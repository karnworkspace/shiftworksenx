/// <reference types="vitest" />
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockSettingsStore = vi.hoisted(() => ({
  shiftTypes: [],
  positions: [],
  deductionConfig: {
    absentDeductionPerDay: 500,
    lateDeductionPerTime: 100,
    sickLeaveDeductionPerDay: 0,
    maxSickLeaveDaysPerMonth: 3,
  },
  loading: false,
  positionsLoading: false,
  fetchShiftTypes: vi.fn(),
  fetchPositions: vi.fn(),
  addShiftType: vi.fn().mockResolvedValue(undefined),
  updateShiftType: vi.fn(),
  deleteShiftType: vi.fn(),
  addPosition: vi.fn().mockResolvedValue(undefined),
  updatePosition: vi.fn(),
  deletePosition: vi.fn(),
  applyPositionDefaultWage: vi.fn(),
  updateDeductionConfig: vi.fn(),
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => mockSettingsStore,
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ isAuthenticated: true, accessToken: 'token' }),
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

import SettingsPage from '../SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    mockSettingsStore.fetchShiftTypes.mockClear();
    mockSettingsStore.fetchPositions.mockClear();
    mockSettingsStore.addShiftType.mockClear();
    mockSettingsStore.addPosition.mockClear();
  });

  it('creates shift and position from modals', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(mockSettingsStore.fetchShiftTypes).toHaveBeenCalled();
    expect(mockSettingsStore.fetchPositions).toHaveBeenCalled();

    const addShiftBtn = screen.getByRole('button', { name: /เพิ่มกะใหม่/i });
    fireEvent.click(addShiftBtn);

    const shiftModal = document.querySelector('.ant-modal') as HTMLElement;
    fireEvent.change(within(shiftModal).getByPlaceholderText(/OFF/i), { target: { value: 'A' } });
    fireEvent.change(within(shiftModal).getByPlaceholderText(/กะเช้า/i), { target: { value: 'กะเช้า' } });
    fireEvent.click(within(shiftModal).getByRole('button', { name: /ok/i }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockSettingsStore.addShiftType).toHaveBeenCalled();

    const positionsTab = screen.getByRole('tab', { name: /ตำแหน่ง/i });
    fireEvent.click(positionsTab);

    const addPositionBtn = screen.getByRole('button', { name: /เพิ่มตำแหน่ง/i });
    fireEvent.click(addPositionBtn);

    const modals = document.querySelectorAll('.ant-modal');
    const positionModal = modals[modals.length - 1] as HTMLElement;
    const nameInput = within(positionModal).getByPlaceholderText(/เช่น/i);
    fireEvent.change(nameInput, { target: { value: 'ช่าง' } });
    const wageInput = within(positionModal).getByRole('spinbutton');
    fireEvent.change(wageInput, { target: { value: '1200' } });
    fireEvent.click(within(positionModal).getByRole('button', { name: /ok/i }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockSettingsStore.addPosition).toHaveBeenCalled();
  });
});
