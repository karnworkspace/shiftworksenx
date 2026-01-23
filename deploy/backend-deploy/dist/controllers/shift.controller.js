"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShift = exports.updateShift = exports.createShift = exports.getShiftById = exports.getAllShifts = void 0;
const prisma_1 = require("../lib/prisma");
// GET /api/shifts - ดึงข้อมูลกะทั้งหมด
const getAllShifts = async (req, res) => {
    try {
        const shifts = await prisma_1.prisma.shiftType.findMany({
            orderBy: {
                code: 'asc',
            },
        });
        res.json(shifts);
    }
    catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllShifts = getAllShifts;
// GET /api/shifts/:id - ดึงข้อมูลกะตาม ID
const getShiftById = async (req, res) => {
    try {
        const { id } = req.params;
        const shift = await prisma_1.prisma.shiftType.findUnique({
            where: { id },
        });
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        res.json(shift);
    }
    catch (error) {
        console.error('Error fetching shift:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getShiftById = getShiftById;
// POST /api/shifts - สร้างกะใหม่
const createShift = async (req, res) => {
    try {
        const { code, name, startTime, endTime, color, isWorkShift } = req.body;
        console.log('Creating shift with data:', { code, name, startTime, endTime, color, isWorkShift });
        // ตรวจสอบว่า code ซ้ำหรือไม่
        const existingShift = await prisma_1.prisma.shiftType.findUnique({
            where: { code },
        });
        if (existingShift) {
            return res.status(400).json({ error: 'Shift code already exists' });
        }
        const shift = await prisma_1.prisma.shiftType.create({
            data: {
                code,
                name,
                startTime: startTime || null,
                endTime: endTime || null,
                color: color || '#1890ff',
                isWorkShift: isWorkShift ?? true,
            },
        });
        console.log('Shift created successfully:', shift);
        res.status(201).json(shift);
    }
    catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createShift = createShift;
// PUT /api/shifts/:id - แก้ไขข้อมูลกะ
const updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, startTime, endTime, color, isWorkShift } = req.body;
        console.log('Updating shift with id:', id, 'and data:', { code, name, startTime, endTime, color, isWorkShift });
        // ตรวจสอบว่ากะมีอยู่หรือไม่
        const existingShift = await prisma_1.prisma.shiftType.findUnique({
            where: { id },
        });
        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        // ถ้ามีการเปลี่ยน code ให้ตรวจสอบว่าซ้ำหรือไม่
        if (code && code !== existingShift.code) {
            const codeExists = await prisma_1.prisma.shiftType.findUnique({
                where: { code },
            });
            if (codeExists) {
                return res.status(400).json({ error: 'Shift code already exists' });
            }
        }
        const shift = await prisma_1.prisma.shiftType.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(startTime !== undefined && { startTime }),
                ...(endTime !== undefined && { endTime }),
                ...(color && { color }),
                ...(isWorkShift !== undefined && { isWorkShift }),
            },
        });
        console.log('Shift updated successfully:', shift);
        res.json(shift);
    }
    catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateShift = updateShift;
// DELETE /api/shifts/:id - ลบกะ
const deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        // ตรวจสอบว่ากะมีอยู่หรือไม่
        const existingShift = await prisma_1.prisma.shiftType.findUnique({
            where: { id },
        });
        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        // ไม่ให้ลบกะที่เป็น system default
        if (existingShift.isSystemDefault) {
            return res.status(400).json({ error: 'Cannot delete system default shift' });
        }
        await prisma_1.prisma.shiftType.delete({
            where: { id },
        });
        res.json({ message: 'Shift deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting shift:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteShift = deleteShift;
//# sourceMappingURL=shift.controller.js.map