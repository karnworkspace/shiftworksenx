import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - ดึงข้อมูลโครงการเดียว
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        manager: true,
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
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH - แก้ไขโครงการ
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, location, themeColor, managerId, isActive, costSharing } = data;

    // อัพเดทโครงการ
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name,
        location,
        themeColor,
        managerId,
        isActive,
      },
    });

    // อัพเดท Cost Sharing
    if (costSharing !== undefined) {
      // ลบของเก่าทั้งหมด
      await prisma.costSharing.deleteMany({
        where: { sourceProjectId: params.id },
      });

      // สร้างใหม่
      if (costSharing.length > 0) {
        await prisma.costSharing.createMany({
          data: costSharing.map((cs: any) => ({
            sourceProjectId: params.id,
            destinationProjectId: cs.destinationProjectId,
            percentage: cs.percentage,
          })),
        });
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - ลบโครงการ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
