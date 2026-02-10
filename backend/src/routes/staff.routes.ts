import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  reorderStaff,
  applyStaffDefaultShift,
  applyStaffWeeklyOffDay,
  toggleStaffStatus,
  deleteStaff,
} from '../controllers/staff.controller';

const router = Router();
router.use(authenticate);

// GET /api/staff?projectId=xxx&includeInactive=true
router.get('/', getAllStaff);

// GET /api/staff/:id
router.get('/:id', getStaffById);

// POST /api/staff
router.post('/', createStaff);

// PUT /api/staff/:id
router.put('/:id', updateStaff);

// POST /api/staff/reorder
router.post('/reorder', reorderStaff);

// POST /api/staff/:id/default-shift
router.post('/:id/default-shift', applyStaffDefaultShift);

// POST /api/staff/:id/weekly-off-day
router.post('/:id/weekly-off-day', applyStaffWeeklyOffDay);

// PATCH /api/staff/:id/toggle-status
router.patch('/:id/toggle-status', toggleStaffStatus);

// DELETE /api/staff/:id (use with caution)
router.delete('/:id', deleteStaff);

export default router;
