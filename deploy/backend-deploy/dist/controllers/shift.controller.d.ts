import { Request, Response } from 'express';
export declare const getAllShifts: (req: Request, res: Response) => Promise<void>;
export declare const getShiftById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createShift: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateShift: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteShift: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shift.controller.d.ts.map