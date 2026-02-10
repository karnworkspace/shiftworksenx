import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import { ensureProjectAccess } from '../utils/projectAccess';
import { isEditWindowOpen } from '../utils/rosterEditWindow';

/**
 * Get roster for a specific project and month
 */
export const getRoster = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, year, month } = req.query;

    if (!projectId || !year || !month) {
      return res.status(400).json({
        error: 'Project ID, year, and month are required',
      });
    }

    if (!(await ensureProjectAccess(req, projectId as string))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Find or create roster
    let roster = await prisma.roster.findUnique({
      where: {
        projectId_year_month: {
          projectId: projectId as string,
          year: yearNum,
          month: monthNum,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        entries: {
          include: {
            staff: true,
          },
          orderBy: [
            { day: 'asc' },
          ],
        },
      },
    });

    if (!roster) {
      // Create new roster if doesn't exist
      roster = await prisma.roster.create({
        data: {
          projectId: projectId as string,
          year: yearNum,
          month: monthNum,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          entries: {
            include: {
              staff: true,
            },
          },
        },
      });
    }

    // Get active staff for this project
    const activeStaff = await prisma.staff.findMany({
      where: {
        projectId: projectId as string,
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { staffType: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Build roster matrix (staff x days)
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const rosterMatrix: {
      [staffId: string]: {
        staff: any;
        days: { [day: number]: { shiftCode: string; notes?: string; entryId?: string } };
      };
    } = {};

    // Initialize matrix with active staff
    activeStaff.forEach((staff) => {
      rosterMatrix[staff.id] = {
        staff,
        days: {},
      };

      // Default each day to staff's defaultShift or OFF (respect weekly off day)
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(yearNum, monthNum - 1, day).getDay();
        const isWeeklyOff = staff.weeklyOffDay !== null && staff.weeklyOffDay !== undefined && dayOfWeek === staff.weeklyOffDay;
        rosterMatrix[staff.id].days[day] = {
          shiftCode: isWeeklyOff ? 'OFF' : (staff.defaultShift || 'OFF'),
        };
      }
    });

    // Override with actual roster entries
    roster.entries.forEach((entry) => {
      if (rosterMatrix[entry.staffId]) {
        rosterMatrix[entry.staffId].days[entry.day] = {
          shiftCode: entry.shiftCode,
          notes: entry.notes || undefined,
          entryId: entry.id,
        };
      }
    });

    return res.json({
      roster: {
        id: roster.id,
        projectId: roster.projectId,
        year: roster.year,
        month: roster.month,
        project: roster.project,
        daysInMonth,
        matrix: rosterMatrix,
      },
    });
  } catch (error) {
    console.error('Get roster error:', error);
    return res.status(500).json({ error: 'Failed to fetch roster' });
  }
};

/**
 * Update roster entry (set shift for a specific staff on a specific day)
 */
export const updateRosterEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { rosterId, staffId, day, shiftCode, notes } = req.body;

    if (!rosterId || !staffId || !day || !shiftCode) {
      return res.status(400).json({
        error: 'Roster ID, staff ID, day, and shift code are required',
      });
    }

    // Get valid shift codes from database
    const validShifts = await prisma.shiftType.findMany({
      select: { code: true },
    });
    const validShiftCodes = validShifts.map(s => s.code);

    if (!validShiftCodes.includes(shiftCode)) {
      return res.status(400).json({
        error: `Invalid shift code. Valid codes: ${validShiftCodes.join(', ')}`,
      });
    }

    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      return res.status(400).json({ error: 'Invalid day (must be 1-31)' });
    }

    // Check if roster exists
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        project: {
          select: {
            id: true,
            editCutoffDay: true,
            editCutoffNextMonth: true,
          },
        },
      },
    });

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'เฉพาะ Super Admin เท่านั้นที่แก้ไขได้' });
    }

    const cutoffDay = roster.project.editCutoffDay;
    const useNextMonth = roster.project.editCutoffNextMonth;
    if (!isEditWindowOpen(roster.year, roster.month, cutoffDay, useNextMonth)) {
      return res.status(403).json({ error: 'เกินกำหนดการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่' });
    }

    if (!(await ensureProjectAccess(req, roster.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    // Check if staff exists and is in the same project
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff || staff.projectId !== roster.projectId) {
      return res.status(404).json({ error: 'Staff not found or not in this project' });
    }

    // Upsert roster entry
    const entry = await prisma.rosterEntry.upsert({
      where: {
        rosterId_staffId_day: {
          rosterId,
          staffId,
          day: dayNum,
        },
      },
      update: {
        shiftCode,
        notes: notes || null,
      },
      create: {
        rosterId,
        staffId,
        day: dayNum,
        shiftCode,
        notes: notes || null,
      },
      include: {
        staff: true,
      },
    });

    return res.json({ entry });
  } catch (error) {
    console.error('Update roster entry error:', error);
    return res.status(500).json({ error: 'Failed to update roster entry' });
  }
};

