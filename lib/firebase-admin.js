import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (typeof serviceAccount === 'string') {
      serviceAccount = JSON.parse(serviceAccount);
    }
    // Fix stringified newlines from environment variables
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Firebase Admin Init Error:', err);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();