import jwt from 'jsonwebtoken';
import { JWTPayload, TokenPair } from '../types/auth.types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  const accessToken = jwt.sign(payload as object, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload as object, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};
