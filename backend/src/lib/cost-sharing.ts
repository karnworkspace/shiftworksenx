import { prisma } from './prisma';
import { decimalToNumber } from '../utils/decimal';

export interface CostSharingCalculation {
  projectId: string;
  projectName: string;
  originalCost: number;
  sharedOut: number; // ค่าใช้จ่ายที่แชร์ออกไป
  sharedIn: number;  // ค่าใช้จ่ายที่ได้รับจากการแชร์
  netCost: number;   // ต้นทุนสุทธิ = originalCost - sharedOut + sharedIn
}

/**
 * คำนวณค่าใช้จ่ายของโครงการพร้อม Cost Sharing
 * @param projectId - ID ของโครงการ
 * @param year - ปี พ.ศ.
 * @param month - เดือน (1-12)
 * @param originalCost - ต้นทุนเดิมของโครงการ
 */
export async function calculateCostSharing(
  projectId: string,
  year: number,
  month: number,
  originalCost: number
): Promise<CostSharingCalculation> {
  // ดึงโครงการ
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      costSharingFrom: {
        include: {
          destinationProject: true,
        },
      },
      costSharingTo: {
        include: {
          sourceProject: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // คำนวณค่าใช้จ่ายที่แชร์ออกไป
  let sharedOut = 0;
  for (const sharing of project.costSharingFrom) {
    const percentage = decimalToNumber(sharing.percentage);
    sharedOut += originalCost * (percentage / 100);
  }

  // คำนวณค่าใช้จ่ายที่ได้รับจากการแชร์
  let sharedIn = 0;
  for (const sharing of project.costSharingTo) {
    // ดึงต้นทุนของโครงการต้นทาง
    const sourceCost = await getProjectOriginalCost(
      sharing.sourceProjectId,
      year,
      month
    );
    const percentage = decimalToNumber(sharing.percentage);
    sharedIn += sourceCost * (percentage / 100);
  }

  // ต้นทุนสุทธิ
  const netCost = originalCost - sharedOut + sharedIn;

  return {
    projectId,
    projectName: project.name,
    originalCost,
    sharedOut,
    sharedIn,
    netCost,
  };
}

/**
 * ดึงต้นทุนเดิมของโครงการ (ก่อนการแชร์)
 */
async function getProjectOriginalCost(
  projectId: string,
  year: number,
  month: number
): Promise<number> {
  // ดึง Roster ของเดือนนั้น
  const roster = await prisma.roster.findUnique({
    where: {
      projectId_year_month: {
        projectId,
        year,
        month,
      },
    },
    include: {
      entries: {
        include: {
          staff: true,
        },
      },
    },
  });

  if (!roster) return 0;

  // คำนวณยอดรวมค่าแรง
  let totalCost = 0;
  const staffCostMap = new Map<string, number>();

  for (const entry of roster.entries) {
    const { staffId, shiftCode } = entry;
    const wagePerDay = decimalToNumber(entry.staff.wagePerDay);

    // นับเฉพาะกะที่เป็นการทำงาน (ไม่นับ OFF, ขาด, ลา)
    const workingShifts = ['1', '2', '3', 'ดึก'];
    if (workingShifts.includes(shiftCode)) {
      if (!staffCostMap.has(staffId)) {
        staffCostMap.set(staffId, 0);
      }
      staffCostMap.set(staffId, staffCostMap.get(staffId)! + wagePerDay);
    }
  }

  // รวมค่าแรงทั้งหมด
  for (const cost of staffCostMap.values()) {
    totalCost += cost;
  }

  return totalCost;
}

/**
 * คำนวณภาพรวมทุกโครงการ พร้อม Cost Sharing
 */
export async function calculateAllProjectsCost(
  year: number,
  month: number
): Promise<CostSharingCalculation[]> {
  const projects = await prisma.project.findMany({
    where: { isActive: true },
  });

  const results: CostSharingCalculation[] = [];

  for (const project of projects) {
    const originalCost = await getProjectOriginalCost(project.id, year, month);
    const calculation = await calculateCostSharing(
      project.id,
      year,
      month,
      originalCost
    );
    results.push(calculation);
  }

  return results;
}

/**
 * ตรวจสอบ Circular Dependency ในการแชร์ค่าใช้จ่าย
 * @returns true ถ้ามี circular dependency
 */
export async function checkCircularDependency(
  sourceId: string,
  destinationId: string
): Promise<boolean> {
  // ตรวจสอบว่า destination แชร์กลับมา source หรือไม่
  const existingSharing = await prisma.costSharing.findUnique({
    where: {
      sourceProjectId_destinationProjectId: {
        sourceProjectId: destinationId,
        destinationProjectId: sourceId,
      },
    },
  });

  return !!existingSharing;
}
