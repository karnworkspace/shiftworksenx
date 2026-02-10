import React, { useState, useMemo } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  DatePicker,
  Modal,
  Form,
  Tag,
  Divider,
  message,
} from 'antd';
import {
  CalendarOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import CalendarView from '../components/CalendarView';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useRosterStore } from '../stores/rosterStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useEffect } from 'react';

dayjs.extend(buddhistEra);
dayjs.locale('th');

const RosterCalendarPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    staffId: string;
    day: number;
  } | null>(null);
  const [form] = Form.useForm();

  // Use global stores
  const { projects, getProject, fetchProjects } = useProjectStore();
  const { getStaffByProject, fetchStaff } = useStaffStore();
  const { currentRoster, rosterMatrix, fetchRoster, updateRosterEntry } = useRosterStore();
  const { shiftTypes, fetchShiftTypes } = useSettingsStore();

  // Fetch data on mount
  useEffect(() => {
    fetchProjects();
    fetchShiftTypes();
  }, [];

  // Set default project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects.length]);

  // Fetch staff and roster when project or date changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchStaff(selectedProjectId, true);
      const year = selectedDate.year();
      const month = selectedDate.month() + 1;
      fetchRoster(selectedProjectId, year, month);
    }
  }, [selectedProjectId, selectedDate]);

  const year = selectedDate.year() + 543; // Convert to Buddhist year
  const month = selectedDate.month() + 1;

  // Get current project
  const currentProject = getProject(selectedProjectId);

  // Get staff for selected project
  const projectStaff = useMemo(() => {
    return getStaffByProject(selectedProjectId).filter(s => s.isActive);
  }, [selectedProjectId]);

  // Calculate statistics using rosterMatrix
  const statistics = useMemo(() => {
    const today = dayjs().date();
    let working = 0;
    let off = 0;
    let absent = 0;

    if (!rosterMatrix) return { working, off, absent };

    projectStaff.forEach((staff) => {
      const staffData = rosterMatrix[staff.id];
      const shiftCode = staffData?.days[today]?.shiftCode || 'OFF';
      const shiftConfig = shiftTypes.find((s) => s.code === shiftCode);
      if (shiftConfig?.isWorkShift) {
        working++;
      } else if (shiftCode === 'OFF') {
        off++;
      } else if (['\u0e02', '\u0e1b', '\u0e01', '\u0e1e'].includes(shiftCode)) {
        absent++;
      }
    });

    return { working, off, absent };
  }, [projectStaff, rosterMatrix]);

  // Navigate month
  const handlePrevMonth = () => {
    setSelectedDate(selectedDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setSelectedDate(selectedDate.add(1, 'month'));
  };

  // Handle cell click
  const handleCellClick = (staffId: string, day: number) => {
    setEditingCell({ staffId, day });
    const staffData = rosterMatrix?.[staffId];
    const currentShift = staffData?.days[day]?.shiftCode || '1';
    form.setFieldsValue({
      shiftCode: currentShift,
    });
    setEditModalVisible(true);
  };

  // Convert rosterMatrix to entries format for CalendarView
  const rosterEntries = useMemo(() => {
    const entries: Array<{ staffId: string; day: number; shiftCode: string }> = [];
    
    if (!rosterMatrix) return entries;
    
    projectStaff.forEach((staff) => {
      const staffData = rosterMatrix[staff.id];
      if (staffData?.days) {
        Object.entries(staffData.days).forEach(([day, data]) => {
          entries.push({
            staffId: staff.id,
            day: parseInt(day),
            shiftCode: data.shiftCode,
          });
        });
      }
    });
    
    return entries;
  }, [projectStaff, rosterMatrix]);

  // Handle save with API update
  const handleSave = async () => {
    if (!editingCell || !currentRoster) return;
    
    try {
      const values = form.getFieldsValue();
      await updateRosterEntry({
        rosterId: currentRoster.id,
        staffId: editingCell.staffId,
        day: editingCell.day,
        shiftCode: values.shiftCode,
      });
      
      message.success('บันทึกสำเร็จ');
      setEditModalVisible(false);
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving shift:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space size="large">
              <Select
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                style={{ width: 300 }}
                size="large"
              >
                {projects.map((proj) => (
                  <Select.Option key={proj.id} value={proj.id}>
                    {proj.name}
                  </Select.Option>
                ))}
              </Select>

              <Space>
                <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  picker="month"
                  format="MMMM BBBB"
                  style={{ width: 180 }}
                  size="large"
                  allowClear={false}
                />
                <Button icon={<RightOutlined />} onClick={handleNextMonth} />
              </Space>
            </Space>
          </Col>

          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="large"
            >
              Export Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics - วันที่ปัจจุบัน */}
      <Card style={{ marginTop: '16px' }}>
        <Space split={<Divider type="vertical" />} size="large">
          <div>
            <CalendarOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
            <span style={{ marginLeft: '8px', fontSize: '14px' }}>
              <strong>สถานะวันที่:</strong> {selectedDate.format('D MMMM BBBB')}
            </span>
          </div>

          <Statistic
            title="เข้างาน"
            value={statistics.working}
            suffix="คน"
            valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            prefix={<UserOutlined />}
          />

          <Statistic
            title="วันหยุด (OFF)"
            value={statistics.off}
            suffix="คน"
            valueStyle={{ color: '#d9d9d9', fontSize: '24px' }}
            prefix={<ClockCircleOutlined />}
          />

          <Statistic
            title="ลา / ขาด"
            value={statistics.absent}
            suffix="คน"
            valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
            prefix={<ClockCircleOutlined />}
          />
        </Space>
      </Card>

      {/* Legend */}
      <Card style={{ marginTop: '16px' }} size="small">
        <Space size="small" wrap>
          <strong>รหัสกะ:</strong>
          {shiftTypes.map((shift) => (
            <Tag key={shift.id} color={shift.color}>
              {shift.code} {shift.name}
              {shift.startTime && ` (${shift.startTime}-${shift.endTime})`}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* Calendar */}
      <Card
        style={{ marginTop: '16px' }}
        title={
          <Space>
            <CalendarOutlined />
            <span>ตารางเวร - {currentProject?.name}</span>
            <span style={{ color: '#999', fontSize: '14px' }}>
              ({projectStaff.length} คน)
            </span>
          </Space>
        }
      >
        <CalendarView
          year={year}
          month={month}
          staff={projectStaff}
          entries={rosterEntries}
          onCellClick={handleCellClick}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="แก้ไขกะ"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="เลือกกะ" name="shiftCode">
            <Select>
              {shiftTypes.map((shift) => (
                <Select.Option key={shift.id} value={shift.code}>
                  <Tag color={shift.color} style={{ marginRight: '8px' }}>
                    {shift.code}
                  </Tag>
                  {shift.name}
                  {shift.startTime && ` (${shift.startTime}-${shift.endTime})`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RosterCalendarPage;
