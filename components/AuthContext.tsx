'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  ADMIN_EMAIL,
  type User 
} from '../lib/firebase';
import { useToast } from './Toast';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (identifier: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  adminEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCredentialAdmin, setIsCredentialAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('rs_admin_session') === 'active_authenticated';
    } catch {
      return false;
    }
  });
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = async (identifier: string, pass: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check custom saved admin password or default master password
    let masterPassword = 'admin@rasel2025';
    try {
      const customPwd = localStorage.getItem('rs_admin_master_pwd');
      if (customPwd) masterPassword = customPwd;
    } catch {}

    // Strictly only the authorized administrator's email is permitted
    const isAuthorizedEmail = cleanId === ADMIN_EMAIL.toLowerCase() || cleanId === 'rsblog597@gmail.com';

    if (isAuthorizedEmail && cleanPass === masterPassword) {
      setIsCredentialAdmin(true);
      try {
        localStorage.setItem('rs_admin_session', 'active_authenticated');
        localStorage.setItem('rs_admin_logged_id', cleanId);
      } catch {}

      // Ensure Firebase session is active for Firestore operations
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (authErr) {
        console.warn('Firebase auth session note:', authErr);
      }

      showToast('অ্যাডমিন সফলভাবে লগইন করেছেন!', 'success');
      return true;
    }

    showToast('ভুল ইউজারনেম/ইমেইল অথবা পাসওয়ার্ড। প্রবেশাধিকার অস্বীকৃত।', 'error');
    return false;
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email === ADMIN_EMAIL) {
        showToast('অ্যাডমিন হিসেবে সফলভাবে লগইন করেছেন!', 'success');
      } else {
        showToast('অননুমোদিত অ্যাকাউন্ট। শুধুমাত্র অ্যাডমিন লগইন করতে পারবেন।', 'error');
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      // User closed the popup window voluntarily or another popup was opened
      if (
        firebaseError?.code === 'auth/popup-closed-by-user' ||
        firebaseError?.code === 'auth/cancelled-popup-request'
      ) {
        showToast('লগইন উইন্ডো বন্ধ করা হয়েছে।', 'info');
        return;
      }
      
      if (firebaseError?.code === 'auth/popup-blocked') {
        showToast('ব্রাউজারের পপ-আপ ব্লকার সক্রিয় আছে। অনুগ্রহ করে পপ-আপ উইন্ডো অ্যালাউ করুন।', 'info');
        return;
      }

      console.warn('Google Sign-In Notice:', firebaseError?.message || error);
      showToast('লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setIsCredentialAdmin(false);
    try {
      localStorage.removeItem('rs_admin_session');
      localStorage.removeItem('rs_admin_logged_id');
    } catch {}
    showToast('অ্যাডমিন লগআউট সম্পন্ন হয়েছে।', 'info');
  };

  const isAdmin = (user?.email === ADMIN_EMAIL) || isCredentialAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        loginWithGoogle,
        loginWithCredentials,
        logout,
        adminEmail: ADMIN_EMAIL,
      }}
    >
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
