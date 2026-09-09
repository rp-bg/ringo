'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Task } from '@/lib/db/queries';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';

export default function TaskListView() {
  const {
    tasks,
    currentUser,
    selectedPriority,
    setSelectedTaskId,
    refreshTasks,
    ax,
  } = useApp();

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'title' | 'due_date' | 'priority' | 'status'>('due_date');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredTasks = tasks.filter(task => {
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === sortedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(sortedTasks.map(t => t.id));
    }
  };

  const toggleSelectTask = (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleDone = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    if (newStatus === 'done') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { status: newStatus },
          userId: currentUser?.id,
        }),
      });

      if (res.ok && newStatus === 'done') {
        ax?.endGoal(
          'task-completion-flow',
          {
            taskId: task.id,
            priority: task.priority,
            subtasksCount: task.subtasks.length,
          },
          task.actual_hours || null
        );
      }

      await refreshTasks();
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const handleBulkMarkDone = async () => {
    for (const id of selectedTaskIds) {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { status: 'done' },
          userId: currentUser?.id,
        }),
      });
    }
    setSelectedTaskIds([]);
    await refreshTasks();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) return;
    for (const id of selectedTaskIds) {
      await fetch(`/api/tasks?taskId=${id}`, { method: 'DELETE' });
    }
    setSelectedTaskIds([]);
    await refreshTasks();
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Bulk Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div
          className="glass-panel animate-modal"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--accent-primary)',
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={handleBulkMarkDone}>
              <CheckCircle2 size={15} color="var(--color-done)" />
              <span>Mark Completed</span>
            </button>
            <button className="btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Task List Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 40px 1fr 140px 120px 140px 120px 80px',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-app)',
            fontSize: '0.725rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            alignItems: 'center',
          }}
        >
          <div>
            <input
              type="checkbox"
              checked={selectedTaskIds.length > 0 && selectedTaskIds.length === sortedTasks.length}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div></div>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => {
              setSortField('title');
              setSortAsc(!sortAsc);
            }}
          >
            Title <ArrowUpDown size={12} />
          </div>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => {
              setSortField('status');
              setSortAsc(!sortAsc);
            }}
          >
            Status <ArrowUpDown size={12} />
          </div>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => {
              setSortField('priority');
              setSortAsc(!sortAsc);
            }}
          >
            Priority <ArrowUpDown size={12} />
          </div>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => {
              setSortField('due_date');
              setSortAsc(!sortAsc);
            }}
          >
            Due Date <ArrowUpDown size={12} />
          </div>
          <div>Assignees</div>
          <div>Subtasks</div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sortedTasks.map(task => {
            const isDone = task.status === 'done';
            const isSelected = selectedTaskIds.includes(task.id);
            const isOverdue =
              task.due_date && new Date(task.due_date) < new Date() && !isDone;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 40px 1fr 140px 120px 140px 120px 80px',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card-hover)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <div onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => toggleSelectTask(e, task.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <div onClick={e => handleToggleDone(e, task)}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="var(--color-done)" style={{ cursor: 'pointer' }} />
                  ) : (
                    <Circle size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                  )}
                </div>

                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </span>
                  {task.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem' }}>
                      {task.tags.map(t => (
                        <span
                          key={t.id}
                          style={{
                            fontSize: '0.62rem',
                            color: t.color,
                            backgroundColor: 'var(--bg-input)',
                            padding: '0.05rem 0.35rem',
                            borderRadius: '3px',
                          }}
                        >
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        isDone
                          ? 'rgba(16, 185, 129, 0.15)'
                          : task.status === 'in_progress'
                          ? 'rgba(234, 179, 8, 0.15)'
                          : 'var(--bg-input)',
                      color:
                        isDone
                          ? 'var(--color-done)'
                          : task.status === 'in_progress'
                          ? 'var(--color-in-progress)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>

                <div
                  style={{
                    color: isOverdue ? 'var(--color-urgent)' : 'var(--text-secondary)',
                    fontWeight: isOverdue ? 700 : 400,
                    fontSize: '0.78rem',
                  }}
                >
                  {task.due_date || '—'}
                </div>

                <div style={{ display: 'flex' }}>
                  {task.assignees.map((user, i) => (
                    <div
                      key={user.id}
                      className="avatar avatar-sm"
                      title={user.name}
                      style={{ marginLeft: i > 0 ? '-6px' : 0 }}
                    >
                      {user.avatar}
                    </div>
                  ))}
                  {task.assignees.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unassigned</span>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {task.subtasks.length > 0
                    ? `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}`
                    : '—'}
                </div>
              </div>
            );
          })}

          {sortedTasks.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tasks found for the current filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
