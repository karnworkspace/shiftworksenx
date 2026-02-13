import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { StaffType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { decimalToNumber } from '../utils/decimal';
import { ensureProjectAccess, isSuperAdmin } from '../utils/projectAccess';

const getDefaultShiftForDay = (
  year: number,
  month: number,
  day: number,
  defaultShift: string,
  weeklyOffDay?: number | null
) => {
  if (weeklyOffDay !== null && weeklyOffDay !== undefined) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek === weeklyOffDay) {
      return 'OFF';
    }
  }
  return defaultShift || 'OFF';
};

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

    if (!(await ensureProjectAccess(req, projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
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
        { displayOrder: 'asc' },
        { isActive: 'desc' }, // Active staff first
        { staffType: 'asc' }, // Regular before Spare
        { createdAt: 'asc' },
      ],
    });

    const staffWithNumbers = staff.map((s) => ({
      ...s,
      wagePerDay: decimalToNumber(s.wagePerDay),
    }));

    return res.json({ staff: staffWithNumbers });
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

    if (!(await ensureProjectAccess(req, staff.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    return res.json({
      staff: {
        ...staff,
        wagePerDay: decimalToNumber(staff.wagePerDay),
      },
    });
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
      code,
      name,
      position,
      positionId,
      phone,
      wagePerDay,
      staffType,
      defaultShift,
      projectId,
      remark,
      displayOrder,
    } = req.body;

    const wagePerDayNumRaw = wagePerDay !== undefined && wagePerDay !== null ? Number(wagePerDay) : undefined;

    // Validation
    if (!name || !projectId) {
      return res.status(400).json({
        error: 'Name, position, wage per day, and project ID are required',
      });
    }

    if (!(await ensureProjectAccess(req, projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    let resolvedPosition = position as string | undefined;
    let resolvedPositionId = positionId as string | undefined;
    let resolvedWage = wagePerDayNumRaw;
    let wageOverride = true;

    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId },
      });
      if (!positionRecord) {
        return res.status(400).json({ error: 'Position not found' });
      }
      resolvedPosition = positionRecord.name;
      resolvedPositionId = positionRecord.id;
      const defaultWage = decimalToNumber(positionRecord.defaultWage);
      if (resolvedWage === undefined || !Number.isFinite(resolvedWage)) {
        resolvedWage = defaultWage;
        wageOverride = false;
      } else {
        wageOverride = resolvedWage !== defaultWage;
      }
    }

    if (!resolvedPosition) {
      return res.status(400).json({ error: 'Position is required' });
    }

    if (resolvedWage === undefined || !Number.isFinite(resolvedWage)) {
      return res.status(400).json({ error: 'Wage per day is required' });
    }

    if (!Number.isFinite(resolvedWage) || resolvedWage <= 0) {
      return res.status(400).json({ error: 'Wage per day must be positive' });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const normalizedCode = typeof code === 'string' ? code.trim() : undefined;

    const maxOrder = await prisma.staff.aggregate({
      where: { projectId },
      _max: { displayOrder: true },
    });
    const staffCount = await prisma.staff.count({ where: { projectId } });
    const baseOrder = Number.isFinite(maxOrder._max.displayOrder)
      ? (maxOrder._max.displayOrder as number)
      : staffCount;
    const nextDisplayOrder = baseOrder + 1;

    const staff = await prisma.staff.create({
      data: {
        ...(normalizedCode ? { code: normalizedCode } : {}),
        name,
        position: resolvedPosition,
        positionId: resolvedPositionId,
        phone,
        wagePerDay: resolvedWage,
        staffType: staffType || StaffType.REGULAR,
        defaultShift: defaultShift || 'OFF',
        displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : nextDisplayOrder,
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

    return res.status(201).json({
      staff: {
        ...staff,
        wagePerDay: decimalToNumber(staff.wagePerDay),
      },
    });
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
      code,
      name,
      position,
      positionId,
      phone,
      wagePerDay,
      staffType,
      defaultShift,
      isActive,
      remark,
      displayOrder,
    } = req.body;

    const parsedDisplayOrder = displayOrder !== undefined ? Number(displayOrder) : undefined;
    if (parsedDisplayOrder !== undefined && !Number.isFinite(parsedDisplayOrder)) {
      return res.status(400).json({ error: 'displayOrder must be a number' });
    }

    const wagePerDayNumRaw = wagePerDay !== undefined ? Number(wagePerDay) : undefined;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (!(await ensureProjectAccess(req, existingStaff.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    // Validation
    let resolvedPosition = position as string | undefined;
    let resolvedPositionId = positionId as string | undefined;
    let resolvedWage = wagePerDayNumRaw;
    let wageOverride: boolean | undefined = undefined;

    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId },
      });
      if (!positionRecord) {
        return res.status(400).json({ error: 'Position not found' });
      }
      resolvedPosition = positionRecord.name;
      resolvedPositionId = positionRecord.id;
      const defaultWage = decimalToNumber(positionRecord.defaultWage);
      if (resolvedWage === undefined || !Number.isFinite(resolvedWage)) {
        resolvedWage = defaultWage;
        wageOverride = false;
      } else {
        wageOverride = resolvedWage !== defaultWage;
      }
    }

    if (!positionId && resolvedWage !== undefined) {
      wageOverride = true;
    }

    if (resolvedWage !== undefined && (!Number.isFinite(resolvedWage) || resolvedWage <= 0)) {
      return res.status(400).json({ error: 'Wage per day must be positive' });
    }

    const normalizedCode = typeof code === 'string' ? code.trim() : undefined;

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(normalizedCode ? { code: normalizedCode } : {}),
        ...(name !== undefined && { name }),
        ...(resolvedPosition !== undefined && { position: resolvedPosition }),
        ...(resolvedPositionId !== undefined && { positionId: resolvedPositionId }),
        ...(phone !== undefined && { phone }),
        ...(resolvedWage !== undefined && { wagePerDay: resolvedWage }),
        ...(staffType !== undefined && { staffType }),
        ...(defaultShift !== undefined && { defaultShift }),
        ...(parsedDisplayOrder !== undefined && { displayOrder: parsedDisplayOrder }),
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

    return res.json({
      staff: {
        ...staff,
        wagePerDay: decimalToNumber(staff.wagePerDay),
      },
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return res.status(500).json({ error: 'Failed to update staff' });
  }
};

/**
 * Apply default shift for staff (current month and future only)
 * - Updates staff.defaultShift
 * - Freezes past months by filling missing entries with the old default
 */
export const applyStaffDefaultShift = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { defaultShift } = req.body;

    if (!defaultShift || typeof defaultShift !== 'string') {
      return res.status(400).json({ error: 'defaultShift is required' });
    }

    const shiftType = await prisma.shiftType.findUnique({
      where: { code: defaultShift },
    });

    if (!shiftType) {
      return res.status(400).json({ error: 'Invalid shift code' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (!(await ensureProjectAccess(req, staff.projectId))) {
      return res.status(403).json({ error: 'เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธเนเธเธฃเธเธเธฒเธฃเธเธตเน' });
    }


    const oldDefault = staff.defaultShift || 'OFF';
    const newDefault = defaultShift;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Freeze past months by materializing missing entries with old default
    if (oldDefault !== newDefault) {
      const pastRosters = await prisma.roster.findMany({
        where: {
          projectId: staff.projectId,
          OR: [
            { year: { lt: currentYear } },
            { year: currentYear, month: { lt: currentMonth } },
          ],
        },
        select: { id: true, year: true, month: true },
      });

      for (const roster of pastRosters) {
        const daysInMonth = new Date(roster.year, roster.month, 0).getDate();
        const existingEntries = await prisma.rosterEntry.findMany({
          where: {
            rosterId: roster.id,
            staffId: staff.id,
          },
          select: { day: true },
        });
        const existingDays = new Set(existingEntries.map((entry) => entry.day));
        const createData = [];

        for (let day = 1; day <= daysInMonth; day++) {
          if (!existingDays.has(day)) {
            createData.push({
              rosterId: roster.id,
              staffId: staff.id,
              day,
              shiftCode: getDefaultShiftForDay(
                roster.year,
                roster.month,
                day,
                oldDefault,
                staff.weeklyOffDay ?? null
              ),
            });
          }
        }

        if (createData.length > 0) {
          await prisma.rosterEntry.createMany({ data: createData });
        }
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: { defaultShift: newDefault },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({
      staff: {
        ...updatedStaff,
        wagePerDay: decimalToNumber(updatedStaff.wagePerDay),
      },
    });
  } catch (error) {
    console.error('Apply staff default shift error:', error);
    return res.status(500).json({ error: 'Failed to apply staff default shift' });
  }
};

/**
 * Reorder staff display order within a project
 */
export const reorderStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, orderedStaffIds } = req.body;

    if (!projectId || !Array.isArray(orderedStaffIds) || orderedStaffIds.length === 0) {
      return res.status(400).json({ error: 'projectId and orderedStaffIds are required' });
    }

    if (!(await ensureProjectAccess(req, projectId))) {
      return res.status(403).json({ error: 'เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธเนเธเธฃเธเธเธฒเธฃเธเธตเน' });
    }

    const uniqueIds = new Set(orderedStaffIds);
    if (uniqueIds.size !== orderedStaffIds.length) {
      return res.status(400).json({ error: 'orderedStaffIds must be unique' });
    }

    const totalCount = await prisma.staff.count({ where: { projectId } });
    if (orderedStaffIds.length !== totalCount) {
      return res.status(400).json({ error: 'orderedStaffIds must include all staff in project' });
    }

    const staffRecords = await prisma.staff.findMany({
      where: { id: { in: orderedStaffIds }, projectId },
      select: { id: true },
    });
    if (staffRecords.length !== orderedStaffIds.length) {
      return res.status(400).json({ error: 'Some staff do not belong to this project' });
    }

    await prisma.$transaction(
      orderedStaffIds.map((id: string, index: number) =>
        prisma.staff.update({
          where: { id },
          data: { displayOrder: index + 1 },
        })
      )
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Reorder staff error:', error);
    return res.status(500).json({ error: 'Failed to reorder staff' });
  }
};

/**
 * Apply weekly off day for staff (current month and future only)
 * - Updates staff.weeklyOffDay
 * - Freezes past months by filling missing entries with old weekly off day rule
 */
export const applyStaffWeeklyOffDay = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const hasWeeklyOffDay = Object.prototype.hasOwnProperty.call(req.body, 'weeklyOffDay');
    if (!hasWeeklyOffDay) {
      return res.status(400).json({ error: 'weeklyOffDay is required' });
    }

    const weeklyOffDay = req.body.weeklyOffDay;
    if (weeklyOffDay !== null) {
      const parsed = Number(weeklyOffDay);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
        return res.status(400).json({ error: 'weeklyOffDay must be 0-6 or null' });
      }
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (!(await ensureProjectAccess(req, staff.projectId))) {
      return res.status(403).json({ error: 'เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธเนเธเธฃเธเธเธฒเธฃเธเธตเน' });
    }


    const oldWeeklyOffDay = staff.weeklyOffDay ?? null;
    const newWeeklyOffDay = weeklyOffDay === null ? null : Number(weeklyOffDay);
    const oldDefault = staff.defaultShift || 'OFF';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (oldWeeklyOffDay !== newWeeklyOffDay) {
      const pastRosters = await prisma.roster.findMany({
        where: {
          projectId: staff.projectId,
          OR: [
            { year: { lt: currentYear } },
            { year: currentYear, month: { lt: currentMonth } },
          ],
        },
        select: { id: true, year: true, month: true },
      });

      for (const roster of pastRosters) {
        const daysInMonth = new Date(roster.year, roster.month, 0).getDate();
        const existingEntries = await prisma.rosterEntry.findMany({
          where: {
            rosterId: roster.id,
            staffId: staff.id,
          },
          select: { day: true },
        });
        const existingDays = new Set(existingEntries.map((entry) => entry.day));
        const createData = [];

        for (let day = 1; day <= daysInMonth; day++) {
          if (!existingDays.has(day)) {
            createData.push({
              rosterId: roster.id,
              staffId: staff.id,
              day,
              shiftCode: getDefaultShiftForDay(
                roster.year,
                roster.month,
                day,
                oldDefault,
                oldWeeklyOffDay
              ),
            });
          }
        }

        if (createData.length > 0) {
          await prisma.rosterEntry.createMany({ data: createData });
        }
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: { weeklyOffDay: newWeeklyOffDay },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({
      staff: {
        ...updatedStaff,
        wagePerDay: decimalToNumber(updatedStaff.wagePerDay),
      },
    });
  } catch (error) {
    console.error('Apply staff weekly off day error:', error);
    return res.status(500).json({ error: 'Failed to apply staff weekly off day' });
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

    if (!(await ensureProjectAccess(req, staff.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
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

    if (!(await ensureProjectAccess(req, staff.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
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
