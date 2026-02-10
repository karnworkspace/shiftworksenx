import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Get all users
 * Only SUPER_ADMIN and AREA_MANAGER can access
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Create new user
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role, permissions } = req.body;
    const nextRole: UserRole = role || UserRole.SITE_MANAGER;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, และ name จำเป็นต้องระบุ',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: nextRole,
        permissions: permissions || ['reports', 'roster', 'staff', 'projects', 'users', 'settings'],
      },
      select: userSelect,
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update user
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, role, permissions } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Check if new email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return res.status(400).json({ error: 'Email นี้ถูกใช้งานแล้ว' });
      }
    }

    const nextRole: UserRole = role || existingUser.role;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email !== undefined && { email }),
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(permissions !== undefined && { permissions }),
      },
      select: userSelect,
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete user (Hard delete)
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
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
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    // If changing own password, verify current password
    if (req.user?.userId === id && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isValid) {
        return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
};
