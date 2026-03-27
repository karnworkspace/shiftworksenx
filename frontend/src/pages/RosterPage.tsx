import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Table,
  Modal,
  Upload,
  DatePicker,
  Statistic,
  message,
  Row,
  Col,
  Spin,
  Tag,
  Alert,
} from 'antd';
import { ExclamationCircleFilled, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useRosterStore } from '../stores/rosterStore';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { rosterService } from '../services/roster.service';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface Staff {
  id: string;
  code: string;
  name: string;
  position: string;
  projectId: string;
  isActive: boolean;
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
  const textColor = shiftType?.isWorkShift ? '#fff' : '#000';
  
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
  const { user } = useAuthStore();
  // Use global stores
  const { projects, fetchProjects, loading: projectsLoading, selectedProjectId, setSelectedProjectId } = useProjectStore();
  const { getStaffByProject, fetchStaff, loading: staffLoading } = useStaffStore();
  const { 
    currentRoster, 
    rosterMatrix, 
    fetchRoster, 
    updateRosterEntry, 
    loading: rosterLoading 
  } = useRosterStore();
  const { shiftTypes } = useSettingsStore();
  
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedDay, setSelectedDay] = useState<number>(dayjs().date()); // วันที่เลือก default เป็นวันปัจจุบัน
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    staffId: string;
    day: number;
    currentShift: string;
  } | null>(null);
  const [lastReminderKey, setLastReminderKey] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Fetch projects and shift types on mount (only once)
  useEffect(() => {
    fetchProjects();
    const { fetchShiftTypes, shiftTypes } = useSettingsStore.getState();
    if (shiftTypes.length === 0) {
      fetchShiftTypes();
    }
  }, []);

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
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const editCutoffDay = selectedProject?.editCutoffDay ?? 2;
  const editCutoffNextMonth = selectedProject?.editCutoffNextMonth ?? true;
  const subProjects = Array.isArray(selectedProject?.subProjects) ? selectedProject?.subProjects : [];

  const getEditDeadline = (
    targetYear: number,
    targetMonth: number,
    cutoffDay: number,
    useNextMonth: boolean
  ) => {
    const safeCutoff = Math.min(Math.max(cutoffDay, 1), 31);
    const adjustedMonth = useNextMonth ? (targetMonth === 12 ? 1 : targetMonth + 1) : targetMonth;
    const adjustedYear = useNextMonth ? (targetMonth === 12 ? targetYear + 1 : targetYear) : targetYear;
    const daysInTargetMonth = dayjs(new Date(adjustedYear, adjustedMonth, 0)).date();
    const day = Math.min(safeCutoff, daysInTargetMonth);
    return dayjs(new Date(adjustedYear, adjustedMonth - 1, day, 23, 59, 59, 999));
  };

  const editDeadline = useMemo(() => {
    return getEditDeadline(year, month, editCutoffDay, editCutoffNextMonth);
  }, [year, month, editCutoffDay, editCutoffNextMonth]);

  const canEdit = !!user && (user.permissions?.includes('roster') ?? false) && today.valueOf() <= editDeadline.valueOf();

  // Fetch roster data when project or date changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchRoster(selectedProjectId, year, month, true);
    }
  }, [selectedProjectId, year, month]);

  // Filter staff by project using store (only active staff)
  const projectStaff = getStaffByProject(selectedProjectId).filter(staff => staff.isActive);

  const normalizeCell = (value: any) => String(value ?? '').trim();

  const handleDownloadTemplate = () => {
    if (!selectedProjectId || !selectedProject) {
      message.error('กรุณาเลือกโครงการก่อน');
      return;
    }

    if (projectStaff.length === 0) {
      message.error('ไม่พบพนักงานในโครงการนี้');
      return;
    }

    const displayYear = Number(selectedDate.format('BBBB'));
    const dataHeader = ['StaffCode', 'StaffName', ...Array.from({ length: 31 }, (_, i) => `D${i + 1}`)];
    const dataRows = projectStaff.map((staff) => {
      const dayValues: string[] = [];
      for (let day = 1; day <= 31; day++) {
        if (day <= daysInMonth) {
          const shiftCode = rosterMatrix?.[staff.id]?.days?.[day]?.shiftCode || 'OFF';
          dayValues.push(shiftCode);
        } else {
          dayValues.push('');
        }
      }
      return [staff.code || '', staff.name || '', ...dayValues];
    });

    const infoRows = [
      ['Project', selectedProject.name],
      ['Year', displayYear],
      ['Month', month],
      ['Note', 'กรอกข้อมูลในชีท DATA: ใส่รหัสกะให้ครบทุกวัน (ถ้าหยุดให้ใส่ OFF) และระบบใช้รหัสพนักงานเป็นหลัก'],
    ];

    const wb = XLSX.utils.book_new();
    const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
    const wsData = XLSX.utils.aoa_to_sheet([dataHeader, ...dataRows]);
    wsData['!cols'] = [
      { wch: 14 },
      { wch: 24 },
      ...Array.from({ length: 31 }, () => ({ wch: 6 })),
    ];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'INFO');
    XLSX.utils.book_append_sheet(wb, wsData, 'DATA');

    if (shiftTypes.length > 0) {
      const shiftRows = [
        ['Code', 'Name', 'Time', 'WorkShift'],
        ...shiftTypes.map((s) => [
          s.code,
          s.name,
          s.startTime && s.endTime ? `${s.startTime}-${s.endTime}` : '',
          s.isWorkShift ? 'Y' : 'N',
        ]),
      ];
      const wsShifts = XLSX.utils.aoa_to_sheet(shiftRows);
      XLSX.utils.book_append_sheet(wb, wsShifts, 'SHIFTS');
    }

    const filename = `roster_template_${selectedProject.name}_${displayYear}_${month}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleImportFile = async (file: File) => {
    if (!selectedProjectId || !selectedProject) {
      message.error('กรุณาเลือกโครงการก่อน');
      return;
    }

    if (!canEdit) {
      message.error('ไม่อยู่ในช่วงเวลาที่สามารถแก้ไขได้');
      return;
    }

    if (projectStaff.length === 0) {
      message.error('ไม่พบพนักงานในโครงการนี้');
      return;
    }

    if (shiftTypes.length === 0) {
      message.error('ไม่พบข้อมูลกะในระบบ');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const infoSheet = workbook.Sheets['INFO'];
      const dataSheet = workbook.Sheets['DATA'];
      const rosterSheet = workbook.Sheets['ROSTER'];

      if (!infoSheet || (!dataSheet && !rosterSheet)) {
        message.error('ไม่พบชีท INFO และ DATA/ROSTER ในไฟล์');
        return;
      }

      const infoRows = XLSX.utils.sheet_to_json<any[]>(infoSheet, { header: 1, defval: '' });
      const infoMap: Record<string, string> = {};
      infoRows.forEach((row) => {
        if (!row || row.length < 2) return;
        const key = normalizeCell(row[0]).toLowerCase();
        const value = normalizeCell(row[1]);
        if (key) infoMap[key] = value;
      });

      const infoProject = infoMap['project'] || infoMap['โครงการ'] || '';
      let infoYear = Number(infoMap['year'] || infoMap['ปี']);
      const infoMonth = Number(infoMap['month'] || infoMap['เดือน']);

      if (!infoYear || !infoMonth) {
        message.error('ไฟล์ต้องระบุ Year และ Month ในชีท INFO');
        return;
      }

      if (infoYear >= 2400) {
        infoYear -= 543;
      }

      if (infoProject && normalizeCell(infoProject).toLowerCase() !== normalizeCell(selectedProject.name).toLowerCase()) {
        message.error('ไฟล์ไม่ตรงกับโครงการที่เลือก');
        return;
      }

      if (infoYear !== year || infoMonth !== month) {
        message.error(`ไฟล์ระบุเดือน/ปี ${infoMonth}/${infoYear} ไม่ตรงกับที่เลือก ${month}/${year}`);
        return;
      }

      const staffByCode = new Map<string, any>();
      const duplicateCodes: string[] = [];
      projectStaff.forEach((s) => {
        const codeKey = normalizeCell(s.code).toLowerCase();
        if (!codeKey) return;
        if (staffByCode.has(codeKey)) {
          duplicateCodes.push(s.code);
          return;
        }
        staffByCode.set(codeKey, s);
      });

      if (duplicateCodes.length > 0) {
        message.error(`พบรหัสพนักงานซ้ำ: ${duplicateCodes.join(', ')} กรุณาแก้ไขให้ไม่ซ้ำก่อนนำเข้า`);
        return;
      }

      const staffByName = new Map<string, any>();
      const duplicateNameKeys = new Set<string>();
      projectStaff.forEach((s) => {
        const nameKey = normalizeCell(s.name).toLowerCase();
        if (!nameKey) return;
        if (staffByName.has(nameKey)) {
          duplicateNameKeys.add(nameKey);
          return;
        }
        staffByName.set(nameKey, s);
      });

      const validShiftCodes = new Set(shiftTypes.map((s) => s.code));
      const importedStaffIds = new Set<string>();
      const entryKeySet = new Set<string>();
      const entries: Array<{ staffId: string; day: number; shiftCode: string }> = [];
      const nameMismatches: Array<{ code: string; name: string; actual: string }> = [];
      const sheetToUse = dataSheet || rosterSheet;
      const sheetName = dataSheet ? 'DATA' : 'ROSTER';
      if (!sheetToUse) {
        message.error('ไม่พบชีท DATA หรือ ROSTER');
        return;
      }

      const rosterRows = XLSX.utils.sheet_to_json<any[]>(sheetToUse, { header: 1, defval: '' });
      if (rosterRows.length < 2) {
        message.error(`ไม่พบข้อมูลในชีท ${sheetName}`);
        return;
      }

      const header = (rosterRows[0] || []).map((cell: any) => normalizeCell(cell));
      const staffCodeIdx = header.findIndex((h: string) => h.toLowerCase() === 'staffcode' || h === 'รหัสพนักงาน');
      const staffNameIdx = header.findIndex((h: string) => h.toLowerCase() === 'staffname' || h === 'ชื่อพนักงาน');
      if (staffCodeIdx === -1 || staffNameIdx === -1) {
        message.error('หัวตารางต้องมี StaffCode และ StaffName');
        return;
      }

      const dayColMap = new Map<number, number>();
      header.forEach((h: string, idx: number) => {
        const match = /^d(\d+)$/i.exec(h);
        if (match) {
          const dayNum = Number(match[1]);
          dayColMap.set(dayNum, idx);
        }
      });
      for (let d = 1; d <= daysInMonth; d++) {
        if (!dayColMap.has(d)) {
          message.error(`ไฟล์ขาดคอลัมน์ D${d}`);
          return;
        }
      }

      for (let i = 1; i < rosterRows.length; i++) {
        const row = rosterRows[i];
        const code = normalizeCell(row?.[staffCodeIdx]);
        const name = normalizeCell(row?.[staffNameIdx]);
        if (!code && !name) {
          continue;
        }
        let staff = null as any;
        if (code) {
          staff = staffByCode.get(code.toLowerCase());
        }
        if (!staff && name) {
          const nameKey = name.toLowerCase();
          if (duplicateNameKeys.has(nameKey)) {
            message.error(`ชื่อพนักงานซ้ำในระบบ: ${name} (กรุณาใช้รหัสพนักงาน)`);
            return;
          }
          staff = staffByName.get(nameKey);
        }
        if (!staff) {
          message.error(`ไม่พบพนักงานจากรหัส/ชื่อ: ${code || name || 'ไม่ระบุ'}`);
          return;
        }

        if (code && name && normalizeCell(staff.name).toLowerCase() !== name.toLowerCase()) {
          nameMismatches.push({ code, name, actual: staff.name });
        }

        if (importedStaffIds.has(staff.id)) {
          message.error(`พบพนักงานซ้ำในไฟล์: ${code}`);
          return;
        }
        importedStaffIds.add(staff.id);

        for (let day = 1; day <= daysInMonth; day++) {
          const colIdx = dayColMap.get(day) as number;
          const shiftCode = normalizeCell(row?.[colIdx]);
          if (!shiftCode) {
            message.error(`กรุณาใส่กะให้ครบทุกวัน (พนักงาน ${staff.name} วันที่ ${day})`);
            return;
          }
          if (!validShiftCodes.has(shiftCode)) {
            message.error(`รหัสกะไม่ถูกต้อง: ${shiftCode} (พนักงาน ${staff.name} วันที่ ${day})`);
            return;
          }
          const key = `${staff.id}-${day}`;
          if (entryKeySet.has(key)) {
            message.error(`พบข้อมูลซ้ำ: ${staff.name} วันที่ ${day}`);
            return;
          }
          entryKeySet.add(key);
          entries.push({ staffId: staff.id, day, shiftCode });
        }
      }

      const missingStaff = projectStaff.filter((s) => !importedStaffIds.has(s.id));
      if (missingStaff.length > 0) {
        message.error(`ไฟล์ขาดรายชื่อพนักงาน: ${missingStaff.map((s) => s.name).join(', ')}`);
        return;
      }

      const missingEntries: string[] = [];
      for (const staff of projectStaff) {
        for (let day = 1; day <= daysInMonth; day++) {
          const key = `${staff.id}-${day}`;
          if (!entryKeySet.has(key)) {
            if (missingEntries.length < 3) {
              missingEntries.push(`${staff.name} วันที่ ${day}`);
            }
          }
        }
      }
      if (missingEntries.length > 0) {
        message.error(`ข้อมูลไม่ครบ เช่น ${missingEntries.join(', ')} (ต้องมีครบทุกคนทุกวัน)`);
        return;
      }

      if (entries.length === 0) {
        message.error('ไม่พบข้อมูลสำหรับนำเข้า');
        return;
      }

      const mismatchText = nameMismatches.length > 0
        ? `พบชื่อไม่ตรงกับรหัส ${nameMismatches.length} รายการ (ระบบจะยึดรหัสเป็นหลัก)`
        : '';

      Modal.confirm({
        title: 'ยืนยันนำเข้าตารางเวลา',
        content: (
          <div>
            <div>จะนำเข้าข้อมูลเดือน {month}/{year} และแทนที่ข้อมูลเดิมทั้งหมด ({projectStaff.length} คน)</div>
            {mismatchText ? <div style={{ color: '#faad14', marginTop: 6 }}>{mismatchText}</div> : null}
          </div>
        ),
        okText: 'นำเข้าและแทนที่',
        okButtonProps: { danger: true },
        cancelText: 'ยกเลิก',
        onOk: async () => {
          setImporting(true);
          try {
            await rosterService.importRoster({
              projectId: selectedProjectId,
              year,
              month,
              entries,
            });
            await fetchRoster(selectedProjectId, year, month, true);
            message.success('นำเข้าเรียบร้อย');
          } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'นำเข้าไม่สำเร็จ';
            message.error(errorMsg);
          } finally {
            setImporting(false);
          }
        },
      });
    } catch (error: any) {
      message.error(error.message || 'อ่านไฟล์ไม่สำเร็จ');
    }
  };

  const uploadProps = {
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: async (file: File) => {
      await handleImportFile(file);
      return false;
    },
    disabled: !selectedProjectId || !canEdit || importing,
  };

  // Handle cell click - open modal (memoized)
  const handleCellClick = useCallback((staffId: string, day: number, currentShift: string) => {
    if (!canEdit) {
      Modal.warning({
        centered: true,
        icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
        title: 'เกินกำหนดการแก้ไขข้อมูล',
        content: 'เกินกำหนดการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่',
      });
      return;
    }
    setEditingCell({ staffId, day, currentShift });
    setIsShiftModalOpen(true);
  }, [canEdit]);

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
  }, [
    projectStaff,
    rosterMatrix,
    daysInMonth,
    selectedDay,
    currentDay,
    isCurrentMonth,
    shiftTypes,
    handleCellClick,
    canEdit,
  ]);

  // Calculate selected day's statistics
  const selectedDayStats = useMemo(() => {
    let working = 0;
    let absent = 0;
    let leave = 0;
    let off = 0;

    if (!rosterMatrix) return { working, absent, leave, off };

    // Find shift codes for special categories
    const absentShift = shiftTypes.find(s => s.code === 'ขาด' || s.code === 'ข');
    const offShift = shiftTypes.find(s => s.code === 'OFF' || s.code === 'หยุด');

    projectStaff.forEach((staff) => {
      const shift = rosterMatrix[staff.id]?.days[selectedDay]?.shiftCode;

      if (!shift || shift === 'OFF' || shift === (offShift?.code)) {
        off++;
      } else if (shift === absentShift?.code) {
        absent++;
      } else {
        const shiftType = shiftTypes.find((st) => st.code === shift);
        if (shiftType?.isWorkShift) {
          working++;
        } else {
          // ลาพักร้อน, ลาป่วย, ลากิจ และประเภทลาอื่นๆ ทั้งหมด
          leave++;
        }
      }
    });

    return { working, absent, leave, off };
  }, [projectStaff, rosterMatrix, selectedDay, shiftTypes]);

  // Get selected day display text
  const selectedDayDate = selectedDate.date(selectedDay);
  const selectedDayText = selectedDayDate.format('D MMMM BBBB');

  useEffect(() => {
    if (!selectedProject) return;
    const endOfMonth = today.date() === today.daysInMonth();
    if (!endOfMonth) return;

    const key = `${selectedProject.id}-${today.format('YYYY-MM')}`;
    if (lastReminderKey === key) return;

    const deadline = getEditDeadline(today.year(), today.month() + 1, editCutoffDay, editCutoffNextMonth);
    Modal.info({
      title: 'แจ้งเตือนกำหนดแก้ไขตารางเวลาทำงาน',
      content: `ตารางเวลาทำงานเดือน ${today.format('MMMM BBBB')} แก้ไขได้ถึงวันที่ ${deadline.format('D MMMM BBBB')}`,
    });
    setLastReminderKey(key);
  }, [selectedProject?.id, editCutoffDay, editCutoffNextMonth, lastReminderKey]);

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
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {projects.map((p) => (
                  <Select.Option key={p.id} value={p.id} label={p.name}>
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
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              disabled={!selectedProjectId}
            >
              ดาวน์โหลด Template
            </Button>
            <Upload {...uploadProps}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={importing}
                disabled={!selectedProjectId || !canEdit || importing}
              >
                Import Excel
              </Button>
            </Upload>
          </Space>
        }
      >
        {subProjects.length > 0 && (
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
        {/* Selected Day Statistics Dashboard */}
        <div style={{ marginBottom: 12 }}>
          <Alert
            type="info"
            showIcon
            message={
              <div>
                <div>
                  ตารางเวลาทำงานเดือน {selectedDate.format('MMMM BBBB')} แก้ไขได้ภายในวันที่ {editDeadline.format('D MMMM BBBB')}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  หมายเหตุ: การตั้งค่ากะเริ่มต้นและวันหยุดประจำสัปดาห์ ทำได้ที่เมนูพนักงาน
                </div>
              </div>
            }
          />
        </div>
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
                <span style={{ fontSize: '11px' }}>
                  {shift.name}
                  {shift.isWorkShift && shift.startTime && shift.endTime && (
                    <span style={{ color: '#666', marginLeft: 4 }}>
                      ({shift.startTime} - {shift.endTime})
                    </span>
                  )}
                </span>
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
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span>{shift.name}</span>
                  {shift.isWorkShift && shift.startTime && shift.endTime && (
                    <span style={{ fontSize: '11px', fontWeight: 400 }}>
                      {shift.startTime} - {shift.endTime}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default RosterPage;
