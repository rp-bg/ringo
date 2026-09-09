'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { Task } from '@/lib/db';
import { X, Plus } from 'lucide-react';

export default function QuickAddModal() {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    projects,
    currentProject,
    currentTenant,
    currentUser,
    users,
    projectLists,
    refreshTasks,
    ax,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(currentProject?.id || (projects[0]?.id || ''));
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours] = useState(2);
  const [assigneeId, setAssigneeId] = useState(currentUser?.id || '');

  React.useEffect(() => {
    if (isQuickAddOpen) {
      ax?.startGoal('create-task-flow');
    }
  }, [isQuickAddOpen, ax]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentTenant || !currentUser) return;

    const targetProject = projects.find(p => p.id === projectId) || currentProject || projects[0];
    if (!targetProject) return;

    // Use first list (e.g. Backlog or To Do)
    const listId = projectLists[0]?.id || 'list_todo';

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetProject.id,
          listId,
          tenantId: currentTenant.id,
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate || null,
          estimatedHours,
          createdBy: currentUser.id,
          assigneeIds: assigneeId ? [assigneeId] : [],
        }),
      });

      if (res.ok) {
        ax?.endGoal(
          'create-task-flow',
          {
            projectId: targetProject.id,
            priority,
            hasDueDate: Boolean(dueDate),
            hasAssignee: Boolean(assigneeId),
          },
          estimatedHours || null
        );
        ax?.logActivity('Task created', {
          projectId: targetProject.id,
          priority,
          hasDueDate: Boolean(dueDate),
        });
        setTitle('');
        setDescription('');
        setDueDate('');
        setIsQuickAddOpen(false);
        await refreshTasks();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsQuickAddOpen(false)}>
      <div
        className="glass-panel animate-modal"
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-card)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Quick Add Task</h3>
          <button
            className="btn-ghost"
            onClick={() => setIsQuickAddOpen(false)}
            style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.35rem',
                color: 'var(--text-secondary)',
              }}
            >
              Task Title
            </label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Implement OAuth login with Google"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.35rem',
                color: 'var(--text-secondary)',
              }}
            >
              Description (Optional)
            </label>
            <textarea
              className="textarea-input"
              rows={3}
              placeholder="Add details, links, or notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Project & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Project
              </label>
              <select
                className="select-input"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Priority
              </label>
              <select
                className="select-input"
                value={priority}
                onChange={e => setPriority(e.target.value as Task['priority'])}
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Due Date & Assignee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                className="input-text"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Assignee
              </label>
              <select
                className="select-input"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsQuickAddOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
