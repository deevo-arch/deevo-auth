'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  // Sign in with email/password
  const signInWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // Create account with email/password
  const signUpWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Set user display name
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    // Send email verification via Firebase
    await sendEmailVerification(result.user);

    // Create user profile in Firestore via API
    const idToken = await result.user.getIdToken();
    await fetch('/api/internal/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        fullName: displayName || '',
      }),
    });

    return result.user;
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // Get Firebase ID Token (for API calls)
  const getIdToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
