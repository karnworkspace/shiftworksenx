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

interface Position {
  id: string;
  name: string;
  defaultWage: number;
  createdAt?: string;
  updatedAt?: string;
}

interface DeductionConfig {
  absentDeductionPerDay: number;
  lateDeductionPerTime: number;
  sickLeaveDeductionPerDay: number;
  maxSickLeaveDaysPerMonth: number;
}

interface SettingsStore {
  shiftTypes: ShiftType[];
  positions: Position[];
  deductionConfig: DeductionConfig;
  loading: boolean;
  positionsLoading: boolean;
  error: string | null;

  // Shift Type actions
  fetchShiftTypes: (force?: boolean) => Promise<void>;
  addShiftType: (shift: Omit<ShiftType, 'id'>) => Promise<void>;
  updateShiftType: (id: string, updates: Partial<ShiftType>) => Promise<void>;
  deleteShiftType: (id: string) => Promise<void>;
  getShiftType: (code: string) => ShiftType | undefined;

  // Position actions
  fetchPositions: (force?: boolean) => Promise<void>;
  addPosition: (position: Omit<Position, 'id'>) => Promise<void>;
  updatePosition: (id: string, updates: Partial<Position>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  getPosition: (id: string) => Position | undefined;
  applyPositionDefaultWage: (id: string, mode: 'all' | 'not_overridden') => Promise<number>;

  // Deduction config actions
  updateDeductionConfig: (config: Partial<DeductionConfig>) => void;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  shiftTypes: [],
  positions: [],
  loading: false,
  positionsLoading: false,
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

  fetchPositions: async (force: boolean = false) => {
    const { positions, positionsLoading } = get();
    if (!force && positions.length > 0) {
      return;
    }
    if (positionsLoading) {
      return;
    }

    set({ positionsLoading: true, error: null });
    try {
      const response = await apiClient.get<Position[]>('/positions');
      set({ positions: response.data, positionsLoading: false });
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      set({
        error: error.response?.data?.error || 'Failed to fetch positions',
        positionsLoading: false,
      });
    }
  },

  addPosition: async (positionData) => {
    set({ positionsLoading: true, error: null });
    try {
      const response = await apiClient.post<Position>('/positions', positionData);
      set((state) => ({
        positions: [...state.positions, response.data],
        positionsLoading: false,
      }));
    } catch (error: any) {
      console.error('Error adding position:', error);
      set({
        error: error.response?.data?.error || 'Failed to add position',
        positionsLoading: false,
      });
      throw error;
    }
  },

  updatePosition: async (id, updates) => {
    set({ positionsLoading: true, error: null });
    try {
      const response = await apiClient.put<Position>(`/positions/${id}`, updates);
      set((state) => ({
        positions: state.positions.map((p) =>
          p.id === id ? response.data : p
        ),
        positionsLoading: false,
      }));
    } catch (error: any) {
      console.error('Error updating position:', error);
      set({
        error: error.response?.data?.error || 'Failed to update position',
        positionsLoading: false,
      });
      throw error;
    }
  },

  deletePosition: async (id) => {
    set({ positionsLoading: true, error: null });
    try {
      await apiClient.delete(`/positions/${id}`);
      set((state) => ({
        positions: state.positions.filter((p) => p.id !== id),
        positionsLoading: false,
      }));
    } catch (error: any) {
      console.error('Error deleting position:', error);
      set({
        error: error.response?.data?.error || 'Failed to delete position',
        positionsLoading: false,
      });
      throw error;
    }
  },

  getPosition: (id) => {
    return get().positions.find((p) => p.id === id);
  },

  applyPositionDefaultWage: async (id, mode) => {
    const response = await apiClient.post<{ updatedCount: number }>(
      `/positions/${id}/apply-wage`,
      { mode }
    );
    return response.data.updatedCount;
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
