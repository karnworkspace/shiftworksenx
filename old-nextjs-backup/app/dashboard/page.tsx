'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Building2, Users, Calendar, TrendingUp, Share2 } from 'lucide-react';
import { THAI_MONTHS, toBuddhistYear, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear + 543); // พ.ศ.

  // ดึงข้อมูลโครงการ
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/api/projects');
      return response.data.projects;
    },
  });

  const projects = projectsData || [];
  const totalProjects = projects.filter((p: any) => p.isActive).length;
  const totalStaff = projects.reduce((sum: number, p: any) => sum + p._count.staff, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">แดชบอร์ด</h1>
        <p className="text-gray-600">ภาพรวมระบบจัดการเวรปฏิบัติงาน</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{totalProjects}</h3>
          <p className="text-gray-600 text-sm">โครงการทั้งหมด</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{totalStaff}</h3>
          <p className="text-gray-600 text-sm">พนักงานทั้งหมด</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            {THAI_MONTHS[new Date().getMonth()]}
          </h3>
          <p className="text-gray-600 text-sm">เดือนปัจจุบัน</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{selectedYear}</h3>
          <p className="text-gray-600 text-sm">ปีที่เลือก (พ.ศ.)</p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">รายงานประจำเดือน</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[0, 1, 2].map((offset) => {
              const year = currentYear + 543 + offset;
              return (
                <option key={year} value={year}>
                  พ.ศ. {year}
                </option>
              );
            })}
          </select>
        </div>

        {/* Project Cards by Month */}
        <div className="space-y-6">
          {projects.filter((p: any) => p.isActive).map((project: any) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4"
              style={{ borderLeftWidth: '4px', borderLeftColor: project.themeColor }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {project.name}
                  </h3>
                  {project.costSharingFrom.length > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Share2 size={12} />
                      แชร์ค่าใช้จ่าย
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600">{project.location}</span>
              </div>

              {/* Months Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {THAI_MONTHS.map((month, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {month}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/roster?projectId=${project.id}&year=${selectedYear}&month=${index + 1}`}
                        className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-center"
                      >
                        ตาราง
                      </Link>
                      <Link
                        href={`/dashboard/reports/deduction?projectId=${project.id}&year=${selectedYear}&month=${index + 1}`}
                        className="flex-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-center"
                      >
                        รายงาน
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
