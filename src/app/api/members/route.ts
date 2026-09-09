import { NextResponse } from 'next/server';
import { getTenantMembers, getAllUsers, inviteTenantMember } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const all = searchParams.get('all');

    if (all) {
      const users = await getAllUsers();
      return NextResponse.json({ users });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const members = await getTenantMembers(tenantId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to get members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, email, name, role } = body;

    if (!tenantId || !email || !name) {
      return NextResponse.json({ error: 'tenantId, email, and name are required' }, { status: 400 });
    }

    const member = await inviteTenantMember(tenantId, email, name, role || 'member');
    return NextResponse.json({ member, success: true });
  } catch (error) {
    console.error('Failed to invite member:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}
