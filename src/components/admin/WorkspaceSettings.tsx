'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { User } from '@/lib/db/queries';
import {
  Users,
  Shield,
  Palette,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

export default function WorkspaceSettings() {
  const { currentTenant, setCurrentTenant, refreshAll, ax } = useApp();

  const [orgName, setOrgName] = useState(currentTenant?.name || '');
  const [brandColor, setBrandColor] = useState(currentTenant?.brand_color || '#6366f1');
  const [prevTenantId, setPrevTenantId] = useState(currentTenant?.id);
  const [members, setMembers] = useState<User[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state during render when currentTenant changes without triggering an extra cascading render cycle
  if (currentTenant && currentTenant.id !== prevTenantId) {
    setPrevTenantId(currentTenant.id);
    setOrgName(currentTenant.name);
    setBrandColor(currentTenant.brand_color);
  }

  useEffect(() => {
    if (isInviteModalOpen) {
      ax?.startGoal('member-invite-flow');
    }
  }, [isInviteModalOpen, ax]);

  useEffect(() => {
    if (!currentTenant?.id) return;

    fetch(`/api/members?tenantId=${currentTenant.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.members) setMembers(d.members);
      })
      .catch(err => console.error(err));
  }, [currentTenant?.id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          name: orgName,
          brandColor,
        }),
      });

      if (res.ok) {
        ax?.logActivity('Organization settings updated', {
          tenantId: currentTenant.id,
          hasCustomBrandColor: brandColor !== '#6366f1',
        });
        setCurrentTenant({ ...currentTenant, name: orgName, brand_color: brandColor });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await refreshAll();
      }
    } catch (err) {
      console.error('Failed to update tenant settings:', err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !inviteEmail.trim() || !inviteName.trim()) return;

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
        }),
      }).then(r => r.json());

      if (res.member) {
        ax?.endGoal(
          'member-invite-flow',
          {
            role: inviteRole,
            tenantId: currentTenant.id,
          },
          null
        );
        setMembers(prev => [...prev, res.member]);
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setInviteName('');
      }
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Workspace Settings & Governance
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Manage organization branding, team access controls, and security policies for {currentTenant?.name}.
        </p>
      </div>

      {/* Organization Branding Section */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={18} color="var(--accent-primary)" />
          <span>Organization Profile & Branding</span>
        </h3>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
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
                Organization Name
              </label>
              <input
                type="text"
                className="input-text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
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
                Brand Accent Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  style={{
                    width: '42px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                />
                <input
                  type="text"
                  className="input-text"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {saveSuccess && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-done)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} /> Saved successfully!
              </span>
            )}
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Team Member Management (RBAC) */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--accent-primary)" />
            <span>Team Members & Roles ({members.length})</span>
          </h3>

          <button className="btn-secondary" onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus size={16} />
            <span>Invite Member</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {members.map(member => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="avatar">{member.avatar}</div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{member.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {member.email} • {member.title}
                  </div>
                </div>
              </div>

              <div>
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      member.role === 'owner'
                        ? 'rgba(99, 102, 241, 0.2)'
                        : member.role === 'admin'
                        ? 'rgba(234, 179, 8, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)',
                    color:
                      member.role === 'owner'
                        ? 'var(--accent-primary)'
                        : member.role === 'admin'
                        ? 'var(--color-in-progress)'
                        : 'var(--color-done)',
                  }}
                >
                  {member.role || 'member'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security, Compliance & Audit Info */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="var(--accent-primary)" />
          <span>Security & Compliance Highlights</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              Multi-Tenant Data Segregation
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Active database tenancy boundaries enforced on every query with foreign key scoping.
            </p>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              Audit Trails & Logging
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              All administrative changes and task state transitions logged with immutable timestamps.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div
            className="glass-panel animate-modal"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Invite New Team Member
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Send an invitation to join {currentTenant?.name}.
            </p>

            <form onSubmit={handleInviteMember}>
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
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. Morgan Reed"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  required
                />
              </div>

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
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-text"
                  placeholder="morgan@company.io"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
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
                  Role Permission
                </label>
                <select
                  className="select-input"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="member">Member - Can create, edit, and finish tasks</option>
                  <option value="admin">Admin - Can configure workspace and manage members</option>
                  <option value="guest">Guest - Read-only project viewer</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
