"""
Deevo Auth SDK for Python
Official SDK for integrating Deevo Account OAuth 2.0 into Python applications.

Usage:
    from deevoauth import DeevoAuth

    deevo = DeevoAuth(
        client_id="YOUR_CLIENT_ID",
        client_secret="YOUR_CLIENT_SECRET",
        redirect_uri="https://yourapp.com/auth/callback",
    )

    # Get login URL
    login_url = deevo.get_auth_url()

    # Exchange code for user info
    result = deevo.handle_callback(code)
    print(result["user"]["email"])
"""

from deevoauth.client import DeevoAuth
from deevoauth.errors import DeevoAuthError

__version__ = "1.0.0"
__all__ = ["DeevoAuth", "DeevoAuthError"]
