'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function TaskTimelineView() {
  const { tasks, setSelectedTaskId } = useApp();

  const days = [
    'Sep 1', 'Sep 2', 'Sep 3', 'Sep 4', 'Sep 5', 'Sep 6', 'Sep 7', 'Sep 8', 'Sep 9', 'Sep 10', 'Sep 11', 'Sep 12'
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Project Roadmap & Timeline</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Visual Gantt schedule and deliverable trajectories.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Timeline Header Days */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px repeat(12, 90px)',
            backgroundColor: 'var(--bg-app)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.725rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            padding: '0.75rem 0',
          }}
        >
          <div style={{ paddingLeft: '1.25rem' }}>Task Deliverable</div>
          {days.map(d => (
            <div key={d} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Timeline Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map((task, idx) => {
            // Simulated start offset and span for roadmap visualization
            const startCol = 2 + (idx % 6);
            const span = 3 + (idx % 4);

            return (
              <div
                key={task.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '280px repeat(12, 90px)',
                  alignItems: 'center',
                  padding: '0.65rem 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                }}
              >
                {/* Title */}
                <div
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    paddingLeft: '1.25rem',
                    paddingRight: '1rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 600,
                  }}
                  title={task.title}
                >
                  <span
                    style={{
                      color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Timeline Grid track */}
                <div
                  style={{
                    gridColumn: `${startCol} / span ${span}`,
                    backgroundColor:
                      task.status === 'done'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : `var(--color-${task.priority})22`,
                    border: `1px solid var(--color-${task.priority})`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.35rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    margin: '0 4px',
                  }}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: `var(--color-${task.priority})`,
                      textTransform: 'capitalize',
                    }}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                  <div style={{ display: 'flex' }}>
                    {task.assignees.map(a => (
                      <span key={a.id} className="avatar avatar-sm" style={{ width: '18px', height: '18px', fontSize: '0.6rem' }}>
                        {a.avatar}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
