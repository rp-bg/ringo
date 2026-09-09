import { NextResponse } from 'next/server';
import { getTasks, createTask, deleteTask, getTaskLists } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const projectId = searchParams.get('projectId') || undefined;
    const workspaceId = searchParams.get('workspaceId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const tasks = await getTasks({
      tenantId,
      projectId,
      workspaceId,
      userId,
      status,
      search,
    });

    let lists = null;
    if (projectId) {
      lists = await getTaskLists(projectId);
    }

    return NextResponse.json({ tasks, lists });
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      listId,
      tenantId,
      title,
      description,
      priority,
      dueDate,
      estimatedHours,
      createdBy,
      assigneeIds,
      tagIds,
    } = body;

    if (!projectId || !listId || !tenantId || !title || !createdBy) {
      return NextResponse.json(
        { error: 'projectId, listId, tenantId, title, and createdBy are required' },
        { status: 400 }
      );
    }

    const taskId = await createTask({
      projectId,
      listId,
      tenantId,
      title,
      description,
      priority,
      dueDate,
      estimatedHours,
      createdBy,
      assigneeIds,
      tagIds,
    });

    return NextResponse.json({ taskId, success: true });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }
    await deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
