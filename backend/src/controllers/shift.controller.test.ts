/**
 * Shift Controller Tests
 * Tests: getAllShifts, getShiftById, createShift, updateShift, deleteShift
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllShifts, getShiftById, createShift, updateShift, deleteShift } from '../controllers/shift.controller';
import { createMockRequest, createMockResponse } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

describe('Shift Controller', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ============= getAllShifts =============
  describe('getAllShifts', () => {
    it('should return all shifts sorted by code', async () => {
      const mockShifts = [
        { id: 's1', code: 'D', name: 'Day', startTime: '08:00', endTime: '17:00', color: '#1890ff', isWorkShift: true, isSystemDefault: false },
        { id: 's2', code: 'N', name: 'Night', startTime: '20:00', endTime: '08:00', color: '#722ed1', isWorkShift: true, isSystemDefault: false },
        { id: 's3', code: 'OFF', name: 'Day Off', startTime: null, endTime: null, color: '#d9d9d9', isWorkShift: false, isSystemDefault: true },
      ];
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue(mockShifts as any);

      const req = createMockRequest({});
      const res = createMockResponse();

      await getAllShifts(req as any, res);

      expect(res._json).toHaveLength(3);
      expect(prisma.shiftType.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
    });

    it('should return empty array when no shifts exist', async () => {
      vi.mocked(prisma.shiftType.findMany).mockResolvedValue([]);

      const req = createMockRequest({});
      const res = createMockResponse();

      await getAllShifts(req as any, res);

      expect(res._json).toEqual([]);
    });
  });

  // ============= getShiftById =============
  describe('getShiftById', () => {
    it('should return shift by ID', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({
        id: 's1', code: 'D', name: 'Day', startTime: '08:00', endTime: '17:00', color: '#1890ff', isWorkShift: true,
      } as any);

      const req = createMockRequest({ params: { id: 's1' } });
      const res = createMockResponse();

      await getShiftById(req as any, res);

      expect(res._json.code).toBe('D');
      expect(res._json.name).toBe('Day');
    });

    it('should return 404 for non-existent shift', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: 'non-existent' } });
      const res = createMockResponse();

      await getShiftById(req as any, res);

      expect(res._status).toBe(404);
      expect(res._json.error).toBe('Shift not found');
    });
  });

  // ============= createShift =============
  describe('createShift', () => {
    it('should create shift with valid data', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null); // no existing
      vi.mocked(prisma.shiftType.create).mockResolvedValue({
        id: 's-new', code: 'E', name: 'Evening', startTime: '16:00', endTime: '00:00', color: '#fa8c16', isWorkShift: true,
      } as any);

      const req = createMockRequest({
        body: { code: 'E', name: 'Evening', startTime: '16:00', endTime: '00:00', color: '#fa8c16', isWorkShift: true },
      });
      const res = createMockResponse();

      await createShift(req as any, res);

      expect(res._status).toBe(201);
      expect(res._json.code).toBe('E');
    });

    it('should create shift with default color and isWorkShift', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.shiftType.create).mockResolvedValue({
        id: 's-new', code: 'X', name: 'Special', startTime: null, endTime: null, color: '#1890ff', isWorkShift: true,
      } as any);

      const req = createMockRequest({
        body: { code: 'X', name: 'Special' },
      });
      const res = createMockResponse();

      await createShift(req as any, res);

      expect(res._status).toBe(201);
      // Verify defaults passed to create
      expect(prisma.shiftType.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          color: '#1890ff',
          isWorkShift: true,
        }),
      }));
    });

    it('should reject duplicate shift code', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({
        id: 's1', code: 'D', name: 'Day',
      } as any);

      const req = createMockRequest({
        body: { code: 'D', name: 'Day Duplicate' },
      });
      const res = createMockResponse();

      await createShift(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('already exists');
    });

    it('should handle null startTime and endTime', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.shiftType.create).mockResolvedValue({
        id: 's-new', code: 'OFF2', name: 'Off2', startTime: null, endTime: null, color: '#1890ff', isWorkShift: false,
      } as any);

      const req = createMockRequest({
        body: { code: 'OFF2', name: 'Off2', isWorkShift: false },
      });
      const res = createMockResponse();

      await createShift(req as any, res);

      expect(res._status).toBe(201);
      expect(prisma.shiftType.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          startTime: null,
          endTime: null,
        }),
      }));
    });
  });

  // ============= updateShift =============
  describe('updateShift', () => {
    it('should update shift successfully', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({
        id: 's1', code: 'D', name: 'Day', color: '#1890ff',
      } as any);
      vi.mocked(prisma.shiftType.update).mockResolvedValue({
        id: 's1', code: 'D', name: 'Day Shift', startTime: '07:00', endTime: '16:00', color: '#52c41a',
      } as any);

      const req = createMockRequest({
        params: { id: 's1' },
        body: { name: 'Day Shift', startTime: '07:00', endTime: '16:00', color: '#52c41a' },
      });
      const res = createMockResponse();

      await updateShift(req as any, res);

      expect(res._json.name).toBe('Day Shift');
    });

    it('should return 404 for non-existent shift', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null);

      const req = createMockRequest({
        params: { id: 'non-existent' },
        body: { name: 'Updated' },
      });
      const res = createMockResponse();

      await updateShift(req as any, res);

      expect(res._status).toBe(404);
    });

    it('should reject duplicate code on code change', async () => {
      // First call: find existing shift
      vi.mocked(prisma.shiftType.findUnique)
        .mockResolvedValueOnce({ id: 's1', code: 'D', name: 'Day' } as any) // existing
        .mockResolvedValueOnce({ id: 's2', code: 'N', name: 'Night' } as any); // code taken

      const req = createMockRequest({
        params: { id: 's1' },
        body: { code: 'N' },
      });
      const res = createMockResponse();

      await updateShift(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('already exists');
    });

    it('should allow update without changing code', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({
        id: 's1', code: 'D', name: 'Day',
      } as any);
      vi.mocked(prisma.shiftType.update).mockResolvedValue({
        id: 's1', code: 'D', name: 'Updated Day',
      } as any);

      const req = createMockRequest({
        params: { id: 's1' },
        body: { name: 'Updated Day' },
      });
      const res = createMockResponse();

      await updateShift(req as any, res);

      expect(res._json.name).toBe('Updated Day');
      // Should NOT have checked for duplicate code
      expect(prisma.shiftType.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  // ============= deleteShift =============
  describe('deleteShift', () => {
    it('should delete non-system-default shift', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({
        id: 's1', code: 'E', name: 'Evening', isSystemDefault: false,
      } as any);
      vi.mocked(prisma.shiftType.delete).mockResolvedValue({} as any);

      const req = createMockRequest({ params: { id: 's1' } });
      const res = createMockResponse();

      await deleteShift(req as any, res);

      expect(res._json.message).toContain('deleted');
    });

    it('should reject deletion of system default shift', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue({
        id: 's-off', code: 'OFF', name: 'Day Off', isSystemDefault: true,
      } as any);

      const req = createMockRequest({ params: { id: 's-off' } });
      const res = createMockResponse();

      await deleteShift(req as any, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain('system default');
      expect(prisma.shiftType.delete).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent shift', async () => {
      vi.mocked(prisma.shiftType.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: 'non-existent' } });
      const res = createMockResponse();

      await deleteShift(req as any, res);

      expect(res._status).toBe(404);
    });
  });
});
