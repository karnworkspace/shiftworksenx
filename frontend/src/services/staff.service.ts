import apiClient from './api';

export interface Staff {
  id: string;
  code: string;
  name: string;
  position: string;
  phone?: string;
  wagePerDay: number;
  staffType: 'REGULAR' | 'SPARE';
  availability: 'AVAILABLE' | 'TEMPORARILY_OFF' | 'ON_LEAVE';
  isActive: boolean;
  projectId: string;
  defaultShift?: string;
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
  name: string;
  position: string;
  phone?: string;
  wagePerDay: number;
  staffType?: string;
  defaultShift?: string;
  projectId: string;
  remark?: string;
}

export interface UpdateStaffData {
  name?: string;
  position?: string;
  phone?: string;
  wagePerDay?: number;
  staffType?: string;
  defaultShift?: string;
  isActive?: boolean;
  availability?: string;
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

  // Toggle staff active status
  toggleStatus: async (id: string): Promise<Staff> => {
    const response = await apiClient.patch(`/staff/${id}/toggle-status`);
    return response.data.staff;
  },

  // Delete staff (use with caution)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },
};
