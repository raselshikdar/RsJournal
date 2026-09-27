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
  logout: () => Promise<void>;
  isDemoAdmin: boolean;
  toggleDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      setIsDemoAdmin(false);
      showToast('লগআউট সম্পন্ন হয়েছে।', 'info');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      showToast('লগআউট করার সময় সমস্যা হয়েছে।', 'error');
    }
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

  const isAdmin = (user?.email === ADMIN_EMAIL) || isDemoAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        loginWithGoogle,
        logout,
        isDemoAdmin,
        toggleDemoAdmin,
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
