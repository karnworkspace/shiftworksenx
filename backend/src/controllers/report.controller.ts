import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import { decimalToNumber } from '../utils/decimal';
import { ensureProjectAccess, getAccessibleProjectIds, isSuperAdmin } from '../utils/projectAccess';

/**
 * Calculate monthly attendance and deductions for a staff
 */
async function calculateMonthlyAttendance(
  staffId: string,
  rosterId: string,
  year: number,
  month: number
) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
  });

  if (!staff) {
    throw new Error('Staff not found');
  }

  const wagePerDay = decimalToNumber(staff.wagePerDay);

  const entries = await prisma.rosterEntry.findMany({
    where: {
      rosterId,
      staffId,
    },
  });

  // Get all shift types to determine work shifts
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

  // Count different types
  let totalWorkDays = 0;
  let totalAbsent = 0;
  let totalSickLeave = 0;
  let totalPersonalLeave = 0;
  let totalVacation = 0;

  entries.forEach((entry) => {
    const shift = entry.shiftCode;
    if (workShiftCodes.includes(shift)) {
      totalWorkDays++;
    } else if (shift === absentCode) {
      totalAbsent++;
    } else if (shift === sickCode) {
      totalSickLeave++;
    } else if (shift === personalCode) {
      totalPersonalLeave++;
    } else if (shift === vacationCode) {
      totalVacation++;
    }
  });

  console.log(`[Staff ${staff.name}] Attendance: workDays=${totalWorkDays}, absent=${totalAbsent}(code: ${absentCode}), sick=${totalSickLeave}, personal=${totalPersonalLeave}, vacation=${totalVacation}`);

  // Calculate deduction (absent days * wage per day) - for display only
  const deductionAmount = totalAbsent * wagePerDay;

  // Calculate expected salary (only actual work days)
  const expectedSalary = totalWorkDays * wagePerDay;

  // Net salary = expected salary (deduction is already reflected by
  // absent days not being counted in totalWorkDays)
  const netSalary = expectedSalary;

  return {
    staffId,
    staffName: staff.name,
    position: staff.position,
    wagePerDay,
    totalWorkDays,
    totalAbsent,
    totalSickLeave,
    totalPersonalLeave,
    totalVacation,
    totalLate: 0, // TODO: Implement late tracking
    deductionAmount,
    expectedSalary,
    netSalary,
  };
}

/**
 * Get monthly deduction report for a project
 */
