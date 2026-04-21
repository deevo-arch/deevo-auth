"""
Deevo Auth Client — handles the full OAuth 2.0 flow.

Usage:
    from deevoauth import DeevoAuth

    deevo = DeevoAuth(
        client_id="YOUR_CLIENT_ID",
        client_secret="YOUR_CLIENT_SECRET",
        redirect_uri="https://yourapp.com/auth/callback",
    )
"""

from urllib.parse import urlencode
from typing import Optional, Dict, Any

try:
    import requests
except ImportError:
    raise ImportError(
        "The 'requests' library is required. Install it with: pip install requests"
    )

from deevoauth.errors import DeevoAuthError

DEFAULT_AUTH_URL = "https://deevo.tech"


class DeevoAuth:
    """
    Deevo OAuth 2.0 client.

    Args:
        client_id: Your OAuth client ID from the Deevo Developer Console
        client_secret: Your OAuth client secret (keep server-side only!)
        redirect_uri: The callback URL registered in your Deevo app
        auth_server_url: Override the auth server URL (default: https://deevo.tech)
        scope: Space-separated scopes (default: "profile email")
    """

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        auth_server_url: str = DEFAULT_AUTH_URL,
        scope: str = "profile email",
    ):
        if not client_id:
            raise ValueError("DeevoAuth: client_id is required")
        if not client_secret:
            raise ValueError("DeevoAuth: client_secret is required")
        if not redirect_uri:
            raise ValueError("DeevoAuth: redirect_uri is required")

        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.auth_server_url = auth_server_url.rstrip("/")
        self.scope = scope

    def get_auth_url(self, state: Optional[str] = None) -> str:
        """
        Get the URL to redirect users to for authentication.

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            The full authorization URL to redirect users to

        Example:
            # Flask
            @app.route("/auth/login")
            def login():
                return redirect(deevo.get_auth_url(state="random-csrf-token"))
        """
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
        }
        if state:
            params["state"] = state

        return f"{self.auth_server_url}/login?{urlencode(params)}"

    def exchange_code(self, code: str) -> Dict[str, Any]:
        """
        Exchange an authorization code for an access token.

        Args:
            code: The authorization code from the callback URL

        Returns:
            Token response dict with access_token, token_type, expires_in

        Example:
            tokens = deevo.exchange_code(request.args["code"])
            access_token = tokens["access_token"]
        """
        response = requests.post(
            f"{self.auth_server_url}/api/oauth/token",
            json={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": self.redirect_uri,
            },
            headers={"Content-Type": "application/json"},
        )

        if not response.ok:
            data = response.json() if response.content else {}
            raise DeevoAuthError(
                message=data.get("message", f"Token exchange failed ({response.status_code})"),
                code=data.get("error", "token_exchange_failed"),
                status_code=response.status_code,
            )

        return response.json()

    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get the authenticated user's profile information.

        Args:
            access_token: The access token from exchange_code()

        Returns:
            User profile dict with sub, name, email, picture

        Example:
            user = deevo.get_user_info(tokens["access_token"])
            print(user["email"])
        """
        response = requests.get(
            f"{self.auth_server_url}/api/oauth/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if not response.ok:
            data = response.json() if response.content else {}
            raise DeevoAuthError(
                message=data.get("message", f"UserInfo request failed ({response.status_code})"),
                code=data.get("error", "userinfo_failed"),
                status_code=response.status_code,
            )

        return response.json()

    def handle_callback(self, code: str) -> Dict[str, Any]:
        """
        Complete OAuth flow in one call: exchange code and get user info.

        Args:
            code: The authorization code from the callback URL

        Returns:
            Dict with access_token, token_type, expires_in, and user profile

        Example:
            # Flask
            @app.route("/auth/callback")
            def callback():
                result = deevo.handle_callback(request.args["code"])
                session["user"] = result["user"]
                session["access_token"] = result["access_token"]
                return redirect("/dashboard")
        """
        tokens = self.exchange_code(code)
        user = self.get_user_info(tokens["access_token"])

        return {
            "access_token": tokens["access_token"],
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_in": tokens.get("expires_in", 3600),
            "user": user,
        }

    def verify_token(self, access_token: str) -> Dict[str, Any]:
        """
        Verify an access token and get user info.

        Args:
            access_token: The Bearer token to verify

        Returns:
            User profile if valid

        Raises:
            DeevoAuthError: If the token is invalid or expired
        """
        return self.get_user_info(access_token)
