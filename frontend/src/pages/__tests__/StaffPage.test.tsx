/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProjectStore = vi.hoisted(() => ({
  projects: [{ id: 'p1', name: 'Project A' }],
  selectedProjectId: 'p1',
  fetchProjects: vi.fn(),
  setSelectedProjectId: vi.fn(),
  getProject: (_id: string) => mockProjectStore.projects[0],
}));

const mockStaffStore = vi.hoisted(() => ({
  addStaff: vi.fn().mockResolvedValue({ id: 's1' }),
  updateStaff: vi.fn(),
  setStaffInactive: vi.fn(),
  getStaffByProject: () => [],
  fetchStaff: vi.fn(),
  applyDefaultShift: vi.fn(),
  applyWeeklyOffDay: vi.fn(),
  reorderStaff: vi.fn(),
}));

const mockSettingsStore = vi.hoisted(() => ({
  positions: [{ id: 'pos1', name: 'ช่าง', defaultWage: 1000 }],
  fetchPositions: vi.fn(),
  shiftTypes: [{ code: 'OFF', name: 'OFF' }],
  fetchShiftTypes: vi.fn(),
}));

vi.mock('../../stores/projectStore', () => ({
  useProjectStore: () => mockProjectStore,
}));

vi.mock('../../stores/staffStore', () => ({
  useStaffStore: () => mockStaffStore,
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => mockSettingsStore,
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { role: 'SUPER_ADMIN' } }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

import StaffPage from '../StaffPage';

describe('StaffPage', () => {
  beforeEach(() => {
    mockProjectStore.fetchProjects.mockClear();
    mockSettingsStore.fetchPositions.mockClear();
    mockSettingsStore.fetchShiftTypes.mockClear();
    mockStaffStore.addStaff.mockClear();
  });

  it('creates a staff record via modal', async () => {
    render(<StaffPage />);

    expect(mockProjectStore.fetchProjects).toHaveBeenCalled();
    expect(mockSettingsStore.fetchPositions).toHaveBeenCalled();

    const createBtn = screen.getByRole('button', { name: /เพิ่มพนักงาน/i });
    fireEvent.click(createBtn);

    const modal = document.querySelector('.ant-modal') as HTMLElement;
    expect(modal).toBeTruthy();

    fireEvent.change(within(modal).getByPlaceholderText(/A01/i), { target: { value: 'A01' } });
    fireEvent.change(within(modal).getByPlaceholderText(/สมชาย/i), { target: { value: 'สมชาย' } });

    const positionSelect = within(modal).getByLabelText(/ตำแหน่ง/i);
    fireEvent.mouseDown(positionSelect);
    fireEvent.click(screen.getByText('ช่าง'));

    const wageInput = within(modal).getByRole('spinbutton');
    fireEvent.change(wageInput, { target: { value: '1000' } });

    const okButton = within(modal).getByRole('button', { name: /ok/i });
    fireEvent.click(okButton);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockStaffStore.addStaff).toHaveBeenCalled();
  });
});
