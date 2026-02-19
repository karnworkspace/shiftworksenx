/**
 * Report Controller Tests
 * Tests: calculateMonthlyAttendance logic, netSalary calculation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMonthlyDeductionReport } from '../controllers/report.controller';
import { createMockRequest, createMockResponse, testUsers, testProjects } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

// Mock projectAccess utilities
vi.mock('../utils/projectAccess', () => ({
  isSuperAdmin: vi.fn((req) => req.user?.role === 'SUPER_ADMIN'),
  getAccessibleProjectIds: vi.fn(),
  ensureProjectAccess: vi.fn(),
}));

import { ensureProjectAccess } from '../utils/projectAccess';

describe('getMonthlyDeductionReport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return 400 when projectId is missing', async () => {
    const req = createMockRequest({
      query: { year: '2025', month: '1' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getMonthlyDeductionReport(req, res);

    expect(res._status).toBe(400);
  });

  it('should return 400 when year is missing', async () => {
    const req = createMockRequest({
      query: { projectId: 'project-001', month: '1' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getMonthlyDeductionReport(req, res);

    expect(res._status).toBe(400);
  });

  it('should return 400 for invalid month', async () => {
    const req = createMockRequest({
      query: { projectId: 'project-001', year: '2025', month: '13' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getMonthlyDeductionReport(req, res);

    expect(res._status).toBe(400);
  });

  it('should return 403 when user has no project access', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(false);

    const req = createMockRequest({
      query: { projectId: 'project-001', year: '2025', month: '1' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await getMonthlyDeductionReport(req, res);

    expect(res._status).toBe(403);
  });

  it('should return 404 when roster not found', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(prisma.roster.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      query: { projectId: 'project-001', year: '2025', month: '1' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getMonthlyDeductionReport(req, res);

    expect(res._status).toBe(404);
  });

  it('should calculate netSalary correctly (no double deduction)', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(prisma.roster.findUnique).mockResolvedValue({
      id: 'roster-001',
      projectId: 'project-001',
      year: 2025,
      month: 1,
      project: { name: 'Alpha' },
    } as any);
    vi.mocked(prisma.staff.findMany).mockResolvedValue([
      { id: 'staff-001', name: 'Worker 1', position: 'Guard', wagePerDay: 500 },
    ] as any);
    vi.mocked(prisma.staff.findUnique).mockResolvedValue({
      id: 'staff-001',
      name: 'Worker 1',
      position: 'Guard',
      wagePerDay: 500,
    } as any);
    // Shift types
    vi.mocked(prisma.shiftType.findMany).mockResolvedValue([
      { code: 'D', name: 'Day', isWorkShift: true },
      { code: 'N', name: 'Night', isWorkShift: true },
      { code: 'ขาด', name: 'Absent', isWorkShift: false },
      { code: 'OFF', name: 'Off', isWorkShift: false },
    ] as any);
    // 20 work days, 2 absent days
    const entries: any[] = [];
    for (let i = 1; i <= 20; i++) entries.push({ staffId: 'staff-001', shiftCode: 'D', day: i });
    entries.push({ staffId: 'staff-001', shiftCode: 'ขาด', day: 21 });
    entries.push({ staffId: 'staff-001', shiftCode: 'ขาด', day: 22 });
    for (let i = 23; i <= 31; i++) entries.push({ staffId: 'staff-001', shiftCode: 'OFF', day: i });
    vi.mocked(prisma.rosterEntry.findMany).mockResolvedValue(entries);

    const req = createMockRequest({
      query: { projectId: 'project-001', year: '2025', month: '1' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getMonthlyDeductionReport(req, res);

    const staff = res._json.report.staff[0];
    expect(staff.totalWorkDays).toBe(20);
    expect(staff.totalAbsent).toBe(2);
    expect(staff.wagePerDay).toBe(500);
    expect(staff.expectedSalary).toBe(10000); // 20 * 500
    expect(staff.deductionAmount).toBe(1000); // 2 * 500
    // netSalary should equal expectedSalary (NOT expectedSalary - deduction)
    expect(staff.netSalary).toBe(10000);
  });
});
