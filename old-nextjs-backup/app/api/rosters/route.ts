import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDaysInMonth } from '@/lib/utils';

// GET - ดึงตารางเวร
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!projectId || !year || !month) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // หาหรือสร้าง roster
    let roster = await prisma.roster.findUnique({
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
        project: true,
      },
    });

    // ถ้ายังไม่มี roster ให้สร้างใหม่พร้อมกับ entries ตั้งต้น
    if (!roster) {
      roster = await prisma.roster.create({
        data: {
          projectId,
          year,
          month,
        },
        include: {
          entries: {
            include: {
              staff: true,
            },
          },
          project: true,
        },
      });

      // สร้าง entries ตั้งต้นสำหรับพนักงานทุกคน
      const activeStaff = await prisma.staff.findMany({
        where: {
          projectId,
          isActive: true,
        },
      });

      const daysInMonth = getDaysInMonth(year, month);
      const entries = [];

      for (const staff of activeStaff) {
        for (let day = 1; day <= daysInMonth; day++) {
          entries.push({
            rosterId: roster.id,
            staffId: staff.id,
            day,
            shiftCode: staff.defaultShift || '1',
          });
        }
      }

      if (entries.length > 0) {
        await prisma.rosterEntry.createMany({
          data: entries,
        });

        // ดึงข้อมูลใหม่พร้อม entries
        roster = await prisma.roster.findUnique({
          where: { id: roster.id },
          include: {
            entries: {
              include: {
                staff: true,
              },
            },
            project: true,
          },
        })!;
      }
    }

    return NextResponse.json({ roster });
  } catch (error) {
    console.error('Get roster error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roster' },
      { status: 500 }
    );
  }
}

// POST - สร้างหรืออัพเดท roster entries
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rosterId, staffId, day, shiftCode, notes } = await request.json();

    // ตรวจสอบว่ามี entry อยู่แล้วหรือไม่
    const existing = await prisma.rosterEntry.findUnique({
      where: {
        rosterId_staffId_day: {
          rosterId,
          staffId,
          day,
        },
      },
    });

    let entry;
    if (existing) {
      // อัพเดท
      entry = await prisma.rosterEntry.update({
        where: { id: existing.id },
        data: { shiftCode, notes },
      });
    } else {
      // สร้างใหม่
      entry = await prisma.rosterEntry.create({
        data: {
          rosterId,
          staffId,
          day,
          shiftCode,
          notes,
        },
      });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Update roster entry error:', error);
    return NextResponse.json(
      { error: 'Failed to update roster entry' },
      { status: 500 }
    );
  }
}
