import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
export declare const getAllProjects: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProjectById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteProject: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=project.controller.d.ts.map