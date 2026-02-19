/**
 * Auth Controller Tests
 * Tests: login, refresh, logout, me
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, refresh, logout, me } from '../controllers/auth.controller';
import { createMockRequest, createMockResponse, generateTestRefreshToken, testUsers } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login successfully with correct credentials', async () => {
    const hashedPassword = 'hashed-password';
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.superAdmin.id,
      email: testUsers.superAdmin.email,
      name: testUsers.superAdmin.name,
      role: testUsers.superAdmin.role,
      password: hashedPassword,
      permissions: testUsers.superAdmin.permissions,
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

    const req = createMockRequest({
      body: { email: 'admin@test.com', password: 'password123' },
    });
    const res = createMockResponse();

    await login(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.accessToken).toBeDefined();
    expect(res._json.user.email).toBe('admin@test.com');
    expect(res._json.user.role).toBe('SUPER_ADMIN');
    // Should not return password
    expect(res._json.user.password).toBeUndefined();
    // Should set refresh token cookie
    expect(res._cookies.length).toBe(1);
    expect(res._cookies[0].name).toBe('refreshToken');
    expect(res._cookies[0].options.httpOnly).toBe(true);
  });

  it('should reject with wrong email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      body: { email: 'wrong@test.com', password: 'password123' },
    });
    const res = createMockResponse();

    await login(req, res);

    expect(res._status).toBe(401);
    expect(res._json.error).toBeDefined();
  });

  it('should reject with wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.superAdmin.id,
      email: testUsers.superAdmin.email,
      password: 'hashed-password',
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

    const req = createMockRequest({
      body: { email: 'admin@test.com', password: 'wrongpassword' },
    });
    const res = createMockResponse();

    await login(req, res);

    expect(res._status).toBe(401);
  });

  it('should set secure cookie in production', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.superAdmin.id,
      email: testUsers.superAdmin.email,
      name: testUsers.superAdmin.name,
      role: testUsers.superAdmin.role,
      password: 'hashed',
      permissions: testUsers.superAdmin.permissions,
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

    const req = createMockRequest({
      body: { email: 'admin@test.com', password: 'password123' },
    });
    const res = createMockResponse();

    await login(req, res);

    expect(res._cookies[0].options.secure).toBe(true);

    process.env.NODE_ENV = origEnv;
  });

  it('should return user permissions in response', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      email: testUsers.siteManager.email,
      name: testUsers.siteManager.name,
      role: testUsers.siteManager.role,
      password: 'hashed',
      permissions: ['reports', 'roster'],
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

    const req = createMockRequest({
      body: { email: 'site@test.com', password: 'password123' },
    });
    const res = createMockResponse();

    await login(req, res);

    expect(res._json.user.permissions).toEqual(['reports', 'roster']);
  });
});

describe('refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh tokens with valid refresh token', async () => {
    const refreshToken = generateTestRefreshToken(testUsers.superAdmin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.superAdmin.id,
      email: testUsers.superAdmin.email,
      role: testUsers.superAdmin.role,
    } as any);

    const req = createMockRequest({
      cookies: { refreshToken },
    });
    const res = createMockResponse();

    await refresh(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.accessToken).toBeDefined();
    expect(res._cookies.length).toBe(1);
  });

  it('should reject when no refresh token cookie', async () => {
    const req = createMockRequest({
      cookies: {},
    });
    const res = createMockResponse();

    await refresh(req, res);

    expect(res._status).toBe(401);
  });

  it('should reject with invalid refresh token', async () => {
    const req = createMockRequest({
      cookies: { refreshToken: 'invalid-token' },
    });
    const res = createMockResponse();

    await refresh(req, res);

    expect(res._status).toBe(401);
  });

  it('should reject when user not found in DB (deleted user)', async () => {
    const refreshToken = generateTestRefreshToken(testUsers.superAdmin);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      cookies: { refreshToken },
    });
    const res = createMockResponse();

    await refresh(req, res);

    expect(res._status).toBe(401);
  });

  it('should use fresh user data from DB (not stale token data)', async () => {
    // User was SITE_MANAGER when token was issued, now promoted to AREA_MANAGER
    const refreshToken = generateTestRefreshToken({
      id: testUsers.siteManager.id,
      email: testUsers.siteManager.email,
      role: 'SITE_MANAGER',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      email: testUsers.siteManager.email,
      role: 'AREA_MANAGER', // Promoted!
    } as any);

    const req = createMockRequest({
      cookies: { refreshToken },
    });
    const res = createMockResponse();

    await refresh(req, res);

    expect(res._json.success).toBe(true);
    // The new token should contain the updated role
    expect(res._json.accessToken).toBeDefined();
    // Verify DB was queried
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('should clear refresh token cookie', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await logout(req, res);

    expect(res._json.success).toBe(true);
    expect(res._clearedCookies).toContain('refreshToken');
  });
});

describe('me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current user info', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.superAdmin.id,
      email: testUsers.superAdmin.email,
      name: testUsers.superAdmin.name,
      role: testUsers.superAdmin.role,
      permissions: testUsers.superAdmin.permissions,
      createdAt: new Date(),
    } as any);

    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await me(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.user.email).toBe('admin@test.com');
    expect(res._json.user.role).toBe('SUPER_ADMIN');
  });

  it('should return 401 when not authenticated', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await me(req, res);

    expect(res._status).toBe(401);
  });

  it('should return 404 when user deleted from DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      user: { userId: 'deleted-user', email: 'deleted@test.com', role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await me(req, res);

    expect(res._status).toBe(404);
  });
});