/**
 * Batch update roster entries (for multiple days/staff at once)
 */
export const batchUpdateRosterEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { rosterId } = req.body;
    // Accept both 'entries' and 'updates' field names for compatibility
    const entries = req.body.entries || req.body.updates;

    if (!rosterId || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: 'Roster ID and entries array are required',
      });
    }

    // Check if roster exists
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        project: {
          select: {
            id: true,
            editCutoffDay: true,
            editCutoffNextMonth: true,
          },
        },
      },
    });

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'เฉพาะ Super Admin เท่านั้นที่แก้ไขได้' });
    }

    const cutoffDay = roster.project.editCutoffDay;
    const useNextMonth = roster.project.editCutoffNextMonth;
    if (!isEditWindowOpen(roster.year, roster.month, cutoffDay, useNextMonth)) {
      return res.status(403).json({ error: 'เกินกำหนดการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่' });
    }

    if (!(await ensureProjectAccess(req, roster.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    // Get valid shift codes from database
    const validShifts = await prisma.shiftType.findMany({
      select: { code: true },
    });
    const validShiftCodes = validShifts.map(s => s.code);

    // Validate all entries
    for (const entry of entries) {
      if (!entry.staffId || !entry.day || !entry.shiftCode) {
        return res.status(400).json({
          error: 'Each entry must have staffId, day, and shiftCode',
        });
      }

      if (!validShiftCodes.includes(entry.shiftCode)) {
        return res.status(400).json({
          error: `Invalid shift code: ${entry.shiftCode}. Valid codes: ${validShiftCodes.join(', ')}`,
        });
      }
    }

    // Batch update using transaction
    const updatedEntries = await prisma.$transaction(
      entries.map((entry) =>
        prisma.rosterEntry.upsert({
          where: {
            rosterId_staffId_day: {
              rosterId,
              staffId: entry.staffId,
              day: entry.day,
            },
          },
          update: {
            shiftCode: entry.shiftCode,
            notes: entry.notes || null,
          },
          create: {
            rosterId,
            staffId: entry.staffId,
            day: entry.day,
            shiftCode: entry.shiftCode,
            notes: entry.notes || null,
          },
        })
      )
    );

    return res.json({ entries: updatedEntries, count: updatedEntries.length });
  } catch (error) {
    console.error('Batch update roster entries error:', error);
    return res.status(500).json({ error: 'Failed to batch update roster entries' });
  }
};

/**
 * Import roster entries for a project/month (replace all entries)
 */
export const importRoster = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, year, month, entries } = req.body;

    if (!projectId || !year || !month || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'projectId, year, month, and entries are required' });
    }

    const yearNum = parseInt(String(year), 10);
    const monthNum = parseInt(String(month), 10);
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'เฉพาะ Super Admin เท่านั้นที่แก้ไขได้' });
    }

    if (!(await ensureProjectAccess(req, projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, editCutoffDay: true, editCutoffNextMonth: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const cutoffDay = project.editCutoffDay;
    const useNextMonth = project.editCutoffNextMonth;
    if (!isEditWindowOpen(yearNum, monthNum, cutoffDay, useNextMonth)) {
      return res.status(403).json({ error: 'เกินกำหนดการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่' });
    }

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    if (entries.length === 0) {
      return res.status(400).json({ error: 'entries must not be empty' });
    }

    const validShiftCodes = new Set(
      (await prisma.shiftType.findMany({ select: { code: true } })).map((s) => s.code)
    );

    const staffIds = Array.from(
      new Set(entries.map((entry: any) => String(entry.staffId)))
    );
    const staffRecords = await prisma.staff.findMany({
      where: { id: { in: staffIds }, projectId },
      select: { id: true },
    });
    if (staffRecords.length !== staffIds.length) {
      return res.status(400).json({ error: 'Some staff do not belong to this project' });
    }

    const entryKeySet = new Set<string>();
    for (const entry of entries) {
      const staffId = String(entry.staffId || '');
      const dayNum = parseInt(String(entry.day), 10);
      const shiftCode = String(entry.shiftCode || '').trim();

      if (!staffId || !shiftCode || isNaN(dayNum)) {
        return res.status(400).json({ error: 'Each entry must have staffId, day, and shiftCode' });
      }
      if (dayNum < 1 || dayNum > daysInMonth) {
        return res.status(400).json({ error: `Invalid day ${dayNum}` });
      }
      if (!validShiftCodes.has(shiftCode)) {
        return res.status(400).json({ error: `Invalid shift code: ${shiftCode}` });
      }
      const key = `${staffId}-${dayNum}`;
      if (entryKeySet.has(key)) {
        return res.status(400).json({ error: `Duplicate entry for staff ${staffId} day ${dayNum}` });
      }
      entryKeySet.add(key);
    }

    let roster = await prisma.roster.findUnique({
      where: {
        projectId_year_month: {
          projectId,
          year: yearNum,
          month: monthNum,
        },
      },
      select: { id: true },
    });

    if (!roster) {
      roster = await prisma.roster.create({
        data: { projectId, year: yearNum, month: monthNum },
        select: { id: true },
      });
    }

    await prisma.$transaction([
      prisma.rosterEntry.deleteMany({ where: { rosterId: roster.id } }),
      prisma.rosterEntry.createMany({
        data: entries.map((entry: any) => ({
          rosterId: roster!.id,
          staffId: String(entry.staffId),
          day: parseInt(String(entry.day), 10),
          shiftCode: String(entry.shiftCode).trim(),
          notes: entry.notes ? String(entry.notes) : null,
        })),
      }),
    ]);

    return res.json({ success: true, rosterId: roster.id, count: entries.length });
  } catch (error) {
    console.error('Import roster error:', error);
    return res.status(500).json({ error: 'Failed to import roster' });
  }
};

/**
 * Get roster statistics for a specific day
 */
export const getRosterDayStats = async (req: AuthRequest, res: Response) => {
  try {
    const { rosterId, day } = req.query;

    if (!rosterId || !day) {
      return res.status(400).json({ error: 'Roster ID and day are required' });
    }

    const roster = await prisma.roster.findUnique({
      where: { id: rosterId as string },
      select: { id: true, projectId: true },
    });

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    if (!(await ensureProjectAccess(req, roster.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    const dayNum = parseInt(day as string);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      return res.status(400).json({ error: 'Invalid day' });
    }

    const entries = await prisma.rosterEntry.findMany({
      where: {
        rosterId: roster.id,
        day: dayNum,
      },
      include: {
        staff: true,
      },
    });

    // Get all shift types
    const shiftTypes = await prisma.shiftType.findMany();
    const workShiftCodes = shiftTypes.filter(s => s.isWorkShift).map(s => s.code);
    const absentShift = shiftTypes.find(s => s.code === 'ขาด' || s.code === 'ข');
    const absentCode = absentShift?.code || 'ขาด';
    const sickLeaveShift = shiftTypes.find(s => s.code === 'ป่วย' || s.code === 'ป');
    const sickCode = sickLeaveShift?.code || 'ป';
    const personalLeaveShift = shiftTypes.find(s => s.code === 'กิจ' || s.code === 'ก');
    const personalCode = personalLeaveShift?.code || 'ก';
    const vacationShift = shiftTypes.find(s => s.code === 'ลา' || s.code === 'พ');
    const vacationCode = vacationShift?.code || 'พ';

    // Calculate statistics
    const stats = {
      day: dayNum,
      total: entries.length,
      working: 0,
      off: 0,
      absent: 0,
      sickLeave: 0,
      personalLeave: 0,
      vacation: 0,
      byShift: {} as { [key: string]: number },
    };

    entries.forEach((entry) => {
      const shift = entry.shiftCode;

      // Count by category
      if (workShiftCodes.includes(shift)) {
        stats.working++;
      } else if (shift === 'OFF') {
        stats.off++;
      } else if (shift === absentCode) {
        stats.absent++;
      } else if (shift === sickCode) {
        stats.sickLeave++;
      } else if (shift === personalCode) {
        stats.personalLeave++;
      } else if (shift === vacationCode) {
        stats.vacation++;
      }

      // Count by shift code
      stats.byShift[shift] = (stats.byShift[shift] || 0) + 1;
    });

    return res.json({ stats });
  } catch (error) {
    console.error('Get roster day stats error:', error);
    return res.status(500).json({ error: 'Failed to get roster statistics' });
  }
};

/**
 * Delete roster entry
 */
export const deleteRosterEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await prisma.rosterEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Roster entry not found' });
    }

    const roster = await prisma.roster.findUnique({
      where: { id: entry.rosterId },
      include: {
        project: {
          select: {
            id: true,
            editCutoffDay: true,
            editCutoffNextMonth: true,
          },
        },
      },
    });

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'เฉพาะ Super Admin เท่านั้นที่แก้ไขได้' });
    }

    const cutoffDay = roster.project.editCutoffDay;
    const useNextMonth = roster.project.editCutoffNextMonth;
    if (!isEditWindowOpen(roster.year, roster.month, cutoffDay, useNextMonth)) {
      return res.status(403).json({ error: 'เกินกำหนดการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่' });
    }

    if (!(await ensureProjectAccess(req, roster.projectId))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    await prisma.rosterEntry.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Roster entry deleted successfully' });
  } catch (error) {
    console.error('Delete roster entry error:', error);
    return res.status(500).json({ error: 'Failed to delete roster entry' });
  }
};
