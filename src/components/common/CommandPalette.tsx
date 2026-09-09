'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  CheckCircle2,
  Target,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    tasks,
    projects,
    setCurrentProject,
    setActiveView,
    setSelectedTaskId,
    setIsQuickAddOpen,
  } = useApp();

  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
      <div
        className="glass-panel animate-modal"
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-card)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          marginTop: '-10vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Type a command or search tasks & projects..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
            }}
          />
          <kbd
            style={{
              fontSize: '0.65rem',
              backgroundColor: 'var(--bg-input)',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.5rem' }}>
          {/* Quick Actions */}
          <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Actions
          </div>
          <button
            onClick={() => {
              setIsCommandPaletteOpen(false);
              setIsQuickAddOpen(true);
            }}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
            }}
            className="btn-ghost"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Plus size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.85rem' }}>Create New Task</span>
            </div>
            <kbd style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Q</kbd>
          </button>

          <button
            onClick={() => {
              setIsCommandPaletteOpen(false);
              setActiveView('my-tasks');
            }}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textAlign: 'left',
            }}
            className="btn-ghost"
          >
            <CheckCircle2 size={16} color="var(--color-done)" />
            <span style={{ fontSize: '0.85rem' }}>Go to My Tasks</span>
          </button>

          <button
            onClick={() => {
              setIsCommandPaletteOpen(false);
              setActiveView('focus');
            }}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textAlign: 'left',
            }}
            className="btn-ghost"
          >
            <Target size={16} color="var(--color-high)" />
            <span style={{ fontSize: '0.85rem' }}>Open Focus Mode (Pomodoro)</span>
          </button>

          <button
            onClick={() => {
              setIsCommandPaletteOpen(false);
              setActiveView('analytics');
            }}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textAlign: 'left',
            }}
            className="btn-ghost"
          >
            <BarChart3 size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem' }}>View Team Workload & Analytics</span>
          </button>

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <>
              <div style={{ padding: '0.65rem 0.75rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Projects
              </div>
              {filteredProjects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setCurrentProject(proj);
                    setActiveView('project');
                    setIsCommandPaletteOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                  }}
                  className="btn-ghost"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: proj.color }} />
                    <span style={{ fontSize: '0.85rem' }}>{proj.name}</span>
                  </div>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </button>
              ))}
            </>
          )}

          {/* Matching Tasks */}
          {filteredTasks.length > 0 && (
            <>
              <div style={{ padding: '0.65rem 0.75rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Matching Tasks
              </div>
              {filteredTasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setIsCommandPaletteOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                  }}
                  className="btn-ghost"
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {t.project_name} • {t.status}
                    </div>
                  </div>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
