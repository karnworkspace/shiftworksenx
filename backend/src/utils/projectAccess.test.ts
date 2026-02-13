/**
 * Project Access Utility Tests
 * Tests: isSuperAdmin, getAccessibleProjectIds, ensureProjectAccess
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSuperAdmin, getAccessibleProjectIds, ensureProjectAccess } from '../utils/projectAccess';
import { createMockRequest, testUsers, testProjects } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

describe('isSuperAdmin', () => {
  it('should return true for SUPER_ADMIN', () => {
    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    expect(isSuperAdmin(req)).toBe(true);
  });

  it('should return false for AREA_MANAGER', () => {
    const req = createMockRequest({
      user: { userId: testUsers.areaManager.id, email: testUsers.areaManager.email, role: 'AREA_MANAGER' },
    });
    expect(isSuperAdmin(req)).toBe(false);
  });

  it('should return false for SITE_MANAGER', () => {
    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    expect(isSuperAdmin(req)).toBe(false);
  });

  it('should return false when user is undefined', () => {
    const req = createMockRequest({});
    expect(isSuperAdmin(req)).toBe(false);
  });
});

describe('getAccessibleProjectIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when user has no assignments and no managed projects (no access)', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const result = await getAccessibleProjectIds(testUsers.siteManager.id);

    expect(result).toEqual([]);
  });

  it('should return assigned project IDs', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([
      { projectId: 'project-001' } as any,
      { projectId: 'project-002' } as any,
    ]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const result = await getAccessibleProjectIds(testUsers.siteManager.id);

    expect(result).toEqual(['project-001', 'project-002']);
  });

  it('should return managed project IDs', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      { id: 'project-003' } as any,
    ]);

    const result = await getAccessibleProjectIds(testUsers.areaManager.id);

    expect(result).toEqual(['project-003']);
  });

  it('should combine assigned and managed projects without duplicates', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([
      { projectId: 'project-001' } as any,
      { projectId: 'project-002' } as any,
    ]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      { id: 'project-002' } as any,  // duplicate
      { id: 'project-003' } as any,
    ]);

    const result = await getAccessibleProjectIds(testUsers.areaManager.id);

    expect(result).toHaveLength(3);
    expect(result).toContain('project-001');
    expect(result).toContain('project-002');
    expect(result).toContain('project-003');
  });

  it('should return array even with single project', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([
      { projectId: 'project-001' } as any,
    ]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const result = await getAccessibleProjectIds(testUsers.siteManager.id);

    expect(result).toEqual(['project-001']);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('ensureProjectAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when user is undefined', async () => {
    const req = createMockRequest({});
    const result = await ensureProjectAccess(req, 'project-001');
    expect(result).toBe(false);
  });

  it('should always return true for SUPER_ADMIN', async () => {
    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });

    const result = await ensureProjectAccess(req, 'any-project-id');

    expect(result).toBe(true);
    // Should NOT query DB for super admin
    expect(prisma.userProject.findMany).not.toHaveBeenCalled();
  });

  it('should return false when user has no assignments (no access)', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });

    const result = await ensureProjectAccess(req, 'any-project-id');

    expect(result).toBe(false);
  });

  it('should return true when project is in assigned list', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([
      { projectId: 'project-001' } as any,
      { projectId: 'project-002' } as any,
    ]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });

    const result = await ensureProjectAccess(req, 'project-001');

    expect(result).toBe(true);
  });

  it('should return false when project is NOT in assigned list', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([
      { projectId: 'project-001' } as any,
    ]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const req = createMockRequest({
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });

    const result = await ensureProjectAccess(req, 'project-999');

    expect(result).toBe(false);
  });

  it('should return true when user is manager of the project', async () => {
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      { id: 'project-002' } as any,
    ]);

    const req = createMockRequest({
      user: { userId: testUsers.areaManager.id, email: testUsers.areaManager.email, role: 'AREA_MANAGER' },
    });

    const result = await ensureProjectAccess(req, 'project-002');

    expect(result).toBe(true);
  });
});
