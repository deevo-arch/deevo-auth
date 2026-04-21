'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [appName, setAppName] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'profile email';
  const state = searchParams.get('state') || '';

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login with OAuth params preserved
      const params = new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri || '',
        scope,
      });
      if (state) params.set('state', state);
      router.push(`/login?${params.toString()}`);
    }
  }, [user, loading, router, clientId, redirectUri, scope, state]);

  useEffect(() => {
    // Fetch real app name from client-info API
    if (clientId) {
      setAppLoading(true);
      fetch(`/api/oauth/client-info?client_id=${encodeURIComponent(clientId)}`)
        .then(res => res.json())
        .then(data => {
          setAppName(data.name || clientId);
          setAppLoading(false);
        })
        .catch(() => {
          setAppName(clientId);
          setAppLoading(false);
        });
    } else {
      setAppLoading(false);
    }
  }, [clientId]);

  const handleAllow = async () => {
    if (!clientId || !redirectUri) {
      setError('Missing application details.');
      return;
    }

    setProcessing(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/internal/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, clientId, redirectUri }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.message || data.error);

      // Redirect back to client app with code (and state if present)
      let callbackUrl = `${redirectUri}?code=${data.code}`;
      if (state) callbackUrl += `&state=${encodeURIComponent(state)}`;
      window.location.href = callbackUrl;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to authorize. Please try again.');
      setProcessing(false);
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      let denyUrl = `${redirectUri}?error=access_denied`;
      if (state) denyUrl += `&state=${encodeURIComponent(state)}`;
      window.location.href = denyUrl;
    } else {
      router.push('/dashboard');
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

  const permissions = scope.split(' ').map((s) => {
    switch (s) {
      case 'profile': return { label: 'View your profile information', desc: 'Name, avatar' };
      case 'email': return { label: 'View your email address', desc: 'Email' };
      case 'openid': return { label: 'Verify your identity', desc: 'User ID' };
      default: return { label: s, desc: '' };
    }
  });

  return (
    <>
      <div className="bg-animated" />
      <div className="page-center">
        <div className="auth-container" style={{ maxWidth: 480 }}>
          <div className="glass-card consent-card">
            {/* App Icon */}
            <div className="consent-app-icon">
              <span>{(appName || '?')[0].toUpperCase()}</span>
            </div>

            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Authorize Access
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)' }}>
              <strong style={{ color: 'var(--on-surface)' }}>{appName || 'An application'}</strong> wants to access your Deevo Account
            </p>

            {/* User info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--surface-container-low)',
              borderRadius: 'var(--radius-md)',
              margin: 'var(--space-6) 0',
            }}>
              <div className="avatar" style={{ width: 36, height: 36, cursor: 'default' }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: 'var(--font-size-sm)' }}>
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                  {user.displayName || 'Deevo User'}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)' }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="consent-permissions">
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--outline)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                This will allow the app to:
              </p>
              {permissions.map((perm, i) => (
                <div key={i} className="consent-permission-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{perm.label}</span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="consent-actions">
              <button className="btn btn-secondary" onClick={handleDeny} disabled={processing}>
                Deny
              </button>
              <button className="btn btn-primary" onClick={handleAllow} disabled={processing}>
                {processing ? (
                  <>
                    <span className="spinner" />
                    Authorizing...
                  </>
                ) : (
                  'Allow'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ConsentFallback() {
  return (
    <div className="page-center">
      <div className="auth-container">
        <div className="glass-card auth-card" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    
      <Suspense fallback={<ConsentFallback />}>
        <ConsentContent />
      </Suspense>
    
  );
}
