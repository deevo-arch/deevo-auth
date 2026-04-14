export interface DeevoAuthConfig {
  /** Your OAuth client ID from the Deevo Developer Console */
  clientId: string;
  /** Your OAuth client secret (keep server-side only!) */
  clientSecret: string;
  /** The callback URL registered in your Deevo app */
  redirectUri: string;
  /** Override the auth server URL (default: https://deevo.tech) */
  authServerUrl?: string;
  /** Space-separated scopes (default: 'profile email') */
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface DeevoUser {
  /** Unique user identifier */
  sub: string;
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** URL to user's profile picture */
  picture: string;
}

export interface CallbackResult {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: DeevoUser;
}

export class DeevoAuth {
  constructor(config: DeevoAuthConfig);

  /** Get the URL to redirect users to for authentication */
  getAuthUrl(options?: { state?: string }): string;

  /** Exchange an authorization code for tokens */
  exchangeCode(code: string): Promise<TokenResponse>;

  /** Get the authenticated user's profile information */
  getUserInfo(accessToken: string): Promise<DeevoUser>;

  /** Complete OAuth flow: exchange code + get user info */
  handleCallback(code: string): Promise<CallbackResult>;

  /** Verify an access token and get user info */
  verifyToken(accessToken: string): Promise<DeevoUser>;
}

export class DeevoAuthError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code: string, statusCode: number);
}

/** Express.js middleware for protecting routes */
export function deevoMiddleware(
  deevoAuth: DeevoAuth
): (req: any, res: any, next: any) => Promise<void>;

export default DeevoAuth;
