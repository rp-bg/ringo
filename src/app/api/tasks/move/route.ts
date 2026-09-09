import { NextResponse } from 'next/server';
import { moveTask } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, targetListId, newPosition, newStatus, userId } = body;

    if (!taskId || !targetListId || newPosition === undefined || !newStatus) {
      return NextResponse.json(
        { error: 'taskId, targetListId, newPosition, and newStatus are required' },
        { status: 400 }
      );
    }

    await moveTask(taskId, targetListId, newPosition, newStatus, userId || 'system');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to move task:', error);
    return NextResponse.json({ error: 'Failed to move task' }, { status: 500 });
  }
}
