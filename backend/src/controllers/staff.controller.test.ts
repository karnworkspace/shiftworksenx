/**
 * Staff Controller Tests
 * Tests: getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff,
 *        toggleStaffStatus, reorderStaff, applyStaffDefaultShift, applyStaffWeeklyOffDay
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff,
  toggleStaffStatus, reorderStaff, applyStaffDefaultShift, applyStaffWeeklyOffDay,
} from '../controllers/staff.controller';
import { createMockRequest, createMockResponse, createAuthRequest, testUsers, testProjects } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

// Mock projectAccess module
vi.mock('../utils/projectAccess', () => ({
  ensureProjectAccess: vi.fn().mockResolvedValue(true),
  isSuperAdmin: vi.fn().mockReturnValue(true),
}));

import { ensureProjectAccess, isSuperAdmin } from '../utils/projectAccess';

const mockStaff = {
  id: 'staff-001',
  code: 'S001',
  name: 'Somchai',
  position: 'Guard',
  positionId: 'pos-1',
  phone: '0812345678',
  wagePerDay: 500,
  staffType: 'REGULAR',
  defaultShift: 'D',
  weeklyOffDay: 0, // Sunday
  displayOrder: 1,
  projectId: testProjects.project1.id,
  isActive: true,
  remark: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: { id: testProjects.project1.id, name: testProjects.project1.name },
};

describe('Staff Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(isSuperAdmin).mockReturnValue(true);
  });

  // ============= getAllStaff =============
  describe('getAllStaff', () => {
    it('should return active staff for a project', async () => {
      vi.mocked(prisma.staff.findMany).mockResolvedValue([mockStaff] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await getAllStaff(req, res);

      expect(res._json.staff).toHaveLength(1);
      expect(res._json.staff[0].name).toBe('Somchai');
    });

    it('should require projectId query param', async () => {
      const req = createAuthRequest(testUsers.superAdmin, { query: {} });
      const res = createMockResponse();

      await getAllStaff(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Project ID');
    });

    it('should include inactive staff when includeInactive=true', async () => {
      vi.mocked(prisma.staff.findMany).mockResolvedValue([mockStaff, { ...mockStaff, id: 'staff-002', isActive: false }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id, includeInactive: 'true' },
      });
      const res = createMockResponse();

      await getAllStaff(req, res);

      expect(res._json.staff).toHaveLength(2);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        query: { projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await getAllStaff(req, res);

      expect(res._status).toBe(403);
    });

    it('should convert Decimal wagePerDay to number', async () => {
      vi.mocked(prisma.staff.findMany).mockResolvedValue([{
        ...mockStaff,
        wagePerDay: { toNumber: () => 500 },
      }] as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        query: { projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await getAllStaff(req, res);

      expect(res._json.staff[0].wagePerDay).toBe(500);
    });
  });

  // ============= getStaffById =============
  describe('getStaffById', () => {
    it('should return staff by ID', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await getStaffById(req, res);

      expect(res._json.staff.name).toBe('Somchai');
    });

    it('should return 404 for non-existent staff', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
      });
      const res = createMockResponse();

      await getStaffById(req, res);

      expect(res._status).toBe(404);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await getStaffById(req, res);

      expect(res._status).toBe(403);
    });
  });

  // ============= createStaff =============
  describe('createStaff', () => {
    it('should create staff with valid data', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(testProjects.project1 as any);
      vi.mocked(prisma.position.findUnique).mockResolvedValue({ id: 'pos-1', name: 'Guard', defaultWage: 500 } as any);
      vi.mocked(prisma.staff.aggregate).mockResolvedValue({ _max: { displayOrder: 5 } } as any);
      vi.mocked(prisma.staff.count).mockResolvedValue(5);
      vi.mocked(prisma.staff.create).mockResolvedValue(mockStaff as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: {
          name: 'Somchai',
          positionId: 'pos-1',
          wagePerDay: 500,
          projectId: testProjects.project1.id,
        },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(201);
      expect(res._json.staff.name).toBe('Somchai');
    });

    it('should reject when name is missing', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id, wagePerDay: 500 },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject when projectId is missing', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { name: 'Test', wagePerDay: 500 },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        body: { name: 'Test', wagePerDay: 500, projectId: testProjects.project1.id, position: 'Guard' },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(403);
    });

    it('should reject non-existent positionId', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { name: 'Test', positionId: 'bad-pos', wagePerDay: 500, projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('Position not found');
    });

    it('should return 404 when project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.staff.aggregate).mockResolvedValue({ _max: { displayOrder: 0 } } as any);
      vi.mocked(prisma.staff.count).mockResolvedValue(0);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { name: 'Test', position: 'Guard', wagePerDay: 500, projectId: 'non-existent' },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(404);
    });

    it('should use position default wage when wagePerDay not provided', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({ id: 'pos-1', name: 'Guard', defaultWage: 600 } as any);
      vi.mocked(prisma.project.findUnique).mockResolvedValue(testProjects.project1 as any);
      vi.mocked(prisma.staff.aggregate).mockResolvedValue({ _max: { displayOrder: 0 } } as any);
      vi.mocked(prisma.staff.count).mockResolvedValue(0);
      vi.mocked(prisma.staff.create).mockResolvedValue({ ...mockStaff, wagePerDay: 600 } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { name: 'Test', positionId: 'pos-1', projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(201);
      expect(prisma.staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ wagePerDay: 600 }),
        })
      );
    });

    it('should reject negative wage', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { name: 'Test', position: 'Guard', wagePerDay: -100, projectId: testProjects.project1.id },
      });
      const res = createMockResponse();

      await createStaff(req, res);

      expect(res._status).toBe(400);
    });
  });

  // ============= updateStaff =============
  describe('updateStaff', () => {
    it('should update staff successfully', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(prisma.staff.update).mockResolvedValue({ ...mockStaff, name: 'Updated Name', wagePerDay: 550 } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { name: 'Updated Name', wagePerDay: 550 },
      });
      const res = createMockResponse();

      await updateStaff(req, res);

      expect(res._json.staff.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent staff', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await updateStaff(req, res);

      expect(res._status).toBe(404);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        params: { id: 'staff-001' },
        body: { name: 'Test' },
      });
      const res = createMockResponse();

      await updateStaff(req, res);

      expect(res._status).toBe(403);
    });

    it('should reject invalid displayOrder', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { displayOrder: 'abc' },
      });
      const res = createMockResponse();

      await updateStaff(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject negative wage on update', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { wagePerDay: -50 },
      });
      const res = createMockResponse();

      await updateStaff(req, res);

      expect(res._status).toBe(400);
    });
  });

  // ============= toggleStaffStatus =============
  describe('toggleStaffStatus', () => {
    it('should toggle active to inactive', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue({ ...mockStaff, isActive: true } as any);
      vi.mocked(prisma.staff.update).mockResolvedValue({ ...mockStaff, isActive: false } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await toggleStaffStatus(req, res);

      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        })
      );
    });

    it('should toggle inactive to active', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue({ ...mockStaff, isActive: false } as any);
      vi.mocked(prisma.staff.update).mockResolvedValue({ ...mockStaff, isActive: true } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await toggleStaffStatus(req, res);

      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        })
      );
    });

    it('should return 404 for non-existent staff', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
      });
      const res = createMockResponse();

      await toggleStaffStatus(req, res);

      expect(res._status).toBe(404);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await toggleStaffStatus(req, res);

      expect(res._status).toBe(403);
    });
  });

  // ============= deleteStaff =============
  describe('deleteStaff', () => {
    it('should hard-delete staff with no roster entries', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(prisma.rosterEntry.count).mockResolvedValue(0);
      vi.mocked(prisma.staff.delete).mockResolvedValue({} as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await deleteStaff(req, res);

      expect(res._json.success).toBe(true);
    });

    it('should reject delete when staff has roster entries', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(prisma.rosterEntry.count).mockResolvedValue(30);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await deleteStaff(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('roster entries');
      expect(prisma.staff.delete).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent staff', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
      });
      const res = createMockResponse();

      await deleteStaff(req, res);

      expect(res._status).toBe(404);
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        params: { id: 'staff-001' },
      });
      const res = createMockResponse();

      await deleteStaff(req, res);

      expect(res._status).toBe(403);
    });
  });

  // ============= reorderStaff =============
  describe('reorderStaff', () => {
    it('should reorder staff successfully', async () => {
      const staffIds = ['staff-001', 'staff-002', 'staff-003'];
      vi.mocked(prisma.staff.count).mockResolvedValue(3);
      vi.mocked(prisma.staff.findMany).mockResolvedValue(
        staffIds.map(id => ({ id })) as any
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(staffIds.map(() => ({})) as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id, orderedStaffIds: staffIds },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._json.success).toBe(true);
    });

    it('should reject missing projectId', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { orderedStaffIds: ['a', 'b'] },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject empty orderedStaffIds', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id, orderedStaffIds: [] },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject duplicate IDs in orderedStaffIds', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id, orderedStaffIds: ['a', 'a', 'b'] },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('unique');
    });

    it('should reject when count does not match total staff', async () => {
      vi.mocked(prisma.staff.count).mockResolvedValue(5);

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id, orderedStaffIds: ['a', 'b'] },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject when staff belong to different project', async () => {
      vi.mocked(prisma.staff.count).mockResolvedValue(2);
      vi.mocked(prisma.staff.findMany).mockResolvedValue([{ id: 'a' }] as any); // only 1 found

      const req = createAuthRequest(testUsers.superAdmin, {
        body: { projectId: testProjects.project1.id, orderedStaffIds: ['a', 'b'] },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('do not belong');
    });

    it('should return 403 when no project access', async () => {
      vi.mocked(ensureProjectAccess).mockResolvedValue(false);

      const req = createAuthRequest(testUsers.siteManager, {
        body: { projectId: testProjects.project1.id, orderedStaffIds: ['a'] },
      });
      const res = createMockResponse();

      await reorderStaff(req, res);

      expect(res._status).toBe(403);
    });
  });

  // ============= applyStaffDefaultShift =============
  describe('applyStaffDefaultShift', () => {
    it('should update default shift for staff', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({ code: 'N', name: 'Night' } as any);
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(prisma.roster.findMany).mockResolvedValue([]); // no past rosters
      vi.mocked(prisma.staff.update).mockResolvedValue({ ...mockStaff, defaultShift: 'N' } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { defaultShift: 'N' },
      });
      const res = createMockResponse();

      await applyStaffDefaultShift(req, res);

      expect(res._json.staff.defaultShift).toBe('N');
    });

    it('should reject missing defaultShift', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: {},
      });
      const res = createMockResponse();

      await applyStaffDefaultShift(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid shift code', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { defaultShift: 'INVALID' },
      });
      const res = createMockResponse();

      await applyStaffDefaultShift(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 404 for non-existent staff', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({ code: 'D' } as any);
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
        body: { defaultShift: 'D' },
      });
      const res = createMockResponse();

      await applyStaffDefaultShift(req, res);

      expect(res._status).toBe(404);
    });
  });

  // ============= applyStaffWeeklyOffDay =============
  describe('applyStaffWeeklyOffDay', () => {
    it('should update weekly off day', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(prisma.roster.findMany).mockResolvedValue([]);
      vi.mocked(prisma.staff.update).mockResolvedValue({ ...mockStaff, weeklyOffDay: 6 } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { weeklyOffDay: 6 }, // Saturday
      });
      const res = createMockResponse();

      await applyStaffWeeklyOffDay(req, res);

      expect(res._json.staff.weeklyOffDay).toBe(6);
    });

    it('should allow setting weeklyOffDay to null', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(mockStaff as any);
      vi.mocked(prisma.roster.findMany).mockResolvedValue([]);
      vi.mocked(prisma.staff.update).mockResolvedValue({ ...mockStaff, weeklyOffDay: null } as any);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { weeklyOffDay: null },
      });
      const res = createMockResponse();

      await applyStaffWeeklyOffDay(req, res);

      expect(res._json.staff.weeklyOffDay).toBeNull();
    });

    it('should reject missing weeklyOffDay field', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: {},
      });
      const res = createMockResponse();

      await applyStaffWeeklyOffDay(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject invalid weeklyOffDay value (7)', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { weeklyOffDay: 7 },
      });
      const res = createMockResponse();

      await applyStaffWeeklyOffDay(req, res);

      expect(res._status).toBe(400);
    });

    it('should reject negative weeklyOffDay value', async () => {
      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'staff-001' },
        body: { weeklyOffDay: -1 },
      });
      const res = createMockResponse();

      await applyStaffWeeklyOffDay(req, res);

      expect(res._status).toBe(400);
    });

    it('should return 404 for non-existent staff', async () => {
      vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);

      const req = createAuthRequest(testUsers.superAdmin, {
        params: { id: 'non-existent' },
        body: { weeklyOffDay: 0 },
      });
      const res = createMockResponse();

      await applyStaffWeeklyOffDay(req, res);

      expect(res._status).toBe(404);
    });
  });
});
