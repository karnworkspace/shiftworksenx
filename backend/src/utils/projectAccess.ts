import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';

export const isSuperAdmin = (req: AuthRequest) => req.user?.role === 'SUPER_ADMIN';

/**
 * ดึง project IDs ที่ user มีสิทธิ์เข้าถึง
 * โดยดูจาก:
 * 1. ตาราง UserProject (project access ที่ถูก assign ให้)
 * 2. project ที่ user เป็น manager
 * รวมผลลัพธ์ทั้ง 2 ส่วนเป็นรายการเดียว (ไม่ซ้ำกัน)
 * 
 * Returns:
 * - string[]: รายการ project IDs ที่เข้าถึงได้ (อาจเป็น [] ถ้าไม่มี assignment)
 */
export const getAccessibleProjectIds = async (userId: string): Promise<string[]> => {
  // 1. ดึงจากตาราง UserProject (โครงการที่ถูก assign)
  const assignedProjects = await prisma.userProject.findMany({
    where: { userId },
    select: { projectId: true },
  });

  // 2. ดึงจากโครงการที่ user เป็น manager
  const managedProjects = await prisma.project.findMany({
    where: { managerId: userId },
    select: { id: true },
  });

  // ถ้าไม่มีการ assign โครงการเลย และไม่ได้เป็น manager ของโครงการใด
  // = ไม่มีสิทธิ์เข้าถึงโครงการใดเลย
  if (assignedProjects.length === 0 && managedProjects.length === 0) {
    return [];
  }

  // รวมผลลัพธ์ ไม่ซ้ำกัน
  const idSet = new Set<string>();
  assignedProjects.forEach((p) => idSet.add(p.projectId));
  managedProjects.forEach((p) => idSet.add(p.id));

  return Array.from(idSet);
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
