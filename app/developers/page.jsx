'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function DeveloperContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', redirectUri: '' });
  const [creating, setCreating] = useState(false);
  const [createdApp, setCreatedApp] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/internal/developer/clients', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
    setLoadingClients(false);
  };

  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!newApp.name || !newApp.redirectUri) return;

    setCreating(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/internal/developer/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(newApp),
      });
      const data = await res.json();
      setCreatedApp(data);
      setNewApp({ name: '', redirectUri: '' });
      setShowCreate(false);
      fetchClients();
    } catch (err) {
      console.error('Failed to create app:', err);
    }
    setCreating(false);
  };

  const handleDeleteClient = async (clientId) => {
    if (!confirm('Are you sure? This will break any app using this client.')) return;

    try {
      const idToken = await user.getIdToken();
      await fetch(`/api/internal/developer/clients?clientId=${clientId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      fetchClients();
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  if (loading || !user) {
    return (
      <div className="loading-overlay">
        <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 32, width: 'auto' }} />
        <span className="spinner" style={{ width: 24, height: 24, color: 'var(--primary)', marginTop: 'var(--space-4)' }} />
      </div>
    );
  }

  return (
    <>
      <div className="bg-animated" />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 22, width: 'auto' }} />
        </Link>
        <div className="navbar-actions">
          <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: 'var(--font-size-sm)' }}>
            My Account
          </Link>
        </div>
      </nav>

      <div className="dashboard-grid" style={{ paddingTop: 'var(--space-8)', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Developer Console
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              Manage your OAuth applications
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ padding: '0.6rem 1.5rem' }}>
            + New App
          </button>
        </div>

        {/* Created App Credentials (shown once after creation) */}
        {createdApp && (
          <div className="alert alert-success" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>✓ App Created Successfully!</strong>
              <button className="btn btn-ghost" onClick={() => setCreatedApp(null)} style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-xs)' }}>
                Dismiss
              </button>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8 }}>
              Save these credentials now — the Client Secret will NOT be shown again.
            </p>
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', wordBreak: 'break-all' }}>
              <div><span style={{ color: 'var(--on-surface-variant)' }}>Client ID:</span> {createdApp.clientId}</div>
              <div style={{ marginTop: 'var(--space-2)' }}><span style={{ color: 'var(--on-surface-variant)' }}>Client Secret:</span> {createdApp.clientSecret}</div>
            </div>
          </div>
        )}

        {/* Create App Form */}
        {showCreate && (
          <div className="glass-card section-card">
            <h2 className="section-title">Register New Application</h2>
            <form onSubmit={handleCreateApp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="app-name">Application Name</label>
                <input
                  id="app-name"
                  className="form-input"
                  placeholder="My Deevo App"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="app-redirect">Redirect URI</label>
                <input
                  id="app-redirect"
                  className="form-input"
                  placeholder="https://myapp.com/auth/callback"
                  value={newApp.redirectUri}
                  onChange={(e) => setNewApp({ ...newApp, redirectUri: e.target.value })}
                  required
                />
                <span className="form-error" style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-xs)' }}>
                  The URL where users will be redirected after authentication
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Application'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Apps List */}
        <div className="glass-card section-card">
          <h2 className="section-title">Your Applications</h2>
          {loadingClients ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <span className="spinner" style={{ width: 24, height: 24, color: 'var(--primary)', margin: '0 auto' }} />
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--on-surface-variant)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>No applications registered yet</p>
              <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)', opacity: 0.6 }}>
                Create your first app to start integrating Deevo Auth
              </p>
            </div>
          ) : (
            <div className="app-list">
              {clients.map((client) => (
                <div key={client.id} className="app-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="app-item-name">{client.name}</span>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 'var(--font-size-xs)', color: 'var(--error)', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', wordBreak: 'break-all' }}>
                    <div>Client ID: <span style={{ color: 'var(--primary)' }}>{client.id}</span></div>
                    <div style={{ marginTop: '2px' }}>Redirect: <span style={{ color: 'var(--on-surface)' }}>{client.redirectUri}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integration Guide */}
        <div className="glass-card section-card">
          <h2 className="section-title">Quick Integration Guide</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--primary)' }}>
                1. Install the SDK
              </h3>
              <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--on-surface)' }}>
                npm install deevo-auth
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--primary)' }}>
                2. Configure in your app
              </h3>
              <pre style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--on-surface)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
{`import { DeevoAuth } from 'deevo-auth';

const deevo = new DeevoAuth({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://yourapp.com/auth/callback',
});`}
              </pre>
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--primary)' }}>
                3. Redirect users to sign in
              </h3>
              <pre style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: 'var(--on-surface)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
{`// Redirect to Deevo login
const loginUrl = deevo.getAuthUrl();
window.location.href = loginUrl;

// In your callback route:
const { accessToken, user } = await deevo.handleCallback(code);
console.log(user.email, user.name);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DeveloperPage() {
  return (
    <AuthProvider>
      <DeveloperContent />
    </AuthProvider>
  );
}
