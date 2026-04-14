import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Extract the Bearer token from the header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT was signed by Deevo
    let decodedPayload;
    try {
      decodedPayload = jwt.verify(token, process.env.DEEVO_JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'invalid_token', message: 'Token expired or malformed' }, { status: 401 });
    }

    // Fetch the canonical user profile from Firestore using the UID in the token
    const userRef = db.collection('users').doc(decodedPayload.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Return standard OpenID Connect / OAuth userinfo response
    return NextResponse.json({
      sub: decodedPayload.uid,
      name: userData.fullName || '',
      email: userData.email,
      picture: userData.avatarUrl || '',
      // Add any custom Deevo ecosystem claims here
    });

  } catch (error) {
    console.error('UserInfo Error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}