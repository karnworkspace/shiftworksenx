/**
 * User Controller Tests
 * Tests: getAllUsers, getUserById, createUser, updateUser, deleteUser, changePassword,
 *        getUserProjectAccess, updateUserProjectAccess
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllUsers, getUserById, createUser, updateUser, deleteUser,
  changePassword, getUserProjectAccess, updateUserProjectAccess,
} from '../controllers/user.controller';
import { createMockRequest, createMockResponse, testUsers } from '../__tests__/helpers';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hashed-new-password'),
  },
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('hashed-new-password'),
}));

describe('getAllUsers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return all users', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: testUsers.superAdmin.id, email: testUsers.superAdmin.email, name: testUsers.superAdmin.name, role: 'SUPER_ADMIN' },
      { id: testUsers.siteManager.id, email: testUsers.siteManager.email, name: testUsers.siteManager.name, role: 'SITE_MANAGER' },
    ] as any);

    const req = createMockRequest({
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getAllUsers(req, res);

    expect(res._json.users).toHaveLength(2);
  });
});

describe('getUserById', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return user by ID', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.areaManager.id,
      email: testUsers.areaManager.email,
      name: testUsers.areaManager.name,
      role: 'AREA_MANAGER',
    } as any);

    const req = createMockRequest({
      params: { id: testUsers.areaManager.id },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getUserById(req, res);

    expect(res._json.user.id).toBe(testUsers.areaManager.id);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent-id' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getUserById(req, res);

    expect(res._status).toBe(404);
  });
});

describe('createUser', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should create user with valid data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // email not taken
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-user-id',
      email: 'new@test.com',
      name: 'New User',
      role: 'SITE_MANAGER',
    } as any);

    const req = createMockRequest({
      body: { email: 'new@test.com', password: 'password123', name: 'New User' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(201);
    expect(res._json.success).toBe(true);
  });

  it('should reject when email is missing', async () => {
    const req = createMockRequest({
      body: { password: 'password123', name: 'New User' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject when password is missing', async () => {
    const req = createMockRequest({
      body: { email: 'new@test.com', name: 'New User' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject when name is missing', async () => {
    const req = createMockRequest({
      body: { email: 'new@test.com', password: 'password123' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject when password is too short', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      body: { email: 'new@test.com', password: '123', name: 'New User' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing',
      email: 'existing@test.com',
    } as any);

    const req = createMockRequest({
      body: { email: 'existing@test.com', password: 'password123', name: 'New User' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(400);
  });

  it('should create user with projectIds', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-user-id',
      email: 'new@test.com',
      name: 'New User',
      role: 'SITE_MANAGER',
    } as any);

    const req = createMockRequest({
      body: {
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        projectIds: ['project-001', 'project-002'],
      },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await createUser(req, res);

    expect(res._status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectAccess: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ projectId: 'project-001' }),
              expect.objectContaining({ projectId: 'project-002' }),
            ]),
          }),
        }),
      })
    );
  });
});

describe('updateUser', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update user name', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      email: testUsers.siteManager.email,
      role: 'SITE_MANAGER',
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: testUsers.siteManager.id,
      email: testUsers.siteManager.email,
      name: 'Updated Name',
      role: 'SITE_MANAGER',
    } as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { name: 'Updated Name' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUser(req, res);

    expect(res._json.success).toBe(true);
  });

  it('should reject when updating to existing email', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: 'user-1', email: 'old@test.com', role: 'SITE_MANAGER' } as any)
      .mockResolvedValueOnce({ id: 'user-2', email: 'taken@test.com' } as any);

    const req = createMockRequest({
      params: { id: 'user-1' },
      body: { email: 'taken@test.com' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUser(req, res);

    expect(res._status).toBe(400);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent' },
      body: { name: 'Test' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUser(req, res);

    expect(res._status).toBe(404);
  });
});

describe('deleteUser', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should delete user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
    } as any);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await deleteUser(req, res);

    expect(res._json.success).toBe(true);
  });

  it('should prevent self-deletion', async () => {
    const req = createMockRequest({
      params: { id: testUsers.superAdmin.id },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await deleteUser(req, res);

    expect(res._status).toBe(400);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await deleteUser(req, res);

    expect(res._status).toBe(404);
  });
});

describe('changePassword', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should change own password with correct current password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      password: 'hashed-current',
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { currentPassword: 'oldpass', newPassword: 'newpass123' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._json.success).toBe(true);
  });

  it('should reject own password change without current password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      password: 'hashed-current',
    } as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { newPassword: 'newpass123' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject own password change with wrong current password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      password: 'hashed-current',
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { currentPassword: 'wrongpass', newPassword: 'newpass123' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._status).toBe(400);
  });

  it('should allow admin to change others password without current password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      password: 'hashed-current',
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { newPassword: 'newpass123' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._json.success).toBe(true);
  });

  it('should reject non-admin changing others password', async () => {
    const req = createMockRequest({
      params: { id: testUsers.superAdmin.id },
      body: { newPassword: 'newpass123' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._status).toBe(403);
  });

  it('should reject password shorter than 6 characters', async () => {
    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { currentPassword: 'old', newPassword: '123' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._status).toBe(400);
  });

  it('should reject when newPassword is missing', async () => {
    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { currentPassword: 'oldpass' },
      user: { userId: testUsers.siteManager.id, email: testUsers.siteManager.email, role: 'SITE_MANAGER' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._status).toBe(400);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent' },
      body: { newPassword: 'newpass123' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await changePassword(req, res);

    expect(res._status).toBe(404);
  });
});

describe('getUserProjectAccess', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return user project access', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
      projectAccess: [
        { projectId: 'project-001', project: { id: 'project-001', name: 'Alpha', location: 'BKK' } },
      ],
    } as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getUserProjectAccess(req, res);

    expect(res._json.projects).toHaveLength(1);
    expect(res._json.projects[0].name).toBe('Alpha');
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await getUserProjectAccess(req, res);

    expect(res._status).toBe(404);
  });
});

describe('updateUserProjectAccess', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should update project access', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testUsers.siteManager.id,
    } as any);
    vi.mocked(prisma.userProject.deleteMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.userProject.createMany).mockResolvedValue({ count: 2 } as any);
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([
      { project: { id: 'p1', name: 'P1', location: 'L1' } },
      { project: { id: 'p2', name: 'P2', location: 'L2' } },
    ] as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { projectIds: ['p1', 'p2'] },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUserProjectAccess(req, res);

    expect(prisma.userProject.deleteMany).toHaveBeenCalledWith({ where: { userId: testUsers.siteManager.id } });
    expect(prisma.userProject.createMany).toHaveBeenCalled();
  });

  it('should reject when projectIds is not an array', async () => {
    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { projectIds: 'not-array' },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUserProjectAccess(req, res);

    expect(res._status).toBe(400);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createMockRequest({
      params: { id: 'non-existent' },
      body: { projectIds: ['p1'] },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUserProjectAccess(req, res);

    expect(res._status).toBe(404);
  });

  it('should handle empty projectIds (remove all access)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: testUsers.siteManager.id } as any);
    vi.mocked(prisma.userProject.deleteMany).mockResolvedValue({ count: 2 } as any);
    vi.mocked(prisma.userProject.findMany).mockResolvedValue([] as any);

    const req = createMockRequest({
      params: { id: testUsers.siteManager.id },
      body: { projectIds: [] },
      user: { userId: testUsers.superAdmin.id, email: testUsers.superAdmin.email, role: 'SUPER_ADMIN' },
    });
    const res = createMockResponse();

    await updateUserProjectAccess(req, res);

    expect(prisma.userProject.deleteMany).toHaveBeenCalled();
    expect(prisma.userProject.createMany).not.toHaveBeenCalled();
  });
});
