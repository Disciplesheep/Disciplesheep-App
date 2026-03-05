import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'light';
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved || 'medium';
  });

  const getSystemTheme = () => {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  };

  const [actualTheme, setActualTheme] = useState(() => {
    if (themeMode === 'auto') {
      return getSystemTheme();
    }
    return themeMode;
  });

  const actualThemeRef = useRef(actualTheme);
  actualThemeRef.current = actualTheme;

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    
    if (themeMode === 'auto') {
      const theme = getSystemTheme();
      setActualTheme(theme);
      
      const interval = setInterval(() => {
        const newTheme = getSystemTheme();
        if (newTheme !== actualThemeRef.current) { // ✅ use ref instead of actualTheme
          setActualTheme(newTheme);
        }
      }, 60000);
      
      return () => clearInterval(interval);
    } else {
      setActualTheme(themeMode);
    }
  }, [themeMode]); // ✅ removed actualTheme from deps — no more warning or loop

  useEffect(() => {
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [actualTheme]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const changeThemeMode = (mode) => {
    setThemeMode(mode);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
  };

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      actualTheme, 
      changeThemeMode, 
      fontSize, 
      changeFontSize 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};