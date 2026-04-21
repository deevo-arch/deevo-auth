'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [initChecking, setInitChecking] = useState(true);

  // OAuth params from URL (when app redirects user here)
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const isOAuthFlow = !!(clientId && redirectUri);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        handleOAuthRedirect(user);
      } else {
        setInitChecking(false);
      }
    }
  }, [user, authLoading]);

  const handleOAuthRedirect = async (user) => {
    if (!isOAuthFlow) {
      router.push('/dashboard');
      return;
    }

    // Redirect to consent screen — user must approve before code is issued
    const scope = searchParams.get('scope') || 'profile email';
    const state = searchParams.get('state') || '';
    const consentParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
    });
    if (state) consentParams.set('state', state);

    router.push(`/consent?${consentParams.toString()}`);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();

      // Sync user profile to Firestore
      const idToken = await user.getIdToken();
      await fetch('/api/internal/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, fullName: user.displayName || '' }),
      });

      await handleOAuthRedirect(user);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled.');
      } else {
        setError('Authentication failed. Please try again.');
      }
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      await handleOAuthRedirect(user);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Sign in failed. Please try again.');
      }
      setLoading(false);
    }
  };

  // Build OAuth query for register link
  const registerHref = isOAuthFlow
    ? `/register?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
    : '/register';

  if (initChecking || authLoading) {
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
      <div className="page-center">
        <div className="auth-container">
          <div className="glass-card auth-card">
            {/* Logo */}
            <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 28, width: 'auto', margin: '0 auto var(--space-6)', display: 'block' }} />

            {/* Header */}
            <div className="auth-header">
              <h1>Sign in to Deevo</h1>
              <p>
                {isOAuthFlow
                  ? 'Sign in to continue to the application'
                  : 'Access your Deevo Account'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email/Password Form */}
            <form className="auth-form" onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider" style={{ margin: 'var(--space-6) 0' }}>
              <span>or</span>
            </div>

            {/* Google Sign In */}
            <button
              className="btn btn-social"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <span className="spinner" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Footer */}
            <div className="auth-footer">
              Don&apos;t have an account?{' '}
              <Link href={registerHref}>Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LoginFallback() {
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

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoginFallback />}>
        <LoginContent />
      </Suspense>
    </AuthProvider>
  );
}