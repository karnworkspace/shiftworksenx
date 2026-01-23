import { create } from 'zustand';
import apiClient from '../services/api';

interface ShiftType {
  id: string;
  code: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  color: string;
  isWorkShift: boolean;
  isSystemDefault?: boolean;
}

interface DeductionConfig {
  absentDeductionPerDay: number;
  lateDeductionPerTime: number;
  sickLeaveDeductionPerDay: number;
  maxSickLeaveDaysPerMonth: number;
}

interface SettingsStore {
  shiftTypes: ShiftType[];
  deductionConfig: DeductionConfig;
  loading: boolean;
  error: string | null;

  // Shift Type actions
  fetchShiftTypes: (force?: boolean) => Promise<void>;
  addShiftType: (shift: Omit<ShiftType, 'id'>) => Promise<void>;
  updateShiftType: (id: string, updates: Partial<ShiftType>) => Promise<void>;
  deleteShiftType: (id: string) => Promise<void>;
  getShiftType: (code: string) => ShiftType | undefined;

  // Deduction config actions
  updateDeductionConfig: (config: Partial<DeductionConfig>) => void;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  shiftTypes: [],
  loading: false,
  error: null,

  deductionConfig: {
    absentDeductionPerDay: 500,
    lateDeductionPerTime: 100,
    sickLeaveDeductionPerDay: 0,
    maxSickLeaveDaysPerMonth: 3,
  },

  fetchShiftTypes: async (force: boolean = false) => {
    // Skip if already loaded and not forcing refresh
    const { shiftTypes, loading } = get();
    if (!force && shiftTypes.length > 0) {
      return;
    }
    
    // Don't fetch if already loading
    if (loading) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ShiftType[]>('/shifts');
      set({ shiftTypes: response.data, loading: false });
    } catch (error: any) {
      console.error('Error fetching shift types:', error);
      set({
        error: error.response?.data?.error || 'Failed to fetch shift types',
        loading: false
      });
    }
  },

  addShiftType: async (shiftData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ShiftType>('/shifts', shiftData);
      set((state) => ({
        shiftTypes: [...state.shiftTypes, response.data],
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error adding shift type:', error);
      set({
        error: error.response?.data?.error || 'Failed to add shift type',
        loading: false
      });
      throw error;
    }
  },

  updateShiftType: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ShiftType>(`/shifts/${id}`, updates);
      set((state) => ({
        shiftTypes: state.shiftTypes.map((s) =>
          s.id === id ? response.data : s
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error updating shift type:', error);
      set({
        error: error.response?.data?.error || 'Failed to update shift type',
        loading: false
      });
      throw error;
    }
  },

  deleteShiftType: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/shifts/${id}`);
      set((state) => ({
        shiftTypes: state.shiftTypes.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting shift type:', error);
      set({
        error: error.response?.data?.error || 'Failed to delete shift type',
        loading: false
      });
      throw error;
    }
  },

  getShiftType: (code) => {
    return get().shiftTypes.find((s) => s.code === code);
  },

  updateDeductionConfig: (config) => {
    set((state) => ({
      deductionConfig: { ...state.deductionConfig, ...config },
    }));
  },
}));
