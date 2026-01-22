import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { PrismaClient, StaffType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all staff for a project
 * Query params:
 * - projectId: required
 * - includeInactive: optional (default: false)
 */
export const getAllStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    const includeInactive = req.query.includeInactive === 'true';

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const staff = await prisma.staff.findMany({
      where: {
        projectId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' }, // Active staff first
        { staffType: 'asc' }, // Regular before Spare
        { createdAt: 'asc' },
      ],
    });

    return res.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

/**
 * Get staff by ID
 */
export const getStaffById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    return res.json({ staff });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

/**
 * Create new staff
 */
export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      position,
      phone,
      wagePerDay,
      staffType,
      defaultShift,
      projectId,
      remark,
    } = req.body;

    // Validation
    if (!name || !position || !wagePerDay || !projectId) {
      return res.status(400).json({
        error: 'Name, position, wage per day, and project ID are required',
      });
    }

    if (wagePerDay <= 0) {
      return res.status(400).json({ error: 'Wage per day must be positive' });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        position,
        phone,
        wagePerDay,
        staffType: staffType || StaffType.REGULAR,
        defaultShift: defaultShift || '1',
        projectId,
        remark,
        isActive: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({ staff });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({ error: 'Failed to create staff' });
  }
};

/**
 * Update staff
 */
export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      position,
      phone,
      wagePerDay,
      staffType,
      defaultShift,
      isActive,
      remark,
    } = req.body;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Validation
    if (wagePerDay !== undefined && wagePerDay <= 0) {
      return res.status(400).json({ error: 'Wage per day must be positive' });
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position }),
        ...(phone !== undefined && { phone }),
        ...(wagePerDay !== undefined && { wagePerDay }),
        ...(staffType !== undefined && { staffType }),
        ...(defaultShift !== undefined && { defaultShift }),
        ...(isActive !== undefined && { isActive }),
        ...(remark !== undefined && { remark }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({ staff });
  } catch (error) {
    console.error('Update staff error:', error);
    return res.status(500).json({ error: 'Failed to update staff' });
  }
};

/**
 * Toggle staff active status (Enable/Disable)
 * This is the preferred way to "delete" staff while keeping historical data
 */
export const toggleStaffStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        isActive: !staff.isActive,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({ staff: updatedStaff });
  } catch (error) {
    console.error('Toggle staff status error:', error);
    return res.status(500).json({ error: 'Failed to toggle staff status' });
  }
};

/**
 * Delete staff (Hard delete - use with caution)
 * Only use this for cleaning up test data or mistaken entries
 */
export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Check if staff has roster entries
    const rosterEntriesCount = await prisma.rosterEntry.count({
      where: { staffId: id },
    });

    if (rosterEntriesCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete staff with existing roster entries. Use toggle status instead.',
      });
    }

    await prisma.staff.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({ error: 'Failed to delete staff' });
  }
};
