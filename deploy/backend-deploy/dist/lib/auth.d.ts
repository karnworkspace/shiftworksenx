export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}
export declare function signToken(payload: JWTPayload): Promise<string>;
export declare function verifyToken(token: string): Promise<JWTPayload | null>;
//# sourceMappingURL=auth.d.ts.map