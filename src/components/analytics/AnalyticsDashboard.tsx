'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { AnalyticsData } from '@/lib/db';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Users,
  Download,
  Clock,
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const { currentTenant, tasks, ax } = useApp();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!currentTenant) return;
    fetch(`/api/analytics?tenantId=${currentTenant.id}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(err => console.error('Failed to load analytics:', err));
  }, [currentTenant, tasks]);

  const exportCSV = () => {
    ax?.startGoal('export-tasks-flow');
    try {
      const headers = ['ID', 'Title', 'Project', 'Status', 'Priority', 'Due Date', 'Est Hours'];
      const rows = tasks.map(t => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.project_name || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.due_date || '',
        t.estimated_hours || 0,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ringo-tasks-${currentTenant?.slug || 'export'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      ax?.endGoal(
        'export-tasks-flow',
        {
          tenantId: currentTenant?.id,
          taskCount: tasks.length,
        },
        tasks.length
      );
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const overview = data?.overview || {};
  const workload = data?.workload || [];

  const total = Number(overview.total || 0);
  const completed = Number(overview.completed || 0);
  const inProgress = Number(overview.in_progress || 0);
  const overdue = Number(overview.overdue || 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Team Workload & Velocity
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time delivery metrics, capacity allocation, and project velocity for {currentTenant?.name}.
          </p>
        </div>

        <button className="btn-secondary" onClick={exportCSV}>
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Tasks
            </span>
            <BarChart3 size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{total}</div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Across active projects</span>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Completion Rate
            </span>
            <CheckCircle2 size={18} color="var(--color-done)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-done)' }}>
            {completionRate}%
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{completed} tasks shipped</span>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              In Flight
            </span>
            <Clock size={18} color="var(--color-in-progress)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-in-progress)' }}>
            {inProgress}
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Currently in development</span>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Overdue Alerts
            </span>
            <AlertTriangle size={18} color="var(--color-urgent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-urgent)' }}>
            {overdue}
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Needs immediate attention</span>
        </div>
      </div>

      {/* Team Capacity & Workload Allocation */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--accent-primary)" />
          <span>Team Capacity & Task Distribution</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {workload.map((user) => {
            const assigned = Number(user.assigned_count || 0);
            const userCompleted = Number(user.completed_count || 0);
            const userPercent = total > 0 ? Math.round((assigned / total) * 100) : 0;

            return (
              <div key={user.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="avatar avatar-sm">{user.avatar}</div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      ({user.title})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {assigned} assigned • {userCompleted} completed
                  </div>
                </div>

                <div
                  style={{
                    height: '8px',
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${userPercent}%`,
                      backgroundColor: userPercent > 40 ? 'var(--color-urgent)' : 'var(--accent-primary)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
