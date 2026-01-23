import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
/**
 * Get roster for a specific project and month
 */
export declare const getRoster: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update roster entry (set shift for a specific staff on a specific day)
 */
export declare const updateRosterEntry: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Batch update roster entries (for multiple days/staff at once)
 */
export declare const batchUpdateRosterEntries: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get roster statistics for a specific day
 */
export declare const getRosterDayStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete roster entry
 */
export declare const deleteRosterEntry: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=roster.controller.d.ts.map