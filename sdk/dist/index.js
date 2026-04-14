/**
 * Deevo Auth SDK
 * Official SDK for integrating Deevo Account OAuth 2.0 into your applications.
 * 
 * Usage:
 *   import { DeevoAuth } from 'deevo-auth';
 *   
 *   const deevo = new DeevoAuth({
 *     clientId: 'YOUR_CLIENT_ID',
 *     clientSecret: 'YOUR_CLIENT_SECRET',
 *     redirectUri: 'https://yourapp.com/auth/callback',
 *   });
 */

const DEFAULT_AUTH_URL = 'https://deevo.tech';

class DeevoAuth {
  /**
   * Create a new DeevoAuth instance.
   * @param {Object} config
   * @param {string} config.clientId - Your OAuth client ID from the Deevo Developer Console
   * @param {string} config.clientSecret - Your OAuth client secret (keep this server-side only!)
   * @param {string} config.redirectUri - The callback URL registered in your Deevo app
   * @param {string} [config.authServerUrl] - Override the auth server URL (default: https://deevo.tech)
   * @param {string} [config.scope] - Space-separated scopes (default: 'profile email')
   */
  constructor(config) {
    if (!config.clientId) throw new Error('DeevoAuth: clientId is required');
    if (!config.clientSecret) throw new Error('DeevoAuth: clientSecret is required');
    if (!config.redirectUri) throw new Error('DeevoAuth: redirectUri is required');

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.authServerUrl = (config.authServerUrl || DEFAULT_AUTH_URL).replace(/\/$/, '');
    this.scope = config.scope || 'profile email';
  }

  /**
   * Get the URL to redirect users to for authentication.
   * Redirect the user's browser to this URL to start the OAuth flow.
   * 
   * @param {Object} [options]
   * @param {string} [options.state] - Optional state parameter for CSRF protection
   * @returns {string} The authorization URL
   * 
   * @example
   *   // Express.js route
   *   app.get('/auth/login', (req, res) => {
   *     const url = deevo.getAuthUrl({ state: 'random-csrf-token' });
   *     res.redirect(url);
   *   });
   */
  getAuthUrl(options = {}) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
    });

    if (options.state) {
      params.set('state', options.state);
    }

    return `${this.authServerUrl}/login?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for an access token.
   * Call this in your callback route after the user is redirected back.
   * 
   * @param {string} code - The authorization code from the callback URL query params
   * @returns {Promise<Object>} Token response with access_token, token_type, expires_in
   * 
   * @example
   *   // Express.js callback route
   *   app.get('/auth/callback', async (req, res) => {
   *     const { code } = req.query;
   *     const tokens = await deevo.exchangeCode(code);
   *     // tokens.access_token is your bearer token
   *   });
   */
  async exchangeCode(code) {
    const response = await fetch(`${this.authServerUrl}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new DeevoAuthError(
        error.message || `Token exchange failed with status ${response.status}`,
        error.error || 'token_exchange_failed',
        response.status
      );
    }

    return response.json();
  }

  /**
   * Get the authenticated user's profile information.
   * 
   * @param {string} accessToken - The access token from exchangeCode()
   * @returns {Promise<Object>} User profile { sub, name, email, picture }
   * 
   * @example
   *   const user = await deevo.getUserInfo(tokens.access_token);
   *   console.log(user.email, user.name);
   */
  async getUserInfo(accessToken) {
    const response = await fetch(`${this.authServerUrl}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new DeevoAuthError(
        error.message || `UserInfo request failed with status ${response.status}`,
        error.error || 'userinfo_failed',
        response.status
      );
    }

    return response.json();
  }

  /**
   * Complete OAuth flow in one call: exchange code and get user info.
   * Convenience method combining exchangeCode() + getUserInfo().
   * 
   * @param {string} code - The authorization code from the callback URL
   * @returns {Promise<Object>} { accessToken, tokenType, expiresIn, user }
   * 
   * @example
   *   app.get('/auth/callback', async (req, res) => {
   *     const { accessToken, user } = await deevo.handleCallback(req.query.code);
   *     req.session.user = user;
   *     req.session.accessToken = accessToken;
   *     res.redirect('/dashboard');
   *   });
   */
  async handleCallback(code) {
    const tokens = await this.exchangeCode(code);
    const user = await this.getUserInfo(tokens.access_token);

    return {
      accessToken: tokens.access_token,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      user,
    };
  }

  /**
   * Verify an access token and get user info (useful for API middleware).
   * 
   * @param {string} accessToken - The Bearer token to verify
   * @returns {Promise<Object>} User profile if valid
   * @throws {DeevoAuthError} If the token is invalid or expired
   */
  async verifyToken(accessToken) {
    return this.getUserInfo(accessToken);
  }
}

/**
 * Express.js middleware for protecting routes with Deevo Auth.
 * 
 * @param {DeevoAuth} deevoAuth - A configured DeevoAuth instance
 * @returns {Function} Express middleware
 * 
 * @example
 *   app.get('/api/protected', deevoMiddleware(deevo), (req, res) => {
 *     res.json({ user: req.deevoUser });
 *   });
 */
function deevoMiddleware(deevoAuth) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const user = await deevoAuth.verifyToken(token);
      req.deevoUser = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

/**
 * Custom error class for Deevo Auth errors.
 */
class DeevoAuthError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'DeevoAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DeevoAuth, deevoMiddleware, DeevoAuthError };
  module.exports.DeevoAuth = DeevoAuth;
  module.exports.deevoMiddleware = deevoMiddleware;
  module.exports.DeevoAuthError = DeevoAuthError;
  module.exports.default = DeevoAuth;
}

// Export for ESM


