import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
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
router.get('/', requirePermission('staff'), getAllStaff);

// GET /api/staff/:id
router.get('/:id', requirePermission('staff'), getStaffById);

// POST /api/staff
router.post('/', requirePermission('staff'), createStaff);

// PUT /api/staff/:id
router.put('/:id', requirePermission('staff'), updateStaff);

// POST /api/staff/reorder
router.post('/reorder', requirePermission('staff'), reorderStaff);

// POST /api/staff/:id/default-shift
router.post('/:id/default-shift', requirePermission('staff'), applyStaffDefaultShift);

// POST /api/staff/:id/weekly-off-day
router.post('/:id/weekly-off-day', requirePermission('staff'), applyStaffWeeklyOffDay);

// PATCH /api/staff/:id/toggle-status
router.patch('/:id/toggle-status', requirePermission('staff'), toggleStaffStatus);

// DELETE /api/staff/:id (use with caution)
router.delete('/:id', requirePermission('staff'), deleteStaff);

export default router;
