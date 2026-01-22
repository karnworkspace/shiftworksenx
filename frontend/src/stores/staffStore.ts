import { create } from 'zustand';
import { staffService, Staff, CreateStaffData, UpdateStaffData } from '../services/staff.service';

interface StaffStore {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  
  // API methods
  fetchStaff: (projectId: string, includeInactive?: boolean) => Promise<void>;
  fetchAllStaff: (projectIds: string[]) => Promise<void>;
  addStaff: (data: CreateStaffData) => Promise<Staff | null>;
  updateStaff: (id: string, updates: UpdateStaffData) => Promise<Staff | null>;
  deleteStaff: (id: string) => Promise<boolean>;
  setStaffInactive: (id: string) => Promise<Staff | null>;
  
  // Local getters
  getStaff: (id: string) => Staff | undefined;
  getStaffByProject: (projectId: string) => Staff[];
  getActiveStaffByProject: (projectId: string) => Staff[];
  
  // Local state
  setStaff: (staff: Staff[]) => void;
  clearError: () => void;
}

export const useStaffStore = create<StaffStore>((set, get) => ({
  staff: [],
  loading: false,
  error: null,

  fetchStaff: async (projectId: string, includeInactive: boolean = true) => {
    set({ loading: true, error: null });
    try {
      const staff = await staffService.getAll(projectId, includeInactive);
      // Merge with existing staff from other projects
      set((state) => {
        const otherStaff = state.staff.filter((s) => s.projectId !== projectId);
        return { staff: [...otherStaff, ...staff], loading: false };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch staff', loading: false });
    }
  },

  fetchAllStaff: async (projectIds: string[]) => {
    set({ loading: true, error: null });
    try {
      const allStaff: Staff[] = [];
      for (const projectId of projectIds) {
        const staff = await staffService.getAll(projectId, true);
        allStaff.push(...staff);
      }
      set({ staff: allStaff, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch staff', loading: false });
    }
  },

  addStaff: async (data: CreateStaffData) => {
    set({ loading: true, error: null });
    try {
      const newStaff = await staffService.create(data);
      set((state) => ({
        staff: [...state.staff, newStaff],
        loading: false,
      }));
      return newStaff;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create staff', loading: false });
      return null;
    }
  },

  updateStaff: async (id: string, updates: UpdateStaffData) => {
    set({ loading: true, error: null });
    try {
      const updatedStaff = await staffService.update(id, updates);
      set((state) => ({
        staff: state.staff.map((s) => (s.id === id ? updatedStaff : s)),
        loading: false,
      }));
      return updatedStaff;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update staff', loading: false });
      return null;
    }
  },

  deleteStaff: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await staffService.delete(id);
      set((state) => ({
        staff: state.staff.filter((s) => s.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete staff', loading: false });
      return false;
    }
  },

  setStaffInactive: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updatedStaff = await staffService.toggleStatus(id);
      set((state) => ({
        staff: state.staff.map((s) => (s.id === id ? updatedStaff : s)),
        loading: false,
      }));
      return updatedStaff;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to toggle staff status', loading: false });
      return null;
    }
  },

  getStaff: (id: string) => {
    return get().staff.find((s) => s.id === id);
  },

  getStaffByProject: (projectId: string) => {
    return get().staff.filter((s) => s.projectId === projectId);
  },

  getActiveStaffByProject: (projectId: string) => {
    return get().staff.filter((s) => s.projectId === projectId && s.isActive);
  },

  setStaff: (staff: Staff[]) => set({ staff }),
  
  clearError: () => set({ error: null }),
}));

