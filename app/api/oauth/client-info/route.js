import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * GET /api/oauth/client-info?client_id=xxx
 * 
 * Public endpoint that returns the display name of a registered OAuth client.
 * Used by the consent screen to show users which app is requesting access.
 * Only returns the app name — no secrets or sensitive data.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'missing_client_id', message: 'client_id query parameter is required' },
        { status: 400 }
      );
    }

    const clientRef = db.collection('oauth_clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'client_not_found', message: 'No application found with this client ID' },
        { status: 404 }
      );
    }

    const clientData = clientDoc.data();

    // Only expose public, non-sensitive info
    return NextResponse.json({
      name: clientData.name || 'Unknown Application',
      redirectUri: clientData.redirectUri,
    });

  } catch (error) {
    console.error('Client Info Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
