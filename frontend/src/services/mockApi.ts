import {
  mockProjects,
  mockStaff,
  mockRoster,
  mockRosterEntries,
  mockDeductionReport,
  mockDashboardStats,
} from '../data/mockData';

// สลับระหว่าง mock mode กับ real API
const USE_MOCK_DATA = true; // เปลี่ยนเป็น false เมื่อต้องการใช้ API จริง

// Delay เพื่อจำลองการเรียก API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // Projects
  async getProjects() {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return mockProjects;
  },

  async getProject(id: string) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(300);
    return mockProjects.find((p) => p.id === id);
  },

  async createProject(data: any) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return {
      id: `proj-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateProject(id: string, data: any) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    const project = mockProjects.find((p) => p.id === id);
    return { ...project, ...data, updatedAt: new Date().toISOString() };
  },

  async deleteProject(_id: string) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return { success: true };
  },

  // Staff
  async getStaff(params?: { projectId?: string; includeInactive?: boolean }) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    let result = [...mockStaff];
    
    if (params?.projectId) {
      result = result.filter((s) => s.projectId === params.projectId);
    }
    
    if (!params?.includeInactive) {
      result = result.filter((s) => s.isActive);
    }
    
    return result;
  },

  async getStaffById(id: string) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(300);
    return mockStaff.find((s) => s.id === id);
  },

  async createStaff(data: any) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return {
      id: `staff-${Date.now()}`,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateStaff(id: string, data: any) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    const staff = mockStaff.find((s) => s.id === id);
    return { ...staff, ...data, updatedAt: new Date().toISOString() };
  },

  async toggleStaffStatus(id: string) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    const staff = mockStaff.find((s) => s.id === id);
    if (!staff) throw new Error('Staff not found');
    return { ...staff, isActive: !staff.isActive, updatedAt: new Date().toISOString() };
  },

  async deleteStaff(_id: string) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return { success: true };
  },

  // Roster
  async getRoster(projectId: string, year: number, month: number) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(700);
    
    if (mockRoster.projectId !== projectId || mockRoster.year !== year || mockRoster.month !== month) {
      return null;
    }
    
    // สร้าง matrix format
    const staffIds = Array.from(new Set(mockRosterEntries.map((e) => e.staffId)));
    const daysInMonth = 31;
    
    const matrix = staffIds.map((staffId) => {
      const staff = mockStaff.find((s) => s.id === staffId);
      const shifts = Array.from({ length: daysInMonth }, (_, i) => {
        const entry = mockRosterEntries.find((e) => e.staffId === staffId && e.day === i + 1);
        return entry ? entry.shiftCode : '';
      });
      
      return {
        staffId,
        staffName: staff?.name || '',
        position: staff?.position || '',
        shifts,
      };
    });
    
    return {
      roster: mockRoster,
      matrix,
      project: mockProjects.find((p) => p.id === projectId),
    };
  },

  async updateRosterEntry(data: any) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(300);
    return {
      id: `entry-${Date.now()}`,
      ...data,
    };
  },

  async batchUpdateRosterEntries(data: any[]) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return { count: data.length };
  },

  // Reports
  async getDeductionReport(_projectId: string, _year: number, _month: number) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(800);
    return mockDeductionReport;
  },


  async exportReportCSV(type: string, _projectId: string, _year: number, _month: number) {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(1000);
    
    // ????????????? CSV
    let csvContent = '';
    
    if (type === 'deduction') {
      csvContent = '????????????????\n';
      csvContent += '????,???????,????????,??????,??????,??? (???)\n';
      mockDeductionReport.details.forEach((att) => {
        csvContent += `${att.staff.name},${att.staff.position},${att.totalWorkDays},${att.totalAbsent},${att.totalLate},${att.deductionAmount}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  },
  // Dashboard
  async getDashboardStats() {
    if (!USE_MOCK_DATA) throw new Error('Use real API');
    await delay(500);
    return mockDashboardStats;
  },
};

// ส่งออกฟังก์ชันสำหรับสลับโหมด
export const setMockMode = (enabled: boolean) => {
  (mockApi as any).USE_MOCK_DATA = enabled;
};

export const isMockMode = () => USE_MOCK_DATA;
