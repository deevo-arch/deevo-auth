'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AuthProvider } from '@/lib/auth-context';

function HomeContent() {
  const { user } = useAuth();

  return (
    <>
      <div className="bg-animated" />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 22, width: 'auto' }} />
        </Link>
        <div className="navbar-actions">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign In</Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="hero">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 48, width: 'auto', marginBottom: 'var(--space-8)' }} />
          <h1>One Account.<br />All of Deevo.</h1>
          <p>
            Your Deevo Account is the single key to the entire Deevo ecosystem. 
            Sign in once, access everything — securely, seamlessly, instantly.
          </p>
          <div className="hero-cta">
            <Link href="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
              Get Started
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <div className="features-grid">
            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>Enterprise Security</h3>
              <p>Built on Firebase Auth with Google&apos;s infrastructure. Your credentials are encrypted and protected by industry-leading security standards.</p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>One-click sign in with Google, or use email and password. No friction, no delays — get into your apps in under a second.</p>
            </div>

            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tertiary)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3>Universal Access</h3>
              <p>One account works across all Deevo products. No need to manage multiple logins — your identity travels with you.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section style={{ padding: 'var(--space-16) var(--space-8)', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
            How it works
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-12)', fontSize: 'var(--font-size-md)' }}>
            Deevo products use OAuth 2.0 — the same protocol used by Google, GitHub, and Apple.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', textAlign: 'left' }}>
            {[
              { step: '01', title: 'App redirects you here', desc: 'When a Deevo product needs to verify your identity, it sends you to this login screen.' },
              { step: '02', title: 'You sign in securely', desc: 'Use Google or your email/password. Your credentials never touch the requesting app.' },
              { step: '03', title: 'You\'re back in the app', desc: 'After authentication, you\'re redirected back with a secure token. The app knows who you are.' },
            ].map((item) => (
              <div key={item.step} className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--primary-container)', opacity: 0.6, flexShrink: 0 }}>
                  {item.step}
                </span>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{item.title}</h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* For Developers CTA */}
        <section style={{ padding: 'var(--space-16) var(--space-8)', textAlign: 'center' }}>
          <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: 'var(--space-12)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-3)' }}>
              For Developers
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-8)', fontSize: 'var(--font-size-sm)', lineHeight: 1.7 }}>
              Integrate Deevo Auth into your app in minutes. Install the SDK, configure your client credentials, and let users sign in with their Deevo Account.
            </p>
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: 'var(--primary)', textAlign: 'left' }}>
              npm install deevo-auth
            </div>
            <Link href="/developers" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Developer Console →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/deevo-logo.svg" alt="Deevo" style={{ height: 16, width: 'auto' }} />
        </div>
        <div className="footer-links">
          <a href="https://deevo.tech" target="_blank" rel="noopener noreferrer">Website</a>
          <Link href="/login">Sign In</Link>
          <Link href="/register">Create Account</Link>
          <Link href="/developers">Developers</Link>
        </div>
        <p style={{ opacity: 0.5 }}>&copy; {new Date().getFullYear()} Deevo. All rights reserved.</p>
      </footer>
    </>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
