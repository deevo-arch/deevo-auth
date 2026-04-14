# deevo-oauth

Official SDK for integrating **Deevo Account** OAuth 2.0 authentication into your applications. It allows you to add a seamless "Sign in with Deevo" experience, just like Google OAuth!

## Installation

Install the package via npm:

```bash
npm install deevo-oauth
```

## Quick Start

### 1. Get Your Credentials

You must register your application on the Deevo platform to get your API keys:
1. Visit the [Deevo Developer Console](https://deevo.tech/developers).
2. Sign in with your Deevo account.
3. Click **"+ New App"**.
4. Set your application name and the allowed Callback/Redirect URI.
5. Save the generated `clientId` and `clientSecret`. Keep the secret secure and never expose it to your frontend!

### 2. Configure the SDK

In your backend or server-side code (Node.js, Express, Next.js, etc.), initialize the SDK with your credentials:

```javascript
const { DeevoAuth } = require('deevo-oauth');
// or using ES Modules: import { DeevoAuth } from 'deevo-oauth';

const deevo = new DeevoAuth({
  clientId: 'YOUR_CLIENT_ID',          // e.g. from deevo.tech/developers
  clientSecret: 'YOUR_CLIENT_SECRET',  // e.g. from deevo.tech/developers
  redirectUri: 'http://localhost:3000/auth/callback', // The exact URL registered in the console
});
```

### 3. Redirect Users to Sign In

When a user clicks "Sign in with Deevo", redirect them to the Deevo authorization URL.

**Express.js Example:**
```javascript
app.get('/auth/login', (req, res) => {
  const loginUrl = deevo.getAuthUrl();
  res.redirect(loginUrl);
});
```

### 4. Handle the Callback & Exchange Code

After the user successfully signs in, Deevo will redirect them back to your `redirectUri` with a special authorization `code` in the query parameters. You need to exchange this code for the user's profile information.

**Express.js Example:**
```javascript
app.get('/auth/callback', async (req, res) => {
  try {
    const code = req.query.code;
    
    // This handles both the token exchange and fetching the user profile!
    const { accessToken, user } = await deevo.handleCallback(code);
    
    /* user object looks like:
      {
        sub: 'firebase-uid-123',
        name: 'John Doe',
        email: 'john@example.com',
        picture: 'https://...'
      }
    */

    // Save the user data to your database or session
    req.session.user = user;
    req.session.accessToken = accessToken;
    
    // Redirect to your app's dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Authentication failed:', error);
    res.redirect('/login?error=auth_failed');
  }
});
```

---

## Usage in Next.js (App Router)

If you are using Next.js (App Router), here is how you can easily integrate Deevo Auth via API routes:

**`app/api/auth/login/route.js`**
```javascript
import { DeevoAuth } from 'deevo-oauth';
import { redirect } from 'next/navigation';

const deevo = new DeevoAuth({
  clientId: process.env.DEEVO_CLIENT_ID,
  clientSecret: process.env.DEEVO_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
});

export async function GET() {
  // Redirect to Deevo Login Screen
  return Response.redirect(deevo.getAuthUrl());
}
```

**`app/api/auth/callback/route.js`**
```javascript
import { DeevoAuth } from 'deevo-oauth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const deevo = new DeevoAuth({
  clientId: process.env.DEEVO_CLIENT_ID,
  clientSecret: process.env.DEEVO_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
});

export async function GET(request) {
  const code = request.nextUrl.searchParams.get('code');
  
  try {
    const { accessToken, user } = await deevo.handleCallback(code);
    
    // Example: Set HTTP-Only Cookie with the token
    const cookieStore = await cookies();
    cookieStore.set('deevo_session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600 // 1 hour
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_code', request.url));
  }
}
```

---

## API Reference

### `new DeevoAuth(config)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientId` | string | ✅ | Your registered OAuth client ID |
| `clientSecret` | string | ✅ | Your private client secret (Do not leak this client-side!) |
| `redirectUri` | string | ✅ | Registered callback URL where users are returned |
| `authServerUrl` | string | ❌ | Override auth server (Default: `https://deevo.tech`) |
| `scope` | string | ❌ | Space-separated scopes (Default: `'profile email'`) |

### `deevo.getAuthUrl(options?)`
Returns the fully-qualified login URL to redirect users to.
```javascript
const url = deevo.getAuthUrl({ state: 'random-csrf-token' });
```

### `deevo.exchangeCode(code)`
Exchanges an authorization code for raw access tokens.
```javascript
const tokens = await deevo.exchangeCode(code);
// => { access_token: '...', token_type: 'Bearer', expires_in: 3600 }
```

### `deevo.getUserInfo(accessToken)`
Fetches the current user profile data using a valid Bearer token.
```javascript
const user = await deevo.getUserInfo(tokens.access_token);
```

### `deevo.handleCallback(code)`
A convenience method that performs `exchangeCode` AND `getUserInfo` in one swift call.
```javascript
const { accessToken, user } = await deevo.handleCallback(code);
```

### `deevo.verifyToken(accessToken)`
Verifies a token and returns user info. Ideal for protecting your internal API routes.
```javascript
const user = await deevo.verifyToken(req.headers.authorization.split(' ')[1]);
```

---

## Express.js API Middleware
The SDK comes with a built-in Express middleware to protect your private routes:

```javascript
const { DeevoAuth, deevoMiddleware } = require('deevo-oauth');

const deevo = new DeevoAuth({ /* config */ });

app.get('/api/protected-data', deevoMiddleware(deevo), (req, res) => {
  // If the token is verified successfully, the user data will be injected into req.deevoUser
  res.json({ message: "Welcome!", user: req.deevoUser });
});
```

## Error Handling

If an API call fails, the SDK will throw a `DeevoAuthError`. You can handle specific error codes:

```javascript
const { DeevoAuthError } = require('deevo-oauth');

try {
  const { user } = await deevo.handleCallback(code);
} catch (error) {
  if (error instanceof DeevoAuthError) {
    console.error(`HTTP Status: ${error.statusCode}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
  }
}
```

---
**License**: MIT © [Deevo Systems](https://deevo.tech)
