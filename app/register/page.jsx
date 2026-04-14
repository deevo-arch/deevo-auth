'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signUpWithEmail, signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initChecking, setInitChecking] = useState(true);

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

  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4);
  };

  const strength = getPasswordStrength(password);

  const handleOAuthRedirect = async (user) => {
    if (!isOAuthFlow) {
      router.push('/dashboard');
      return;
    }
    const idToken = await user.getIdToken();
    const response = await fetch('/api/internal/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, clientId, redirectUri }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    window.location.href = `${redirectUri}?code=${data.code}`;
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      const idToken = await user.getIdToken();
      await fetch('/api/internal/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, fullName: user.displayName || '' }),
      });
      await handleOAuthRedirect(user);
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign up failed. Please try again.');
      }
      setGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setError('');
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, fullName);
      setSuccess(true);
      setTimeout(async () => { await handleOAuthRedirect(user); }, 2000);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Registration failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const loginHref = isOAuthFlow
    ? `/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
    : '/login';

  if (initChecking || authLoading || success) {
    if (success) {
      return (
        <>
          <div className="bg-animated" />
          <div className="page-center">
            <div className="auth-container">
              <div className="glass-card auth-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', margin: '0 auto var(--space-2)', textAlign: 'center', color: 'var(--success)' }}>✓</div>
                <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 28, width: 'auto', margin: '0 auto var(--space-6)', display: 'block' }} />
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                  Account Created!
                </h1>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                  We&apos;ve sent a verification email to <strong style={{ color: 'var(--primary)' }}>{email}</strong>.
                </p>
                <div className="alert alert-info"><span>Redirecting you shortly...</span></div>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    // Default loading state
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
            <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 28, width: 'auto', margin: '0 auto var(--space-6)', display: 'block' }} />

            <div className="auth-header">
              <h1>Create your Deevo Account</h1>
              <p>One account for the entire Deevo ecosystem</p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleEmailSignup}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input id="reg-name" className="form-input" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <input id="reg-email" className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input id="reg-password" className="form-input" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                {password && (
                  <div className="password-strength">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`password-strength-bar ${strength >= level ? (strength <= 1 ? 'active-weak' : strength <= 2 ? 'active-medium' : 'active-strong') : ''}`} />
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <input id="reg-confirm" className="form-input" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || googleLoading}>
                {loading ? (<><span className="spinner" /> Creating account...</>) : 'Create Account'}
              </button>
            </form>

            <div className="divider" style={{ margin: 'var(--space-6) 0' }}><span>or</span></div>

            <button className="btn btn-social" onClick={handleGoogleSignup} disabled={loading || googleLoading}>
              {googleLoading ? (<><span className="spinner" /> Connecting...</>) : (
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

            <div className="auth-footer">
              Already have an account?{' '}<Link href={loginHref}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RegisterFallback() {
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

export default function RegisterPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<RegisterFallback />}>
        <RegisterContent />
      </Suspense>
    </AuthProvider>
  );
}
