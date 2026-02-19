/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRosterStore } from '../rosterStore';
import { rosterService } from '../../services/roster.service';

vi.mock('../../services/roster.service', () => ({
  rosterService: {
    getRoster: vi.fn(),
    updateEntry: vi.fn(),
    batchUpdate: vi.fn(),
  },
}));

describe('rosterStore', () => {
  beforeEach(() => {
    useRosterStore.setState({
      currentRoster: null,
      rosterMatrix: {},
      loading: false,
      error: null,
      lastFetchKey: null,
    });
    vi.resetAllMocks();
  });

  it('fetches roster and caches by key', async () => {
    (rosterService.getRoster as any).mockResolvedValue({
      roster: { id: 'r1', projectId: 'p1', year: 2024, month: 1 },
      rosterMatrix: { s1: { staff: { id: 's1', name: 'A', position: 'P' }, days: { 1: { shiftCode: 'A' } } } },
    });
    await useRosterStore.getState().fetchRoster('p1', 2024, 1);
    const state = useRosterStore.getState();
    expect(state.currentRoster?.id).toBe('r1');
    expect(state.rosterMatrix.s1.days[1].shiftCode).toBe('A');
    expect(state.lastFetchKey).toBe('p1-2024-1');
  });

  it('skips fetch when already loaded and not forced', async () => {
    useRosterStore.setState({ lastFetchKey: 'p1-2024-1' });
    await useRosterStore.getState().fetchRoster('p1', 2024, 1);
    expect(rosterService.getRoster).not.toHaveBeenCalled();
  });

  it('optimistically updates and rolls back on failure', async () => {
    useRosterStore.setState({
      rosterMatrix: { s1: { staff: { id: 's1', name: '', position: '' }, days: {} } },
    });
    (rosterService.updateEntry as any).mockRejectedValue(new Error('fail'));
    await expect(
      useRosterStore.getState().updateRosterEntry({ rosterId: 'r1', staffId: 's1', day: 1, shiftCode: 'X' })
    ).rejects.toThrow();
    expect(useRosterStore.getState().rosterMatrix.s1.days[1]).toBeUndefined();
  });

  it('batch updates when roster exists', async () => {
    useRosterStore.setState({
      currentRoster: { id: 'r1', projectId: 'p1', year: 2024, month: 1 } as any,
    });
    (rosterService.batchUpdate as any).mockResolvedValue(undefined);
    await useRosterStore.getState().batchUpdateEntries('r1', [{ staffId: 's1', day: 1, shiftCode: 'A' }]);
    expect(rosterService.batchUpdate).toHaveBeenCalled();
  });

  it('returns OFF for missing roster entry', () => {
    expect(useRosterStore.getState().getRosterShift('s1', 1)).toBe('OFF');
  });
});
