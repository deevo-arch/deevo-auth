# Deevo OAuth Test App

A standalone Express.js application that tests the complete **Deevo OAuth 2.0** flow end-to-end.

## What it does

This app acts as a **third-party application** that integrates "Sign in with Deevo" using the `deevoauth` SDK — exactly like a real developer would.

### The Flow

```
User clicks "Sign in with Deevo"
        ↓
Redirected to Deevo login (localhost:3000/login)
        ↓
User logs in with email/password or Google
        ↓
Consent screen: "Test App wants to access your account"
        ↓
User clicks "Allow"
        ↓
Redirected back to test app with authorization code
        ↓
Server exchanges code for access token + user profile
        ↓
Dashboard shows user data (name, email, picture, UID)
        ↓
"Verify Token" button confirms token is valid
```

## Setup

### 1. Start the Deevo Auth Server

In the **project root** (`Deevo_oauth/`):

```bash
npm run dev
```

This starts the auth server on `http://localhost:3000`.

### 2. Register a Test App

1. Open `http://localhost:3000/developers`
2. Sign in to your Deevo account
3. Click **"+ New App"**
4. Set:
   - **Name:** `Test App`
   - **Redirect URI:** `http://localhost:3001/auth/callback`
5. **Save the Client ID and Client Secret**

### 3. Configure This Test App

```bash
cd test-app
copy .env.example .env
```

Edit `.env` and paste your credentials:

```
DEEVO_CLIENT_ID=abc123...
DEEVO_CLIENT_SECRET=dv_xyz789...
```

### 4. Install & Run

```bash
npm install
node server.js
```

### 5. Test

Open `http://localhost:3001` and click **"Sign in with Deevo"**.

## What to Verify

| Step | Expected Result |
|------|----------------|
| Click "Sign in with Deevo" | Redirected to `localhost:3000/login` |
| Log in on Deevo | Consent screen appears showing "Test App" |
| Click "Allow" | Redirected back to `localhost:3001/auth/callback` |
| Dashboard loads | Shows your name, email, profile picture |
| Click "Verify Token" | Shows "Token is valid!" with your info |
| Click "Sign Out" | Session cleared, back to home page |

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express server with login/callback/verify routes |
| `public/index.html` | Landing page with "Sign in with Deevo" button |
| `public/dashboard.html` | Authenticated dashboard showing user data |
| `.env.example` | Environment variable template |
