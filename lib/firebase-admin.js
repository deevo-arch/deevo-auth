import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let saString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!saString) {
      console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is missing from environment variables!');
    } else {
      // If user pasted the single quotes from .env into Vercel, strip them before parsing
      if (saString.startsWith("'") && saString.endsWith("'")) {
        saString = saString.slice(1, -1);
      }

      const serviceAccount = JSON.parse(saString);
      
      // Fix stringified newlines from environment variables
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (err) {
    console.error('Firebase Admin Init Error! Check if your FIREBASE_SERVICE_ACCOUNT_KEY json is valid:', err);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();