import { NextResponse } from 'next/server';
import { getWorkspaces, getDb, initDatabase } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }
    const workspaces = await getWorkspaces(tenantId);
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Failed to get workspaces:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, name, description, icon } = body;
    if (!tenantId || !name) {
      return NextResponse.json({ error: 'tenantId and name are required' }, { status: 400 });
    }

    await initDatabase();
    const db = getDb();
    const id = 'ws_' + Math.random().toString(36).substring(2, 9);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await db.execute({
      sql: 'INSERT INTO workspaces (id, tenant_id, name, slug, description, icon) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, tenantId, name, slug, description || '', icon || 'Layers'],
    });

    return NextResponse.json({
      workspace: { id, tenant_id: tenantId, name, slug, description, icon: icon || 'Layers' },
    });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
