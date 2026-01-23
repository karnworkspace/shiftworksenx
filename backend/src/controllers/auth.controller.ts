import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.utils';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบ user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจสอบรหัสผ่าน
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง JWT Tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'ไม่พบ Refresh Token' });
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({ error: 'Refresh Token ไม่ถูกต้องหรือหมดอายุ' });
    }

    // สร้าง tokens ใหม่
    const tokens = generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Update refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเฟรช Token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  return res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'ไม่ได้ยืนยันตัวตน' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
};
