/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockXlsx = vi.hoisted(() => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    sheet_to_json: vi.fn(() => []),
  },
  writeFile: vi.fn(),
  read: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
}));

vi.mock('xlsx', () => mockXlsx);

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  const Modal = actual.Modal;
  return {
    ...actual,
    message: {
      loading: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
    Modal: Object.assign(Modal, { confirm: vi.fn() }),
  };
});

const mockProjectStore = vi.hoisted(() => ({
  projects: [
    { id: 'p1', name: 'Project A', isActive: true, themeColor: '#000', editCutoffDay: 2, editCutoffNextMonth: true },
  ],
  loading: false,
  selectedProjectId: 'p1',
  fetchProjects: vi.fn(),
  setSelectedProjectId: vi.fn(),
}));

const mockStaffStore = vi.hoisted(() => ({
  loading: false,
  fetchStaff: vi.fn(),
  getStaffByProject: () => [
    { id: 's1', code: 'A01', name: 'Alice', position: 'พนักงาน', projectId: 'p1', isActive: true, wagePerDay: 1000 },
  ],
}));

const mockRosterStore = vi.hoisted(() => ({
  loading: false,
  currentRoster: { id: 'r1', projectId: 'p1', year: 2024, month: 1 },
  rosterMatrix: {
    s1: { staff: { id: 's1', name: 'Alice', position: 'พนักงาน' }, days: { 1: { shiftCode: 'A' } } },
  },
  fetchRoster: vi.fn(),
  updateRosterEntry: vi.fn(),
}));

const mockSettingsStoreState = vi.hoisted(() => ({
  shiftTypes: [{ code: 'A', name: 'A', color: '#000', isWorkShift: true }],
  fetchShiftTypes: vi.fn(),
}));

const useSettingsStoreMock = vi.hoisted(() =>
  Object.assign(() => mockSettingsStoreState, { getState: () => mockSettingsStoreState })
);

vi.mock('../../stores/projectStore', () => ({
  useProjectStore: () => mockProjectStore,
}));

vi.mock('../../stores/staffStore', () => ({
  useStaffStore: () => mockStaffStore,
}));

vi.mock('../../stores/rosterStore', () => ({
  useRosterStore: () => mockRosterStore,
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: useSettingsStoreMock,
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { role: 'SUPER_ADMIN' } }),
}));

import RosterPage from '../RosterPage';

describe('RosterPage', () => {
  beforeEach(() => {
    mockProjectStore.fetchProjects.mockClear();
    mockStaffStore.fetchStaff.mockClear();
    mockRosterStore.fetchRoster.mockClear();
    mockXlsx.writeFile.mockClear();
  });

  it('renders and downloads template', async () => {
    render(<RosterPage />);

    expect(mockProjectStore.fetchProjects).toHaveBeenCalled();
    expect(mockStaffStore.fetchStaff).toHaveBeenCalled();
    await waitFor(() => expect(mockRosterStore.fetchRoster).toHaveBeenCalled());

    const downloadBtn = screen.getByRole('button', { name: /ดาวน์โหลด Template/i });
    fireEvent.click(downloadBtn);

    expect(mockXlsx.writeFile).toHaveBeenCalled();
  });
});
