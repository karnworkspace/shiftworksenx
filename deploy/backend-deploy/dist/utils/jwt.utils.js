"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const generateTokenPair = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
    });
    return { accessToken, refreshToken };
};
exports.generateTokenPair = generateTokenPair;
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwt.utils.js.map