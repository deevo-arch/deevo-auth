import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin'; // From previous setup
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { idToken, clientId, redirectUri } = await request.json();

    // 1. Verify the Firebase user securely on the server
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // 2. Validate the Client App
    const clientRef = db.collection('oauth_clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return NextResponse.json({ error: 'invalid_client', message: 'Client application not found' }, { status: 400 });
    }

    // 3. Validate redirect URI matches what's registered for this client
    const clientData = clientDoc.data();
    if (clientData.redirectUri !== redirectUri) {
      return NextResponse.json(
        { error: 'invalid_redirect_uri', message: 'Redirect URI does not match the registered URI for this client' },
        { status: 400 }
      );
    }

    // 4. Generate a secure, random Authorization Code
    const authCode = crypto.randomBytes(16).toString('hex');

    // 4. Store the code in Firestore with a 5-minute expiration
    await db.collection('oauth_codes').doc(authCode).set({
      code: authCode,
      clientId: clientId,
      uid: uid,
      email: email,
      redirectUri: redirectUri,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins from now
    });

    return NextResponse.json({ code: authCode });

  } catch (error) {
    console.error('Error generating auth code:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}