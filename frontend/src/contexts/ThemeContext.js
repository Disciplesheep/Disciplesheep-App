import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Outside component — never recreated ─────────────────────────────────────
const VALID_SIZES   = ['small', 'medium', 'large', 'xlarge'];
const getSystemTheme = () => (new Date().getHours() >= 6 && new Date().getHours() < 18) ? 'light' : 'dark';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem('themeMode') || 'light'
  );

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return VALID_SIZES.includes(saved) ? saved : 'small';
  });

  // Derived — no separate state needed; computed from themeMode on demand
  const [actualTheme, setActualTheme] = useState(
    () => themeMode === 'auto' ? getSystemTheme() : themeMode
  );

  // Persist themeMode + keep actualTheme in sync; interval only when auto
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);

    if (themeMode !== 'auto') {
      setActualTheme(themeMode);
      return;
    }

    setActualTheme(getSystemTheme());

    // No stale-closure bug: always calls getSystemTheme() fresh each tick
    const id = setInterval(() => setActualTheme(getSystemTheme()), 60_000);
    return () => clearInterval(id);
  }, [themeMode]); // ← removed actualTheme dep so interval isn't reset on every theme change

  // Apply dark class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', actualTheme === 'dark');
  }, [actualTheme]);

  // Persist + apply font size
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  return (
    <ThemeContext.Provider value={{
      themeMode,
      actualTheme,
      changeThemeMode: setThemeMode,   // setter is stable — no wrapper needed
      fontSize,
      changeFontSize:  setFontSize,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};