export const getMonthlyDeductionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, year, month } = req.query;

    if (!projectId || !year || !month) {
      return res.status(400).json({
        error: 'Project ID, year, and month are required',
      });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    if (!(await ensureProjectAccess(req, projectId as string))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    // Get roster
    const roster = await prisma.roster.findUnique({
      where: {
        projectId_year_month: {
          projectId: projectId as string,
          year: yearNum,
          month: monthNum,
        },
      },
      include: {
        project: true,
      },
    });

    if (!roster) {
      return res.status(404).json({
        error: 'Roster not found for this period',
      });
    }

    // Get all staff for this project (include inactive to show historical data)
    const staff = await prisma.staff.findMany({
      where: {
        projectId: projectId as string,
      },
    });

    // Calculate attendance for each staff
    const attendanceReports = await Promise.all(
      staff.map((s) => calculateMonthlyAttendance(s.id, roster.id, yearNum, monthNum))
    );

    // Calculate totals
    const totals = attendanceReports.reduce(
      (acc, report) => ({
        totalWorkDays: acc.totalWorkDays + report.totalWorkDays,
        totalAbsent: acc.totalAbsent + report.totalAbsent,
        totalSickLeave: acc.totalSickLeave + report.totalSickLeave,
        totalPersonalLeave: acc.totalPersonalLeave + report.totalPersonalLeave,
        totalVacation: acc.totalVacation + report.totalVacation,
        totalDeduction: acc.totalDeduction + report.deductionAmount,
        totalExpectedSalary: acc.totalExpectedSalary + report.expectedSalary,
        totalNetSalary: acc.totalNetSalary + report.netSalary,
      }),
      {
        totalWorkDays: 0,
        totalAbsent: 0,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        totalDeduction: 0,
        totalExpectedSalary: 0,
        totalNetSalary: 0,
      }
    );

    return res.json({
      report: {
        projectId: roster.projectId,
        projectName: roster.project.name,
        year: yearNum,
        month: monthNum,
        staff: attendanceReports,
        totals,
      },
    });
  } catch (error) {
    console.error('Get monthly deduction report error:', error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Get financial overview for admin (all projects summary)
 */
export const getFinancialOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const isAdmin = isSuperAdmin(req);
    const allowedIds = !isAdmin && req.user ? await getAccessibleProjectIds(req.user.userId) : undefined;

    // Get all projects
    const projects = await prisma.project.findMany({
      where: {
        isActive: true,
        ...(allowedIds ? { id: { in: allowedIds } } : {}),
      },
    });

    const projectSummaries: { projectId: string; projectName: string; staffCount: number; totalCost: number }[] = [];

    for (const project of projects) {
      const roster = await prisma.roster.findUnique({
        where: {
          projectId_year_month: {
            projectId: project.id,
            year: yearNum,
            month: monthNum,
          },
        },
      });

      let totalCost = 0;
      let staffCount = 0;

      if (roster) {
        const staff = await prisma.staff.findMany({
          where: {
            projectId: project.id,
            isActive: true,
          },
        });

        staffCount = staff.length;

        for (const s of staff) {
          const attendance = await calculateMonthlyAttendance(
            s.id,
            roster.id,
            yearNum,
            monthNum
          );
          totalCost += attendance.netSalary;
        }
      }

      projectSummaries.push({
        projectId: project.id,
        projectName: project.name,
        staffCount,
        totalCost,
      });
    }

    // Calculate grand total
    const grandTotal = projectSummaries.reduce((sum, p) => sum + p.totalCost, 0);

    return res.json({
      overview: {
        year: yearNum,
        month: monthNum,
        projects: projectSummaries,
        grandTotal,
        projectCount: projects.length,
      },
    });
  } catch (error) {
    console.error('Get financial overview error:', error);
    return res.status(500).json({ error: 'Failed to generate financial overview' });
  }
};

/**
 * Export report to CSV format
 * Returns CSV string that can be downloaded
 */
export const exportReportCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, year, month } = req.query;

    if (!projectId || !year || !month) {
      return res.status(400).json({
        error: 'Project ID, year, and month are required',
      });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (!(await ensureProjectAccess(req, projectId as string))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงโครงการนี้' });
    }

    // Get the report data
    const roster = await prisma.roster.findUnique({
      where: {
        projectId_year_month: {
          projectId: projectId as string,
          year: yearNum,
          month: monthNum,
        },
      },
      include: {
        project: true,
      },
    });

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found' });
    }

    const staff = await prisma.staff.findMany({
      where: { projectId: projectId as string },
    });

    const attendanceReports = await Promise.all(
      staff.map((s) => calculateMonthlyAttendance(s.id, roster.id, yearNum, monthNum))
    );

    // Build CSV
    const headers = [
      'ชื่อพนักงาน',
      'ตำแหน่ง',
      'ค่าแรง/วัน',
      'วันทำงาน',
      'ขาด',
      'ลาป่วย',
      'ลากิจ',
      'พักร้อน',
      'เงินเดือนคาดหวัง',
      'หักเงิน',
      'เงินเดือนสุทธิ',
    ];

    const rows = attendanceReports.map((report) => [
      report.staffName,
      report.position,
      report.wagePerDay.toString(),
      report.totalWorkDays.toString(),
      report.totalAbsent.toString(),
      report.totalSickLeave.toString(),
      report.totalPersonalLeave.toString(),
      report.totalVacation.toString(),
      report.expectedSalary.toFixed(2),
      report.deductionAmount.toFixed(2),
      report.netSalary.toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${projectId}_${year}_${month}.csv"`
    );

    // Add BOM for Excel UTF-8 support
    return res.send('\uFEFF' + csvContent);
  } catch (error) {
    console.error('Export report CSV error:', error);
    return res.status(500).json({ error: 'Failed to export report' });
  }
};
