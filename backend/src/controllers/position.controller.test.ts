/**
 * Position Controller Tests
 * Tests: getAllPositions, getPositionById, createPosition, updatePosition, deletePosition, applyPositionDefaultWage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllPositions, getPositionById, createPosition, updatePosition, deletePosition, applyPositionDefaultWage } from '../controllers/position.controller';
import { createMockRequest, createMockResponse } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

describe('Position Controller', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ============= getAllPositions =============
  describe('getAllPositions', () => {
    it('should return all positions sorted by name', async () => {
      vi.mocked(prisma.position.findMany).mockResolvedValue([
        { id: 'pos-1', name: 'Cleaner', defaultWage: 400 },
        { id: 'pos-2', name: 'Guard', defaultWage: 500 },
      ] as any);

      const req = createMockRequest({});
      const res = createMockResponse();

      await getAllPositions(req as any, res);

      expect(res._json).toHaveLength(2);
      expect(prisma.position.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });

    it('should convert Decimal fields to numbers', async () => {
      vi.mocked(prisma.position.findMany).mockResolvedValue([
        { id: 'pos-1', name: 'Guard', defaultWage: { toNumber: () => 500 } },
      ] as any);

      const req = createMockRequest({});
      const res = createMockResponse();

      await getAllPositions(req as any, res);

      expect(res._json[0].defaultWage).toBe(500);
    });
  });

  // ============= getPositionById =============
  describe('getPositionById', () => {
    it('should return position by ID', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({
        id: 'pos-1', name: 'Guard', defaultWage: 500,
      } as any);

      const req = createMockRequest({ params: { id: 'pos-1' } });
      const res = createMockResponse();

      await getPositionById(req as any, res);

      expect(res._json.name).toBe('Guard');
    });

    it('should return 404 for non-existent position', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: 'non-existent' } });
      const res = createMockResponse();

      await getPositionById(req as any, res);

      expect(res._status).toBe(404);
    });
  });

  // ============= createPosition =============
  describe('createPosition', () => {
    it('should create position with valid data', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.position.create).mockResolvedValue({
        id: 'pos-new', name: 'Technician', defaultWage: 600,
      } as any);

      const req = createMockRequest({
        body: { name: 'Technician', defaultWage: 600 },
      });
      const res = createMockResponse();

      await createPosition(req as any, res);

      expect(res._status).toBe(201);
    });

    it('should reject when name is missing', async () => {
      const req = createMockRequest({
        body: { defaultWage: 600 },
      });
      const res = createMockResponse();

      await createPosition(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('name');
    });

    it('should reject non-string name', async () => {
      const req = createMockRequest({
        body: { name: 123, defaultWage: 600 },
      });
      const res = createMockResponse();

      await createPosition(req as any, res);

      expect(res._status).toBe(400);
    });

    it('should reject negative wage', async () => {
      const req = createMockRequest({
        body: { name: 'Test', defaultWage: -100 },
      });
      const res = createMockResponse();

      await createPosition(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('wage');
    });

    it('should reject non-numeric wage', async () => {
      const req = createMockRequest({
        body: { name: 'Test', defaultWage: 'abc' },
      });
      const res = createMockResponse();

      await createPosition(req as any, res);

      expect(res._status).toBe(400);
    });

    it('should reject duplicate position name', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({
        id: 'pos-1', name: 'Guard',
      } as any);

      const req = createMockRequest({
        body: { name: 'Guard', defaultWage: 500 },
      });
      const res = createMockResponse();

      await createPosition(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('already exists');
    });
  });

  // ============= updatePosition =============
  describe('updatePosition', () => {
    it('should update position successfully', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({
        id: 'pos-1', name: 'Guard', defaultWage: 500,
      } as any);
      // findUnique for duplicate name check - return null (no conflict since name changed)
      vi.mocked(prisma.position.findUnique)
        .mockResolvedValueOnce({ id: 'pos-1', name: 'Guard', defaultWage: 500 } as any) // existing
        .mockResolvedValueOnce(null); // name not taken

      vi.mocked(prisma.$transaction).mockResolvedValue({
        id: 'pos-1', name: 'Security Guard', defaultWage: 550,
      } as any);

      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { name: 'Security Guard', defaultWage: 550 },
      });
      const res = createMockResponse();

      await updatePosition(req as any, res);

      expect(res._json.name).toBe('Security Guard');
    });

    it('should return 404 for non-existent position', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue(null);

      const req = createMockRequest({
        params: { id: 'non-existent' },
        body: { name: 'Updated' },
      });
      const res = createMockResponse();

      await updatePosition(req as any, res);

      expect(res._status).toBe(404);
    });

    it('should reject duplicate name on update', async () => {
      vi.mocked(prisma.position.findUnique)
        .mockResolvedValueOnce({ id: 'pos-1', name: 'Guard' } as any) // existing
        .mockResolvedValueOnce({ id: 'pos-2', name: 'Cleaner' } as any); // name taken

      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { name: 'Cleaner' },
      });
      const res = createMockResponse();

      await updatePosition(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('already exists');
    });

    it('should reject invalid wage on update', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({
        id: 'pos-1', name: 'Guard', defaultWage: 500,
      } as any);

      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { defaultWage: -10 },
      });
      const res = createMockResponse();

      await updatePosition(req as any, res);

      expect(res._status).toBe(400);
    });

    it('should update staff position name when position name changes', async () => {
      vi.mocked(prisma.position.findUnique)
        .mockResolvedValueOnce({ id: 'pos-1', name: 'Guard', defaultWage: 500 } as any) // existing
        .mockResolvedValueOnce(null); // name not taken

      // $transaction receives a callback fn - we verify that the fn is called
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          position: {
            update: vi.fn().mockResolvedValue({ id: 'pos-1', name: 'Security', defaultWage: 500 }),
          },
          staff: {
            updateMany: vi.fn().mockResolvedValue({ count: 3 }),
          },
        };
        const result = await fn(tx);
        // Verify staff.updateMany was called within the transaction
        expect(tx.staff.updateMany).toHaveBeenCalled();
        return result;
      });

      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { name: 'Security' },
      });
      const res = createMockResponse();

      await updatePosition(req as any, res);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ============= deletePosition =============
  describe('deletePosition', () => {
    it('should delete position with no staff', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({ id: 'pos-1' } as any);
      vi.mocked(prisma.staff.count).mockResolvedValue(0);
      vi.mocked(prisma.position.delete).mockResolvedValue({} as any);

      const req = createMockRequest({ params: { id: 'pos-1' } });
      const res = createMockResponse();

      await deletePosition(req as any, res);

      expect(res._json.message).toContain('deleted');
    });

    it('should reject deletion when position is in use', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({ id: 'pos-1' } as any);
      vi.mocked(prisma.staff.count).mockResolvedValue(3);

      const req = createMockRequest({ params: { id: 'pos-1' } });
      const res = createMockResponse();

      await deletePosition(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('in use');
      expect(prisma.position.delete).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent position', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: 'non-existent' } });
      const res = createMockResponse();

      await deletePosition(req as any, res);

      expect(res._status).toBe(404);
    });
  });

  // ============= applyPositionDefaultWage =============
  describe('applyPositionDefaultWage', () => {
    it('should apply wage to all staff in mode=all', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({
        id: 'pos-1', name: 'Guard', defaultWage: 600,
      } as any);
      vi.mocked(prisma.staff.updateMany).mockResolvedValue({ count: 5 } as any);

      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { mode: 'all' },
      });
      const res = createMockResponse();

      await applyPositionDefaultWage(req as any, res);

      expect(res._json.updatedCount).toBe(5);
    });

    it('should filter by oldDefaultWage in mode=not_overridden', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue({
        id: 'pos-1', name: 'Guard', defaultWage: 600,
      } as any);
      vi.mocked(prisma.staff.updateMany).mockResolvedValue({ count: 3 } as any);

      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { mode: 'not_overridden', oldDefaultWage: 500 },
      });
      const res = createMockResponse();

      await applyPositionDefaultWage(req as any, res);

      expect(res._json.updatedCount).toBe(3);
      expect(prisma.staff.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            wagePerDay: 500,
          }),
        })
      );
    });

    it('should reject invalid mode', async () => {
      const req = createMockRequest({
        params: { id: 'pos-1' },
        body: { mode: 'invalid' },
      });
      const res = createMockResponse();

      await applyPositionDefaultWage(req as any, res);

      expect(res._status).toBe(400);
    });

    it('should return 404 for non-existent position', async () => {
      vi.mocked(prisma.position.findUnique).mockResolvedValue(null);

      const req = createMockRequest({
        params: { id: 'non-existent' },
        body: { mode: 'all' },
      });
      const res = createMockResponse();

      await applyPositionDefaultWage(req as any, res);

      expect(res._status).toBe(404);
    });
  });
});
