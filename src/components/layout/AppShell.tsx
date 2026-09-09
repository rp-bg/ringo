'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import KanbanBoard from '@/components/board/KanbanBoard';
import TaskListView from '@/components/list/TaskListView';
import TaskCalendarView from '@/components/calendar/TaskCalendarView';
import TaskTimelineView from '@/components/timeline/TaskTimelineView';
import MyTasksView from '@/components/my-tasks/MyTasksView';
import FocusModeView from '@/components/focus/FocusModeView';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import WorkspaceSettings from '@/components/admin/WorkspaceSettings';
import TaskDetailModal from '@/components/task/TaskDetailModal';
import QuickAddModal from '@/components/common/QuickAddModal';
import CommandPalette from '@/components/common/CommandPalette';

export default function AppShell() {
  const { activeView, projectViewMode } = useApp();

  const renderMainView = () => {
    switch (activeView) {
      case 'my-tasks':
        return <MyTasksView />;
      case 'focus':
        return <FocusModeView />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'settings':
        return <WorkspaceSettings />;
      case 'project':
      default:
        switch (projectViewMode) {
          case 'list':
            return <TaskListView />;
          case 'calendar':
            return <TaskCalendarView />;
          case 'timeline':
            return <TaskTimelineView />;
          case 'board':
          default:
            return <KanbanBoard />;
        }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderMainView()}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <TaskDetailModal />
      <QuickAddModal />
      <CommandPalette />
    </div>
  );
}
