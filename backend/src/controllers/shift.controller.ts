import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/shifts - ดึงข้อมูลกะทั้งหมด
export const getAllShifts = async (req: Request, res: Response) => {
    try {
        const shifts = await prisma.shiftType.findMany({
            orderBy: {
                code: 'asc',
            },
        });

        res.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/shifts/:id - ดึงข้อมูลกะตาม ID
export const getShiftById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const shift = await prisma.shiftType.findUnique({
            where: { id },
        });

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json(shift);
    } catch (error) {
        console.error('Error fetching shift:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/shifts - สร้างกะใหม่
export const createShift = async (req: Request, res: Response) => {
    try {
        const { code, name, startTime, endTime, color, isWorkShift } = req.body;

        console.log('Creating shift with data:', { code, name, startTime, endTime, color, isWorkShift });

        // ตรวจสอบว่า code ซ้ำหรือไม่
        const existingShift = await prisma.shiftType.findUnique({
            where: { code },
        });

        if (existingShift) {
            return res.status(400).json({ error: 'Shift code already exists' });
        }

        const shift = await prisma.shiftType.create({
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
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/shifts/:id - แก้ไขข้อมูลกะ
export const updateShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, startTime, endTime, color, isWorkShift } = req.body;

        console.log('Updating shift with id:', id, 'and data:', { code, name, startTime, endTime, color, isWorkShift });

        // ตรวจสอบว่ากะมีอยู่หรือไม่
        const existingShift = await prisma.shiftType.findUnique({
            where: { id },
        });

        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        // ถ้ามีการเปลี่ยน code ให้ตรวจสอบว่าซ้ำหรือไม่
        if (code && code !== existingShift.code) {
            const codeExists = await prisma.shiftType.findUnique({
                where: { code },
            });

            if (codeExists) {
                return res.status(400).json({ error: 'Shift code already exists' });
            }
        }

        const shift = await prisma.shiftType.update({
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
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/shifts/:id - ลบกะ
export const deleteShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่ากะมีอยู่หรือไม่
        const existingShift = await prisma.shiftType.findUnique({
            where: { id },
        });

        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        // ไม่ให้ลบกะที่เป็น system default
        if (existingShift.isSystemDefault) {
            return res.status(400).json({ error: 'Cannot delete system default shift' });
        }

        await prisma.shiftType.delete({
            where: { id },
        });

        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
