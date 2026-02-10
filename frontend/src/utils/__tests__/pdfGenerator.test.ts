
/// <reference types="vitest" />
import dayjs from 'dayjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMonthlyReport } from '../pdfGenerator';

let lastFromElement: HTMLElement | null = null;

const chain = {
  set: vi.fn().mockReturnThis(),
  from: vi.fn((el: HTMLElement) => {
    lastFromElement = el;
    return chain;
  }),
  save: vi.fn(() => Promise.resolve()),
};

vi.mock('html2pdf.js', () => ({
  default: vi.fn(() => chain),
}));

const baseData = {
  project: { id: 'p1', name: 'Project A' },
  month: dayjs('2024-01-01'),
  staff: [
    {
      id: 's1',
      name: 'Test Staff',
      position: 'พนักงาน',
      wagePerDay: 1000,
    },
  ],
  rosterData: {
    s1: {
      1: 'ขาด',
    },
  },
  shiftTypes: [{ code: 'ขาด' }],
  deductionConfig: {
    sickLeaveDeductionPerDay: 500,
    maxSickLeaveDaysPerMonth: 0,
  },
};

describe('generateMonthlyReport', () => {
  beforeEach(() => {
    lastFromElement = null;
    vi.clearAllMocks();
  });

  it('renders summary totals with subproject rows', async () => {
    await generateMonthlyReport({
      ...baseData,
      summary: {
        totalAbsent: 1,
        totalDeduction: 1000,
        subProjects: [
          { name: 'โครงการย่อย A', percentage: 40, amount: 400 },
        ],
      },
    });

    expect(lastFromElement).not.toBeNull();
    const html = lastFromElement?.innerHTML ?? '';
    expect(html).toContain('รวมยอดลดหนี้ก่อนภาษีมูลค่าเพิ่ม');
    expect(html).toContain('โครงการย่อย A');
    expect(html).toContain('40%');
  });
});
