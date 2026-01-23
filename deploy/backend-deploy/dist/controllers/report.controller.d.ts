import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
/**
 * Get monthly deduction report for a project
 */
export declare const getMonthlyDeductionReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get cost sharing report (consolidated across all projects)
 */
export declare const getCostSharingReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get financial overview for admin (all projects summary)
 */
export declare const getFinancialOverview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Export report to CSV format
 * Returns CSV string that can be downloaded
 */
export declare const exportReportCSV: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=report.controller.d.ts.map