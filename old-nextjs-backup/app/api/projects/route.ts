import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - ดึงรายการโครงการทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const projects = await prisma.project.findMany({
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

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - สร้างโครงการใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, location, themeColor, managerId, costSharing } = data;

    // สร้างโครงการ
    const project = await prisma.project.create({
      data: {
        name,
        location,
        themeColor: themeColor || '#3b82f6',
        managerId,
      },
    });

    // สร้าง Cost Sharing (ถ้ามี)
    if (costSharing && costSharing.length > 0) {
      await prisma.costSharing.createMany({
        data: costSharing.map((cs: any) => ({
          sourceProjectId: project.id,
          destinationProjectId: cs.destinationProjectId,
          percentage: cs.percentage,
        })),
      });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
