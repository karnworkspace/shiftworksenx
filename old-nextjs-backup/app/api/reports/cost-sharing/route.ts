import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { calculateAllProjectsCost } from '@/lib/cost-sharing';

// GET - ดึงรายงานภาพรวมทุกโครงการ
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // คำนวณ Cost Sharing สำหรับทุกโครงการ
    const costData = await calculateAllProjectsCost(year, month);

    return NextResponse.json({ costData });
  } catch (error) {
    console.error('Get cost report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost report' },
      { status: 500 }
    );
  }
}
