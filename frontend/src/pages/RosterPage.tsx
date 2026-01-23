import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Table,
  Modal,
  DatePicker,
  Statistic,
  message,
  Row,
  Col,
  Spin,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useRosterStore } from '../stores/rosterStore';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useSettingsStore } from '../stores/settingsStore';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface Staff {
  id: string;
  code: string;
  name: string;
  position: string;
  projectId: string;
}

// Memoized Cell Component to prevent unnecessary re-renders
const ShiftCell = React.memo(({ 
  staffId, 
  day, 
  shiftCode, 
  shiftType, 
  isSelected, 
  isToday, 
  onClick 
}: { 
  staffId: string; 
  day: number; 
  shiftCode: string; 
  shiftType: any; 
  isSelected: boolean; 
  isToday: boolean; 
  onClick: (staffId: string, day: number, shiftCode: string) => void;
}) => {
  const cellBackgroundColor = shiftType?.color || '#f0f0f0';
  const textColor = shiftType?.isWorkShift ? '#fff' : '#595959';
  
  return (
    <div
      onClick={() => onClick(staffId, day, shiftCode)}
      style={{
        cursor: 'pointer',
        padding: '3px 2px',
        textAlign: 'center',
        backgroundColor: cellBackgroundColor,
        color: textColor,
        borderRadius: '3px',
        fontWeight: '600',
        fontSize: '10px',
        userSelect: 'none',
        border: isSelected ? '2px solid #1890ff' : (isToday ? '2px solid #52c41a' : '1px solid #e8e8e8'),
        transition: 'all 0.2s',
      }}
    >
      {shiftCode}
    </div>
  );
});

ShiftCell.displayName = 'ShiftCell';

