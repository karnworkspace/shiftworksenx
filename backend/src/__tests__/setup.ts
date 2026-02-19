// Global test setup
import { vi } from 'vitest';

// Mock Prisma client globally
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    staff: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    userProject: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    position: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shiftType: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    roster: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    rosterEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    subProject: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg({
          position: { update: vi.fn(), findUnique: vi.fn() },
          staff: { updateMany: vi.fn(), update: vi.fn(), findMany: vi.fn() },
          rosterEntry: { deleteMany: vi.fn(), createMany: vi.fn() },
          roster: { create: vi.fn(), findUnique: vi.fn() },
        });
      }
      return Promise.all(arg);
    }),
  },
}));

// Set test environment variables
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
