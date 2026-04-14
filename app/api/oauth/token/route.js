import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { grant_type, code, client_id, client_secret, redirect_uri } = body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', message: 'Only authorization_code is supported' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!code || !client_id || !redirect_uri) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields: code, client_id, redirect_uri' },
        { status: 400 }
      );
    }

    // 1. Look up the auth code in Firestore
    const codeRef = db.collection('oauth_codes').doc(code);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      return NextResponse.json(
        { error: 'invalid_grant', message: 'Authorization code not found or already used' },
        { status: 400 }
      );
    }

    const codeData = codeDoc.data();

    // 2. Validate the code hasn't expired
    if (Date.now() > codeData.expiresAt) {
      await codeRef.delete(); // Clean up expired code
      return NextResponse.json(
        { error: 'invalid_grant', message: 'Authorization code has expired' },
        { status: 400 }
      );
    }

    // 3. Validate the client_id and redirect_uri match
    if (codeData.clientId !== client_id) {
      return NextResponse.json(
        { error: 'invalid_client', message: 'Client ID mismatch' },
        { status: 400 }
      );
    }

    if (codeData.redirectUri !== redirect_uri) {
      return NextResponse.json(
        { error: 'invalid_grant', message: 'Redirect URI mismatch' },
        { status: 400 }
      );
    }

    // 4. Validate client_secret (if provided)
    if (client_secret) {
      const clientRef = db.collection('oauth_clients').doc(client_id);
      const clientDoc = await clientRef.get();

      if (!clientDoc.exists) {
        return NextResponse.json(
          { error: 'invalid_client', message: 'Client not found' },
          { status: 400 }
        );
      }

      const clientData = clientDoc.data();
      if (clientData.clientSecret && clientData.clientSecret !== client_secret) {
        return NextResponse.json(
          { error: 'invalid_client', message: 'Invalid client secret' },
          { status: 401 }
        );
      }
    }

    // 5. Delete the code (one-time use)
    await codeRef.delete();

    // 6. Generate a Deevo access token (JWT)
    const accessToken = jwt.sign(
      {
        uid: codeData.uid,
        email: codeData.email,
        client_id: client_id,
        iss: 'https://deevo.tech',
        aud: client_id,
      },
      process.env.DEEVO_JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 7. Return the token response (OAuth 2.0 standard format)
    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'profile email',
    });

  } catch (error) {
    console.error('Token Exchange Error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
