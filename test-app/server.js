/**
 * Deevo OAuth Test App
 * 
 * This is a minimal Express.js app that demonstrates the complete
 * "Sign in with Deevo" OAuth 2.0 flow using the deevoauth SDK.
 * 
 * Flow:
 *   1. User clicks "Sign in with Deevo" → redirected to Deevo login
 *   2. User logs in & approves on Deevo → redirected back here with ?code=xxx
 *   3. This server exchanges the code for an access token + user profile
 *   4. User sees their profile data on the dashboard
 * 
 * Usage:
 *   1. Copy .env.example to .env and fill in your credentials
 *   2. npm install
 *   3. node server.js
 *   4. Open http://localhost:3001
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { DeevoAuth } = require('deevo-oauth');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Validate environment ────────────────────────────────────────────
const DEEVO_CLIENT_ID = process.env.DEEVO_CLIENT_ID;
const DEEVO_CLIENT_SECRET = process.env.DEEVO_CLIENT_SECRET;
const DEEVO_AUTH_SERVER = process.env.DEEVO_AUTH_SERVER || 'http://localhost:3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

if (!DEEVO_CLIENT_ID || !DEEVO_CLIENT_SECRET) {
  console.error('\n❌ Missing DEEVO_CLIENT_ID or DEEVO_CLIENT_SECRET in .env file!');
  console.error('   1. Go to your Deevo auth server → /developers');
  console.error('   2. Create a new app with redirect URI: ' + BASE_URL + '/auth/callback');
  console.error('   3. Copy the Client ID and Client Secret into .env\n');
  process.exit(1);
}

// ── Initialize Deevo OAuth SDK ──────────────────────────────────────
const deevo = new DeevoAuth({
  clientId: DEEVO_CLIENT_ID,
  clientSecret: DEEVO_CLIENT_SECRET,
  redirectUri: `${BASE_URL}/auth/callback`,
  authServerUrl: DEEVO_AUTH_SERVER,
});

// ── Middleware ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'deevo-test-app-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 } // 1 hour
}));

// ── Routes ──────────────────────────────────────────────────────────

/**
 * GET /auth/login
 * Redirects the user to the Deevo login/consent screen.
 */
app.get('/auth/login', (req, res) => {
  const loginUrl = deevo.getAuthUrl({
    state: 'random-csrf-' + Date.now(), // In production, use a proper CSRF token
  });
  console.log('→ Redirecting to Deevo:', loginUrl);
  res.redirect(loginUrl);
});

/**
 * GET /auth/callback
 * Deevo redirects users here after they approve access.
 * We exchange the authorization code for an access token + user profile.
 */
app.get('/auth/callback', async (req, res) => {
  const { code, error, state } = req.query;

  // Handle denial
  if (error) {
    console.log('✗ User denied access:', error);
    return res.redirect('/?error=' + encodeURIComponent(error));
  }

  if (!code) {
    console.log('✗ No authorization code received');
    return res.redirect('/?error=no_code');
  }

  try {
    console.log('→ Exchanging code for token...');
    
    // This single call does: exchange code → get access token → fetch user profile
    const { accessToken, user } = await deevo.handleCallback(code);

    console.log('✓ Authentication successful!');
    console.log('  User:', user.name, '(' + user.email + ')');
    console.log('  Token:', accessToken.substring(0, 20) + '...');

    // Save to session
    req.session.accessToken = accessToken;
    req.session.user = user;

    res.redirect('/dashboard.html');
  } catch (err) {
    console.error('✗ Authentication failed:', err.message);
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

/**
 * GET /api/me
 * Returns the authenticated user's info from the session.
 * The dashboard page calls this to display user data.
 */
app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  res.json({
    user: req.session.user,
    accessToken: req.session.accessToken,
  });
});

/**
 * GET /api/verify
 * Verifies the stored access token is still valid by calling Deevo's userinfo endpoint.
 * This demonstrates the verifyToken() SDK method.
 */
app.get('/api/verify', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'not_authenticated' });
  }

  try {
    const user = await deevo.verifyToken(req.session.accessToken);
    res.json({ valid: true, user });
  } catch (err) {
    res.json({ valid: false, error: err.message });
  }
});

/**
 * GET /auth/logout
 * Clears the session and redirects to home.
 */
app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ── Start server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         Deevo OAuth Test App                            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  App URL:        ${BASE_URL.padEnd(38)}║`);
  console.log(`║  Auth Server:    ${DEEVO_AUTH_SERVER.padEnd(38)}║`);
  console.log(`║  Client ID:      ${DEEVO_CLIENT_ID.substring(0, 20).padEnd(38)}║`);
  console.log(`║  Redirect URI:   ${(BASE_URL + '/auth/callback').padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Open ${BASE_URL} in your browser to test the OAuth flow.`);
  console.log('');
});
