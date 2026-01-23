"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaff = exports.toggleStaffStatus = exports.updateStaff = exports.createStaff = exports.getStaffById = exports.getAllStaff = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const decimal_1 = require("../utils/decimal");
/**
 * Get all staff for a project
 * Query params:
 * - projectId: required
 * - includeInactive: optional (default: false)
 */
const getAllStaff = async (req, res) => {
    try {
        const { projectId } = req.query;
        const includeInactive = req.query.includeInactive === 'true';
        if (!projectId || typeof projectId !== 'string') {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        const staff = await prisma_1.prisma.staff.findMany({
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
        const staffWithNumbers = staff.map((s) => ({
            ...s,
            wagePerDay: (0, decimal_1.decimalToNumber)(s.wagePerDay),
        }));
        return res.json({ staff: staffWithNumbers });
    }
    catch (error) {
        console.error('Get staff error:', error);
        return res.status(500).json({ error: 'Failed to fetch staff' });
    }
};
exports.getAllStaff = getAllStaff;
/**
 * Get staff by ID
 */
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await prisma_1.prisma.staff.findUnique({
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
        return res.json({
            staff: {
                ...staff,
                wagePerDay: (0, decimal_1.decimalToNumber)(staff.wagePerDay),
            },
        });
    }
    catch (error) {
        console.error('Get staff by ID error:', error);
        return res.status(500).json({ error: 'Failed to fetch staff' });
    }
};
exports.getStaffById = getStaffById;
/**
 * Create new staff
 */
const createStaff = async (req, res) => {
    try {
        const { name, position, phone, wagePerDay, staffType, defaultShift, projectId, remark, } = req.body;
        const wagePerDayNum = Number(wagePerDay);
        // Validation
        if (!name || !position || wagePerDay === undefined || wagePerDay === null || !projectId) {
            return res.status(400).json({
                error: 'Name, position, wage per day, and project ID are required',
            });
        }
        if (!Number.isFinite(wagePerDayNum) || wagePerDayNum <= 0) {
            return res.status(400).json({ error: 'Wage per day must be positive' });
        }
        // Check if project exists
        const project = await prisma_1.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const staff = await prisma_1.prisma.staff.create({
            data: {
                name,
                position,
                phone,
                wagePerDay: wagePerDayNum,
                staffType: staffType || client_1.StaffType.REGULAR,
                defaultShift: defaultShift || 'OFF',
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
                wagePerDay: (0, decimal_1.decimalToNumber)(staff.wagePerDay),
            },
        });
    }
    catch (error) {
        console.error('Create staff error:', error);
        return res.status(500).json({ error: 'Failed to create staff' });
    }
};
exports.createStaff = createStaff;
/**
 * Update staff
 */
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position, phone, wagePerDay, staffType, defaultShift, isActive, remark, } = req.body;
        const wagePerDayNum = wagePerDay !== undefined ? Number(wagePerDay) : undefined;
        // Check if staff exists
        const existingStaff = await prisma_1.prisma.staff.findUnique({
            where: { id },
        });
        if (!existingStaff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        // Validation
        if (wagePerDayNum !== undefined && (!Number.isFinite(wagePerDayNum) || wagePerDayNum <= 0)) {
            return res.status(400).json({ error: 'Wage per day must be positive' });
        }
        const staff = await prisma_1.prisma.staff.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(position !== undefined && { position }),
                ...(phone !== undefined && { phone }),
                ...(wagePerDayNum !== undefined && { wagePerDay: wagePerDayNum }),
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
        return res.json({
            staff: {
                ...staff,
                wagePerDay: (0, decimal_1.decimalToNumber)(staff.wagePerDay),
            },
        });
    }
    catch (error) {
        console.error('Update staff error:', error);
        return res.status(500).json({ error: 'Failed to update staff' });
    }
};
exports.updateStaff = updateStaff;
/**
 * Toggle staff active status (Enable/Disable)
 * This is the preferred way to "delete" staff while keeping historical data
 */
const toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await prisma_1.prisma.staff.findUnique({
            where: { id },
        });
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        const updatedStaff = await prisma_1.prisma.staff.update({
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
    }
    catch (error) {
        console.error('Toggle staff status error:', error);
        return res.status(500).json({ error: 'Failed to toggle staff status' });
    }
};
exports.toggleStaffStatus = toggleStaffStatus;
/**
 * Delete staff (Hard delete - use with caution)
 * Only use this for cleaning up test data or mistaken entries
 */
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await prisma_1.prisma.staff.findUnique({
            where: { id },
        });
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        // Check if staff has roster entries
        const rosterEntriesCount = await prisma_1.prisma.rosterEntry.count({
            where: { staffId: id },
        });
        if (rosterEntriesCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete staff with existing roster entries. Use toggle status instead.',
            });
        }
        await prisma_1.prisma.staff.delete({
            where: { id },
        });
        return res.json({ success: true, message: 'Staff deleted successfully' });
    }
    catch (error) {
        console.error('Delete staff error:', error);
        return res.status(500).json({ error: 'Failed to delete staff' });
    }
};
exports.deleteStaff = deleteStaff;
//# sourceMappingURL=staff.controller.js.map