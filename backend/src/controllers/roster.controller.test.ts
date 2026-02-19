/**
 * Roster Controller Tests
 * Tests: getRoster, updateRosterEntry, batchUpdateRosterEntries, importRoster, getRosterDayStats, deleteRosterEntry
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRoster, updateRosterEntry, batchUpdateRosterEntries,
  importRoster, getRosterDayStats, deleteRosterEntry,
} from '../controllers/roster.controller';
import { createMockRequest, createMockResponse, createAuthRequest, testUsers, testProjects } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

// Mock projectAccess module
vi.mock('../utils/projectAccess', () => ({
  ensureProjectAccess: vi.fn().mockResolvedValue(true),
}));

// Mock rosterEditWindow module
vi.mock('../utils/rosterEditWindow', () => ({
  isEditWindowOpen: vi.fn().mockReturnValue(true),
}));

import { ensureProjectAccess } from '../utils/projectAccess';
import { isEditWindowOpen } from '../utils/rosterEditWindow';

const mockRoster = {
  id: 'roster-001',
  projectId: testProjects.project1.id,
  year: 2025,
  month: 1,
  project: { id: testProjects.project1.id, name: testProjects.project1.name },
  entries: [],
};

describe('Roster Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(isEditWindowOpen).mockReturnValue(true);
  });

  // ============= getRoster =============
  describe('getRoster', () => {
    it('should return roster with matrix for existing roster', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        entries: [],
      } as any);
      vi.mocked(prisma.staff.findMany).mockResolvedValue([
        { id: 'staff-1', defaultShift: 'D', weeklyOffDay: null, isActive: true, displayOrder: 1, staffType: 'REGULAR', createdAt: new Date() },
      ] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id, year: '2025', month: '1' },
      });
      const res = createMockResponse();

      await getRoster(req, res);

      expect(res._json.roster).toBeDefined();
      expect(res._json.roster.matrix).toBeDefined();
      expect(res._json.roster.daysInMonth).toBe(31);
    });

    it('should create roster if not exists', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.roster.create).mockResolvedValue({
        ...mockRoster,
        entries: [],
      } as any);
      vi.mocked(prisma.staff.findMany).mockResolvedValue([]);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id, year: '2025', month: '1' },
      });
      const res = createMockResponse();

      await getRoster(req, res);

      expect(prisma.roster.create).toHaveBeenCalled();
      expect(res._json.roster).toBeDefined();
    });

    it('should require projectId, year, and month', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await getRoster(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid month (13)', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id, year: '2025', month: '13' },
      });
      const res = createMockResponse();

      await getRoster(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid month (0)', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id, year: '2025', month: '0' },
      });
      const res = createMockResponse();

      await getRoster(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        query: { projectId: testProjects.project1.id, year: '2025', month: '1' },
      });
      const res = createMockResponse();

      await getRoster(req, res);

      expect(res._status).toBe(403);
    });

    it('should respect weekly off day in matrix defaults', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        entries: [],
      } as any);
      vi.mocked(prisma.staff.findMany).mockResolvedValue([
        {
          id: 'staff-1',
          defaultShift: 'D',
          weeklyOffDay: 0, // Sunday off
          isActive: true,
          displayOrder: 1,
          staffType: 'REGULAR',
          createdAt: new Date(),
        },
      ] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id, year: '2025', month: '6' }, // June 2025
      });
      const res = createMockResponse();

      await getRoster(req, res);

      const matrix = res._json.roster.matrix;
      // June 1, 2025 is Sunday (day=0)
      expect(matrix['staff-1'].days[1].shiftCode).toBe('OFF');
    });
  });

  // ============= updateRosterEntry =============
  describe('updateRosterEntry', () => {
    it('should upsert roster entry with valid data', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([
        { code: 'D' }, { code: 'N' }, { code: 'OFF' },
      ] as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(prisma.staff.findUnique).mockResolvedValue({
        id: 'staff-1', projectId: testProjects.project1.id,
      } as any);
      vi.mocked(prisma.rosterEntry.upsert).mockResolvedValue({
        id: 'entry-1', staffId: 'staff-1', day: 5, shiftCode: 'N',
      } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1', day: '5', shiftCode: 'N' },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._json.entry).toBeDefined();
    });

    it('should require all fields', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1' }, // missing day, shiftCode
      });
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid shift code', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([
        { code: 'D' }, { code: 'N' }, { code: 'OFF' },
      ] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1', day: '5', shiftCode: 'INVALID' },
      });
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Invalid shift code');
    });

    it('should reject invalid day (0)', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1', day: '0', shiftCode: 'D' },
      });
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid day (32)', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1', day: '32', shiftCode: 'D' },
      });
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 404 for non-existent roster', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'non-existent', staffId: 'staff-1', day: '5', shiftCode: 'D' },
      });
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(404);
    });

    it('should reject when edit window is closed', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(isEditWindowOpen).mockReturnValue(false);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1', day: '5', shiftCode: 'D' },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(403);
    });

    it('should return 404 if staff not in project', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(prisma.staff.findUnique).mockResolvedValue({
        id: 'staff-1', projectId: 'different-project',
      } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', staffId: 'staff-1', day: '5', shiftCode: 'D' },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await updateRosterEntry(req, res);

      expect(res._status).toBe(404);
    });
  });

  // ============= batchUpdateRosterEntries =============
  describe('batchUpdateRosterEntries', () => {
    it('should batch update roster entries', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([
        { code: 'D' }, { code: 'N' }, { code: 'OFF' },
      ] as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { id: 'e1', staffId: 's1', day: 1, shiftCode: 'D' },
        { id: 'e2', staffId: 's1', day: 2, shiftCode: 'N' },
      ] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          rosterId: 'roster-001',
          entries: [
            { staffId: 's1', day: 1, shiftCode: 'D' },
            { staffId: 's1', day: 2, shiftCode: 'N' },
          ],
        },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await batchUpdateRosterEntries(req, res);

      expect(res._json.entries).toHaveLength(2);
      expect(res._json.count).toBe(2);
    });

    it('should reject when entries is empty', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { rosterId: 'roster-001', entries: [] },
      });
      const res = createMockResponse();

      await batchUpdateRosterEntries(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject when rosterId is missing', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { entries: [{ staffId: 's1', day: 1, shiftCode: 'D' }] },
      });
      const res = createMockResponse();

      await batchUpdateRosterEntries(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject entries with invalid shift code', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          rosterId: 'roster-001',
          entries: [{ staffId: 's1', day: 1, shiftCode: 'INVALID' }],
        },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await batchUpdateRosterEntries(req, res);

      expect(res._status).toBe(400);
    });
  });

  // ============= importRoster =============
  describe('importRoster', () => {
    it('should import roster entries', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([
        { code: 'D' }, { code: 'N' }, { code: 'OFF' },
      ] as any);
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true,
      } as any);
      vi.mocked(prisma.staff.findMany).mockResolvedValue([{ id: 's1' }] as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({ id: 'roster-001' } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([null, { count: 2 }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          projectId: testProjects.project1.id,
          year: 2025,
          month: 1,
          entries: [
            { staffId: 's1', day: 1, shiftCode: 'D' },
            { staffId: 's1', day: 2, shiftCode: 'N' },
          ],
        },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await importRoster(req, res);

      expect(res._json.success).toBe(true);
      expect(res._json.count).toBe(2);
    });

    it('should reject missing required fields', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await importRoster(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid month', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          projectId: testProjects.project1.id,
          year: 2025,
          month: 13,
          entries: [{ staffId: 's1', day: 1, shiftCode: 'D' }],
        },
      });
      const res = createMockResponse();

      await importRoster(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject empty entries', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true,
      } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          projectId: testProjects.project1.id,
          year: 2025,
          month: 1,
          entries: [],
        },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await importRoster(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject duplicate entries (same staffId+day)', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([{ code: 'D' }] as any);
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true,
      } as any);
      vi.mocked(prisma.staff.findMany).mockResolvedValue([{ id: 's1' }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          projectId: testProjects.project1.id,
          year: 2025,
          month: 1,
          entries: [
            { staffId: 's1', day: 1, shiftCode: 'D' },
            { staffId: 's1', day: 1, shiftCode: 'D' }, // duplicate
          ],
        },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await importRoster(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Duplicate');
    });

    it('should reject when edit window is closed', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true,
      } as any);
      vi.mocked(isEditWindowOpen).mockReturnValue(false);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          projectId: testProjects.project1.id,
          year: 2025,
          month: 1,
          entries: [{ staffId: 's1', day: 1, shiftCode: 'D' }],
        },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await importRoster(req, res);

      expect(res._status).toBe(403);
    });
  });

  // ============= getRosterDayStats =============
  describe('getRosterDayStats', () => {
    it('should return statistics for a specific day', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        id: 'roster-001', projectId: testProjects.project1.id,
      } as any);
      vi.mocked(prisma.rosterEntry.findMany).mockResolvedValue([
        { shiftCode: 'D', staff: { id: 's1' } },
        { shiftCode: 'D', staff: { id: 's2' } },
        { shiftCode: 'OFF', staff: { id: 's3' } },
      ] as any);
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([
        { code: 'D', isWorkShift: true },
        { code: 'N', isWorkShift: true },
        { code: 'OFF', isWorkShift: false },
      ] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { rosterId: 'roster-001', day: '5' },
      });
      const res = createMockResponse();

      await getRosterDayStats(req, res);

      expect(res._json.stats.total).toBe(3);
      expect(res._json.stats.working).toBe(2);
      expect(res._json.stats.off).toBe(1);
    });

    it('should require rosterId and day', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        query: { rosterId: 'roster-001' },
      });
      const res = createMockResponse();

      await getRosterDayStats(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 404 for non-existent roster', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { rosterId: 'non-existent', day: '5' },
      });
      const res = createMockResponse();

      await getRosterDayStats(req, res);

      expect(res._status).toBe(404);
    });

    it('should reject invalid day', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        id: 'roster-001', projectId: testProjects.project1.id,
      } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { rosterId: 'roster-001', day: '0' },
      });
      const res = createMockResponse();

      await getRosterDayStats(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        id: 'roster-001', projectId: testProjects.project1.id,
      } as any);
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        query: { rosterId: 'roster-001', day: '5' },
      });
      const res = createMockResponse();

      await getRosterDayStats(req, res);

      expect(res._status).toBe(403);
    });
  });

  // ============= deleteRosterEntry =============
  describe('deleteRosterEntry', () => {
    it('should delete roster entry (SUPER_ADMIN)', async () => {
      vi.mocked(prisma.rosterEntry.findUnique).mockResolvedValue({
        id: 'entry-1', rosterId: 'roster-001',
      } as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(prisma.rosterEntry.delete).mockResolvedValue({} as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'entry-1' },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await deleteRosterEntry(req, res);

      expect(res._json.success).toBe(true);
    });

    it('should return 404 for non-existent entry', async () => {
      vi.mocked(prisma.rosterEntry.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
      });
      const res = createMockResponse();

      await deleteRosterEntry(req, res);

      expect(res._status).toBe(404);
    });

    it('should reject when edit window is closed', async () => {
      vi.mocked(prisma.rosterEntry.findUnique).mockResolvedValue({
        id: 'entry-1', rosterId: 'roster-001',
      } as any);
      vi.mocked(prisma.roster.findUnique).mockResolvedValue({
        ...mockRoster,
        project: { ...testProjects.project1, editCutoffDay: 2, editCutoffNextMonth: true },
      } as any);
      vi.mocked(isEditWindowOpen).mockReturnValue(false);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'entry-1' },
      });
      req.user = { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' };
      const res = createMockResponse();

      await deleteRosterEntry(req, res);

      expect(res._status).toBe(403);
    });
  });
});
