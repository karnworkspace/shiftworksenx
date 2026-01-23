import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
/**
 * Get all staff for a project
 * Query params:
 * - projectId: required
 * - includeInactive: optional (default: false)
 */
export declare const getAllStaff: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get staff by ID
 */
export declare const getStaffById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Create new staff
 */
export declare const createStaff: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update staff
 */
export declare const updateStaff: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Toggle staff active status (Enable/Disable)
 * This is the preferred way to "delete" staff while keeping historical data
 */
export declare const toggleStaffStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete staff (Hard delete - use with caution)
 * Only use this for cleaning up test data or mistaken entries
 */
export declare const deleteStaff: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=staff.controller.d.ts.map