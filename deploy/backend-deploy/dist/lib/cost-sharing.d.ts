export interface CostSharingCalculation {
    projectId: string;
    projectName: string;
    originalCost: number;
    sharedOut: number;
    sharedIn: number;
    netCost: number;
}
/**
 * คำนวณค่าใช้จ่ายของโครงการพร้อม Cost Sharing
 * @param projectId - ID ของโครงการ
 * @param year - ปี พ.ศ.
 * @param month - เดือน (1-12)
 * @param originalCost - ต้นทุนเดิมของโครงการ
 */
export declare function calculateCostSharing(projectId: string, year: number, month: number, originalCost: number): Promise<CostSharingCalculation>;
/**
 * คำนวณภาพรวมทุกโครงการ พร้อม Cost Sharing
 */
export declare function calculateAllProjectsCost(year: number, month: number): Promise<CostSharingCalculation[]>;
/**
 * ตรวจสอบ Circular Dependency ในการแชร์ค่าใช้จ่าย
 * @returns true ถ้ามี circular dependency
 */
export declare function checkCircularDependency(sourceId: string, destinationId: string): Promise<boolean>;
//# sourceMappingURL=cost-sharing.d.ts.map