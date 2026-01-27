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
  Tooltip,
  Divider,
  Button,
  message,
  Spin,
} from 'antd';
import {
  InfoCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useRosterStore } from '../stores/rosterStore';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useSettingsStore } from '../stores/settingsStore';
import apiClient from '../services/api';
import { generateMonthlyReport } from '../utils/pdfGenerator';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const ReportsPage: React.FC = () => {
  // Use global stores
  const { projects, getProject, fetchProjects, loading: projectsLoading } = useProjectStore();
  const { getStaffByProject, fetchStaff, loading: staffLoading } = useStaffStore();
  const { rosterMatrix, fetchRoster, loading: rosterLoading } = useRosterStore();
  const { shiftTypes, fetchShiftTypes, deductionConfig } = useSettingsStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState('attendance');

  const [receivedDeductions, setReceivedDeductions] = useState<{
    loading: boolean;
    totalReceived: number;
    details: { projectId: string; projectName: string; amount: number; percentage: number }[];
    error?: string;
  }>({
    loading: false,
    totalReceived: 0,
    details: [],
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Set default project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

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
  const projectStaff = getStaffByProject(selectedProjectId).filter(staff => staff.isActive);

  // Get current project from store
  const currentProject = getProject(selectedProjectId);
  const costSharingFrom = currentProject?.costSharingFrom ?? [];

  // Compute received deductions from other projects based on costSharingFrom settings (source -> this project)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!selectedProjectId || projects.length === 0) return;

      setReceivedDeductions((prev) => ({ ...prev, loading: true, error: undefined }));

      const year = selectedDate.year();
      const month = selectedDate.month() + 1;

      try {
        const sourceProjects = projects
          .filter((p) => p.id !== selectedProjectId)
          .map((p) => {
            const cs = (p.costSharingFrom || []).find(
              (x) => x.destinationProjectId === selectedProjectId && (x.percentage || 0) > 0
            );
            return cs
              ? {
                projectId: p.id,
                projectName: p.name,
                percentage: cs.percentage,
              }
              : null;
          })
          .filter(Boolean) as Array<{ projectId: string; projectName: string; percentage: number }>;

        if (sourceProjects.length === 0) {
          if (!cancelled) {
            setReceivedDeductions({ loading: false, totalReceived: 0, details: [] });
          }
          return;
        }

        const results = await Promise.all(
          sourceProjects.map(async (sp) => {
            const resp = await apiClient.get('/reports/deduction', {
              params: { projectId: sp.projectId, year, month },
            });
            const projectTotalDeduction = resp.data?.report?.totals?.totalDeduction || 0;
            const sharedAmount = (projectTotalDeduction * sp.percentage) / 100;
            return {
              ...sp,
              amount: sharedAmount,
            };
          })
        );

        const details = results
          .filter((r) => r.amount > 0)
          .map((r) => ({
            projectId: r.projectId,
            projectName: r.projectName,
            amount: r.amount,
            percentage: r.percentage,
          }));

        const totalReceived = details.reduce((sum, d) => sum + d.amount, 0);

        if (!cancelled) {
          setReceivedDeductions({ loading: false, totalReceived, details });
        }
      } catch (e: any) {
        if (!cancelled) {
          setReceivedDeductions((prev) => ({
            ...prev,
            loading: false,
            error: e?.message || 'คำนวณ Cost Sharing ไม่สำเร็จ',
          }));
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [projects, selectedProjectId, selectedDate]);

  // Calculate deductions received FROM other projects (other projects share TO this project)
  // Calculate attendance data dynamically from roster entries
  const attendanceData = useMemo(() => {
    const daysInMonth = selectedDate.daysInMonth();

    // Get shift codes dynamically for counting
    const absentShift = shiftTypes.find(s => s.code === 'ขาด' || s.code === 'ข');
    const absentCode = absentShift?.code || 'ขาด';
    const sickShift = shiftTypes.find(s => s.code === 'ป่วย' || s.code === 'ป');
    const sickCode = sickShift?.code || 'ป';
    const personalShift = shiftTypes.find(s => s.code === 'กิจ' || s.code === 'ก');
    const personalCode = personalShift?.code || 'ก';
    const vacationShift = shiftTypes.find(s => s.code === 'ลา' || s.code === 'พ');
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
      const totalDeductionRaw = absentDeduction + sickLeaveDeduction;

      // Calculate shared deduction (how much THIS project shares to others)
      let ownProjectDeduction = totalDeductionRaw;
      let sharedToOthers = 0;

      // If current project has cost sharing settings (sharing TO others)
      if (costSharingFrom.length > 0) {
        const sharedPercentages = costSharingFrom.reduce((sum, cs) => sum + (cs.percentage || 0), 0);
        const thisProjectPercentage = Math.max(0, 100 - sharedPercentages);
        ownProjectDeduction = (totalDeductionRaw * thisProjectPercentage) / 100;
        sharedToOthers = totalDeductionRaw - ownProjectDeduction;
      }

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
        originalDeduction: totalDeductionRaw,
        ownProjectDeduction, // โครงการตัวเอง (หลังหักส่วนที่แชร์ไป)
        sharedToOthers, // ส่วนที่แชร์ไปโครงการอื่น
        expectedSalary: totalWorkDays * staff.wagePerDay,
        netSalary: totalWorkDays * staff.wagePerDay - ownProjectDeduction,
      };
    });
  }, [projectStaff, costSharingFrom, selectedDate, rosterMatrix, deductionConfig]);

  // Calculate totals
  const totals = useMemo(() => {
    const base = attendanceData.reduce(
      (acc, curr) => ({
        totalWorkDays: acc.totalWorkDays + curr.totalWorkDays,
        totalAbsent: acc.totalAbsent + curr.totalAbsent,
        totalLeave: acc.totalLeave + curr.totalLeave,
        ownDeduction: acc.ownDeduction + curr.ownProjectDeduction,
        sharedToOthers: acc.sharedToOthers + curr.sharedToOthers,
        totalExpectedSalary: acc.totalExpectedSalary + curr.expectedSalary,
      }),
      {
        totalWorkDays: 0,
        totalAbsent: 0,
        totalLeave: 0,
        ownDeduction: 0,
        sharedToOthers: 0,
        totalExpectedSalary: 0,
      }
    );

    // Grand total = own deduction + received from others
    const grandTotalDeduction = base.ownDeduction + receivedDeductions.totalReceived;

    return {
      ...base,
      receivedFromOthers: receivedDeductions.totalReceived,
      grandTotalDeduction,
    };
  }, [attendanceData, receivedDeductions]);

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
      render: (value: number) => value > 0 ? <Tag color="red">{value}</Tag> : '-',
    },
    {
      title: 'ลา',
      dataIndex: 'totalLeave',
      key: 'totalLeave',
      render: (value: number) => value > 0 ? <Tag color="blue">{value}</Tag> : '-',
    },
    {
      title: (
        <Tooltip title="หักเงินหลังแชร์ Cost ไปโครงการอื่นแล้ว">
          หักเงิน (โครงการนี้) <InfoCircleOutlined />
        </Tooltip>
      ),
      dataIndex: 'ownProjectDeduction',
      key: 'ownProjectDeduction',
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
        summary: {
          totalAbsent: totals.totalAbsent,
          ownDeduction: totals.ownDeduction,
          receivedFromOthers: totals.receivedFromOthers,
          receivedDetails: receivedDeductions.details,
          grandTotalDeduction: totals.grandTotalDeduction,
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
            📊 รายงานและสถิติ
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
                label: '📝 รายงานการเข้าทำงาน',
                children: (
                  <div>
                    {/* Summary Cards */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={4}>
                        <Card>
                          <Statistic
                            title="จำนวนพนักงาน"
                            value={attendanceData.length}
                            suffix="คน"
                          />
                        </Card>
                      </Col>
                      <Col span={4}>
                        <Card>
                          <Statistic
                            title="ขาดงานรวม"
                            value={totals.totalAbsent}
                            suffix="วัน"
                            valueStyle={{ color: '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card>
                          <Statistic
                            title={
                              <Tooltip title="ยอดหักเงินของโครงการนี้ (หลังหักส่วนที่แชร์ไปโครงการอื่นแล้ว)">
                                หักเงิน (โครงการนี้) <InfoCircleOutlined />
                              </Tooltip>
                            }
                            value={totals.ownDeduction}
                            prefix="฿"
                            valueStyle={{ color: '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={4}>
                        <Card>
                          <Statistic
                            title={
                              <Tooltip title={
                                receivedDeductions.loading
                                  ? 'กำลังคำนวณ...'
                                  : receivedDeductions.details.length > 0
                                    ? receivedDeductions.details.map(d =>
                                      `${d.projectName}: ฿${d.amount.toLocaleString()} (${d.percentage}%)`
                                    ).join('\n')
                                    : 'ไม่มีโครงการอื่นแชร์มา'
                              }>
                                หักเงิน (จากโครงการอื่น) <InfoCircleOutlined />
                              </Tooltip>
                            }
                            value={totals.receivedFromOthers}
                            prefix="฿"
                            valueStyle={{ color: '#fa8c16' }}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card style={{ background: '#fff2f0', borderColor: '#ffccc7' }}>
                          <Statistic
                            title={
                              <span style={{ fontWeight: 'bold' }}>
                                💰 หักเงินรวมทั้งหมด
                              </span>
                            }
                            value={totals.grandTotalDeduction}
                            prefix="฿"
                            valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Cost Sharing Info */}
                    {receivedDeductions.details.length > 0 && (
                      <Card
                        size="small"
                        style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}
                      >
                        <Row align="middle">
                          <Col span={24}>
                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>📤 รับค่าใช้จ่ายจากโครงการอื่น:</span>
                            <Space split={<Divider type="vertical" />}>
                              {receivedDeductions.details.map((detail, index) => (
                                <Tag key={index} color="orange">
                                  {detail.projectName}: ฿{detail.amount.toLocaleString()} ({detail.percentage}%)
                                </Tag>
                              ))}
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {/* Cost Sharing to Others Info */}
                    {costSharingFrom.length > 0 && (
                      <Card
                        size="small"
                        style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
                      >
                        <Row align="middle">
                          <Col span={24}>
                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>📥 แชร์ค่าใช้จ่ายไปโครงการอื่น:</span>
                            <Space split={<Divider type="vertical" />}>
                              {costSharingFrom.map((cs: any, index: number) => {
                                const destName = cs.destinationProject?.name || getProject(cs.destinationProjectId)?.name || 'ไม่ทราบ';
                                return (
                                  <Tag key={index} color="green">
                                    {destName}: {cs.percentage}%
                                  </Tag>
                                );
                              })}
                            </Space>
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              โครงการนี้รับภาระ: {Math.max(0, 100 - costSharingFrom.reduce((sum: number, cs: any) => sum + (cs.percentage || 0), 0))}%
                            </Tag>
                          </Col>
                        </Row>
                      </Card>
                    )}

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
