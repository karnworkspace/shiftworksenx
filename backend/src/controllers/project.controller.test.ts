/**
 * Project Controller Tests
 * Tests: getAllProjects, getProjectById, createProject, updateProject, deleteProject
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { createMockRequest, createMockResponse, testUsers, testProjects } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';

// Mock projectAccess utilities
vi.mock('../utils/projectAccess', () => ({
  isSuperAdmin: vi.fn((req) => req.user?.role === 'SUPER_ADMIN'),
  getAccessibleProjectIds: vi.fn(),
  ensureProjectAccess: vi.fn(),
}));

import { getAccessibleProjectIds, ensureProjectAccess } from '../utils/projectAccess';

describe('getAllProjects', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return all projects for SUPER_ADMIN', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      { ...testProjects.project1, manager: null, subProjects: [], _count: { staff: 5 } },
      { ...testProjects.project2, manager: { id: testUsers.areaManager.id, name: 'Area Mgr', email: 'area@test.com' }, subProjects: [], _count: { staff: 3 } },
    ] as any);

    const req = createMockRequest({
      query: {},
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getAllProjects(req, res);

    expect(res._json.projects).toHaveLength(2);
    // SUPER_ADMIN should NOT call getAccessibleProjectIds
    expect(getAccessibleProjectIds).not.toHaveBeenCalled();
  });

  it('should return only accessible projects for non-admin with assignments', async () => {
    vi.mocked(getAccessibleProjectIds).mockResolvedValue(['project-001']);
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      { ...testProjects.project1, manager: null, subProjects: [], _count: { staff: 5 } },
    ] as any);

    const req = createMockRequest({
      query: {},
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await getAllProjects(req, res);

    expect(res._json.projects).toHaveLength(1);
    expect(getAccessibleProjectIds).toHaveBeenCalledWith(testUsers.siteManager.id);
  });

  it('should return no projects for non-admin without assignments (empty array)', async () => {
    vi.mocked(getAccessibleProjectIds).mockResolvedValue([]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as any);

    const req = createMockRequest({
      query: {},
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await getAllProjects(req, res);

    expect(res._json.projects).toHaveLength(0);
  });

  it('should filter inactive projects by default', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as any);

    const req = createMockRequest({
      query: {},
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getAllProjects(req, res);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('should include inactive projects when requested', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as any);

    const req = createMockRequest({
      query: { includeInactive: 'true' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getAllProjects(req, res);

    const callArgs = vi.mocked(prisma.project.findMany).mock.calls[0][0];
    expect(callArgs?.where).not.toHaveProperty('isActive');
  });

  it('should convert subProject percentages to numbers', async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      {
        ...testProjects.project1,
        manager: null,
        subProjects: [
          { id: 'sp1', name: 'Sub 1', percentage: { toNumber: () => 50 } },
          { id: 'sp2', name: 'Sub 2', percentage: { toNumber: () => 30 } },
        ],
        _count: { staff: 5 },
      },
    ] as any);

    const req = createMockRequest({
      query: {},
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getAllProjects(req, res);

    // Percentages should be converted to numbers
    expect(typeof res._json.projects[0].subProjects[0].percentage).toBe('number');
  });
});

describe('getProjectById', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return project when user has access', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...testProjects.project1,
      manager: null,
      subProjects: [],
      staff: [],
    } as any);

    const req = createMockRequest({
      params: { id: 'project-001' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getProjectById(req, res);

    expect(res._json.project.id).toBe('project-001');
  });

  it('should return 403 when user has no access', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(false);

    const req = createMockRequest({
      params: { id: 'project-001' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await getProjectById(req, res);

    expect(res._status).toBe(403);
  });

  it('should return 404 when project not found', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getProjectById(req, res);

    expect(res._status).toBe(404);
  });
});

describe('createProject', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should create project with valid data', async () => {
    vi.mocked(prisma.project.create).mockResolvedValue({
      id: 'new-project',
      name: 'New Project',
      location: 'Bangkok',
      themeColor: '#3b82f6',
      subProjects: [],
    } as any);

    const req = createMockRequest({
      body: { name: 'New Project', location: 'Bangkok' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createProject(req, res);

    expect(res._status).toBe(201);
    expect(res._json.success).toBe(true);
    expect(res._json.project.name).toBe('New Project');
  });

  it('should reject when name is missing', async () => {
    const req = createMockRequest({
      body: { location: 'Bangkok' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createProject(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject when name is empty string', async () => {
    const req = createMockRequest({
      body: { name: '  ' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createProject(req, res);

    expect(res._status).toBe(400);
  });

  it('should create project with subProjects', async () => {
    vi.mocked(prisma.project.create).mockResolvedValue({
      id: 'new-project',
      name: 'Project With Subs',
      subProjects: [
        { id: 'sp1', name: 'Sub A', percentage: 60 },
        { id: 'sp2', name: 'Sub B', percentage: 40 },
      ],
    } as any);

    const req = createMockRequest({
      body: {
        name: 'Project With Subs',
        subProjects: [
          { name: 'Sub A', percentage: 60 },
          { name: 'Sub B', percentage: 40 },
        ],
      },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createProject(req, res);

    expect(res._status).toBe(201);
  });

  it('should reject invalid subProject percentage', async () => {
    const req = createMockRequest({
      body: {
        name: 'Test',
        subProjects: [{ name: 'Bad Sub', percentage: 150 }],
      },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createProject(req, res);

    expect(res._status).toBe(400);
  });
});

describe('updateProject', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update project when user has access', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma));
    vi.mocked(prisma.project.update).mockResolvedValue({} as any);
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...testProjects.project1,
      name: 'Updated Name',
      subProjects: [],
    } as any);

    const req = createMockRequest({
      params: { id: 'project-001' },
      body: { name: 'Updated Name' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateProject(req, res);

    expect(res._json.success).toBe(true);
  });

  it('should return 403 when user has no access', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(false);

    const req = createMockRequest({
      params: { id: 'project-001' },
      body: { name: 'Updated' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await updateProject(req, res);

    expect(res._status).toBe(403);
  });
});

describe('deleteProject', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should soft-delete project (set isActive=false)', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(true);
    vi.mocked(prisma.project.update).mockResolvedValue({} as any);

    const req = createMockRequest({
      params: { id: 'project-001' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await deleteProject(req, res);

    expect(res._json.success).toBe(true);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-001' },
      data: { isActive: false },
    });
  });

  it('should return 403 when user has no access', async () => {
    vi.mocked(ensureProjectAccess).mockResolvedValue(false);

    const req = createMockRequest({
      params: { id: 'project-001' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await deleteProject(req, res);

    expect(res._status).toBe(403);
  });
});