const RosterPage: React.FC = () => {
  // Use global stores
  const { projects, fetchProjects, loading: projectsLoading } = useProjectStore();
  const { getStaffByProject, fetchStaff, loading: staffLoading } = useStaffStore();
  const { 
    currentRoster, 
    rosterMatrix, 
    fetchRoster, 
    updateRosterEntry, 
    loading: rosterLoading 
  } = useRosterStore();
  const { shiftTypes } = useSettingsStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedDay, setSelectedDay] = useState<number>(dayjs().date()); // วันที่เลือก default เป็นวันปัจจุบัน
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    staffId: string;
    day: number;
    currentShift: string;
  } | null>(null);

  // Fetch projects and shift types on mount (only once)
  useEffect(() => {
    fetchProjects();
    const { fetchShiftTypes, shiftTypes } = useSettingsStore.getState();
    if (shiftTypes.length === 0) {
      fetchShiftTypes();
    }
  }, []);

  // Set default project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch staff when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchStaff(selectedProjectId, true);
    }
  }, [selectedProjectId, fetchStaff]);

  const year = selectedDate.year();
  const month = selectedDate.month() + 1;
  const daysInMonth = selectedDate.daysInMonth();
  const today = dayjs();
  const currentDay = today.date();
  const isCurrentMonth = today.year() === year && today.month() + 1 === month;

  // Fetch roster data when project or date changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchRoster(selectedProjectId, year, month);
    }
  }, [selectedProjectId, year, month]);

  // Filter staff by project using store (only active staff)
  const projectStaff = getStaffByProject(selectedProjectId).filter(staff => staff.isActive);

  // Handle cell click - open modal (memoized)
  const handleCellClick = useCallback((staffId: string, day: number, currentShift: string) => {
    setEditingCell({ staffId, day, currentShift });
    setIsShiftModalOpen(true);
  }, []);

  // Handle shift selection (memoized)
  const handleShiftSelect = useCallback(async (newShift: string) => {
    // Prevent double-click
    if (isUpdating) {
      return;
    }
    
    if (editingCell && currentRoster) {
      const { staffId, day } = editingCell;
      
      setIsUpdating(true);
      
      try {
        // Update roster entry via API
        await updateRosterEntry({
          rosterId: currentRoster.id,
          staffId,
          day,
          shiftCode: newShift
        });
        
        const shiftName = shiftTypes.find((st) => st.code === newShift)?.name || newShift;
        message.success(`เปลี่ยนกะเป็น ${shiftName}`);
        setIsShiftModalOpen(false);
        setEditingCell(null);
      } catch (error: any) {
        console.error('Error updating shift:', error);
        const errorMsg = error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัพเดตกะ';
        message.error(errorMsg);
      } finally {
        setIsUpdating(false);
      }
    } else {
      message.error('ไม่พบข้อมูล roster กรุณาลองรีเฟรชหน้า');
    }
  }, [isUpdating, editingCell, currentRoster, updateRosterEntry, shiftTypes]);

  // Use roster matrix from store (already loaded by fetchRoster)
  // rosterMatrix is already available from useRosterStore

  // Build table columns (days)
  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        title: 'พนักงาน',
        key: 'staff',
        fixed: 'left' as const,
        width: 180,
        render: (_: any, staff: Staff) => (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 500, fontSize: '11px' }}>{staff.name}</span>
            <span style={{ fontSize: '10px', color: '#888' }}>
              {staff.position}
            </span>
          </Space>
        ),
      },
    ];

    // Add columns for each day
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === currentDay;
      const isSelected = day === selectedDay;
      
      baseColumns.push({
        title: (
          <div 
            style={{ 
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              backgroundColor: isSelected ? '#1890ff' : 'transparent',
              color: isSelected ? '#fff' : (isToday ? '#1890ff' : 'inherit'),
            }}
            onClick={() => setSelectedDay(day)}
          >
            <div style={{ 
              fontWeight: isToday || isSelected ? 'bold' : 'normal',
              fontSize: '11px',
            }}>
              {day}
            </div>
          </div>
        ),
        key: day.toString(),
        width: 32,
        render: (_: any, staff: Staff) => {
          const shiftCode = rosterMatrix?.[staff.id]?.days[day]?.shiftCode || 'OFF';
          const shiftType = shiftTypes.find((st) => st.code === shiftCode);
          
          return (
            <ShiftCell
              staffId={staff.id}
              day={day}
              shiftCode={shiftCode}
              shiftType={shiftType}
              isSelected={isSelected}
              isToday={isToday}
              onClick={handleCellClick}
            />
          );
        },
      });
    }

    return baseColumns;
  }, [projectStaff, rosterMatrix, daysInMonth, selectedDay, currentDay, isCurrentMonth, shiftTypes, handleCellClick]);

  // Calculate selected day's statistics
  const selectedDayStats = useMemo(() => {
    let working = 0;
    let absent = 0;
    let leave = 0;
    let off = 0;

    if (!rosterMatrix) return { working, absent, leave, off };

    // Find shift codes for different categories
    const absentShift = shiftTypes.find(s => s.code === 'ขาด' || s.code === 'ข');
    const leaveShift = shiftTypes.find(s => s.code === 'ลา' || s.code === 'ล');
    const offShift = shiftTypes.find(s => s.code === 'OFF' || s.code === 'หยุด');

    projectStaff.forEach((staff) => {
      const shift = rosterMatrix[staff.id]?.days[selectedDay]?.shiftCode;
      
      if (!shift || shift === 'OFF' || shift === (offShift?.code)) {
        // No shift assigned or OFF/หยุด
        off++;
      } else if (shift === absentShift?.code) {
        // Absent shift
        absent++;
      } else if (shift === leaveShift?.code) {
        // Leave shift
        leave++;
      } else {
        // Check if it's a work shift
        const shiftType = shiftTypes.find((st) => st.code === shift);
        if (shiftType?.isWorkShift) {
          working++;
        } else {
          // Other non-working shifts
          off++;
        }
      }
    });

    return { working, absent, leave, off };
  }, [projectStaff, rosterMatrix, selectedDay, shiftTypes]);

  // Get selected day display text
  const selectedDayDate = selectedDate.date(selectedDay);
  const selectedDayText = selectedDayDate.format('D MMMM BBBB');

  return (
    <div>
      <Spin spinning={rosterLoading || projectsLoading || staffLoading}>
        <Card
          title={
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              📅 ตารางเวลาทำงาน
              <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px', color: '#1890ff' }}>
                (วันที่ {selectedDayText})
              </span>
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
                onChange={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    // Reset selected day to 1 or current day if same month
                    if (date.year() === today.year() && date.month() === today.month()) {
                      setSelectedDay(currentDay);
                    } else {
                      setSelectedDay(1);
                    }
                  }
                }}
                format="MMMM BBBB"
              style={{ width: 200 }}
            />
          </Space>
        }
      >
        {/* Selected Day Statistics Dashboard */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="เข้างาน"
                value={selectedDayStats.working}
                suffix="คน"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="ขาด/ลา"
                value={selectedDayStats.absent + selectedDayStats.leave}
                suffix="คน"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="วันหยุด"
                value={selectedDayStats.off}
                suffix="คน"
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Legend */}
        <div style={{ 
          marginBottom: 12, 
          padding: '10px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <Space wrap size="middle">
            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>🎨 สัญลักษณ์:</span>
            {shiftTypes.map((shift) => (
              <div key={shift.code} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: 28,
                    height: 20,
                    backgroundColor: shift.color,
                    color: shift.isWorkShift ? '#fff' : '#000',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '3px',
                    fontSize: '10px',
                  }}
                >
                  {shift.code}
                </div>
                <span style={{ fontSize: '11px' }}>{shift.name}</span>
              </div>
            ))}
          </Space>
        </div>

        {/* Roster Table */}
        <Table
          columns={columns}
          dataSource={projectStaff}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          bordered
          size="small"
          style={{ fontSize: '11px' }}
        />
      </Card>
      </Spin>

      {/* Shift Selection Modal */}
      <Modal
        title="เลือกกะ/สถานะ"
        open={isShiftModalOpen}
        onCancel={() => {
          setIsShiftModalOpen(false);
          setEditingCell(null);
        }}
        footer={null}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            เลือกกะหรือสถานะสำหรับวันที่ {editingCell?.day}
          </p>
          <Space wrap size="middle">
            {shiftTypes.map((shift) => (
              <Button
                key={shift.code}
                size="large"
                loading={isUpdating}
                disabled={isUpdating}
                style={{
                  backgroundColor: isUpdating ? '#d9d9d9' : shift.color,
                  color: shift.isWorkShift ? '#fff' : '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  minWidth: 100,
                }}
                onClick={() => handleShiftSelect(shift.code)}
              >
                {shift.name}
              </Button>
            ))}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default RosterPage;
