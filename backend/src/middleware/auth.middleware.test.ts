/**
 * Auth Middleware Tests
 * Tests: authenticate, requireAdmin, requirePermission, requireManagerOrAdmin
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate, requireAdmin, requirePermission, requireManagerOrAdmin } from '../middleware/auth.middleware';
import { createMockRequest, createMockResponse, generateTestAccessToken, testUsers } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass with valid Bearer token', () => {
    const token = generateTestAccessToken(testUsers.superAdmin);
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe(testUsers.superAdmin.id);
    expect(req.user?.email).toBe(testUsers.superAdmin.email);
    expect(req.user?.role).toBe('SUPER_ADMIN');
  });

  it('should reject when no Authorization header', () => {
    const req = createMockRequest({ headers: {} });
    const res = createMockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._json.error).toContain('Token');
  });

  it('should reject when Authorization header has wrong format', () => {
    const req = createMockRequest({
      headers: { authorization: 'Basic some-token' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('should reject with invalid token', () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer invalid-token-here' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('should reject with expired token', () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 'test', email: 'test@test.com', role: 'SITE_MANAGER' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '0s' }
    );
    const req = createMockRequest({
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    // Wait a moment for token to expire
    setTimeout(() => {
      authenticate(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
    }, 100);
  });

  it('should attach correct user payload for each role', () => {
    for (const user of [testUsers.superAdmin, testUsers.areaManager, testUsers.siteManager]) {
      const token = generateTestAccessToken(user);
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = vi.fn();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user?.role).toBe(user.role);
    }
  });
});

describe('requireAdmin middleware', () => {
  it('should pass for SUPER_ADMIN', () => {
    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject AREA_MANAGER', () => {
    const req = createMockRequest({
      user: { userId: testUsers.areaManager.id, email: testUsers.areaManager.email, role: 'AREA_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('should reject SITE_MANAGER', () => {
    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('should reject when no user on request', () => {
    const req = createMockRequest({});
    const res = createMockResponse();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });
});

describe('requireManagerOrAdmin middleware', () => {
  it('should pass for SUPER_ADMIN', () => {
    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireManagerOrAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should pass for AREA_MANAGER', () => {
    const req = createMockRequest({
      user: { userId: testUsers.areaManager.id, email: testUsers.areaManager.email, role: 'AREA_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireManagerOrAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject SITE_MANAGER', () => {
    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireManagerOrAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });
});

describe('requirePermission middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass for SUPER_ADMIN regardless of permissions', async () => {
    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('reports');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Should NOT query DB for SUPER_ADMIN
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should pass when user has the required permission', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      permissions: ['reports', 'roster', 'staff'],
    } as any);

    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('reports');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject when user lacks the required permission', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      permissions: ['roster'],
    } as any);

    const req = createMockRequest({
      user: { userId: testUsers.limitedUser.id, email: testUsers.limitedUser.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('users');
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('should pass when user has any of multiple required permissions', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      permissions: ['roster'],
    } as any);

    const req = createMockRequest({
      user: { userId: testUsers.limitedUser.id, email: testUsers.limitedUser.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('users', 'roster');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject when user has empty permissions array', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      permissions: [],
    } as any);

    const req = createMockRequest({
      user: { userId: testUsers.noPermUser.id, email: testUsers.noPermUser.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('staff');
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('should return 401 when no user on request', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('reports');
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('should return 401 when user not found in DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      user: { userId: 'deleted-user', email: 'deleted@test.com', role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('reports');
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });
});
