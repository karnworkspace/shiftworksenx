/**
 * JWT Utils Tests
 * Tests: generateTokenPair, verifyAccessToken, verifyRefreshToken
 */
import { describe, it, expect } from 'vitest';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.utils';

describe('generateTokenPair', () => {
  const payload = {
    userId: 'test-user-001',
    email: 'test@test.com',
    role: 'SUPER_ADMIN',
  };

  it('should generate both access and refresh tokens', () => {
    const tokens = generateTokenPair(payload);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('should generate different access and refresh tokens', () => {
    const tokens = generateTokenPair(payload);

    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });

  it('should generate valid JWT format tokens', () => {
    const tokens = generateTokenPair(payload);

    // JWT format: header.payload.signature
    expect(tokens.accessToken.split('.')).toHaveLength(3);
    expect(tokens.refreshToken.split('.')).toHaveLength(3);
  });
});

describe('verifyAccessToken', () => {
  it('should verify a valid access token', () => {
    const tokens = generateTokenPair({
      userId: 'test-user',
      email: 'test@test.com',
      role: 'SITE_MANAGER',
    });

    const payload = verifyAccessToken(tokens.accessToken);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('test-user');
    expect(payload?.email).toBe('test@test.com');
    expect(payload?.role).toBe('SITE_MANAGER');
  });

  it('should return null for invalid token', () => {
    const result = verifyAccessToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should return null for refresh token (wrong secret)', () => {
    const tokens = generateTokenPair({
      userId: 'test-user',
      email: 'test@test.com',
      role: 'SITE_MANAGER',
    });

    // Refresh token should NOT be verifiable with access secret
    const result = verifyAccessToken(tokens.refreshToken);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = verifyAccessToken('');
    expect(result).toBeNull();
  });
});

describe('verifyRefreshToken', () => {
  it('should verify a valid refresh token', () => {
    const tokens = generateTokenPair({
      userId: 'test-user',
      email: 'test@test.com',
      role: 'AREA_MANAGER',
    });

    const payload = verifyRefreshToken(tokens.refreshToken);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('test-user');
    expect(payload?.role).toBe('AREA_MANAGER');
  });

  it('should return null for invalid token', () => {
    const result = verifyRefreshToken('invalid-token');
    expect(result).toBeNull();
  });

  it('should return null for access token (wrong secret)', () => {
    const tokens = generateTokenPair({
      userId: 'test-user',
      email: 'test@test.com',
      role: 'SITE_MANAGER',
    });

    // Access token should NOT be verifiable with refresh secret
    const result = verifyRefreshToken(tokens.accessToken);
    expect(result).toBeNull();
  });
});
