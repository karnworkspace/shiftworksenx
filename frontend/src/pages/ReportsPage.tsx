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
  DollarOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { mockShiftTypes } from '../data/mockData';
import { useRosterStore } from '../stores/rosterStore';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useSettingsStore } from '../stores/settingsStore';
import { generateMonthlyReport } from '../utils/pdfGenerator';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const ReportsPage: React.FC = () => {
  // Use global stores
  const { projects, getProject, fetchProjects, loading: projectsLoading } = useProjectStore();
  const { getStaffByProject, staff: allStaff, fetchStaff, loading: staffLoading } = useStaffStore();
  const { currentRoster, rosterMatrix, fetchRoster, loading: rosterLoading } = useRosterStore();
  const { deductionConfig } = useSettingsStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState('attendance');

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

  // Fetch roster data when project or date changes
  useEffect(() => {
    if (selectedProjectId) {
      const year = selectedDate.year();
      const month = selectedDate.month() + 1;
      fetchRoster(selectedProjectId, year, month);
    }
  }, [selectedProjectId, selectedDate]);

  const year = selectedDate.year();
  const month = selectedDate.month() + 1;

  // Filter staff by project using store - only active staff
  const projectStaff = getStaffByProject(selectedProjectId).filter(staff => staff.isActive);
  
  // Get current project from store
  const currentProject = getProject(selectedProjectId);

  // Calculate deduction for a specific staff member
  const calculateStaffDeduction = (staffId: string) => {
    const daysInMonth = selectedDate.daysInMonth();
    let totalAbsent = 0;
    let totalLate = 0;
    let totalSickLeave = 0;
    
    if (!rosterMatrix) return { totalAbsent: 0, totalLate: 0, totalSickLeave: 0, absentDeduction: 0, lateDeduction: 0, sickLeaveDeduction: 0, totalDeduction: 0 };
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentShift = rosterMatrix[staffId]?.days[day]?.shiftCode || 'OFF';
      
      if (currentShift === 'ข') {
        totalAbsent++;
      } else if (currentShift === 'ป') {
        totalSickLeave++;
      } else if (currentShift === 'ส') {
        totalLate++;
      }
    }
    
    // Calculate deductions based on settings
    const absentDeduction = totalAbsent * deductionConfig.absentDeductionPerDay;
    const lateDeduction = totalLate * deductionConfig.lateDeductionPerTime;
    const excessSickDays = Math.max(0, totalSickLeave - deductionConfig.maxSickLeaveDaysPerMonth);
    const sickLeaveDeduction = excessSickDays * deductionConfig.sickLeaveDeductionPerDay;
    
    return {
      totalAbsent,
      totalLate,
      totalSickLeave,
      absentDeduction,
      lateDeduction,
      sickLeaveDeduction,
      totalDeduction: absentDeduction + lateDeduction + sickLeaveDeduction,
    };
  };

  // Calculate deductions received FROM other projects (other projects share TO this project)
  const receivedDeductions = useMemo(() => {
    let totalReceived = 0;
    const details: { projectName: string; amount: number; percentage: number }[] = [];
    
    // Loop through all projects to find ones that share costs TO this project
    projects.forEach((project) => {
      if (project.id === selectedProjectId) return; // Skip current project
      
      const costSharing = (project as any).costSharing || [];
      const sharingToThisProject = costSharing.find(
        (cs: any) => cs.destinationProjectId === selectedProjectId
      );
      
      if (sharingToThisProject) {
        // Calculate total deduction for ALL staff in that project
        const staffInProject = allStaff.filter((s) => s.projectId === project.id);
        let projectTotalDeduction = 0;
        
        staffInProject.forEach((staff) => {
          const deduction = calculateStaffDeduction(staff.id);
          projectTotalDeduction += deduction.totalDeduction;
        });
        
        // Calculate amount shared to this project
        const sharedAmount = (projectTotalDeduction * sharingToThisProject.percentage) / 100;
        
        if (sharedAmount > 0) {
          totalReceived += sharedAmount;
          details.push({
            projectName: project.name,
            amount: sharedAmount,
            percentage: sharingToThisProject.percentage,
          });
        }
      }
    });
    
    return { totalReceived, details };
  }, [projects, selectedProjectId, allStaff, selectedDate, rosterMatrix, deductionConfig]);

  // Calculate attendance data dynamically from roster entries
  const attendanceData = useMemo(() => {
    const daysInMonth = selectedDate.daysInMonth();
    
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
        
        // Find shift type
        const shiftType = mockShiftTypes.find((st) => st.code === currentShift);
        
        // Count based on shift type
        if (shiftType?.isWorkShift) {
          totalWorkDays++;
        } else if (currentShift === 'ข') {
          totalAbsent++;
        } else if (currentShift === 'ป') {
          totalSickLeave++;
          totalLeave++; // นับรวมในการลา
        } else if (currentShift === 'ก') {
          totalPersonalLeave++;
          totalLeave++; // นับรวมในการลา
        } else if (currentShift === 'พ') {
          totalVacation++;
          totalLeave++; // นับรวมในการลา
        }
      }
      
      // Calculate deduction using deduction config
      const absentDeduction = totalAbsent * deductionConfig.absentDeductionPerDay;
      const excessSickDays = Math.max(0, totalSickLeave - deductionConfig.maxSickLeaveDaysPerMonth);
      const sickLeaveDeduction = excessSickDays * deductionConfig.sickLeaveDeductionPerDay;
      const totalDeductionRaw = absentDeduction + sickLeaveDeduction;
      
      // Calculate shared deduction (how much THIS project shares to others)
      let ownProjectDeduction = totalDeductionRaw;
      let sharedToOthers = 0;
      
      // If current project has cost sharing settings (sharing TO others)
      if (currentProject && (currentProject as any).costSharing && (currentProject as any).costSharing.length > 0) {
        const costSharing = (currentProject as any).costSharing;
        const sharedPercentages = costSharing.reduce((sum: number, cs: any) => sum + (cs.percentage || 0), 0);
        const thisProjectPercentage = 100 - sharedPercentages;
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
  }, [projectStaff, currentProject, selectedDate, rosterMatrix, deductionConfig]);

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
  const handleDownloadPDF = () => {
    if (!currentProject) {
      message.error('กรุณาเลือกโครงการ');
      return;
    }

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

    generateMonthlyReport({
      project: currentProject,
      month: selectedDate,
      staff: projectStaff,
      rosterData: rosterDataForPDF,
      shiftTypes: mockShiftTypes,
      summary: {
        totalAbsent: totals.totalAbsent,
        ownDeduction: totals.ownDeduction,
        receivedFromOthers: totals.receivedFromOthers,
        receivedDetails: receivedDeductions.details,
        grandTotalDeduction: totals.grandTotalDeduction,
      },
    });

    message.success('กำลังดาวน์โหลดรายงาน PDF');
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
                    <Col span={4}>
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
                              receivedDeductions.details.length > 0
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
                    <Col span={4}>
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
                  {currentProject && (currentProject as any).costSharing?.length > 0 && (
                    <Card 
                      size="small" 
                      style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
                    >
                      <Row align="middle">
                        <Col span={24}>
                          <span style={{ fontWeight: 'bold', marginRight: 8 }}>📥 แชร์ค่าใช้จ่ายไปโครงการอื่น:</span>
                          <Space split={<Divider type="vertical" />}>
                            {((currentProject as any).costSharing || []).map((cs: any, index: number) => {
                              const destProject = getProject(cs.destinationProjectId);
                              return (
                                <Tag key={index} color="green">
                                  {destProject?.name || 'ไม่ทราบ'}: {cs.percentage}%
                                </Tag>
                              );
                            })}
                          </Space>
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            โครงการนี้รับภาระ: {100 - ((currentProject as any).costSharing || []).reduce((sum: number, cs: any) => sum + (cs.percentage || 0), 0)}%
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
