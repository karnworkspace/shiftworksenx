"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticate = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'ไม่พบ Token การยืนยันตัวตน' });
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        if (!payload) {
            return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
        }
        // Attach user to request
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'การยืนยันตัวตนล้มเหลว' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.middleware.js.map