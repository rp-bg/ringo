import { NextResponse } from 'next/server';
import { getTaskDetails, updateTask } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const details = await getTaskDetails(id);
    if (!details) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error) {
    console.error('Failed to get task details:', error);
    return NextResponse.json({ error: 'Failed to fetch task details' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { updates, userId } = body;

    if (!updates) {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
    }

    await updateTask(id, updates, userId || 'system');
    const updated = await getTaskDetails(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
