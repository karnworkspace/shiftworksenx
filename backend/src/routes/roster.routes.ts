import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
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
router.get('/', getRoster);

// GET /api/rosters/stats?rosterId=xxx&day=15
router.get('/stats', getRosterDayStats);

// POST /api/rosters/entry
router.post('/entry', updateRosterEntry);

// POST /api/rosters/batch
router.post('/batch', batchUpdateRosterEntries);

// POST /api/rosters/import
router.post('/import', importRoster);

// DELETE /api/rosters/entry/:id
router.delete('/entry/:id', deleteRosterEntry);

export default router;
