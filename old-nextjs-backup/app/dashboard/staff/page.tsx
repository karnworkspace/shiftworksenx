'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/api/projects');
      return response.data.projects;
    },
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff', selectedProject],
    queryFn: async () => {
      const params: any = { includeInactive: true };
      if (selectedProject !== 'all') {
        params.projectId = selectedProject;
      }
      const response = await axios.get('/api/staff', { params });
      return response.data.staff;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: any) =>
      axios.patch(`/api/staff/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('เปลี่ยนสถานะสำเร็จ');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('ลบพนักงานสำเร็จ');
    },
  });

  const projects = projectsData || [];
  const staff = staffData || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">จัดการพนักงาน</h1>
          <p className="text-gray-600">จัดการข้อมูลพนักงานและตำแหน่งงาน</p>
        </div>
        <button
          onClick={() => {
            setEditingStaff(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          เพิ่มพนักงาน
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            กรองตามโครงการ:
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกโครงการ</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  ชื่อพนักงาน
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  ตำแหน่ง
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  โครงการ
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  เบอร์โทร
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  ค่าแรง/วัน
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s: any, index: number) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-100 ${
                    !s.isActive ? 'bg-gray-50 opacity-60' : ''
                  } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{s.name}</span>
                      {s.staffType === 'SPARE' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          สแปร์
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.position}</td>
                  <td className="px-6 py-4 text-gray-600">{s.project.name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.phone || '-'}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {formatCurrency(s.wagePerDay)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: s.id,
                          isActive: s.isActive,
                        })
                      }
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mx-auto ${
                        s.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.isActive ? (
                        <>
                          <UserCheck size={14} />
                          ทำงาน
                        </>
                      ) : (
                        <>
                          <UserX size={14} />
                          ไม่ทำงาน
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingStaff(s);
                          setShowModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('ต้องการปิดการใช้งานพนักงานนี้?')) {
                            deleteMutation.mutate(s.id);
                          }
                        }}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StaffModal
          staff={editingStaff}
          projects={projects}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function StaffModal({
  staff,
  projects,
  onClose,
}: {
  staff: any;
  projects: any[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    position: staff?.position || '',
    phone: staff?.phone || '',
    wagePerDay: staff?.wagePerDay || 400,
    staffType: staff?.staffType || 'REGULAR',
    defaultShift: staff?.defaultShift || '1',
    projectId: staff?.projectId || projects[0]?.id || '',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (staff) {
        return await axios.patch(`/api/staff/${staff.id}`, data);
      } else {
        return await axios.post('/api/staff', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(staff ? 'แก้ไขสำเร็จ' : 'เพิ่มพนักงานสำเร็จ');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {staff ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อพนักงาน *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตำแหน่ง *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทร
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค่าแรง/วัน *
              </label>
              <input
                type="number"
                required
                value={formData.wagePerDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wagePerDay: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทพนักงาน *
              </label>
              <select
                value={formData.staffType}
                onChange={(e) =>
                  setFormData({ ...formData, staffType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="REGULAR">ประจำ</option>
                <option value="SPARE">สแปร์</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กะตั้งต้น
              </label>
              <select
                value={formData.defaultShift}
                onChange={(e) =>
                  setFormData({ ...formData, defaultShift: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">กะ 1</option>
                <option value="2">กะ 2</option>
                <option value="3">กะ 3</option>
                <option value="ดึก">ดึก</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              โครงการ *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
