import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockShiftTypes } from '../data/mockData';

interface ShiftType {
  id: string;
  code: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  color: string;
  isWorkShift: boolean;
}

interface DeductionConfig {
  absentDeductionPerDay: number;  // หักต่อวันขาด
  lateDeductionPerTime: number;   // หักต่อครั้งสาย
  sickLeaveDeductionPerDay: number; // หักต่อวันลาป่วย (ถ้าเกินโควต้า)
  maxSickLeaveDaysPerMonth: number; // โควต้าลาป่วยต่อเดือน
}

interface SettingsStore {
  shiftTypes: ShiftType[];
  deductionConfig: DeductionConfig;
  
  // Shift Type actions
  addShiftType: (shift: Omit<ShiftType, 'id'>) => void;
  updateShiftType: (id: string, updates: Partial<ShiftType>) => void;
  deleteShiftType: (id: string) => void;
  getShiftType: (code: string) => ShiftType | undefined;
  
  // Deduction config actions
  updateDeductionConfig: (config: Partial<DeductionConfig>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      shiftTypes: mockShiftTypes.map(st => ({
        ...st,
        startTime: st.startTime || null,
        endTime: st.endTime || null,
      })) as ShiftType[],
      
      deductionConfig: {
        absentDeductionPerDay: 500,
        lateDeductionPerTime: 100,
        sickLeaveDeductionPerDay: 0,
        maxSickLeaveDaysPerMonth: 3,
      },

      addShiftType: (shiftData) => {
        const newShift: ShiftType = {
          ...shiftData,
          id: `shift-${Date.now()}`,
        };
        set((state) => ({
          shiftTypes: [...state.shiftTypes, newShift],
        }));
      },

      updateShiftType: (id, updates) => {
        set((state) => ({
          shiftTypes: state.shiftTypes.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteShiftType: (id) => {
        set((state) => ({
          shiftTypes: state.shiftTypes.filter((s) => s.id !== id),
        }));
      },

      getShiftType: (code) => {
        return get().shiftTypes.find((s) => s.code === code);
      },

      updateDeductionConfig: (config) => {
        set((state) => ({
          deductionConfig: { ...state.deductionConfig, ...config },
        }));
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
