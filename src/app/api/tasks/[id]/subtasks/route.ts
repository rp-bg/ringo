import { NextResponse } from 'next/server';
import { addSubtask, toggleSubtask, deleteSubtask } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const subtask = await addSubtask(id, title);
    return NextResponse.json({ subtask });
  } catch (error) {
    console.error('Failed to add subtask:', error);
    return NextResponse.json({ error: 'Failed to add subtask' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { subtaskId, completed } = body;

    if (!subtaskId || completed === undefined) {
      return NextResponse.json({ error: 'subtaskId and completed are required' }, { status: 400 });
    }

    await toggleSubtask(subtaskId, completed);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to toggle subtask:', error);
    return NextResponse.json({ error: 'Failed to toggle subtask' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subtaskId = searchParams.get('subtaskId');

    if (!subtaskId) {
      return NextResponse.json({ error: 'subtaskId is required' }, { status: 400 });
    }

    await deleteSubtask(subtaskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
