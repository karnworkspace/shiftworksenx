import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import { verifyAccessToken } from '../utils/jwt.utils';
import { prisma } from '../lib/prisma';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ไม่พบ Token การยืนยันตัวตน' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'การยืนยันตัวตนล้มเหลว' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
  }
  next();
};

/**
 * Middleware ตรวจสอบสิทธิ์ (permissions) ของ user
 * SUPER_ADMIN ผ่านเสมอ
 * คนอื่นตรวจสอบจาก permissions array ใน DB
 */
export const requirePermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'ไม่ได้ยืนยันตัวตน' });
    }

    // SUPER_ADMIN ผ่านทุก permission
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { permissions: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'ไม่พบผู้ใช้' });
      }

      const hasPermission = permissions.some((p) => user.permissions.includes(p));
      if (!hasPermission) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์ในการเข้าถึงส่วนนี้' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'ไม่สามารถตรวจสอบสิทธิ์' });
    }
  };
};

/**
 * ตรวจสอบว่าเป็น admin (SUPER_ADMIN) หรือ manager (AREA_MANAGER+)
 */
export const requireManagerOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'AREA_MANAGER') {
    return next();
  }
  return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง (ต้องเป็น Admin หรือ Area Manager)' });
};
