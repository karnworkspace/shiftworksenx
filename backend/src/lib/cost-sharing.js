"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCostSharing = calculateCostSharing;
exports.calculateAllProjectsCost = calculateAllProjectsCost;
exports.checkCircularDependency = checkCircularDependency;
const prisma_1 = require("./prisma");
/**
 * คำนวณค่าใช้จ่ายของโครงการพร้อม Cost Sharing
 * @param projectId - ID ของโครงการ
 * @param year - ปี พ.ศ.
 * @param month - เดือน (1-12)
 * @param originalCost - ต้นทุนเดิมของโครงการ
 */
async function calculateCostSharing(projectId, year, month, originalCost) {
    // ดึงโครงการ
    const project = await prisma_1.prisma.project.findUnique({
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
        sharedOut += originalCost * (sharing.percentage / 100);
    }
    // คำนวณค่าใช้จ่ายที่ได้รับจากการแชร์
    let sharedIn = 0;
    for (const sharing of project.costSharingTo) {
        // ดึงต้นทุนของโครงการต้นทาง
        const sourceCost = await getProjectOriginalCost(sharing.sourceProjectId, year, month);
        sharedIn += sourceCost * (sharing.percentage / 100);
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
async function getProjectOriginalCost(projectId, year, month) {
    // ดึง Roster ของเดือนนั้น
    const roster = await prisma_1.prisma.roster.findUnique({
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
    if (!roster)
        return 0;
    // คำนวณยอดรวมค่าแรง
    let totalCost = 0;
    const staffCostMap = new Map();
    for (const entry of roster.entries) {
        const { staffId, shiftCode } = entry;
        const { wagePerDay } = entry.staff;
        // นับเฉพาะกะที่เป็นการทำงาน (ไม่นับ OFF, ขาด, ลา)
        const workingShifts = ['1', '2', '3', 'ดึก'];
        if (workingShifts.includes(shiftCode)) {
            if (!staffCostMap.has(staffId)) {
                staffCostMap.set(staffId, 0);
            }
            staffCostMap.set(staffId, staffCostMap.get(staffId) + wagePerDay);
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
async function calculateAllProjectsCost(year, month) {
    const projects = await prisma_1.prisma.project.findMany({
        where: { isActive: true },
    });
    const results = [];
    for (const project of projects) {
        const originalCost = await getProjectOriginalCost(project.id, year, month);
        const calculation = await calculateCostSharing(project.id, year, month, originalCost);
        results.push(calculation);
    }
    return results;
}
/**
 * ตรวจสอบ Circular Dependency ในการแชร์ค่าใช้จ่าย
 * @returns true ถ้ามี circular dependency
 */
async function checkCircularDependency(sourceId, destinationId) {
    // ตรวจสอบว่า destination แชร์กลับมา source หรือไม่
    const existingSharing = await prisma_1.prisma.costSharing.findUnique({
        where: {
            sourceProjectId_destinationProjectId: {
                sourceProjectId: destinationId,
                destinationProjectId: sourceId,
            },
        },
    });
    return !!existingSharing;
}
//# sourceMappingURL=cost-sharing.js.map