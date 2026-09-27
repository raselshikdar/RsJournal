'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rs_blog_theme');
        return saved === 'dark' ? 'dark' : 'light';
      } catch {
        return 'light';
      }
    }
    return 'light';
  });

  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Synchronize the DOM element with theme state
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme: Theme = prevTheme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('rs_blog_theme', nextTheme);
      } catch {
        // Ignored
      }
      return nextTheme;
    });
  }, []);

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
