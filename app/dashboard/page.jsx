'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function DashboardContent() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [connectedApps, setConnectedApps] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.displayName || '');
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/internal/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, fullName }),
      });
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
    setSaving(false);
  };

  if (loading || !user) {
    return (
      <div className="loading-overlay">
        <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 32, width: 'auto' }} />
        <span className="spinner" style={{ width: 24, height: 24, color: 'var(--primary)', marginTop: 'var(--space-4)' }} />
      </div>
    );
  }

  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="bg-animated" />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 22, width: 'auto' }} />
        </Link>

        <div className="navbar-actions">
          <div className="user-menu">
            <div
              className="avatar"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="avatar-placeholder">{initials}</div>
              )}
            </div>

            <div className={`user-menu-dropdown ${menuOpen ? 'open' : ''}`}>
              <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                  {user.displayName || 'Deevo User'}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>
                  {user.email}
                </div>
              </div>
              <div className="user-menu-divider" />
              <button className="user-menu-item" onClick={() => { setMenuOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </button>
              <div className="user-menu-divider" />
              <button className="user-menu-item" onClick={handleSignOut} style={{ color: 'var(--error)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="dashboard-grid" style={{ paddingTop: 'var(--space-8)' }}>
        {/* Profile Section */}
        <div className="glass-card section-card">
          <h2 className="section-title">Profile</h2>
          <div className="profile-header">
            <div className="avatar avatar-lg">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="avatar-placeholder">{initials}</div>
              )}
            </div>
            <div className="profile-info">
              {editing ? (
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ maxWidth: 250 }}
                    placeholder="Your name"
                  />
                  <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ padding: '0.5rem 1rem', fontSize: 'var(--font-size-sm)' }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setEditing(false); setFullName(user.displayName || ''); }} style={{ padding: '0.5rem 1rem', fontSize: 'var(--font-size-sm)' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2>{user.displayName || 'Deevo User'}</h2>
                  <p>{user.email}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {user.emailVerified ? (
                      <span className="chip chip-success">✓ Verified</span>
                    ) : (
                      <span className="chip chip-warning">⚠ Unverified</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {!editing && (
            <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}>
              Edit Profile
            </button>
          )}
        </div>

        {/* Connected Apps */}
        <div className="glass-card section-card">
          <h2 className="section-title">Connected Apps</h2>
          {connectedApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--on-surface-variant)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>No apps connected yet</p>
              <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)', opacity: 0.6 }}>
                When you sign in to apps using Deevo, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <div className="app-list">
              {connectedApps.map((app, i) => (
                <div key={i} className="app-item">
                  <div className="app-item-info">
                    <span className="app-item-name">{app.name}</span>
                    <span className="app-item-scope">{app.scope}</span>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--error)' }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Security */}
        <div className="glass-card section-card">
          <h2 className="section-title">Account Security</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="app-item">
              <div className="app-item-info">
                <span className="app-item-name">Sign-in Method</span>
                <span className="app-item-scope">
                  {user.providerData.map((p) => p.providerId === 'google.com' ? 'Google' : 'Email/Password').join(', ')}
                </span>
              </div>
              <span className="chip chip-info">Active</span>
            </div>

            <div className="app-item">
              <div className="app-item-info">
                <span className="app-item-name">Email Verification</span>
                <span className="app-item-scope">{user.email}</span>
              </div>
              {user.emailVerified ? (
                <span className="chip chip-success">Verified</span>
              ) : (
                <span className="chip chip-warning">Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0 var(--space-12)' }}>
          <button className="btn btn-danger" onClick={handleSignOut} style={{ padding: '0.75rem 2rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
