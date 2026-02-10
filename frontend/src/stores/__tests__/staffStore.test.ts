/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStaffStore } from '../staffStore';
import { staffService } from '../../services/staff.service';

vi.mock('../../services/staff.service', () => ({
  staffService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    applyDefaultShift: vi.fn(),
    applyWeeklyOffDay: vi.fn(),
    reorder: vi.fn(),
    delete: vi.fn(),
    toggleStatus: vi.fn(),
  },
}));

const staffA = { id: 's1', name: 'A', position: 'P', wagePerDay: 1000, isActive: true, projectId: 'p1' } as any;
const staffB = { id: 's2', name: 'B', position: 'P', wagePerDay: 1000, isActive: true, projectId: 'p2' } as any;

describe('staffStore', () => {
  beforeEach(() => {
    useStaffStore.setState({ staff: [], loading: false, error: null });
    vi.resetAllMocks();
  });

  it('fetches staff and merges by project', async () => {
    useStaffStore.setState({ staff: [staffB] });
    (staffService.getAll as any).mockResolvedValue([staffA]);
    await useStaffStore.getState().fetchStaff('p1', true);
    expect(useStaffStore.getState().staff).toHaveLength(2);
  });

  it('adds, updates, and deletes staff', async () => {
    (staffService.create as any).mockResolvedValue(staffA);
    const created = await useStaffStore.getState().addStaff({ name: 'A', position: 'P', wagePerDay: 1000, projectId: 'p1' } as any);
    expect(created?.id).toBe('s1');

    (staffService.update as any).mockResolvedValue({ ...staffA, name: 'Updated' });
    const updated = await useStaffStore.getState().updateStaff('s1', { name: 'Updated' });
    expect(updated?.name).toBe('Updated');

    (staffService.delete as any).mockResolvedValue(undefined);
    const deleted = await useStaffStore.getState().deleteStaff('s1');
    expect(deleted).toBe(true);
  });

  it('applies default shift and weekly off day', async () => {
    useStaffStore.setState({ staff: [staffA] });
    (staffService.applyDefaultShift as any).mockResolvedValue({ ...staffA, defaultShift: 'A' });
    const updatedShift = await useStaffStore.getState().applyDefaultShift('s1', 'A');
    expect(updatedShift?.defaultShift).toBe('A');

    (staffService.applyWeeklyOffDay as any).mockResolvedValue({ ...staffA, weeklyOffDay: 2 });
    const updatedOff = await useStaffStore.getState().applyWeeklyOffDay('s1', 2);
    expect(updatedOff?.weeklyOffDay).toBe(2);
  });

  it('reorders staff by displayOrder', async () => {
    useStaffStore.setState({ staff: [{ ...staffA, projectId: 'p1' }, { ...staffB, projectId: 'p1' }] });
    (staffService.reorder as any).mockResolvedValue(undefined);
    const ok = await useStaffStore.getState().reorderStaff('p1', ['s2', 's1']);
    expect(ok).toBe(true);
    const ordered = useStaffStore.getState().getStaffByProject('p1');
    expect(ordered[0].id).toBe('s2');
  });
});
