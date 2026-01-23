"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Get all users
 * Only SUPER_ADMIN and AREA_MANAGER can access
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ users });
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
/**
 * Create new user
 */
const createUser = async (req, res) => {
    try {
        const { email, password, name, role, permissions } = req.body;
        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Email, password, และ name จำเป็นต้องระบุ',
            });
        }
        // Check if email already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email นี้ถูกใช้งานแล้ว' });
        }
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || client_1.UserRole.SITE_MANAGER,
                permissions: permissions || ['reports', 'roster', 'staff', 'projects', 'users', 'settings'],
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.status(201).json({ success: true, user });
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
};
exports.createUser = createUser;
/**
 * Update user
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, role, permissions } = req.body;
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }
        // Check if new email is already taken by another user
        if (email && email !== existingUser.email) {
            const emailTaken = await prisma_1.prisma.user.findUnique({
                where: { email },
            });
            if (emailTaken) {
                return res.status(400).json({ error: 'Email นี้ถูกใช้งานแล้ว' });
            }
        }
        // Update user
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: {
                ...(email !== undefined && { email }),
                ...(name !== undefined && { name }),
                ...(role !== undefined && { role }),
                ...(permissions !== undefined && { permissions }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.json({ success: true, user });
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
/**
 * Delete user (Hard delete)
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent self-deletion
        if (req.user?.userId === id) {
            return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' });
        }
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }
        // Delete user
        await prisma_1.prisma.user.delete({
            where: { id },
        });
        return res.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
/**
 * Change user password
 */
const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        // Validation
        if (!newPassword) {
            return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านใหม่' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }
        // If changing own password, verify current password
        if (req.user?.userId === id && currentPassword) {
            const isValid = await bcryptjs_1.default.compare(currentPassword, existingUser.password);
            if (!isValid) {
                return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
            }
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await prisma_1.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    }
    catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=user.controller.js.map