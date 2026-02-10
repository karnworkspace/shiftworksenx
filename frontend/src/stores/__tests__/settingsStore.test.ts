/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import apiClient from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
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
    });
    vi.resetAllMocks();
  });

  it('fetches shift types and positions', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 's1', code: 'A', name: 'A', startTime: null, endTime: null, color: '#000', isWorkShift: true }] });
    await useSettingsStore.getState().fetchShiftTypes();
    expect(useSettingsStore.getState().shiftTypes).toHaveLength(1);

    (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 'p1', name: 'ตำแหน่ง', defaultWage: 1000 }] });
    await useSettingsStore.getState().fetchPositions();
    expect(useSettingsStore.getState().positions).toHaveLength(1);
  });

  it('adds and updates shift types', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 's1', code: 'A', name: 'A', startTime: null, endTime: null, color: '#000', isWorkShift: true } });
    await useSettingsStore.getState().addShiftType({ code: 'A', name: 'A', startTime: null, endTime: null, color: '#000', isWorkShift: true });
    expect(useSettingsStore.getState().shiftTypes).toHaveLength(1);

    (apiClient.put as any).mockResolvedValueOnce({ data: { id: 's1', code: 'A', name: 'Updated', startTime: null, endTime: null, color: '#000', isWorkShift: true } });
    await useSettingsStore.getState().updateShiftType('s1', { name: 'Updated' });
    expect(useSettingsStore.getState().shiftTypes[0].name).toBe('Updated');
  });

  it('adds and deletes positions', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 'p1', name: 'ตำแหน่ง', defaultWage: 1000 } });
    await useSettingsStore.getState().addPosition({ name: 'ตำแหน่ง', defaultWage: 1000 });
    expect(useSettingsStore.getState().positions).toHaveLength(1);

    (apiClient.delete as any).mockResolvedValueOnce({});
    await useSettingsStore.getState().deletePosition('p1');
    expect(useSettingsStore.getState().positions).toHaveLength(0);
  });

  it('applies position default wage and updates config', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { updatedCount: 3 } });
    const count = await useSettingsStore.getState().applyPositionDefaultWage('p1', 'all');
    expect(count).toBe(3);

    useSettingsStore.getState().updateDeductionConfig({ absentDeductionPerDay: 700 });
    expect(useSettingsStore.getState().deductionConfig.absentDeductionPerDay).toBe(700);
  });
});
