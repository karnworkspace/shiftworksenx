import { Router } from 'express';
import {
    getAllShifts,
    getShiftById,
    createShift,
    updateShift,
    deleteShift,
} from '../controllers/shift.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// ทุก route ต้อง authenticate
router.use(authenticate);

// GET /api/shifts - ดึงข้อมูลกะทั้งหมด
router.get('/', getAllShifts);

// GET /api/shifts/:id - ดึงข้อมูลกะตาม ID
router.get('/:id', getShiftById);

// POST /api/shifts - สร้างกะใหม่
router.post('/', requireAdmin, createShift);

// PUT /api/shifts/:id - แก้ไขข้อมูลกะ
router.put('/:id', requireAdmin, updateShift);

// DELETE /api/shifts/:id - ลบกะ
router.delete('/:id', requireAdmin, deleteShift);

export default router;
