import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';

export const isSuperAdmin = (req: AuthRequest) => req.user?.role === 'SUPER_ADMIN';

export const getAccessibleProjectIds = async (userId: string): Promise<string[]> => {
  // Since userProjectAccess table was removed, 
  // check if user is a manager of any projects
  const managedProjects = await prisma.project.findMany({
    where: { managerId: userId },
    select: { id: true },
  });

  return managedProjects.map((p) => p.id);
};

export const ensureProjectAccess = async (
  req: AuthRequest,
  projectId: string
): Promise<boolean> => {
  if (!req.user) {
    return false;
  }

  if (isSuperAdmin(req)) {
    return true;
  }

  const allowedIds = await getAccessibleProjectIds(req.user.userId);
  return allowedIds.includes(projectId);
};
