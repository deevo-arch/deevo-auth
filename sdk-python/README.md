# deevoauth (Python)

Official Python SDK for **Deevo Account** OAuth 2.0 authentication.

## Installation

```bash
pip install deevo-oauth
```

## Quick Start

### Flask Example

```python
from flask import Flask, redirect, request, session
from deevoauth import DeevoAuth

app = Flask(__name__)
app.secret_key = "your-secret-key"

deevo = DeevoAuth(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_CLIENT_SECRET",
    redirect_uri="http://localhost:5000/auth/callback",
    auth_server_url="https://deevo.tech",  # or your Vercel URL
)


@app.route("/auth/login")
def login():
    """Redirect user to Deevo login."""
    return redirect(deevo.get_auth_url())


@app.route("/auth/callback")
def callback():
    """Handle the OAuth callback."""
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return f"Access denied: {error}", 403

    result = deevo.handle_callback(code)
    session["user"] = result["user"]
    session["access_token"] = result["access_token"]

    return redirect("/dashboard")


@app.route("/dashboard")
def dashboard():
    """Show authenticated user info."""
    user = session.get("user")
    if not user:
        return redirect("/auth/login")
    return f"Welcome {user['name']}! ({user['email']})"
```

### Django Example

```python
# views.py
from django.shortcuts import redirect
from django.http import JsonResponse
from deevoauth import DeevoAuth

deevo = DeevoAuth(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_CLIENT_SECRET",
    redirect_uri="http://localhost:8000/auth/callback",
)


def login(request):
    return redirect(deevo.get_auth_url())


def callback(request):
    code = request.GET.get("code")
    result = deevo.handle_callback(code)
    request.session["user"] = result["user"]
    return redirect("/dashboard")
```

### FastAPI Example

```python
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from deevoauth import DeevoAuth

app = FastAPI()

deevo = DeevoAuth(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_CLIENT_SECRET",
    redirect_uri="http://localhost:8000/auth/callback",
)


@app.get("/auth/login")
async def login():
    return RedirectResponse(deevo.get_auth_url())


@app.get("/auth/callback")
async def callback(code: str):
    result = deevo.handle_callback(code)
    # Save to session/database
    return {"user": result["user"]}
```

## API Reference

### `DeevoAuth(client_id, client_secret, redirect_uri, auth_server_url?, scope?)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_id` | str | ✅ | OAuth client ID from Developer Console |
| `client_secret` | str | ✅ | OAuth client secret |
| `redirect_uri` | str | ✅ | Registered callback URL |
| `auth_server_url` | str | ❌ | Auth server URL (default: `https://deevo.tech`) |
| `scope` | str | ❌ | Space-separated scopes (default: `"profile email"`) |

### `deevo.get_auth_url(state=None)`
Returns the authorization URL to redirect users to.

### `deevo.exchange_code(code)`
Exchanges an authorization code for access tokens.

### `deevo.get_user_info(access_token)`
Fetches user profile using a Bearer token.

### `deevo.handle_callback(code)`
Convenience method: exchanges code AND fetches user info in one call.

### `deevo.verify_token(access_token)`
Verifies a token is still valid and returns user info.

## Error Handling

```python
from deevoauth import DeevoAuth, DeevoAuthError

try:
    result = deevo.handle_callback(code)
except DeevoAuthError as e:
    print(f"Error: {e.message}")
    print(f"Code: {e.code}")
    print(f"Status: {e.status_code}")
```

---
**License**: MIT © [Deevo Systems](https://deevo.tech)
