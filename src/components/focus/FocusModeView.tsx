'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Task } from '@/lib/db/queries';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Circle,
  Flame,
  Target,
  Coffee,
} from 'lucide-react';

export default function FocusModeView() {
  const { tasks, currentUser, setSelectedTaskId, refreshTasks, ax } = useApp();

  // Pomodoro state: default 25 min = 1500 sec
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          confetti({ particleCount: 100, spread: 80 });
          if (mode === 'focus') {
            ax?.endGoal('focus-session-flow', { mode: 'focus', durationMinutes: 25 }, 25);
            alert('Focus session complete! Take a 5 minute break.');
            setMode('break');
            return 5 * 60;
          } else {
            alert('Break is over! Ready to focus again?');
            setMode('focus');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, ax]);

  const toggleTimer = () => {
    if (!isRunning && mode === 'focus') {
      ax?.startGoal('focus-session-flow');
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    if (mode !== newMode) {
      ax?.logActivity('Focus timer mode changed', { mode: newMode });
    }
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // High priority / active tasks for today
  const activeFocusTasks = tasks.filter(t => t.status !== 'done');

  const handleToggle = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    confetti({ particleCount: 70, spread: 70 });
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { status: 'done' }, userId: currentUser?.id }),
      });
      await refreshTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Timer Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => switchMode('focus')}
            className="btn-secondary"
            style={{
              backgroundColor: mode === 'focus' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'focus' ? '#fff' : 'var(--text-secondary)',
              borderColor: mode === 'focus' ? 'var(--accent-primary)' : 'var(--border-subtle)',
              fontWeight: 600,
            }}
          >
            <Flame size={16} />
            <span>Focus Block (25m)</span>
          </button>
          <button
            onClick={() => switchMode('break')}
            className="btn-secondary"
            style={{
              backgroundColor: mode === 'break' ? 'var(--color-done)' : 'transparent',
              color: mode === 'break' ? '#fff' : 'var(--text-secondary)',
              borderColor: mode === 'break' ? 'var(--color-done)' : 'var(--border-subtle)',
              fontWeight: 600,
            }}
          >
            <Coffee size={16} />
            <span>Short Break (5m)</span>
          </button>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '5rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            marginBottom: '1.5rem',
            color: mode === 'focus' ? 'var(--text-primary)' : 'var(--color-done)',
          }}
        >
          {formatTime(timeLeft)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            onClick={toggleTimer}
            className="btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
          </button>

          <button
            onClick={resetTimer}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-full)' }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Focus Objective Checklist */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} color="var(--accent-primary)" />
            <span>Priority Objectives for This Session</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {activeFocusTasks.length} active tasks
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeFocusTasks.map(task => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div onClick={e => handleToggle(e, task)}>
                  <Circle size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{task.title}</h4>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {task.project_name} • Est. {task.estimated_hours}h
                  </span>
                </div>
              </div>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
