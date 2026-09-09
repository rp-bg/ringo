'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Task } from '@/lib/db/queries';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function MyTasksView() {
  const { tasks, currentUser, setSelectedTaskId, refreshTasks } = useApp();
  const [slice, setSlice] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');

  const myTasks = tasks.filter(t =>
    currentUser ? t.assignees.some(a => a.id === currentUser.id) : true
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const overdueTasks = myTasks.filter(
    t => t.due_date && t.due_date < todayStr && t.status !== 'done'
  );
  const todayTasks = myTasks.filter(
    t => (t.due_date === todayStr || !t.due_date) && t.status !== 'done'
  );
  const upcomingTasks = myTasks.filter(
    t => t.due_date && t.due_date > todayStr && t.status !== 'done'
  );
  const completedTasks = myTasks.filter(t => t.status === 'done');

  let displayTasks = todayTasks;
  if (slice === 'upcoming') displayTasks = upcomingTasks;
  else if (slice === 'overdue') displayTasks = overdueTasks;
  else if (slice === 'completed') displayTasks = completedTasks;

  const handleToggle = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    if (newStatus === 'done') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { status: newStatus }, userId: currentUser?.id }),
      });
      await refreshTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          My Assigned Tasks
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          All tasks assigned to {currentUser?.name || 'you'} across projects.
        </p>
      </div>

      {/* Slices Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          onClick={() => setSlice('today')}
          className="btn-secondary"
          style={{
            backgroundColor: slice === 'today' ? 'var(--accent-primary)' : 'transparent',
            color: slice === 'today' ? '#ffffff' : 'var(--text-secondary)',
            borderColor: slice === 'today' ? 'var(--accent-primary)' : 'var(--border-subtle)',
            fontWeight: 600,
          }}
        >
          <span>Today / Active ({todayTasks.length})</span>
        </button>

        <button
          onClick={() => setSlice('upcoming')}
          className="btn-secondary"
          style={{
            backgroundColor: slice === 'upcoming' ? 'var(--accent-primary)' : 'transparent',
            color: slice === 'upcoming' ? '#ffffff' : 'var(--text-secondary)',
            borderColor: slice === 'upcoming' ? 'var(--accent-primary)' : 'var(--border-subtle)',
            fontWeight: 600,
          }}
        >
          <span>Upcoming ({upcomingTasks.length})</span>
        </button>

        <button
          onClick={() => setSlice('overdue')}
          className="btn-secondary"
          style={{
            backgroundColor: slice === 'overdue' ? 'var(--color-urgent)' : 'transparent',
            color: slice === 'overdue' ? '#ffffff' : 'var(--text-secondary)',
            borderColor: slice === 'overdue' ? 'var(--color-urgent)' : 'var(--border-subtle)',
            fontWeight: 600,
          }}
        >
          <span>Overdue ({overdueTasks.length})</span>
        </button>

        <button
          onClick={() => setSlice('completed')}
          className="btn-secondary"
          style={{
            backgroundColor: slice === 'completed' ? 'var(--color-done)' : 'transparent',
            color: slice === 'completed' ? '#ffffff' : 'var(--text-secondary)',
            borderColor: slice === 'completed' ? 'var(--color-done)' : 'var(--border-subtle)',
            fontWeight: 600,
          }}
        >
          <span>Completed ({completedTasks.length})</span>
        </button>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {displayTasks.map(task => (
          <div
            key={task.id}
            onClick={() => setSelectedTaskId(task.id)}
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <div onClick={e => handleToggle(e, task)}>
                {task.status === 'done' ? (
                  <CheckCircle2 size={20} color="var(--color-done)" style={{ cursor: 'pointer' }} />
                ) : (
                  <Circle size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                )}
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '0.925rem',
                    fontWeight: 600,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                    marginBottom: '0.2rem',
                  }}
                >
                  {task.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Project: <strong>{task.project_name}</strong></span>
                  {task.subtasks.length > 0 && (
                    <span>
                      Checklist: {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              {task.due_date && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color:
                      task.due_date < todayStr && task.status !== 'done'
                        ? 'var(--color-urgent)'
                        : 'var(--text-muted)',
                    fontWeight: task.due_date < todayStr && task.status !== 'done' ? 700 : 400,
                  }}
                >
                  <Calendar size={13} />
                  <span>{task.due_date}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {displayTasks.length === 0 && (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <Sparkles size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--accent-primary)' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              All caught up!
            </h4>
            <p style={{ fontSize: '0.8rem' }}>No tasks found in this view.</p>
          </div>
        )}
      </div>
    </div>
  );
}
