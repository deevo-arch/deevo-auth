import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Store your downloaded Firebase Service Account JSON string in Vercel Environment Variables
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();