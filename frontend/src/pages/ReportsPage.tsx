
import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Select,
  Space,
  Table,
  DatePicker,
  Tabs,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  message,
  Spin,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useRosterStore } from '../stores/rosterStore';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useSettingsStore } from '../stores/settingsStore';
import { generateMonthlyReport } from '../utils/pdfGenerator';

dayjs.extend(buddhistEra);
dayjs.locale('th');
const ReportsPage: React.FC = () => {
  // Use global stores
  const { projects, getProject, fetchProjects, loading: projectsLoading, selectedProjectId, setSelectedProjectId } = useProjectStore();
  const { getStaffByProject, fetchStaff, loading: staffLoading } = useStaffStore();
  const { rosterMatrix, fetchRoster, loading: rosterLoading } = useRosterStore();
  const { shiftTypes, fetchShiftTypes, deductionConfig } = useSettingsStore();

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState('attendance');

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch staff when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchStaff(selectedProjectId, true);
    }
  }, [selectedProjectId]);

  // Fetch shift types on mount
  useEffect(() => {
    fetchShiftTypes();
  }, []);

  // Fetch roster data when project or date changes
  useEffect(() => {
    if (selectedProjectId) {
      const year = selectedDate.year();
      const month = selectedDate.month() + 1;
      fetchRoster(selectedProjectId, year, month);
    }
  }, [selectedProjectId, selectedDate]);

  // Filter staff by project using store - only active staff
  const projectStaff = getStaffByProject(selectedProjectId).filter((staff) => staff.isActive);

  // Get current project from store
  const currentProject = getProject(selectedProjectId);
  const subProjects = Array.isArray(currentProject?.subProjects) ? currentProject?.subProjects : [];

  // Calculate attendance data dynamically from roster entries
  const attendanceData = useMemo(() => {
    const daysInMonth = selectedDate.daysInMonth();

    // Get shift codes dynamically for counting
    const absentShift = shiftTypes.find((s) => s.code === 'ขาด' || s.code === 'ข');
    const absentCode = absentShift?.code || 'ขาด';
    const sickShift = shiftTypes.find((s) => s.code === 'ป่วย' || s.code === 'ป');
    const sickCode = sickShift?.code || 'ป';
    const personalShift = shiftTypes.find((s) => s.code === 'กิจ' || s.code === 'ก');
    const personalCode = personalShift?.code || 'ก';
    const vacationShift = shiftTypes.find((s) => s.code === 'ลา' || s.code === 'พ');
    const vacationCode = vacationShift?.code || 'พ';

    return projectStaff.map((staff) => {
      let totalWorkDays = 0;
      let totalAbsent = 0;
      let totalSickLeave = 0;
      let totalPersonalLeave = 0;
      let totalVacation = 0;
      let totalLeave = 0; // รวมการลาทุกประเภท

      // Count days from roster entries
      for (let day = 1; day <= daysInMonth; day++) {
        // Get current shift from roster matrix
        const currentShift = rosterMatrix?.[staff.id]?.days[day]?.shiftCode || 'OFF';

        // Find shift type from store instead of mock
        const shiftType = shiftTypes.find((st: any) => st.code === currentShift);

        // Count based on shift type
        if (shiftType?.isWorkShift) {
          totalWorkDays++;
        } else if (currentShift === absentCode) {
          totalAbsent++;
        } else if (currentShift === sickCode) {
          totalSickLeave++;
          totalLeave++; // นับรวมในการลา
        } else if (currentShift === personalCode) {
          totalPersonalLeave++;
          totalLeave++; // นับรวมในการลา
        } else if (currentShift === vacationCode) {
          totalVacation++;
          totalLeave++; // นับรวมในการลา
        }
      }

      // Calculate deduction using deduction config
      const absentDeduction = totalAbsent * staff.wagePerDay;
      const excessSickDays = Math.max(0, totalSickLeave - deductionConfig.maxSickLeaveDaysPerMonth);
      const sickLeaveDeduction = excessSickDays * deductionConfig.sickLeaveDeductionPerDay;
      const totalDeduction = absentDeduction + sickLeaveDeduction;

      return {
        staffId: staff.id,
        staffName: staff.name,
        position: staff.position,
        wagePerDay: staff.wagePerDay,
        totalWorkDays,
        totalAbsent,
        totalSickLeave,
        totalPersonalLeave,
        totalVacation,
        totalLeave,
        totalDeduction,
        expectedSalary: totalWorkDays * staff.wagePerDay,
        netSalary: totalWorkDays * staff.wagePerDay - totalDeduction,
      };
    });
  }, [projectStaff, selectedDate, rosterMatrix, deductionConfig, shiftTypes]);

  // Calculate totals
  const totals = useMemo(() => {
    return attendanceData.reduce(
      (acc, curr) => ({
        totalWorkDays: acc.totalWorkDays + curr.totalWorkDays,
        totalAbsent: acc.totalAbsent + curr.totalAbsent,
        totalLeave: acc.totalLeave + curr.totalLeave,
        totalDeduction: acc.totalDeduction + curr.totalDeduction,
        totalExpectedSalary: acc.totalExpectedSalary + curr.expectedSalary,
      }),
      {
        totalWorkDays: 0,
        totalAbsent: 0,
        totalLeave: 0,
        totalDeduction: 0,
        totalExpectedSalary: 0,
      }
    );
  }, [attendanceData]);

  const subProjectDetails = useMemo(() => {
    if (!subProjects || subProjects.length === 0) return [];
    const totalDeduction = totals.totalDeduction ?? 0;
    return subProjects
      .map((sp: any) => ({
        name: typeof sp?.name === 'string' ? sp.name.trim() : '',
        percentage: Number(sp?.percentage),
        amount: (totalDeduction * Number(sp?.percentage || 0)) / 100,
      }))
      .filter((sp) => sp.name && Number.isFinite(sp.percentage));
  }, [subProjects, totals.totalDeduction]);

  // Attendance report columns
  const attendanceColumns = [
    {
      title: 'ชื่อพนักงาน',
      dataIndex: 'staffName',
      key: 'staffName',
    },
    {
      title: 'ตำแหน่ง',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'ค่าแรง/วัน',
      dataIndex: 'wagePerDay',
      key: 'wagePerDay',
      render: (value: number) => `฿${value.toLocaleString()}`,
    },
    {
      title: 'วันทำงาน',
      dataIndex: 'totalWorkDays',
      key: 'totalWorkDays',
      render: (value: number) => <Tag color="green">{value}</Tag>,
    },
    {
      title: 'ขาด',
      dataIndex: 'totalAbsent',
      key: 'totalAbsent',
      render: (value: number) => (value > 0 ? <Tag color="red">{value}</Tag> : '-'),
    },
    {
      title: 'ลา',
      dataIndex: 'totalLeave',
      key: 'totalLeave',
      render: (value: number) => (value > 0 ? <Tag color="blue">{value}</Tag> : '-'),
    },
    {
      title: 'หักเงิน',
      dataIndex: 'totalDeduction',
      key: 'totalDeduction',
      render: (value: number) => (
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          {value > 0 ? `-฿${value.toLocaleString()}` : '-'}
        </span>
      ),
    },
  ];

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!currentProject) {
      message.error('กรุณาเลือกโครงการ');
      return;
    }

    message.loading({ content: 'กำลังสร้างรายงาน PDF...', key: 'pdf' });

    // Prepare roster data for PDF
    const daysInMonth = selectedDate.daysInMonth();
    const rosterDataForPDF: { [staffId: string]: { [day: number]: string } } = {};

    // Prepare roster data for PDF - use rosterMatrix directly
    projectStaff.forEach((staff) => {
      rosterDataForPDF[staff.id] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const currentShift = rosterMatrix?.[staff.id]?.days[day]?.shiftCode || 'OFF';
        rosterDataForPDF[staff.id][day] = currentShift;
      }
    });

    try {
      await generateMonthlyReport({
        project: currentProject,
        month: selectedDate,
        staff: projectStaff,
        rosterData: rosterDataForPDF,
        shiftTypes: shiftTypes,
        deductionConfig: deductionConfig,
        summary: {
          totalAbsent: totals.totalAbsent,
          totalDeduction: totals.totalDeduction,
          subProjects: subProjectDetails,
        },
      });

      message.success({ content: 'ดาวน์โหลดรายงาน PDF แล้ว', key: 'pdf' });
    } catch {
      message.error({ content: 'สร้างรายงาน PDF ไม่สำเร็จ', key: 'pdf' });
    }
  };

  return (
    <div>
      <Card
        title={
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            รายงานและสถิติ
          </span>
        }
        extra={
          <Space>
            <Select
              placeholder="เลือกโครงการ"
              style={{ width: 250 }}
              onChange={setSelectedProjectId}
              value={selectedProjectId}
            >
              {projects.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
            <DatePicker
              picker="month"
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              format="MMMM BBBB"
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
            >
              ดาวน์โหลด PDF
            </Button>
          </Space>
        }
      >
        <Spin spinning={rosterLoading || projectsLoading || staffLoading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'attendance',
                label: 'รายงานการเข้างาน',
                children: (
                  <div>
                    {currentProject && subProjects.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <Space wrap size={8}>
                          <Tag color="blue">โครงการย่อย</Tag>
                          {subProjects.map((sp: any, idx: number) => (
                            <Tag key={`${sp?.name ?? 'sub'}-${idx}`} color="geekblue">
                              {sp?.name ?? '-'} {Number.isFinite(Number(sp?.percentage)) ? `(${Number(sp?.percentage)}%)` : ''}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* Summary Cards */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="จำนวนพนักงาน"
                            value={attendanceData.length}
                            suffix="คน"
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="ขาดงานรวม"
                            value={totals.totalAbsent}
                            suffix="วัน"
                            valueStyle={{ color: '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{ background: '#fff2f0', borderColor: '#ffccc7' }}>
                          <Statistic
                            title={
                              <span style={{ fontWeight: 'bold' }}>
                                หักเงินรวมทั้งหมด
                              </span>
                            }
                            value={totals.totalDeduction}
                            prefix="฿"
                            valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Report Table */}
                    <Table
                      columns={attendanceColumns}
                      dataSource={attendanceData}
                      rowKey="staffId"
                      pagination={{ pageSize: 20 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ReportsPage;
