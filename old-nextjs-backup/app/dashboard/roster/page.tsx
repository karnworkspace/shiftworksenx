'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Save, Download, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { THAI_MONTHS, getMonthDays, SHIFT_COLORS, SHIFT_LABELS } from '@/lib/utils';

function RosterContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const projectId = searchParams.get('projectId') || '';
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear() + 543));
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

  const [changes, setChanges] = useState<Record<string, string>>({});

  // ดึงข้อมูล roster
  const { data: rosterData, isLoading } = useQuery({
    queryKey: ['roster', projectId, year, month],
    queryFn: async () => {
      const response = await axios.get('/api/rosters', {
        params: { projectId, year, month },
      });
      return response.data.roster;
    },
    enabled: !!projectId,
  });

  // Mutation สำหรับบันทึกการเปลี่ยนแปลง
  const updateMutation = useMutation({
    mutationFn: async ({ rosterId, staffId, day, shiftCode }: any) => {
      return await axios.post('/api/rosters', {
        rosterId,
        staffId,
        day,
        shiftCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster'] });
      toast.success('บันทึกสำเร็จ');
      setChanges({});
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาด');
    },
  });

  const handleShiftChange = (staffId: string, day: number, shiftCode: string) => {
    const key = `${staffId}-${day}`;
    setChanges((prev) => ({ ...prev, [key]: shiftCode }));
  };

  const handleSave = () => {
    if (!rosterData) return;

    const updates = Object.entries(changes).map(([key, shiftCode]) => {
      const [staffId, day] = key.split('-');
      return {
        rosterId: rosterData.id,
        staffId,
        day: parseInt(day),
        shiftCode,
      };
    });

    Promise.all(updates.map((update) => updateMutation.mutateAsync(update)));
  };

  if (!projectId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">กรุณาเลือกโครงการและเดือน</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">กำลังโหลด...</p>
      </div>
    );
  }

  const roster = rosterData;
  const days = getMonthDays(year - 543, month);

  // จัดกลุ่ม entries ตาม staff
  const staffEntries: Record<string, any> = {};
  roster?.entries.forEach((entry: any) => {
    if (!staffEntries[entry.staffId]) {
      staffEntries[entry.staffId] = {
        staff: entry.staff,
        days: {},
      };
    }
    staffEntries[entry.staffId].days[entry.day] = entry.shiftCode;
  });

  const staffList = Object.values(staffEntries);

  // Shift options
  const shiftOptions = ['1', '2', '3', 'ดึก', 'OFF', 'ข', 'ป', 'ก', 'พ'];

  return (
    <div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {roster?.project.name}
            </h2>
            <p className="text-gray-600 mt-1">
              {THAI_MONTHS[month - 1]} {year}
            </p>
          </div>
          <div className="flex gap-3">
            {Object.keys(changes).length > 0 && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Save size={20} />
                บันทึก ({Object.keys(changes).length})
              </button>
            )}
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Download size={20} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Shift Legend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">สัญลักษณ์กะ:</h3>
        <div className="flex flex-wrap gap-3">
          {shiftOptions.map((shift) => (
            <div key={shift} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-semibold ${SHIFT_COLORS[shift]}`}>
                {shift}
              </div>
              <span className="text-sm text-gray-700">{SHIFT_LABELS[shift]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 z-10">
                  พนักงาน
                </th>
                {days.map((day) => (
                  <th key={day} className="px-2 py-3 text-center font-semibold text-gray-700 min-w-[60px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staffEntry: any, index) => {
                const { staff, days: staffDays } = staffEntry;
                const isSpare = staff.staffType === 'SPARE';

                return (
                  <tr key={staff.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="sticky left-0 bg-inherit px-4 py-2 z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{staff.name}</span>
                        {isSpare && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            สแปร์
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">{staff.position}</span>
                    </td>
                    {days.map((day) => {
                      const key = `${staff.id}-${day}`;
                      const currentShift = changes[key] || staffDays[day] || '1';

                      return (
                        <td key={day} className="px-1 py-2">
                          <select
                            value={currentShift}
                            onChange={(e) => handleShiftChange(staff.id, day, e.target.value)}
                            className={`w-full px-2 py-1 text-center rounded border-0 cursor-pointer text-sm font-semibold ${SHIFT_COLORS[currentShift]} ${changes[key] ? 'ring-2 ring-yellow-400' : ''}`}
                          >
                            {shiftOptions.map((shift) => (
                              <option key={shift} value={shift}>
                                {shift}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
        <h3 className="font-semibold text-gray-800 mb-4">สรุปสถิติ</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{staffList.length}</p>
            <p className="text-sm text-gray-600">พนักงานทั้งหมด</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{days.length}</p>
            <p className="text-sm text-gray-600">วันในเดือน</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RosterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RosterContent />
    </Suspense>
  );
}
