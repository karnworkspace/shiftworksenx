'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Plus, Edit, Trash2, Share2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/api/projects?includeInactive=true');
      return response.data.projects;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('ลบโครงการสำเร็จ');
    },
  });

  const projects = projectsData || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">จัดการโครงการ</h1>
          <p className="text-gray-600">จัดการข้อมูลโครงการและการแชร์ค่าใช้จ่าย</p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          เพิ่มโครงการ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project: any) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div
              className="h-2"
              style={{ backgroundColor: project.themeColor }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${project.themeColor}20` }}
                  >
                    <Building2
                      size={24}
                      style={{ color: project.themeColor }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.location}</p>
                  </div>
                </div>
              </div>

              {project.costSharingFrom.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 size={16} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">
                      แชร์ค่าใช้จ่าย:
                    </span>
                  </div>
                  {project.costSharingFrom.map((cs: any) => (
                    <div key={cs.id} className="text-sm text-blue-700 ml-6">
                      • {cs.destinationProject.name} ({cs.percentage}%)
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>พนักงาน: {project._count.staff} คน</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    project.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {project.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProject(project);
                    setShowModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  <Edit size={16} />
                  แก้ไข
                </button>
                <button
                  onClick={() => {
                    if (confirm('ต้องการลบโครงการนี้?')) {
                      deleteMutation.mutate(project.id);
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: project?.name || '',
    location: project?.location || '',
    themeColor: project?.themeColor || '#3b82f6',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (project) {
        return await axios.patch(`/api/projects/${project.id}`, data);
      } else {
        return await axios.post('/api/projects', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(project ? 'แก้ไขสำเร็จ' : 'เพิ่มโครงการสำเร็จ');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {project ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อโครงการ *
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
              สถานที่
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สีธีม
            </label>
            <input
              type="color"
              value={formData.themeColor}
              onChange={(e) =>
                setFormData({ ...formData, themeColor: e.target.value })
              }
              className="w-20 h-10 rounded cursor-pointer"
            />
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
