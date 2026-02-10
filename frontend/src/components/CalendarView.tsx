import React, { useMemo } from 'react';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { useSettingsStore } from '../stores/settingsStore';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface Staff {
  id: string;
  name: string;
  position: string;
}

interface RosterEntry {
  staffId: string;
  day: number;
  shiftCode: string;
  notes?: string;
}

interface CalendarViewProps {
  year: number; // พ.ศ.
  month: number; // 1-12
  staff: Staff[];
  entries: RosterEntry[];
  onCellClick?: (staffId: string, day: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  staff,
  entries,
  onCellClick,
}) => {
  // สร้างวันที่ของเดือนนั้น
  const daysInMonth = useMemo(() => {
    const date = dayjs(`${year - 543}-${month}-01`);
    const days = date.daysInMonth();
    return Array.from({ length: days }, (_, i) => i + 1);
  }, [year, month]);

  // แปลง entries เป็น Map สำหรับค้นหาเร็ว
  const entriesMap = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((entry) => {
      map.set(`${entry.staffId}-${entry.day}`, entry.shiftCode);
    });
    return map;
  }, [entries]);

  // หา shift config
  const { shiftTypes } = useSettingsStore();
  const getShiftConfig = (code: string) => {
    return shiftTypes.find((s) => s.code === code);
  };

  // แสดงวันในสัปดาห์
  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="calendar-view" style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '1200px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <th
              style={{
                padding: '12px 8px',
                borderBottom: '2px solid #f0f0f0',
                position: 'sticky',
                left: 0,
                backgroundColor: '#fafafa',
                zIndex: 2,
                minWidth: '180px',
                textAlign: 'left',
              }}
            >
              รายชื่อ ({staff.length})
            </th>
            {daysInMonth.map((day) => {
              const date = dayjs(`${year - 543}-${month}-${day}`);
              const dayOfWeek = weekDays[date.day()];
              const isWeekend = date.day() === 0 || date.day() === 6;

              return (
                <th
                  key={day}
                  style={{
                    padding: '8px 4px',
                    borderBottom: '2px solid #f0f0f0',
                    textAlign: 'center',
                    minWidth: '40px',
                    backgroundColor: isWeekend ? '#fff7e6' : '#fafafa',
                    fontSize: '12px',
                  }}
                >
                  <div>{day}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {dayOfWeek}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {staff.map((person, index) => (
            <tr
              key={person.id}
              style={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
              }}
            >
              <td
                style={{
                  padding: '12px 8px',
                  borderBottom: '1px solid #f0f0f0',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                  zIndex: 1,
                }}
              >
                <div style={{ fontWeight: 500, fontSize: '14px' }}>
                  {person.name}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {person.position}
                </div>
              </td>
              {daysInMonth.map((day) => {
                const shiftCode = entriesMap.get(`${person.id}-${day}`);
                const shiftConfig = shiftCode
                  ? getShiftConfig(shiftCode)
                  : null;
                const date = dayjs(`${year - 543}-${month}-${day}`);
                const isWeekend = date.day() === 0 || date.day() === 6;

                return (
                  <td
                    key={day}
                    onClick={() => onCellClick?.(person.id, day)}
                    style={{
                      padding: '4px',
                      borderBottom: '1px solid #f0f0f0',
                      borderRight: '1px solid #f5f5f5',
                      textAlign: 'center',
                      cursor: onCellClick ? 'pointer' : 'default',
                      backgroundColor: isWeekend ? '#fffbf0' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (onCellClick) {
                        e.currentTarget.style.backgroundColor = '#e6f7ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (onCellClick) {
                        e.currentTarget.style.backgroundColor = isWeekend
                          ? '#fffbf0'
                          : 'transparent';
                      }
                    }}
                  >
                    {shiftConfig ? (
                      <Tag
                        color={shiftConfig.color}
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {shiftCode}
                      </Tag>
                    ) : (
                      <span style={{ color: '#d9d9d9' }}>-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalendarView;
