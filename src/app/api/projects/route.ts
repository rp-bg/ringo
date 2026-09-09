import { NextResponse } from 'next/server';
import { getProjects, getDb, initDatabase } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const workspaceId = searchParams.get('workspaceId') || undefined;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const projects = await getProjects(tenantId, workspaceId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to get projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, tenantId, name, description, color, icon, viewMode } = body;

    if (!workspaceId || !tenantId || !name) {
      return NextResponse.json({ error: 'workspaceId, tenantId, and name are required' }, { status: 400 });
    }

    await initDatabase();
    const db = getDb();
    const id = 'proj_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO projects (id, workspace_id, tenant_id, name, description, color, icon, view_mode, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        workspaceId,
        tenantId,
        name,
        description || '',
        color || '#6366f1',
        icon || 'FolderKanban',
        viewMode || 'board',
        now,
      ],
    });

    // Automatically create default task lists for the new project
    const defaultLists = [
      { id: 'list_' + Math.random().toString(36).substring(2, 9), name: 'Backlog', pos: 0, color: '#64748b' },
      { id: 'list_' + Math.random().toString(36).substring(2, 9), name: 'To Do', pos: 1, color: '#0284c7' },
      { id: 'list_' + Math.random().toString(36).substring(2, 9), name: 'In Progress', pos: 2, color: '#eab308' },
      { id: 'list_' + Math.random().toString(36).substring(2, 9), name: 'In Review', pos: 3, color: '#a855f7' },
      { id: 'list_' + Math.random().toString(36).substring(2, 9), name: 'Completed', pos: 4, color: '#10b981' },
    ];

    for (const l of defaultLists) {
      await db.execute({
        sql: 'INSERT INTO task_lists (id, project_id, name, position, color) VALUES (?, ?, ?, ?, ?)',
        args: [l.id, id, l.name, l.pos, l.color],
      });
    }

    return NextResponse.json({
      project: {
        id,
        workspace_id: workspaceId,
        tenant_id: tenantId,
        name,
        description,
        color: color || '#6366f1',
        icon: icon || 'FolderKanban',
        view_mode: viewMode || 'board',
        created_at: now,
      },
    });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
