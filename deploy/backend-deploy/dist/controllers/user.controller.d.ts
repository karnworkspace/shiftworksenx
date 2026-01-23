import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
/**
 * Get all users
 * Only SUPER_ADMIN and AREA_MANAGER can access
 */
export declare const getAllUsers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get user by ID
 */
export declare const getUserById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Create new user
 */
export declare const createUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update user
 */
export declare const updateUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete user (Hard delete)
 */
export declare const deleteUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Change user password
 */
export declare const changePassword: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=user.controller.d.ts.map