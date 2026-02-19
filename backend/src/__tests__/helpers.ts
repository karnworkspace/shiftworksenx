/**
 * Test helpers: mock request/response, JWT token generation, test users
 */
import { vi } from 'vitest';
import { AuthRequest } from '../types/auth.types';
import { Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

// ======== Test Users ========

export const testUsers = {
  superAdmin: {
    id: 'user-super-admin-001',
    email: 'admin@test.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN' as const,
    password: '$2a$10$hashedpassword', // bcrypt hash of 'password123'
    permissions: ['reports', 'roster', 'staff', 'projects', 'users', 'settings'],
  },
  areaManager: {
    id: 'user-area-mgr-001',
    email: 'area@test.com',
    name: 'Area Manager',
    role: 'AREA_MANAGER' as const,
    password: '$2a$10$hashedpassword',
    permissions: ['reports', 'roster', 'staff', 'projects'],
  },
  siteManager: {
    id: 'user-site-mgr-001',
    email: 'site@test.com',
    name: 'Site Manager',
    role: 'SITE_MANAGER' as const,
    password: '$2a$10$hashedpassword',
    permissions: ['reports', 'roster', 'staff'],
  },
  limitedUser: {
    id: 'user-limited-001',
    email: 'limited@test.com',
    name: 'Limited User',
    role: 'SITE_MANAGER' as const,
    password: '$2a$10$hashedpassword',
    permissions: ['roster'], // Only roster access
  },
  noPermUser: {
    id: 'user-noperm-001',
    email: 'noperm@test.com',
    name: 'No Perm User',
    role: 'SITE_MANAGER' as const,
    password: '$2a$10$hashedpassword',
    permissions: [], // No permissions at all
  },
};

// ======== Test Projects ========

export const testProjects = {
  project1: {
    id: 'project-001',
    name: 'Project Alpha',
    location: 'Bangkok',
    themeColor: '#3b82f6',
    isActive: true,
    managerId: null,
    description: null,
    editCutoffDay: 2,
    editCutoffNextMonth: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  project2: {
    id: 'project-002',
    name: 'Project Beta',
    location: 'Chiang Mai',
    themeColor: '#ef4444',
    isActive: true,
    managerId: testUsers.areaManager.id,
    description: null,
    editCutoffDay: 2,
    editCutoffNextMonth: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// ======== Token Generation ========

export function generateTestAccessToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateTestRefreshToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// ======== Mock Request/Response ========

export function createMockRequest(overrides: Partial<AuthRequest> = {}): AuthRequest {
  const req = {
    headers: {},
    params: {},
    query: {},
    body: {},
    cookies: {},
    user: undefined,
    ...overrides,
  } as unknown as AuthRequest;
  return req;
}

export function createMockResponse(): Response & {
  _status: number;
  _json: any;
  _headers: Record<string, string>;
  _cookies: Array<{ name: string; value: string; options: any }>;
  _clearedCookies: string[];
  _sent: string;
} {
  const res: any = {
    _status: 200,
    _json: null,
    _headers: {},
    _cookies: [],
    _clearedCookies: [],
    _sent: '',
    status: vi.fn().mockImplementation(function (this: any, code: number) {
      this._status = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function (this: any, data: any) {
      this._json = data;
      return this;
    }),
    send: vi.fn().mockImplementation(function (this: any, data: string) {
      this._sent = data;
      return this;
    }),
    setHeader: vi.fn().mockImplementation(function (this: any, key: string, value: string) {
      this._headers[key] = value;
      return this;
    }),
    cookie: vi.fn().mockImplementation(function (this: any, name: string, value: string, options: any) {
      this._cookies.push({ name, value, options });
      return this;
    }),
    clearCookie: vi.fn().mockImplementation(function (this: any, name: string) {
      this._clearedCookies.push(name);
      return this;
    }),
  };
  return res;
}

// ======== Auth Request with User ========

export function createAuthRequest(
  user: { id: string; email: string; role: string },
  overrides: Partial<AuthRequest> = {}
): AuthRequest {
  const token = generateTestAccessToken(user);
  return createMockRequest({
    headers: { authorization: `Bearer ${token}` },
    user: { userId: user.id, email: user.email, role: user.role },
    ...overrides,
  });
}
