"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// User CRUD routes
router.get('/', user_controller_1.getAllUsers);
router.get('/:id', user_controller_1.getUserById);
router.post('/', user_controller_1.createUser);
router.put('/:id', user_controller_1.updateUser);
router.delete('/:id', user_controller_1.deleteUser);
// Password management
router.put('/:id/password', user_controller_1.changePassword);
exports.default = router;
//# sourceMappingURL=user.routes.js.map