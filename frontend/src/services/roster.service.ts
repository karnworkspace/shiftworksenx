import apiClient from './api';

export interface RosterEntry {
  id: string;
  day: number;
  shiftCode: string;
  notes?: string;
  staffId: string;
  rosterId: string;
  staff?: {
    id: string;
    name: string;
    position: string;
  };
}

export interface Roster {
  id: string;
  projectId: string;
  year: number;
  month: number;
  entries: RosterEntry[];
  project?: {
    id: string;
    name: string;
  };
}

export interface RosterMatrix {
  [staffId: string]: {
    staff: {
      id: string;
      name: string;
      position: string;
      code?: string;
    };
    days: {
      [day: number]: {
        shiftCode: string;
        notes?: string;
        entryId?: string;
      };
    };
  };
}

export interface GetRosterResponse {
  roster: Roster;
  rosterMatrix: RosterMatrix;
  activeStaff: any[];
}

export interface UpdateRosterEntryData {
  rosterId: string;
  staffId: string;
  day: number;
  shiftCode: string;
  notes?: string;
}

export interface BatchUpdateRosterData {
  rosterId: string;
  updates: Array<{
    staffId: string;
    day: number;
    shiftCode: string;
    notes?: string;
  }>;
}

export interface ImportRosterData {
  projectId: string;
  year: number;
  month: number;
  entries: Array<{
    staffId: string;
    day: number;
    shiftCode: string;
    notes?: string;
  }>;
}

export const rosterService = {
  // Get roster for a specific project and month
  getRoster: async (projectId: string, year: number, month: number): Promise<GetRosterResponse> => {
    const response = await apiClient.get('/rosters', {
      params: { projectId, year, month },
    });
    // Backend returns { roster: { id, projectId, year, month, matrix } }
    // We need to map it to { roster, rosterMatrix }
    const { roster } = response.data;
    return {
      roster: {
        id: roster.id,
        projectId: roster.projectId,
        year: roster.year,
        month: roster.month,
        entries: [],
        project: roster.project,
      },
      rosterMatrix: roster.matrix || {},
      activeStaff: [],
    };
  },

  // Update a single roster entry
  updateEntry: async (data: UpdateRosterEntryData): Promise<RosterEntry> => {
    const response = await apiClient.post('/rosters/entry', data);
    return response.data.entry;
  },

  // Batch update multiple roster entries
  batchUpdate: async (data: BatchUpdateRosterData): Promise<{ entries: RosterEntry[] }> => {
    const response = await apiClient.post('/rosters/batch', data);
    return response.data;
  },

  // Import roster entries (replace all)
  importRoster: async (data: ImportRosterData): Promise<{ success: boolean; count: number }> => {
    const response = await apiClient.post('/rosters/import', data);
    return response.data;
  },

  // Delete a roster entry
  deleteEntry: async (entryId: string): Promise<void> => {
    await apiClient.delete(`/rosters/entry/${entryId}`);
  },

  // Get roster statistics for a specific day
  getDayStats: async (rosterId: string, day: number): Promise<any> => {
    const response = await apiClient.get('/rosters/stats', {
      params: { rosterId, day },
    });
    return response.data;
  },
};
