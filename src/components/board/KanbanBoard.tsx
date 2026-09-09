'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Task, TaskList } from '@/lib/db/queries';
import confetti from 'canvas-confetti';
import {
  Plus,
  Calendar,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function KanbanBoard() {
  const {
    tasks,
    projectLists,
    currentProject,
    currentTenant,
    currentUser,
    selectedPriority,
    setSelectedTaskId,
    refreshTasks,
    ax,
  } = useApp();

  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim() || !currentProject || !currentTenant || !currentUser) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          listId,
          tenantId: currentTenant.id,
          title: newCardTitle.trim(),
          createdBy: currentUser.id,
          priority: 'medium',
        }),
      });

      if (res.ok) {
        ax?.logActivity('Task created', {
          projectId: currentProject.id,
          priority: 'medium',
          hasDueDate: false,
        });
        setNewCardTitle('');
        setAddingToListId(null);
        await refreshTasks();
      }
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  const handleMoveTask = async (task: Task, targetList: TaskList) => {
    if (task.list_id === targetList.id) return;

    let newStatus: Task['status'] = 'todo';
    const listNameLower = targetList.name.toLowerCase();
    if (listNameLower.includes('backlog')) newStatus = 'backlog';
    else if (listNameLower.includes('progress') || listNameLower.includes('designing')) {
      newStatus = 'in_progress';
      ax?.startGoal('task-completion-flow');
    } else if (listNameLower.includes('review')) {
      newStatus = 'in_review';
    } else if (listNameLower.includes('done') || listNameLower.includes('completed') || listNameLower.includes('shipped')) {
      newStatus = 'done';
    }

    if (newStatus === 'done') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    }

    try {
      const res = await fetch('/api/tasks/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          targetListId: targetList.id,
          newPosition: 0,
          newStatus,
          userId: currentUser?.id,
        }),
      });

      if (res.ok) {
        ax?.logActivity('Task status changed', {
          taskId: task.id,
          newStatus,
        });

        if (newStatus === 'done') {
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
      }
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetList: TaskList) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await handleMoveTask(task, targetList);
    }
    setDraggedTaskId(null);
  };

  if (!currentProject) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Please select or create a project to view the Kanban board.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '1.25rem',
        overflowX: 'auto',
        padding: '1.5rem',
        height: 'calc(100vh - 64px)',
        alignItems: 'flex-start',
      }}
    >
      {projectLists.map((list, listIndex) => {
        const listTasks = filteredTasks.filter(t => t.list_id === list.id);

        return (
          <div
            key={list.id}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, list)}
            style={{
              width: '320px',
              minWidth: '320px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100%',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Column Header */}
            <div
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: list.color,
                  }}
                />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{list.name}</h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-input)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                  }}
                >
                  {listTasks.length}
                </span>
              </div>

              <button
                onClick={() => setAddingToListId(list.id)}
                className="btn-ghost"
                style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}
                title="Add task to column"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Add Inline Form */}
            {addingToListId === list.id && (
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="What needs to be done?"
                  value={newCardTitle}
                  onChange={e => setNewCardTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateCard(list.id);
                    if (e.key === 'Escape') setAddingToListId(null);
                  }}
                  autoFocus
                  style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    className="btn-ghost"
                    onClick={() => setAddingToListId(null)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleCreateCard(list.id)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Cards List */}
            <div
              style={{
                padding: '0.75rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flex: 1,
              }}
            >
              {listTasks.map(task => {
                const isOverdue =
                  task.due_date &&
                  new Date(task.due_date) < new Date() &&
                  task.status !== 'done';
                const completedSubtasks = task.subtasks.filter(s => s.completed).length;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTaskId(task.id)}
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'grab',
                      transition: 'all var(--transition-fast)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Top: Priority & Move Controls */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority}
                      </span>

                      {/* Quick Shift buttons */}
                      <div
                        style={{ display: 'flex', gap: '0.2rem' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {listIndex > 0 && (
                          <button
                            onClick={() => handleMoveTask(task, projectLists[listIndex - 1])}
                            title={`Move to ${projectLists[listIndex - 1].name}`}
                            className="btn-ghost"
                            style={{ padding: '0.15rem' }}
                          >
                            <ChevronLeft size={13} />
                          </button>
                        )}
                        {listIndex < projectLists.length - 1 && (
                          <button
                            onClick={() => handleMoveTask(task, projectLists[listIndex + 1])}
                            title={`Move to ${projectLists[listIndex + 1].name}`}
                            className="btn-ghost"
                            style={{ padding: '0.15rem' }}
                          >
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        marginBottom: '0.5rem',
                        lineHeight: 1.35,
                      }}
                    >
                      {task.title}
                    </h4>

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                          marginBottom: '0.65rem',
                        }}
                      >
                        {task.tags.map(tag => (
                          <span
                            key={tag.id}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-input)',
                              color: tag.color,
                              fontWeight: 600,
                              border: `1px solid ${tag.color}30`,
                            }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: Due Date, Subtasks, Comments, Assignees */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.725rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {task.due_date && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: isOverdue ? 'var(--color-urgent)' : 'inherit',
                              fontWeight: isOverdue ? 700 : 500,
                            }}
                          >
                            <Calendar size={13} />
                            {task.due_date}
                          </span>
                        )}

                        {task.subtasks.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckSquare size={13} />
                            {completedSubtasks}/{task.subtasks.length}
                          </span>
                        )}

                        {task.comments_count > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MessageSquare size={13} />
                            {task.comments_count}
                          </span>
                        )}
                      </div>

                      {/* Assignee Avatars */}
                      <div style={{ display: 'flex', marginLeft: 'auto' }}>
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
                      </div>
                    </div>
                  </div>
                );
              })}

              {listTasks.length === 0 && (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Drop tasks here or click + to add
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
