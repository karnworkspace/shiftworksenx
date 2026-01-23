"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shift_controller_1 = require("../controllers/shift.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ทุก route ต้อง authenticate
router.use(auth_middleware_1.authenticate);
// GET /api/shifts - ดึงข้อมูลกะทั้งหมด
router.get('/', shift_controller_1.getAllShifts);
// GET /api/shifts/:id - ดึงข้อมูลกะตาม ID
router.get('/:id', shift_controller_1.getShiftById);
// POST /api/shifts - สร้างกะใหม่
router.post('/', shift_controller_1.createShift);
// PUT /api/shifts/:id - แก้ไขข้อมูลกะ
router.put('/:id', shift_controller_1.updateShift);
// DELETE /api/shifts/:id - ลบกะ
router.delete('/:id', shift_controller_1.deleteShift);
exports.default = router;
//# sourceMappingURL=shift.routes.js.map