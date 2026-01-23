import { create } from 'zustand';
import { rosterService, Roster, RosterMatrix, UpdateRosterEntryData } from '../services/roster.service';

interface RosterStore {
  currentRoster: Roster | null;
  rosterMatrix: RosterMatrix;
  loading: boolean;
  error: string | null;
  lastFetchKey: string | null; // Cache key for last fetch
  
  // API methods
  fetchRoster: (projectId: string, year: number, month: number, force?: boolean) => Promise<void>;
  updateRosterEntry: (data: UpdateRosterEntryData) => Promise<void>;
  batchUpdateEntries: (rosterId: string, updates: Array<{ staffId: string; day: number; shiftCode: string; notes?: string }>) => Promise<void>;
  
  // Local getters
  getRosterShift: (staffId: string, day: number) => string;
  
  // Local state
  clearRoster: () => void;
  clearError: () => void;
}

export const useRosterStore = create<RosterStore>((set, get) => ({
  currentRoster: null,
  rosterMatrix: {},
  loading: false,
  error: null,
  lastFetchKey: null,

  fetchRoster: async (projectId: string, year: number, month: number, force: boolean = false) => {
    const fetchKey = `${projectId}-${year}-${month}`;
    const { lastFetchKey, loading } = get();
    
    // Skip if already fetching or already loaded (unless forced)
    if (loading || (!force && lastFetchKey === fetchKey)) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const data = await rosterService.getRoster(projectId, year, month);
      set({
        currentRoster: data.roster,
        rosterMatrix: data.rosterMatrix,
        loading: false,
        lastFetchKey: fetchKey,
      });
    } catch (error: any) {
      console.error('Error fetching roster:', error);
      set({
        error: error.response?.data?.error || 'Failed to fetch roster',
        loading: false,
      });
    }
  },

  updateRosterEntry: async (data: UpdateRosterEntryData) => {
    const { rosterMatrix } = get();
    const oldMatrix = { ...rosterMatrix };
    
    // Optimistic update - update UI immediately
    const updatedMatrix = { ...rosterMatrix };
    
    // Create entry if staff doesn't exist in matrix
    if (!updatedMatrix[data.staffId]) {
      updatedMatrix[data.staffId] = {
        staff: { id: data.staffId, name: '', position: '' },
        days: {},
      };
    }
    
    updatedMatrix[data.staffId] = {
      ...updatedMatrix[data.staffId],
      days: {
        ...updatedMatrix[data.staffId].days,
        [data.day]: {
          shiftCode: data.shiftCode,
          notes: data.notes,
        },
      },
    };
    
    // Update UI immediately (optimistic)
    set({ rosterMatrix: updatedMatrix });
    
    try {
      // Make API call in background
      await rosterService.updateEntry(data);
    } catch (error: any) {
      // Rollback on error
      set({ rosterMatrix: oldMatrix });
      throw error;
    }
  },

  batchUpdateEntries: async (rosterId: string, updates: Array<{ staffId: string; day: number; shiftCode: string; notes?: string }>) => {
    set({ loading: true, error: null });
    try {
      await rosterService.batchUpdate({ rosterId, updates });
      // Refetch roster to get updated data (force refresh)
      const { currentRoster } = get();
      if (currentRoster) {
        await get().fetchRoster(currentRoster.projectId, currentRoster.year, currentRoster.month, true);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to batch update roster',
        loading: false,
      });
    }
  },

  getRosterShift: (staffId: string, day: number) => {
    const { rosterMatrix } = get();
    return rosterMatrix[staffId]?.days[day]?.shiftCode || 'OFF';
  },

  clearRoster: () => set({ currentRoster: null, rosterMatrix: {}, error: null, lastFetchKey: null }),
  
  clearError: () => set({ error: null }),
}));
