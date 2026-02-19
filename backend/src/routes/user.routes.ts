import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    getUserProjectAccess,
    updateUserProjectAccess,
} from '../controllers/user.controller';
import { authenticate, requireAdmin, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User list and detail - requires 'users' permission
router.get('/', requirePermission('users'), getAllUsers);
router.get('/:id', requirePermission('users'), getUserById);

// User CRUD (admin only)
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

// Password management (self or admin - checked in controller)
router.put('/:id/password', changePassword);

// Project access management
router.get('/:id/projects', requirePermission('users'), getUserProjectAccess);
router.put('/:id/projects', requireAdmin, updateUserProjectAccess);

export default router;
