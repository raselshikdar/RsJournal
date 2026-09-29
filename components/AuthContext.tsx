'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
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
  isDemoAdmin: boolean;
  toggleDemoAdmin: () => void;
  adminEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);
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

    // Check custom saved admin password or default
    let masterPassword = 'admin@rasel2025';
    try {
      const customPwd = localStorage.getItem('rs_admin_master_pwd');
      if (customPwd) masterPassword = customPwd;
    } catch {}

    const validIdentifiers = [
      'admin@rasel.dev.bd',
      'rsblog597@gmail.com',
      'rasel',
      'admin',
      ADMIN_EMAIL.toLowerCase(),
    ];

    if (validIdentifiers.includes(cleanId) && cleanPass === masterPassword) {
      setIsCredentialAdmin(true);
      try {
        localStorage.setItem('rs_admin_session', 'active_authenticated');
        localStorage.setItem('rs_admin_logged_id', cleanId);
      } catch {}
      showToast('অ্যাডমিন ক্রিডেনশিয়াল দিয়ে সফলভাবে লগইন করেছেন!', 'success');
      return true;
    }

    showToast('ভুল ইউজারনেম/ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিন।', 'error');
    return false;
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email === ADMIN_EMAIL) {
        showToast('অ্যাডমিন হিসেবে সফলভাবে লগইন করেছেন!', 'success');
      } else {
        showToast(`স্বাগতম, ${result.user.displayName || 'ব্যবহারকারী'}!`, 'success');
      }
    } catch (error: unknown) {
      console.error('Google Sign-In Error:', error);
      showToast('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setIsDemoAdmin(false);
    setIsCredentialAdmin(false);
    try {
      localStorage.removeItem('rs_admin_session');
      localStorage.removeItem('rs_admin_logged_id');
    } catch {}
    showToast('অ্যাডমিন লগআউট সম্পন্ন হয়েছে।', 'info');
  };

  const toggleDemoAdmin = () => {
    setIsDemoAdmin((prev) => {
      const next = !prev;
      showToast(
        next ? 'ডেমো অ্যাডমিন মোড সক্রিয় হয়েছে!' : 'ডেমো অ্যাডমিন মোড নিষ্ক্রিয় হয়েছে।',
        'info'
      );
      return next;
    });
  };

  const isAdmin = (user?.email === ADMIN_EMAIL) || isDemoAdmin || isCredentialAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        loginWithGoogle,
        loginWithCredentials,
        logout,
        isDemoAdmin,
        toggleDemoAdmin,
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
