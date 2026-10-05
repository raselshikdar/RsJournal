'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function subscribeTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('theme-change', callback);
  };
}

function getThemeSnapshot(): Theme {
  try {
    const saved = localStorage.getItem('rs_blog_theme');
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useIsMounted();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Synchronize document.documentElement class when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('rs_blog_theme', nextTheme);
      if (typeof document !== 'undefined') {
        try {
          const match = document.cookie.match(/(?:^|;\s*)rs_consent_status=([^;]*)/);
          if (match) {
            const consent = JSON.parse(decodeURIComponent(match[1]));
            if (consent?.categories?.preferences) {
              const maxAge = 365 * 24 * 60 * 60;
              const isSecure = window.location.protocol === 'https:';
              document.cookie = `rs_blog_theme=${encodeURIComponent(nextTheme)}; max-age=${maxAge}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
            }
          }
        } catch {}
      }
      window.dispatchEvent(new Event('theme-change'));
    } catch {
      // Ignored
    }
  }, [theme]);

  const handleSetFontSize = useCallback((size: FontSize) => {
    setFontSize(size);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        fontSize,
        setFontSize: handleSetFontSize,
        focusMode,
        toggleFocusMode,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
