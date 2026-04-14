import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { idToken, fullName } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get the full user record from Firebase Auth
    const userRecord = await auth.getUser(uid);

    // Build the user profile data
    const userData = {
      uid: uid,
      email: userRecord.email || '',
      fullName: fullName || userRecord.displayName || '',
      avatarUrl: userRecord.photoURL || '',
      emailVerified: userRecord.emailVerified || false,
      provider: userRecord.providerData?.[0]?.providerId || 'unknown',
      updatedAt: Date.now(),
    };

    // Check if user already exists
    const userRef = db.collection('users').doc(uid);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      // Update existing user (preserve createdAt)
      const updateData = { ...userData };
      delete updateData.uid; // Don't overwrite uid
      await userRef.update(updateData);
    } else {
      // Create new user with createdAt
      userData.createdAt = Date.now();
      await userRef.set(userData);
    }

    return NextResponse.json({ success: true, uid });

  } catch (error) {
    console.error('Create User Error:', error);
    return NextResponse.json(
      { error: 'server_error', message: error.message },
      { status: 500 }
    );
  }
}
