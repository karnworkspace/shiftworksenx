import { Router } from 'express';
import {
    getAllShifts,
    getShiftById,
    createShift,
    updateShift,
    deleteShift,
} from '../controllers/shift.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ทุก route ต้อง authenticate
router.use(authenticate);

// GET /api/shifts - ดึงข้อมูลกะทั้งหมด
router.get('/', getAllShifts);

// GET /api/shifts/:id - ดึงข้อมูลกะตาม ID
router.get('/:id', getShiftById);

// POST /api/shifts - สร้างกะใหม่
router.post('/', createShift);

// PUT /api/shifts/:id - แก้ไขข้อมูลกะ
router.put('/:id', updateShift);

// DELETE /api/shifts/:id - ลบกะ
router.delete('/:id', deleteShift);

export default router;
