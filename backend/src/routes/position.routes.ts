import { Router } from 'express';
import {
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  applyPositionDefaultWage,
} from '../controllers/position.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllPositions);
router.get('/:id', getPositionById);
router.post('/', requireAdmin, createPosition);
router.put('/:id', requireAdmin, updatePosition);
router.delete('/:id', requireAdmin, deletePosition);
router.post('/:id/apply-wage', requireAdmin, applyPositionDefaultWage);

export default router;
