'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CallbackContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setError(`Access was denied: ${errorParam}`);
      setLoading(false);
      return;
    }

    if (!code) {
      setError('No authorization code received. Please start the test from /test');
      setLoading(false);
      return;
    }

    // Get saved credentials from sessionStorage
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('deevo_test_creds') : null;
    if (!saved) {
      setError('No test credentials found in this browser session. Please go to /test and enter your Client ID & Secret first.');
      setLoading(false);
      return;
    }

    try {
      const { clientId, clientSecret } = JSON.parse(saved);
      exchangeCode(code, clientId, clientSecret);
    } catch {
      setError('Failed to parse saved credentials.');
      setLoading(false);
    }
  }, [code, errorParam]);

  const exchangeCode = async (code, clientId, clientSecret) => {
    try {
      // Step 1: Exchange code for access token
      setStep('Exchanging authorization code for access token...');
      const redirectUri = `${window.location.origin}/test/callback`;

      const tokenRes = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        throw new Error(`Token exchange failed: ${tokenData.message || tokenData.error}`);
      }

      // Step 2: Get user info using the access token
      setStep('Fetching user profile with access token...');
      const userRes = await fetch('/api/oauth/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const userData = await userRes.json();
      if (userData.error) {
        throw new Error(`UserInfo failed: ${userData.message || userData.error}`);
      }

      setResult({
        token: tokenData,
        user: userData,
        code,
        clientId,
      });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerifyToken = async () => {
    if (!result) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/oauth/userinfo', {
        headers: { Authorization: `Bearer ${result.token.access_token}` },
      });
      const data = await res.json();

      if (data.error) {
        setVerifyResult({ valid: false, error: data.message || data.error });
      } else {
        setVerifyResult({ valid: true, user: data });
      }
    } catch (err) {
      setVerifyResult({ valid: false, error: err.message });
    }
    setVerifying(false);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <div className="bg-animated" />
        <div className="page-center">
          <div className="auth-container" style={{ maxWidth: 500 }}>
            <div className="glass-card auth-card" style={{ textAlign: 'center' }}>
              <span className="spinner" style={{ width: 32, height: 32, margin: '0 auto var(--space-4)' }} />
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Processing OAuth Callback
              </h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)' }}>{step}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <div className="bg-animated" />
        <div className="page-center">
          <div className="auth-container" style={{ maxWidth: 500 }}>
            <div className="glass-card auth-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>✗</div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--error)' }}>
                Test Failed
              </h2>
              <div className="alert alert-error" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
                <span>{error}</span>
              </div>
              <Link href="/test" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                ← Try Again
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Success state
  return (
    <>
      <div className="bg-animated" />

      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 22, width: 'auto' }} />
        </Link>
        <div className="navbar-actions">
          <Link href="/test" className="btn btn-ghost" style={{ fontSize: 'var(--font-size-sm)' }}>
            ← Back to Playground
          </Link>
        </div>
      </nav>

      <div className="dashboard-grid" style={{ paddingTop: 'var(--space-8)', maxWidth: '720px' }}>
        {/* Success Banner */}
        <div className="alert alert-success" style={{
          padding: 'var(--space-5)',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem' }}>✓</div>
          <strong style={{ fontSize: 'var(--font-size-lg)' }}>OAuth Flow Completed Successfully!</strong>
          <span style={{ opacity: 0.8, fontSize: 'var(--font-size-sm)' }}>
            Authorization code exchanged → Access token received → User profile fetched
          </span>
        </div>

        {/* User Profile */}
        <div className="glass-card section-card">
          <h2 className="section-title">👤 User Profile (from /api/oauth/userinfo)</h2>
          <div className="profile-header">
            <div className="avatar avatar-lg">
              {result.user.picture ? (
                <img src={result.user.picture} alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="avatar-placeholder">
                  {(result.user.name || result.user.email || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2>{result.user.name || 'No Name'}</h2>
              <p>{result.user.email}</p>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span className="chip chip-success">Authenticated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Raw User Data */}
        <div className="glass-card section-card">
          <h2 className="section-title">📦 Raw User Response</h2>
          <pre style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--on-surface)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
          }}>
{JSON.stringify(result.user, null, 2)}
          </pre>
        </div>

        {/* Token Info */}
        <div className="glass-card section-card">
          <h2 className="section-title">🔑 Access Token (JWT)</h2>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'var(--primary)',
            wordBreak: 'break-all',
            lineHeight: 1.8,
            maxHeight: 120,
            overflow: 'auto',
          }}>
            {result.token.access_token}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
            <span className="chip chip-info">Type: {result.token.token_type}</span>
            <span className="chip chip-info">Expires: {result.token.expires_in}s</span>
            <span className="chip chip-info">Scope: {result.token.scope}</span>
          </div>

          {/* Verify Button */}
          <button
            className="btn btn-primary"
            onClick={handleVerifyToken}
            disabled={verifying}
            style={{ marginTop: 'var(--space-5)', padding: '10px 20px', fontSize: 'var(--font-size-sm)' }}
          >
            {verifying ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying...</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Verify Token is Still Valid</>
            )}
          </button>

          {verifyResult && (
            <div className={`alert ${verifyResult.valid ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 'var(--space-4)' }}>
              {verifyResult.valid ? (
                <span>✓ <strong>Token verified!</strong> Server confirms: {verifyResult.user.name} ({verifyResult.user.email})</span>
              ) : (
                <span>✗ <strong>Token invalid:</strong> {verifyResult.error}</span>
              )}
            </div>
          )}
        </div>

        {/* Flow Details */}
        <div className="glass-card section-card">
          <h2 className="section-title">📋 Flow Details</h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 1.8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--space-3)' }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>Client ID</span>
              <span style={{ color: 'var(--on-surface)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{result.clientId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--space-3)' }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>Auth Code</span>
              <span style={{ color: 'var(--on-surface)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{result.code}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 'var(--space-3)' }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>User ID (sub)</span>
              <span style={{ color: 'var(--on-surface)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{result.user.sub}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>Redirect URI</span>
              <span style={{ color: 'var(--on-surface)', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{typeof window !== 'undefined' ? `${window.location.origin}/test/callback` : ''}</span>
            </div>
          </div>
        </div>

        {/* Try Again */}
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0 var(--space-12)' }}>
          <Link href="/test" className="btn btn-secondary" style={{ padding: '12px 32px' }}>
            ← Run Another Test
          </Link>
        </div>
      </div>
    </>
  );
}

function CallbackFallback() {
  return (
    <>
      <div className="bg-animated" />
      <div className="page-center">
        <div className="auth-container">
          <div className="glass-card auth-card" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function TestCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
