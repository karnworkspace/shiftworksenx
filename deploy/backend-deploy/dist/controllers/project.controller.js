"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getAllProjects = void 0;
const prisma_1 = require("../lib/prisma");
const decimal_1 = require("../utils/decimal");
const getAllProjects = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const projects = await prisma_1.prisma.project.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                costSharingFrom: {
                    include: {
                        destinationProject: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        staff: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const projectsWithNumbers = projects.map((p) => ({
            ...p,
            costSharingFrom: p.costSharingFrom.map((cs) => ({
                ...cs,
                percentage: (0, decimal_1.decimalToNumber)(cs.percentage),
            })),
        }));
        return res.json({ projects: projectsWithNumbers });
    }
    catch (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
exports.getAllProjects = getAllProjects;
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma_1.prisma.project.findUnique({
            where: { id },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
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
                staff: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        position: true,
                        // staffType: true,
                    },
                },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'ไม่พบโครงการ' });
        }
        return res.json({
            project: {
                ...project,
                costSharingFrom: project.costSharingFrom.map((cs) => ({
                    ...cs,
                    percentage: (0, decimal_1.decimalToNumber)(cs.percentage),
                })),
                costSharingTo: project.costSharingTo.map((cs) => ({
                    ...cs,
                    percentage: (0, decimal_1.decimalToNumber)(cs.percentage),
                })),
            },
        });
    }
    catch (error) {
        console.error('Get project error:', error);
        return res.status(500).json({ error: 'Failed to fetch project' });
    }
};
exports.getProjectById = getProjectById;
const createProject = async (req, res) => {
    try {
        const { name, location, themeColor, managerId, costSharing, costSharingFrom } = req.body;
        // รองรับทั้ง costSharing และ costSharingFrom
        const costSharingData = costSharingFrom || costSharing;
        // สร้างโครงการ
        const project = await prisma_1.prisma.project.create({
            data: {
                name,
                location,
                themeColor: themeColor || '#3b82f6',
                managerId,
            },
        });
        // สร้าง Cost Sharing (ถ้ามี)
        if (costSharingData && costSharingData.length > 0) {
            await prisma_1.prisma.costSharing.createMany({
                data: costSharingData.map((cs) => ({
                    sourceProjectId: project.id,
                    destinationProjectId: cs.destinationProjectId,
                    percentage: cs.percentage,
                })),
            });
        }
        return res.status(201).json({ success: true, project });
    }
    catch (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ error: 'Failed to create project' });
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, themeColor, managerId, costSharing, costSharingFrom, isActive } = req.body;
        // รองรับทั้ง costSharing และ costSharingFrom
        const costSharingData = costSharingFrom || costSharing;
        // Update project
        await prisma_1.prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(location !== undefined && { location }),
                ...(themeColor !== undefined && { themeColor }),
                ...(managerId !== undefined && { managerId }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        // Update cost sharing
        if (costSharingData !== undefined) {
            // Delete existing
            await prisma_1.prisma.costSharing.deleteMany({
                where: { sourceProjectId: id },
            });
            // Create new
            if (costSharingData.length > 0) {
                await prisma_1.prisma.costSharing.createMany({
                    data: costSharingData.map((cs) => ({
                        sourceProjectId: id,
                        destinationProjectId: cs.destinationProjectId,
                        percentage: cs.percentage,
                    })),
                });
            }
        }
        // Refetch with relations
        const project = await prisma_1.prisma.project.findUnique({
            where: { id },
            include: {
                costSharingFrom: {
                    include: {
                        destinationProject: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        return res.json({
            success: true,
            project: project
                ? {
                    ...project,
                    costSharingFrom: project.costSharingFrom.map((cs) => ({
                        ...cs,
                        percentage: (0, decimal_1.decimalToNumber)(cs.percentage),
                    })),
                }
                : project,
        });
    }
    catch (error) {
        console.error('Update project error:', error);
        return res.status(500).json({ error: 'Failed to update project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete
        await prisma_1.prisma.project.update({
            where: { id },
            data: { isActive: false },
        });
        return res.json({ success: true, message: 'ปิดการใช้งานโครงการสำเร็จ' });
    }
    catch (error) {
        console.error('Delete project error:', error);
        return res.status(500).json({ error: 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=project.controller.js.map