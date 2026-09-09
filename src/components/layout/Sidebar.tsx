'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  Target,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const {
    tenants,
    currentTenant,
    setCurrentTenant,
    users,
    currentUser,
    setCurrentUser,
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    projects,
    currentProject,
    setCurrentProject,
    activeView,
    setActiveView,
    tasks,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setIsQuickAddOpen,
    refreshAll,
    ax,
  } = useApp();

  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366f1');

  React.useEffect(() => {
    if (isNewProjectModalOpen) {
      ax?.startGoal('create-project-flow');
    }
  }, [isNewProjectModalOpen, ax]);

  // Count my open tasks
  const myTasksCount = tasks.filter(
    t => currentUser && t.assignees.some(a => a.id === currentUser.id) && t.status !== 'done'
  ).length;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !currentWorkspace || !currentTenant) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          tenantId: currentTenant.id,
          name: newProjectName.trim(),
          color: newProjectColor,
          icon: 'FolderKanban',
        }),
      }).then(r => r.json());

      if (res.project) {
        ax?.endGoal(
          'create-project-flow',
          {
            workspaceId: currentWorkspace.id,
            tenantId: currentTenant.id,
          },
          null
        );
        setIsNewProjectModalOpen(false);
        setNewProjectName('');
        await refreshAll();
        setCurrentProject(res.project);
        setActiveView('project');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const projectList = projects.filter(
    p => !currentWorkspace || p.workspace_id === currentWorkspace.id
  );

  return (
    <>
      <aside
        style={{
          width: isSidebarCollapsed ? '72px' : '280px',
          transition: 'width var(--transition-smooth)',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Top: Organization / Tenant Switcher */}
        <div
          style={{
            padding: isSidebarCollapsed ? '1rem 0.5rem' : '1.25rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'relative',
          }}
        >
          {isSidebarCollapsed ? (
            <button
              title={currentTenant?.name || 'Ringo ToDo'}
              onClick={() => setIsSidebarCollapsed(false)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: currentTenant?.brand_color || 'var(--accent-primary)',
                color: '#fff',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Zap size={22} />
            </button>
          ) : (
            <div>
              <button
                onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: currentTenant?.brand_color || 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={18} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentTenant?.name || 'Select Org'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {currentTenant?.plan || 'Multi-Tenant'}
                    </div>
                  </div>
                </div>
                <ChevronDown size={16} color="var(--text-muted)" />
              </button>

              {/* Tenant Dropdown */}
              {isTenantDropdownOpen && (
                <div
                  className="glass-panel animate-modal"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '1rem',
                    right: '1rem',
                    marginTop: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 50,
                    padding: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      padding: '0.35rem 0.5rem',
                      fontWeight: 700,
                    }}
                  >
                    Switch Organization (Multi-Tenant)
                  </div>
                  {tenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        if (currentTenant && currentTenant.id !== tenant.id) {
                          ax?.logActivity('Organization switched', {
                            fromTenantId: currentTenant.id,
                            toTenantId: tenant.id,
                          });
                        }
                        setCurrentTenant(tenant);
                        setIsTenantDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        backgroundColor:
                          currentTenant?.id === tenant.id ? 'var(--bg-card-hover)' : 'transparent',
                        fontWeight: currentTenant?.id === tenant.id ? 600 : 400,
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: tenant.brand_color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        <Sparkles size={12} />
                      </div>
                      <span style={{ fontSize: '0.825rem' }}>{tenant.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Action Button */}
        <div style={{ padding: isSidebarCollapsed ? '0.75rem 0.5rem' : '0.85rem 1rem' }}>
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="btn-primary"
            style={{
              width: '100%',
              padding: isSidebarCollapsed ? '0.65rem 0' : '0.65rem 1rem',
              justifyContent: 'center',
            }}
            title="Create Task (Q)"
          >
            <Plus size={18} />
            {!isSidebarCollapsed && <span>New Task</span>}
          </button>
        </div>

        {/* Navigation & Sections */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isSidebarCollapsed ? '0.5rem 0.25rem' : '0.5rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Main Views */}
          <div>
            {!isSidebarCollapsed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  padding: '0 0.5rem 0.4rem',
                  letterSpacing: '0.05em',
                }}
              >
                Views
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                onClick={() => setActiveView('my-tasks')}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                  backgroundColor:
                    activeView === 'my-tasks' ? 'var(--bg-card-hover)' : 'transparent',
                  color: activeView === 'my-tasks' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border:
                    activeView === 'my-tasks'
                      ? '1px solid var(--border-active)'
                      : '1px solid transparent',
                  fontWeight: activeView === 'my-tasks' ? 600 : 500,
                }}
                title="My Tasks"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <CheckCircle2 size={18} />
                  {!isSidebarCollapsed && <span>My Tasks</span>}
                </div>
                {!isSidebarCollapsed && myTasksCount > 0 && (
                  <span
                    style={{
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {myTasksCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveView('focus')}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  gap: '0.7rem',
                  backgroundColor:
                    activeView === 'focus' ? 'var(--bg-card-hover)' : 'transparent',
                  color: activeView === 'focus' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border:
                    activeView === 'focus'
                      ? '1px solid var(--border-active)'
                      : '1px solid transparent',
                  fontWeight: activeView === 'focus' ? 600 : 500,
                }}
                title="Focus Mode / My Day"
              >
                <Target size={18} />
                {!isSidebarCollapsed && <span>Focus / My Day</span>}
              </button>

              <button
                onClick={() => setActiveView('analytics')}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  gap: '0.7rem',
                  backgroundColor:
                    activeView === 'analytics' ? 'var(--bg-card-hover)' : 'transparent',
                  color: activeView === 'analytics' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border:
                    activeView === 'analytics'
                      ? '1px solid var(--border-active)'
                      : '1px solid transparent',
                  fontWeight: activeView === 'analytics' ? 600 : 500,
                }}
                title="Workload & Analytics"
              >
                <BarChart3 size={18} />
                {!isSidebarCollapsed && <span>Team Analytics</span>}
              </button>

              <button
                onClick={() => setActiveView('settings')}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  gap: '0.7rem',
                  backgroundColor:
                    activeView === 'settings' ? 'var(--bg-card-hover)' : 'transparent',
                  color: activeView === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border:
                    activeView === 'settings'
                      ? '1px solid var(--border-active)'
                      : '1px solid transparent',
                  fontWeight: activeView === 'settings' ? 600 : 500,
                }}
                title="Workspace Settings & RBAC"
              >
                <Settings size={18} />
                {!isSidebarCollapsed && <span>Settings & Roles</span>}
              </button>
            </div>
          </div>

          {/* Workspaces & Projects */}
          <div>
            {!isSidebarCollapsed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 0.5rem 0.4rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Workspaces
                </span>
              </div>
            )}

            {/* Workspace Pills */}
            {!isSidebarCollapsed && workspaces.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => setCurrentWorkspace(ws)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background:
                        currentWorkspace?.id === ws.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                      color: currentWorkspace?.id === ws.id ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 600,
                    }}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}

            {!isSidebarCollapsed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.5rem 0.35rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Projects
                </span>
                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  style={{
                    padding: '0.15rem 0.4rem',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  title="Create Project"
                >
                  <Plus size={15} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {projectList.map(proj => {
                const isSelected = activeView === 'project' && currentProject?.id === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setCurrentProject(proj);
                      setActiveView('project');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                      backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid var(--border-active)' : '1px solid transparent',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    title={proj.name}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          backgroundColor: proj.color,
                          flexShrink: 0,
                        }}
                      />
                      {!isSidebarCollapsed && (
                        <span
                          style={{
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {proj.name}
                        </span>
                      )}
                    </div>
                    {!isSidebarCollapsed && proj.task_count !== undefined && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {proj.task_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Persona & Role Switcher */}
        <div
          style={{
            padding: isSidebarCollapsed ? '0.75rem 0.5rem' : '0.85rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            position: 'relative',
          }}
        >
          {isSidebarCollapsed ? (
            <div
              className="avatar"
              title={`${currentUser?.name} (${currentUser?.role || 'Member'})`}
              onClick={() => setIsSidebarCollapsed(false)}
              style={{ cursor: 'pointer', margin: '0 auto' }}
            >
              {currentUser?.avatar || 'U'}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                  <div className="avatar">{currentUser?.avatar || 'U'}</div>
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.825rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentUser?.name || 'User'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{currentUser?.title}</span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.05rem 0.4rem',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {currentUser?.role || 'Member'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown size={15} color="var(--text-muted)" />
              </button>

              {/* User Persona Dropdown */}
              {isUserDropdownOpen && (
                <div
                  className="glass-panel animate-modal"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '1rem',
                    right: '1rem',
                    marginBottom: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 50,
                    padding: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      padding: '0.35rem 0.5rem',
                      fontWeight: 700,
                    }}
                  >
                    Switch User Persona (RBAC Testing)
                  </div>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setIsUserDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor:
                          currentUser?.id === user.id ? 'var(--bg-card-hover)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div className="avatar avatar-sm">{user.avatar}</div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {user.title}
                          </div>
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.62rem',
                          textTransform: 'uppercase',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {user.role || 'Member'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            zIndex: 45,
            boxShadow: 'var(--shadow-sm)',
          }}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProjectModalOpen(false)}>
          <div
            className="glass-panel animate-modal"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Create New Project
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Add a new project to the {currentWorkspace?.name} workspace.
            </p>
            <form onSubmit={handleCreateProject}>
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
                  Project Name
                </label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. Mobile Application V2"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Color Accent
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'].map(
                    c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewProjectColor(c)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-full)',
                          background: c,
                          border:
                            newProjectColor === c ? '2px solid #ffffff' : '2px solid transparent',
                          boxShadow: newProjectColor === c ? '0 0 8px ' + c : 'none',
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
