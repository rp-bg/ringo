import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const logs = await getActivityLogs(tenantId, limit);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
