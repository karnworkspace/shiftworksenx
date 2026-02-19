
/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateMonthlyReport = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../../utils/pdfGenerator', () => ({
  generateMonthlyReport: (...args: any[]) => mockGenerateMonthlyReport(...args),
}));

const mockProjectStore = vi.hoisted(() => ({
  projects: [
    {
      id: 'p1',
      name: 'Project A',
      themeColor: '#000',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
  ],
  loading: false,
  selectedProjectId: 'p1',
  fetchProjects: vi.fn(),
  setSelectedProjectId: vi.fn(),
  getProject: (_id: string) => mockProjectStore.projects[0],
}));

const mockStaffStore = vi.hoisted(() => ({
  loading: false,
  fetchStaff: vi.fn(),
  getStaffByProject: (projectId: string) => [
    { id: 's1', name: 'Alice', position: 'พนักงาน', wagePerDay: 1000, isActive: true, projectId },
  ],
}));

const mockRosterStore = vi.hoisted(() => ({
  loading: false,
  fetchRoster: vi.fn(),
  rosterMatrix: {
    s1: { staff: { id: 's1', name: 'Alice', position: 'พนักงาน' }, days: { 1: { shiftCode: 'ขาด' } } },
  },
}));

const mockSettingsStore = vi.hoisted(() => ({
  shiftTypes: [{ code: 'ขาด', isWorkShift: false }],
  fetchShiftTypes: vi.fn(),
  deductionConfig: { sickLeaveDeductionPerDay: 0, maxSickLeaveDaysPerMonth: 0 },
}));

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
  useSettingsStore: () => mockSettingsStore,
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    message: {
      loading: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

import ReportsPage from '../ReportsPage';

describe('ReportsPage', () => {
  beforeEach(() => {
    mockGenerateMonthlyReport.mockClear();
    mockProjectStore.fetchProjects.mockClear();
    mockStaffStore.fetchStaff.mockClear();
    mockRosterStore.fetchRoster.mockClear();
  });

  it('renders and triggers PDF download', async () => {
    render(<ReportsPage />);

    expect(mockProjectStore.fetchProjects).toHaveBeenCalled();
    expect(mockStaffStore.fetchStaff).toHaveBeenCalled();
    expect(mockRosterStore.fetchRoster).toHaveBeenCalled();

    const downloadBtn = screen.getByRole('button', { name: /ดาวน์โหลด PDF/i });
    fireEvent.click(downloadBtn);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockGenerateMonthlyReport).toHaveBeenCalled();
  });
});
