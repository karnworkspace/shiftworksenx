"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roster_controller_1 = require("../controllers/roster.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/rosters?projectId=xxx&year=2567&month=1
router.get('/', roster_controller_1.getRoster);
// GET /api/rosters/stats?rosterId=xxx&day=15
router.get('/stats', roster_controller_1.getRosterDayStats);
// POST /api/rosters/entry
router.post('/entry', roster_controller_1.updateRosterEntry);
// POST /api/rosters/batch
router.post('/batch', roster_controller_1.batchUpdateRosterEntries);
// DELETE /api/rosters/entry/:id
router.delete('/entry/:id', roster_controller_1.deleteRosterEntry);
exports.default = router;
//# sourceMappingURL=roster.routes.js.map