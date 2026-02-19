import jwt from 'jsonwebtoken';
import { JWTPayload, TokenPair } from '../types/auth.types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.error('❌ JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Fallback only for development
const getAccessSecret = () => ACCESS_SECRET || 'dev-access-secret-key';
const getRefreshSecret = () => REFRESH_SECRET || 'dev-refresh-secret-key';

export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  const accessToken = jwt.sign(payload as object, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload as object, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, getAccessSecret()) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, getRefreshSecret()) as JWTPayload;
  } catch (error) {
    return null;
  }
};
