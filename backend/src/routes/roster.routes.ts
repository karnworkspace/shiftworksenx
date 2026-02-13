import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import {
  getRoster,
  updateRosterEntry,
  batchUpdateRosterEntries,
  importRoster,
  getRosterDayStats,
  deleteRosterEntry,
} from '../controllers/roster.controller';

const router = Router();
router.use(authenticate);

// GET /api/rosters?projectId=xxx&year=2567&month=1
router.get('/', requirePermission('roster'), getRoster);

// GET /api/rosters/stats?rosterId=xxx&day=15
router.get('/stats', requirePermission('roster'), getRosterDayStats);

// POST /api/rosters/entry
router.post('/entry', requirePermission('roster'), updateRosterEntry);

// POST /api/rosters/batch
router.post('/batch', requirePermission('roster'), batchUpdateRosterEntries);

// POST /api/rosters/import
router.post('/import', requirePermission('roster'), importRoster);

// DELETE /api/rosters/entry/:id
router.delete('/entry/:id', requirePermission('roster'), deleteRosterEntry);

export default router;
