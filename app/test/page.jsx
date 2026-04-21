'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function TestContent() {
  const { user, loading: authLoading } = useAuth();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    // Auto-populate redirect URI with current origin
    if (typeof window !== 'undefined') {
      setRedirectUri(`${window.location.origin}/test/callback`);

      // Restore saved credentials
      const saved = sessionStorage.getItem('deevo_test_creds');
      if (saved) {
        try {
          const { clientId: cid, clientSecret: cs } = JSON.parse(saved);
          if (cid) setClientId(cid);
          if (cs) setClientSecret(cs);
        } catch {}
      }
    }
  }, []);

  const handleStartTest = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      alert('Please enter both Client ID and Client Secret');
      return;
    }

    // Save credentials for callback page to use
    sessionStorage.setItem('deevo_test_creds', JSON.stringify({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    }));

    // Build the OAuth authorization URL (same as what the SDK generates)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId.trim(),
      redirect_uri: redirectUri,
      scope: 'profile email',
    });

    window.location.href = `/login?${params.toString()}`;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <>
      <div className="bg-animated" />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 22, width: 'auto' }} />
        </Link>
        <div className="navbar-actions">
          <Link href="/developers" className="btn btn-ghost" style={{ fontSize: 'var(--font-size-sm)' }}>
            Developer Console
          </Link>
          {user && (
            <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: 'var(--font-size-sm)' }}>
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      <div className="dashboard-grid" style={{ paddingTop: 'var(--space-8)', maxWidth: '720px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'var(--primary-container)',
            color: 'var(--on-primary-container)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
            opacity: 0.8,
          }}>
            🧪 PLAYGROUND
          </div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            OAuth Test Playground
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)', lineHeight: 1.7 }}>
            Test your OAuth integration right here — no separate app needed.<br />
            Enter your credentials and walk through the complete flow.
          </p>
        </div>

        {/* Step 1: Setup Instructions */}
        <div className="glass-card section-card">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-full)', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>1</span>
            Get Your Credentials
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
            First, register an OAuth app in the{' '}
            <Link href="/developers" style={{ color: 'var(--primary)', fontWeight: 500 }}>Developer Console</Link>.
            Use the redirect URI below when creating your app:
          </p>

          {/* Redirect URI Copy Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
          }}>
            <code style={{ flex: 1, fontSize: 'var(--font-size-xs)', color: 'var(--primary)', wordBreak: 'break-all' }}>
              {redirectUri || 'Loading...'}
            </code>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: 'var(--font-size-xs)', flexShrink: 0 }}
              onClick={() => copyToClipboard(redirectUri, 'uri')}
            >
              {copied === 'uri' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Step 2: Enter Credentials */}
        <div className="glass-card section-card">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-full)', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</span>
            Enter Credentials
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="test-client-id">Client ID</label>
              <input
                id="test-client-id"
                className="form-input"
                type="text"
                placeholder="Paste your Client ID from Developer Console"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="test-client-secret">Client Secret</label>
              <input
                id="test-client-secret"
                className="form-input"
                type="password"
                placeholder="Paste your Client Secret (dv_...)"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--on-surface-variant)', marginTop: 'var(--space-1)', display: 'block' }}>
                Credentials are stored in your browser&apos;s session only — never sent to any server except during the test.
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Run Test */}
        <div className="glass-card section-card">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-full)', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>3</span>
            Run The OAuth Flow
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)', lineHeight: 1.7, marginBottom: 'var(--space-5)' }}>
            Click below to start the full OAuth 2.0 Authorization Code flow. You&apos;ll be redirected to the Deevo login, then the consent screen, then back here with the result.
          </p>

          <button
            className="btn btn-primary btn-full"
            onClick={handleStartTest}
            disabled={!clientId.trim() || !clientSecret.trim()}
            style={{ padding: '14px 24px', fontSize: 'var(--font-size-md)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start OAuth Test
          </button>
        </div>

        {/* How It Works */}
        <div className="glass-card section-card" style={{ opacity: 0.8 }}>
          <h2 className="section-title">What Happens</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>→</span>
              <span>You click &quot;Start OAuth Test&quot; and get redirected to the Deevo login page</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>→</span>
              <span>After logging in, the consent screen asks you to approve access</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>→</span>
              <span>You&apos;re redirected back to <code style={{ background: 'var(--surface-container-low)', padding: '2px 6px', borderRadius: '4px', fontSize: 'var(--font-size-xs)' }}>/test/callback?code=xxx</code></span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600, flexShrink: 0 }}>✓</span>
              <span>The code is exchanged for an access token + user profile — results shown on screen</span>
            </div>
          </div>
        </div>

        {/* SDK Code Example */}
        <div className="glass-card section-card" style={{ opacity: 0.8 }}>
          <h2 className="section-title">Equivalent SDK Code</h2>
          <pre style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--on-surface)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
          }}>
{`import { DeevoAuth } from 'deevo-oauth';

const deevo = new DeevoAuth({
  clientId: '${clientId || 'YOUR_CLIENT_ID'}',
  clientSecret: '${clientSecret ? '••••••••' : 'YOUR_CLIENT_SECRET'}',
  redirectUri: '${redirectUri || 'https://yourapp.com/auth/callback'}',
});

// Step 1: Redirect user to login
const loginUrl = deevo.getAuthUrl();
// → redirect user to loginUrl

// Step 2: Handle callback
const { accessToken, user } = await deevo.handleCallback(code);
console.log(user.name, user.email);`}
          </pre>
        </div>
      </div>
    </>
  );
}

export default function TestPage() {
  return (
    
      <TestContent />
    
  );
}
