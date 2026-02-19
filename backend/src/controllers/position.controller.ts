import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { decimalToNumber } from '../utils/decimal';

const normalizePosition = (position: any) => ({
  ...position,
  defaultWage: decimalToNumber(position.defaultWage),
});

// GET /api/positions
export const getAllPositions = async (_req: Request, res: Response) => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(positions.map(normalizePosition));
  } catch (error) {
    console.error('Error fetching positions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/positions/:id
export const getPositionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const position = await prisma.position.findUnique({ where: { id } });

    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    return res.json(normalizePosition(position));
  } catch (error) {
    console.error('Error fetching position:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/positions
export const createPosition = async (req: Request, res: Response) => {
  try {
    const { name, defaultWage } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Position name is required' });
    }

    const wageNum = Number(defaultWage);
    if (!Number.isFinite(wageNum) || wageNum < 0) {
      return res.status(400).json({ error: 'Default wage must be a valid number' });
    }

    const existing = await prisma.position.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({ error: 'Position already exists' });
    }

    const position = await prisma.position.create({
      data: {
        name,
        defaultWage: wageNum,
      },
    });

    return res.status(201).json(normalizePosition(position));
  } catch (error) {
    console.error('Error creating position:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/positions/:id
export const updatePosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, defaultWage } = req.body;

    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Position not found' });
    }

    if (name && name !== existing.name) {
      const nameTaken = await prisma.position.findUnique({ where: { name } });
      if (nameTaken) {
        return res.status(400).json({ error: 'Position name already exists' });
      }
    }

    let wageNum: number | undefined;
    if (defaultWage !== undefined) {
      wageNum = Number(defaultWage);
      if (!Number.isFinite(wageNum) || wageNum < 0) {
        return res.status(400).json({ error: 'Default wage must be a valid number' });
      }
    }

    const position = await prisma.$transaction(async (tx) => {
      const updated = await tx.position.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(wageNum !== undefined && { defaultWage: wageNum }),
        },
      });

      if (name && name !== existing.name) {
        await tx.staff.updateMany({
          where: {
            OR: [
              { positionId: id },
              { position: existing.name },
            ],
          },
          data: {
            position: name,
            positionId: id,
          },
        });
      }

      return updated;
    });

    return res.json(normalizePosition(position));
  } catch (error) {
    console.error('Error updating position:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/positions/:id
export const deletePosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const staffCount = await prisma.staff.count({ where: { positionId: id } });
    if (staffCount > 0) {
      return res.status(400).json({ error: 'Position is in use by staff' });
    }

    await prisma.position.delete({ where: { id } });
    return res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/positions/:id/apply-wage
export const applyPositionDefaultWage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mode } = req.body;

    if (mode !== 'all' && mode !== 'not_overridden') {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const position = await prisma.position.findUnique({ where: { id } });
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const defaultWage = decimalToNumber(position.defaultWage);

    const whereClause: any = {
      OR: [
        { positionId: id },
        { position: position.name },
      ],
    };

    // When mode is 'not_overridden', only update staff whose current wage
    // differs from the new default — meaning they still had an old default.
    // Without a separate wageOverride flag, we use a heuristic:
    // skip staff whose wage was manually set to a non-default value.
    // NOTE: This requires oldDefaultWage from request for accurate filtering.
    if (mode === 'not_overridden' && req.body.oldDefaultWage !== undefined) {
      const oldWage = Number(req.body.oldDefaultWage);
      if (Number.isFinite(oldWage)) {
        whereClause.wagePerDay = oldWage;
      }
    }

    const result = await prisma.staff.updateMany({
      where: whereClause,
      data: {
        wagePerDay: defaultWage,
        positionId: id,
        position: position.name,
      },
    });

    return res.json({ updatedCount: result.count });
  } catch (error) {
    console.error('Error applying position wage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
