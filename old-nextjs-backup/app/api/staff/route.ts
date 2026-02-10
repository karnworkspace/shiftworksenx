import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - ดึงรายการพนักงาน
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const staff = await prisma.staff.findMany({
      where: {
        projectId: projectId || undefined,
        isActive: includeInactive ? undefined : true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST - สร้างพนักงานใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      position,
      phone,
      wagePerDay,
      staffType,
      defaultShift,
      projectId,
    } = data;

    const staff = await prisma.staff.create({
      data: {
        name,
        position,
        phone,
        wagePerDay: parseFloat(wagePerDay),
        staffType: staffType || 'REGULAR',
        defaultShift: defaultShift || '1',
        projectId,
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json(
      { error: 'Failed to create staff' },
      { status: 500 }
    );
  }
}
