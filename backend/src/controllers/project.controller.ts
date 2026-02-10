import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import { ensureProjectAccess, getAccessibleProjectIds, isSuperAdmin } from '../utils/projectAccess';

type SubProjectInput = { name: string; percentage: number };

const normalizeSubProjects = (input: any) => {
  if (input === undefined) {
    return { value: undefined as SubProjectInput[] | undefined };
  }
  if (input === null) {
    return { value: [] as SubProjectInput[] };
  }
  let raw = input;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { error: 'Sub projects must be an array' };
    }
  }
  if (!Array.isArray(raw)) {
    return { error: 'Sub projects must be an array' };
  }
  const result: SubProjectInput[] = [];
  for (const item of raw) {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    if (!name) continue;
    const percentage = Number(item?.percentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return { error: 'Sub project percentage must be between 0 and 100' };
    }
    result.push({ name, percentage });
  }
  return { value: result };
};

export const getAllProjects = async (req: AuthRequest, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const isAdmin = isSuperAdmin(req);
    const allowedIds = !isAdmin && req.user ? await getAccessibleProjectIds(req.user.userId) : undefined;

    const projects = await prisma.project.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(allowedIds ? { id: { in: allowedIds } } : {}),
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subProjects: {
          select: {
            id: true,
            name: true,
            percentage: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            staff: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform subProjects percentage from Decimal to number
    const transformedProjects = projects.map(p => ({
      ...p,
      subProjects: p.subProjects.map(sp => ({
        ...sp,
        percentage: Number(sp.percentage),
      })),
    }));

    return res.json({ projects: transformedProjects });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!(await ensureProjectAccess(req, id))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subProjects: {
          select: {
            id: true,
            name: true,
            percentage: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        staff: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'ไม่พบโครงการ' });
    }

    // Transform subProjects percentage from Decimal to number
    const transformedProject = {
      ...project,
      subProjects: project.subProjects.map(sp => ({
        ...sp,
        percentage: Number(sp.percentage),
      })),
    };

    return res.json({ project: transformedProject });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, themeColor, managerId, description, editCutoffDay, editCutoffNextMonth } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const parsed = normalizeSubProjects(req.body.subProjects);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const subProjects = parsed.value || [];

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        location,
        themeColor: themeColor || '#3b82f6',
        description: description || null,
        managerId,
        editCutoffDay: editCutoffDay ?? 2,
        editCutoffNextMonth: editCutoffNextMonth ?? true,
        ...(subProjects.length > 0 ? {
          subProjects: {
            create: subProjects.map(sp => ({
              name: sp.name,
              percentage: sp.percentage,
            })),
          },
        } : {}),
      },
      include: {
        subProjects: {
          select: { id: true, name: true, percentage: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const transformedProject = {
      ...project,
      subProjects: project.subProjects.map(sp => ({
        ...sp,
        percentage: Number(sp.percentage),
      })),
    };

    return res.status(201).json({
      success: true,
      project: transformedProject,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, themeColor, managerId, isActive, description, editCutoffDay, editCutoffNextMonth } = req.body;

    if (!(await ensureProjectAccess(req, id))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    const parsed = normalizeSubProjects(req.body.subProjects);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    // Update project basic fields
    await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(themeColor !== undefined && { themeColor }),
        ...(managerId !== undefined && { managerId }),
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { description }),
        ...(editCutoffDay !== undefined && { editCutoffDay }),
        ...(editCutoffNextMonth !== undefined && { editCutoffNextMonth }),
      },
    });

    // Handle sub-projects: delete all existing and re-create
    if (parsed.value !== undefined) {
      await prisma.subProject.deleteMany({ where: { projectId: id } });
      if (parsed.value.length > 0) {
        await prisma.subProject.createMany({
          data: parsed.value.map(sp => ({
            name: sp.name,
            percentage: sp.percentage,
            projectId: id,
          })),
        });
      }
    }

    // Fetch updated project with subProjects
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        subProjects: {
          select: { id: true, name: true, percentage: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const transformedProject = updatedProject ? {
      ...updatedProject,
      subProjects: updatedProject.subProjects.map(sp => ({
        ...sp,
        percentage: Number(sp.percentage),
      })),
    } : updatedProject;

    return res.json({
      success: true,
      project: transformedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!(await ensureProjectAccess(req, id))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    // Soft delete
    await prisma.project.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ success: true, message: 'ปิดการใช้งานโครงการสำเร็จ' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
};
