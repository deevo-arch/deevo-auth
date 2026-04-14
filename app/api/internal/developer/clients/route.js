import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import crypto from 'crypto';

// GET - List all OAuth clients for the authenticated user
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch clients owned by this user
    const snapshot = await db.collection('oauth_clients')
      .where('ownerId', '==', uid)
      .get();

    const clients = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name,
        redirectUri: data.redirectUri,
        createdAt: data.createdAt,
      });
    });

    return NextResponse.json({ clients });

  } catch (error) {
    console.error('List Clients Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// POST - Create a new OAuth client
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { name, redirectUri } = await request.json();

    if (!name || !redirectUri) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Generate client credentials
    const clientId = crypto.randomBytes(16).toString('hex');
    const clientSecret = `dv_${crypto.randomBytes(32).toString('hex')}`;

    // Store in Firestore
    await db.collection('oauth_clients').doc(clientId).set({
      name,
      redirectUri,
      clientSecret,
      ownerId: uid,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      clientId,
      clientSecret,
      name,
      redirectUri,
    });

  } catch (error) {
    console.error('Create Client Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

// DELETE - Delete an OAuth client
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'missing_client_id' }, { status: 400 });
    }

    // Verify ownership
    const clientDoc = await db.collection('oauth_clients').doc(clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (clientDoc.data().ownerId !== uid) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    await db.collection('oauth_clients').doc(clientId).delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete Client Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
