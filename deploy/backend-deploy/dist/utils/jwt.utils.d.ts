import { JWTPayload, TokenPair } from '../types/auth.types';
export declare const generateTokenPair: (payload: JWTPayload) => TokenPair;
export declare const verifyAccessToken: (token: string) => JWTPayload | null;
export declare const verifyRefreshToken: (token: string) => JWTPayload | null;
//# sourceMappingURL=jwt.utils.d.ts.map