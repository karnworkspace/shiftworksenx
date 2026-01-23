"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const staff_controller_1 = require("../controllers/staff.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/staff?projectId=xxx&includeInactive=true
router.get('/', staff_controller_1.getAllStaff);
// GET /api/staff/:id
router.get('/:id', staff_controller_1.getStaffById);
// POST /api/staff
router.post('/', staff_controller_1.createStaff);
// PUT /api/staff/:id
router.put('/:id', staff_controller_1.updateStaff);
// PATCH /api/staff/:id/toggle-status
router.patch('/:id/toggle-status', staff_controller_1.toggleStaffStatus);
// DELETE /api/staff/:id (use with caution)
router.delete('/:id', staff_controller_1.deleteStaff);
exports.default = router;
//# sourceMappingURL=staff.routes.js.map