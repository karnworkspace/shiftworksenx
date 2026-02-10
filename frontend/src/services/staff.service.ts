import apiClient from './api';

export interface Staff {
  id: string;
  code: string;
  name: string;
  position: string;
  positionId?: string;
  phone?: string;
  wagePerDay: number;
  wageOverride?: boolean;
  staffType: 'REGULAR' | 'SPARE';
  displayOrder?: number | null;
  isActive: boolean;
  projectId: string;
  defaultShift?: string;
  weeklyOffDay?: number | null;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    themeColor?: string;
  };
}

export interface CreateStaffData {
  code?: string;
  name: string;
  position?: string;
  positionId?: string;
  phone?: string;
  wagePerDay?: number;
  staffType?: string;
  defaultShift?: string;
  weeklyOffDay?: number | null;
  displayOrder?: number;
  projectId: string;
  remark?: string;
}

export interface UpdateStaffData {
  code?: string;
  name?: string;
  position?: string;
  positionId?: string;
  phone?: string;
  wagePerDay?: number;
  staffType?: string;
  defaultShift?: string;
  weeklyOffDay?: number | null;
  displayOrder?: number;
  isActive?: boolean;
  remark?: string;
}

export const staffService = {
  // Get all staff for a project
  getAll: async (projectId: string, includeInactive: boolean = true): Promise<Staff[]> => {
    const response = await apiClient.get('/staff', {
      params: { projectId, includeInactive },
    });
    return response.data.staff;
  },

  // Get staff by ID
  getById: async (id: string): Promise<Staff> => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data.staff;
  },

  // Create new staff
  create: async (data: CreateStaffData): Promise<Staff> => {
    const response = await apiClient.post('/staff', data);
    return response.data.staff;
  },

  // Update staff
  update: async (id: string, data: UpdateStaffData): Promise<Staff> => {
    const response = await apiClient.put(`/staff/${id}`, data);
    return response.data.staff;
  },

  // Apply default shift for staff (current + future months)
  applyDefaultShift: async (id: string, defaultShift: string): Promise<Staff> => {
    const response = await apiClient.post(`/staff/${id}/default-shift`, { defaultShift });
    return response.data.staff;
  },

  // Apply weekly off day for staff (current + future months)
  applyWeeklyOffDay: async (id: string, weeklyOffDay: number | null): Promise<Staff> => {
    const response = await apiClient.post(`/staff/${id}/weekly-off-day`, { weeklyOffDay });
    return response.data.staff;
  },

  // Toggle staff active status
  toggleStatus: async (id: string): Promise<Staff> => {
    const response = await apiClient.patch(`/staff/${id}/toggle-status`);
    return response.data.staff;
  },

  // Reorder staff display order within a project
  reorder: async (projectId: string, orderedStaffIds: string[]): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/staff/reorder', { projectId, orderedStaffIds });
    return response.data;
  },

  // Delete staff (use with caution)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },
};
