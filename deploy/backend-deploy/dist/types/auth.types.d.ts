import { Request } from 'express';
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface AuthRequest extends Request {
    user?: JWTPayload;
}
//# sourceMappingURL=auth.types.d.ts.map