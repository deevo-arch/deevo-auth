# deevo-auth

Official SDK for integrating **Deevo Account** OAuth 2.0 authentication into your applications.

## Installation

```bash
npm install deevo-auth
```

## Quick Start

### 1. Get your credentials

Visit the [Deevo Developer Console](https://deevo.tech/developers) to register your application and get your `clientId` and `clientSecret`.

### 2. Configure the SDK

```javascript
const { DeevoAuth } = require('deevo-auth');
// or: import { DeevoAuth } from 'deevo-auth';

const deevo = new DeevoAuth({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://yourapp.com/auth/callback',
});
```

### 3. Redirect users to sign in

```javascript
// Express.js example
app.get('/auth/login', (req, res) => {
  const loginUrl = deevo.getAuthUrl();
  res.redirect(loginUrl);
});
```

### 4. Handle the callback

```javascript
app.get('/auth/callback', async (req, res) => {
  try {
    const { accessToken, user } = await deevo.handleCallback(req.query.code);
    
    // user = { sub: 'uid', name: 'John', email: 'john@example.com', picture: '...' }
    req.session.user = user;
    req.session.accessToken = accessToken;
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Auth failed:', error);
    res.redirect('/login?error=auth_failed');
  }
});
```

## API Reference

### `new DeevoAuth(config)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientId` | string | ✅ | OAuth client ID from Developer Console |
| `clientSecret` | string | ✅ | OAuth client secret (keep server-side!) |
| `redirectUri` | string | ✅ | Registered callback URL |
| `authServerUrl` | string | ❌ | Override auth server (default: `https://deevo.tech`) |
| `scope` | string | ❌ | Scopes (default: `'profile email'`) |

### `deevo.getAuthUrl(options?)`

Returns the URL to redirect users to for authentication.

```javascript
const url = deevo.getAuthUrl({ state: 'csrf-token' });
// => https://deevo.tech/login?client_id=...&redirect_uri=...
```

### `deevo.exchangeCode(code)`

Exchanges an authorization code for tokens.

```javascript
const tokens = await deevo.exchangeCode(code);
// => { access_token: '...', token_type: 'Bearer', expires_in: 3600 }
```

### `deevo.getUserInfo(accessToken)`

Fetches the authenticated user's profile.

```javascript
const user = await deevo.getUserInfo(tokens.access_token);
// => { sub: 'uid', name: 'John Doe', email: 'john@example.com', picture: '...' }
```

### `deevo.handleCallback(code)`

Convenience method: exchanges code AND fetches user info in one call.

```javascript
const { accessToken, user } = await deevo.handleCallback(code);
```

### `deevo.verifyToken(accessToken)`

Verifies a token and returns user info. Useful for API middleware.

```javascript
const user = await deevo.verifyToken(req.headers.authorization.split(' ')[1]);
```

## Express Middleware

Protect your API routes:

```javascript
const { DeevoAuth, deevoMiddleware } = require('deevo-auth');

const deevo = new DeevoAuth({ /* config */ });

app.get('/api/profile', deevoMiddleware(deevo), (req, res) => {
  // req.deevoUser contains the authenticated user's profile
  res.json({ user: req.deevoUser });
});
```

## Next.js Integration

```javascript
// pages/api/auth/login.js
import { DeevoAuth } from 'deevo-auth';

const deevo = new DeevoAuth({
  clientId: process.env.DEEVO_CLIENT_ID,
  clientSecret: process.env.DEEVO_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
});

export default function handler(req, res) {
  res.redirect(deevo.getAuthUrl());
}
```

```javascript
// pages/api/auth/callback.js
export default async function handler(req, res) {
  const { code } = req.query;
  const { accessToken, user } = await deevo.handleCallback(code);
  
  // Set session cookie, JWT, etc.
  res.redirect('/dashboard');
}
```

## React Component (Client-side)

```jsx
function LoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <button onClick={handleLogin}>
      Sign in with Deevo
    </button>
  );
}
```

## Error Handling

```javascript
const { DeevoAuthError } = require('deevo-auth');

try {
  const { user } = await deevo.handleCallback(code);
} catch (error) {
  if (error instanceof DeevoAuthError) {
    console.error(`Deevo Auth Error [${error.code}]:`, error.message);
    // error.code: 'invalid_grant', 'invalid_client', 'token_exchange_failed', etc.
    // error.statusCode: HTTP status code
  }
}
```

## OAuth Flow Diagram

```
Your App                    Deevo Auth Server
   |                              |
   |  1. Redirect to /login       |
   | ---------------------------→ |
   |                              |  2. User signs in
   |                              |     (Google or Email)
   |  3. Redirect back with code  |
   | ←--------------------------- |
   |                              |
   |  4. POST /api/oauth/token    |
   | ---------------------------→ |
   |                              |
   |  5. Returns access_token     |
   | ←--------------------------- |
   |                              |
   |  6. GET /api/oauth/userinfo  |
   | ---------------------------→ |
   |                              |
   |  7. Returns user profile     |
   | ←--------------------------- |
```

## License

MIT © [Deevo](https://deevo.tech)
