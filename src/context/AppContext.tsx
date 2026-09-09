'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant, User, Workspace, Project, Task, TaskList } from '@/lib/db/queries';
import { useAX } from '@/lib/ax-client';
import type { AXReact } from '@appxiom/4react';

interface AppContextType {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Multi-tenancy & Organization
  tenants: Tenant[];
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  // Workspaces & Projects
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projectLists: TaskList[];

  // Views & Navigation
  activeView: 'project' | 'my-tasks' | 'focus' | 'analytics' | 'settings';
  setActiveView: (view: 'project' | 'my-tasks' | 'focus' | 'analytics' | 'settings') => void;
  projectViewMode: 'board' | 'list' | 'calendar' | 'timeline';
  setProjectViewMode: (mode: 'board' | 'list' | 'calendar' | 'timeline') => void;

  // Tasks & Data
  tasks: Task[];
  isLoadingTasks: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPriority: string;
  setSelectedPriority: (priority: string) => void;
  refreshTasks: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Appxiom Telemetry
  ax: AXReact | null;

  // Modals & Panels
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const ax = useAX();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectLists, setProjectLists] = useState<TaskList[]>([]);

  const [activeView, setActiveView] = useState<'project' | 'my-tasks' | 'focus' | 'analytics' | 'settings'>('project');
  const [projectViewMode, setProjectViewMode] = useState<'board' | 'list' | 'calendar' | 'timeline'>('board');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync Appxiom User Custom ID
  useEffect(() => {
    if (ax && currentUser) {
      try {
        ax.setCustomId(`${currentTenant?.slug || 'tenant'}:${currentUser.id}`);
      } catch (err) {
        console.warn('Appxiom setCustomId notice:', err);
      }
    }
  }, [ax, currentUser, currentTenant]);

  // 1. Initial Load: Tenants & Users
  useEffect(() => {
    async function loadInitial() {
      try {
        const [tenantsRes, membersRes] = await Promise.all([
          fetch('/api/tenants').then(r => r.json()),
          fetch('/api/members?all=true').then(r => r.json()),
        ]);

        if (tenantsRes.tenants && tenantsRes.tenants.length > 0) {
          setTenants(tenantsRes.tenants);
          setCurrentTenant(tenantsRes.tenants[0]);
        }

        if (membersRes.users && membersRes.users.length > 0) {
          setUsers(membersRes.users);
          setCurrentUser(membersRes.users[0]);
        }
      } catch (err) {
        console.error('Failed to load initial tenants/users:', err);
      }
    }
    loadInitial();
  }, []);

  // 2. Load Workspaces and Projects when Current Tenant changes
  useEffect(() => {
    if (!currentTenant) return;

    async function loadTenantData() {
      try {
        const [wsRes, projRes] = await Promise.all([
          fetch(`/api/workspaces?tenantId=${currentTenant!.id}`).then(r => r.json()),
          fetch(`/api/projects?tenantId=${currentTenant!.id}`).then(r => r.json()),
        ]);

        if (wsRes.workspaces) {
          setWorkspaces(wsRes.workspaces);
          setCurrentWorkspace(wsRes.workspaces[0] || null);
        }

        if (projRes.projects) {
          setProjects(projRes.projects);
          setCurrentProject(projRes.projects[0] || null);
        }
      } catch (err) {
        console.error('Failed to load workspaces and projects:', err);
      }
    }

    loadTenantData();
  }, [currentTenant]);

  // 3. Load Tasks & Task Lists
  const refreshTasks = useCallback(async () => {
    if (!currentTenant) return;
    setIsLoadingTasks(true);

    try {
      let url = `/api/tasks?tenantId=${currentTenant.id}`;
      if (activeView === 'project' && currentProject) {
        url += `&projectId=${currentProject.id}`;
      } else if (activeView === 'my-tasks' && currentUser) {
        url += `&userId=${currentUser.id}`;
      }

      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url).then(r => r.json());
      if (res.tasks) {
        setTasks(res.tasks);
      }
      if (res.lists) {
        setProjectLists(res.lists);
      }
    } catch (err) {
      console.error('Failed to refresh tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [currentTenant, activeView, currentProject, currentUser, searchQuery]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const refreshAll = async () => {
    await refreshTasks();
    if (currentTenant) {
      const projRes = await fetch(`/api/projects?tenantId=${currentTenant.id}`).then(r => r.json());
      if (projRes.projects) setProjects(projRes.projects);
    }
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K, Q for quick add)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
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
        projectLists,
        activeView,
        setActiveView,
        projectViewMode,
        setProjectViewMode,
        tasks,
        isLoadingTasks,
        searchQuery,
        setSearchQuery,
        selectedPriority,
        setSelectedPriority,
        refreshTasks,
        refreshAll,
        isQuickAddOpen,
        setIsQuickAddOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        selectedTaskId,
        setSelectedTaskId,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        ax,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
