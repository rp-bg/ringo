'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Task, Comment, ActivityLog } from '@/lib/db/queries';
import confetti from 'canvas-confetti';
import {
  X,
  Trash2,
  Plus,
  Send,
} from 'lucide-react';

export default function TaskDetailModal() {
  const { selectedTaskId, setSelectedTaskId, currentUser, refreshTasks, ax } = useApp();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  // Load task details
  useEffect(() => {
    if (!selectedTaskId) return;

    fetch(`/api/tasks/${selectedTaskId}`)
      .then(r => r.json())
      .then(data => {
        if (data.task) {
          setTask(data.task);
          setTitle(data.task.title);
          setDescription(data.task.description || '');
          setComments(data.comments || []);
          setActivity(data.activity || []);
        }
      })
      .catch(err => console.error('Failed to load task details:', err));
  }, [selectedTaskId]);

  if (!selectedTaskId) return null;

  const handleUpdate = async (updates: Partial<Task>) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, userId: currentUser?.id }),
      }).then(r => r.json());

      if (res.task) {
        if (updates.status) {
          ax?.logActivity('Task status changed', {
            taskId: task.id,
            newStatus: updates.status,
          });
        }
        setTask(res.task);
        setComments(res.comments || []);
        setActivity(res.activity || []);
        await refreshTasks();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleToggleStatus = (status: Task['status']) => {
    if (status === 'done') {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }
    handleUpdate({ status });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      }).then(r => r.json());

      if (res.subtask) {
        setTask(prev =>
          prev ? { ...prev, subtasks: [...prev.subtasks, res.subtask] } : null
        );
        setNewSubtaskTitle('');
        await refreshTasks();
      }
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: number) => {
    try {
      const res = await fetch(`/api/tasks/${task!.id}/subtasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtaskId, completed: !currentCompleted }),
      });

      if (res.ok) {
        ax?.logActivity('Subtask toggled', {
          subtaskId,
          completed: !currentCompleted,
        });
      }

      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: currentCompleted ? 0 : 1 } : s
          ),
        };
      });
      await refreshTasks();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await fetch(`/api/tasks/${task!.id}/subtasks?subtaskId=${subtaskId}`, {
        method: 'DELETE',
      });

      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.filter(s => s.id !== subtaskId),
        };
      });
      await refreshTasks();
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task || !currentUser) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: newComment.trim(),
        }),
      }).then(r => r.json());

      if (res.comment) {
        ax?.logActivity('Task comment added', {
          taskId: task.id,
          charCount: newComment.trim().length,
        });
        setComments(prev => [...prev, res.comment]);
        setNewComment('');
        await refreshTasks();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks?taskId=${task!.id}`, { method: 'DELETE' });
      if (res.ok) {
        ax?.logActivity('Task deleted', {
          taskId: task!.id,
        });
      }
      setSelectedTaskId(null);
      await refreshTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const completedSubtasksCount = task?.subtasks.filter(s => s.completed).length || 0;
  const subtasksTotal = task?.subtasks.length || 0;
  const subtasksPercent = subtasksTotal > 0 ? Math.round((completedSubtasksCount / subtasksTotal) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={() => setSelectedTaskId(null)}>
      <div
        className="glass-panel animate-modal"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Project: <strong style={{ color: 'var(--text-primary)' }}>{task?.project_name}</strong>
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <select
              className="select-input"
              value={task?.status || 'todo'}
              onChange={e => handleToggleStatus(e.target.value as Task['status'])}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                width: 'auto',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
              }}
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn-danger"
              onClick={handleDeleteTask}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              title="Delete Task"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
            <button
              className="btn-ghost"
              onClick={() => setSelectedTaskId(null)}
              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {/* Left Column: Title, Description, Subtasks, Tabs */}
          <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => handleUpdate({ title })}
              placeholder="Task Title"
              style={{
                width: '100%',
                fontSize: '1.25rem',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            />

            {/* Subtasks Progress */}
            {subtasksTotal > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    marginBottom: '0.35rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Checklist Progress</span>
                  <span>{subtasksPercent}%</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${subtasksPercent}%`,
                      backgroundColor: 'var(--accent-primary)',
                      transition: 'width var(--transition-smooth)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Description Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  marginBottom: '0.4rem',
                }}
              >
                Description (Markdown Supported)
              </label>
              <textarea
                className="textarea-input"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => handleUpdate({ description })}
                placeholder="Add context, specifications, requirements, or acceptance criteria..."
                style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
              />
            </div>

            {/* Subtasks / Checklist Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Subtasks & Acceptance Criteria ({completedSubtasksCount}/{subtasksTotal})
                </span>
              </div>

              {/* Subtask list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {task?.subtasks.map(sub => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(sub.completed)}
                        onChange={() => handleToggleSubtask(sub.id, sub.completed)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span
                        style={{
                          fontSize: '0.825rem',
                          textDecoration: sub.completed ? 'line-through' : 'none',
                          color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {sub.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="btn-ghost"
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask form */}
              <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Add a new checklist item..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Tabs for Comments vs Audit Activity Log */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setActiveTab('details')}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: activeTab === 'details' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'details' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    paddingBottom: '0.35rem',
                  }}
                >
                  Discussion ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: activeTab === 'activity' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    paddingBottom: '0.35rem',
                  }}
                >
                  Activity Audit Log ({activity.length})
                </button>
              </div>

              {activeTab === 'details' ? (
                <div>
                  {/* Comments list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    {comments.map(c => (
                      <div
                        key={c.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="avatar avatar-sm">{c.user_avatar}</div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.user_name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              ({c.user_title})
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {c.content}
                        </p>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        No comments yet. Mention teammates with @ to collaborate.
                      </div>
                    )}
                  </div>

                  {/* Add comment input */}
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-text"
                      placeholder="Write a comment or mention @teammate..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.85rem' }}>
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {activity.map(a => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div className="avatar avatar-sm" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                        {a.user_avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{a.user_name}</strong> {a.details}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Properties & Metadata */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Priority */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Priority
              </label>
              <select
                className="select-input"
                value={task?.priority || 'medium'}
                onChange={e => handleUpdate({ priority: e.target.value as Task['priority'] })}
                style={{ fontWeight: 600 }}
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                className="input-text"
                value={task?.due_date || ''}
                onChange={e => handleUpdate({ due_date: e.target.value })}
              />
            </div>

            {/* Estimated & Actual Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Est. Hours
                </label>
                <input
                  type="number"
                  className="input-text"
                  value={task?.estimated_hours || 0}
                  onChange={e => handleUpdate({ estimated_hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Logged Hours
                </label>
                <input
                  type="number"
                  className="input-text"
                  value={task?.actual_hours || 0}
                  onChange={e => handleUpdate({ actual_hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                Assignees ({task?.assignees.length || 0})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {task?.assignees.map(a => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.5rem',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="avatar avatar-sm">{a.avatar}</div>
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {task && task.tags.length > 0 && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {task.tags.map(t => (
                    <span
                      key={t.id}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-card)',
                        color: t.color,
                        border: `1px solid ${t.color}40`,
                      }}
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
