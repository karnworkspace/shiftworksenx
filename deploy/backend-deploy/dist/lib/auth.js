"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jose_1 = require("jose");
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');
async function signToken(payload) {
    return await new jose_1.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}
async function verifyToken(token) {
    try {
        const verified = await (0, jose_1.jwtVerify)(token, secret);
        return verified.payload;
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=auth.js.map