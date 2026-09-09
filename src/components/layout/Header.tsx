'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Search,
  LayoutGrid,
  ListOrdered,
  Calendar,
  Clock,
  Sun,
  Moon,
  Bell,
  Plus,
} from 'lucide-react';

export default function Header() {
  const {
    theme,
    toggleTheme,
    currentTenant,
    currentWorkspace,
    currentProject,
    activeView,
    projectViewMode,
    setProjectViewMode,
    searchQuery,
    selectedPriority,
    setSelectedPriority,
    setIsQuickAddOpen,
    setIsCommandPaletteOpen,
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Mock notifications
  const notifications = [
    { id: '1', title: 'Sarah assigned you to SQLite WAL mode', time: '10m ago', unread: true },
    { id: '2', title: 'Cloud Platform V2 sprint review scheduled', time: '1h ago', unread: true },
    { id: '3', title: 'Maya commented on Design System tokens', time: '3h ago', unread: false },
  ];

  const getViewTitle = () => {
    switch (activeView) {
      case 'my-tasks':
        return 'My Tasks';
      case 'focus':
        return 'Focus Mode / My Day';
      case 'analytics':
        return 'Team Workload & Analytics';
      case 'settings':
        return 'Workspace Settings & Access';
      case 'project':
      default:
        return currentProject?.name || 'Project Overview';
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Breadcrumbs & View Modes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>{currentTenant?.name}</span>
            {activeView === 'project' && currentWorkspace && (
              <>
                <span>/</span>
                <span>{currentWorkspace.name}</span>
              </>
            )}
          </div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {getViewTitle()}
          </h1>
        </div>

        {/* View mode switcher (When in Project view) */}
        {activeView === 'project' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-input)',
              padding: '0.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setProjectViewMode('board')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor:
                  projectViewMode === 'board' ? 'var(--bg-card)' : 'transparent',
                color:
                  projectViewMode === 'board' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: projectViewMode === 'board' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <LayoutGrid size={14} />
              <span>Board</span>
            </button>

            <button
              onClick={() => setProjectViewMode('list')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor:
                  projectViewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                color:
                  projectViewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: projectViewMode === 'list' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <ListOrdered size={14} />
              <span>List</span>
            </button>

            <button
              onClick={() => setProjectViewMode('calendar')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor:
                  projectViewMode === 'calendar' ? 'var(--bg-card)' : 'transparent',
                color:
                  projectViewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: projectViewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Calendar size={14} />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setProjectViewMode('timeline')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor:
                  projectViewMode === 'timeline' ? 'var(--bg-card)' : 'transparent',
                color:
                  projectViewMode === 'timeline' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: projectViewMode === 'timeline' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Clock size={14} />
              <span>Timeline</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Search, Filters, Theme, Notifications, Quick Add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Search Bar & Command Palette Launcher */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            cursor: 'pointer',
            minWidth: '220px',
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>
            {searchQuery ? searchQuery : 'Search tasks...'}
          </span>
          <kbd
            style={{
              fontSize: '0.65rem',
              backgroundColor: 'var(--bg-card)',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Priority Filter */}
        {(activeView === 'project' || activeView === 'my-tasks') && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              className="select-input"
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              style={{
                fontSize: '0.75rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                width: 'auto',
                fontWeight: 500,
              }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn-ghost"
          style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="btn-ghost"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              color: 'var(--text-secondary)',
            }}
            title="Notifications"
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '7px',
                height: '7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-primary)',
              }}
            />
          </button>

          {/* Notifications Popover */}
          {isNotificationsOpen && (
            <div
              className="glass-panel animate-modal"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '320px',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                  Mark all read
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: n.unread ? 'var(--bg-card-hover)' : 'transparent',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: n.unread ? 'var(--accent-primary)' : 'transparent',
                        marginTop: '5px',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: n.unread ? 600 : 400 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {n.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Task Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="btn-primary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem' }}
        >
          <Plus size={16} />
          <span>Task</span>
        </button>
      </div>
    </header>
  );
}
