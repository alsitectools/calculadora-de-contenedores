import React, { createContext, useContext, useState, useEffect } from 'react';

type UnitSystem = 'metric' | 'imperial';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
  unitSystem: UnitSystem;
  toggleUnitSystem: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = 'alsiapps_theme';
const UNITS_STORAGE_KEY = 'alsiapps_units';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Dark Mode as requested by user
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'dark';
      }
    } catch {
      // ignore
    }
    return true; // Default is Dark Mode
  });

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    try {
      const saved = localStorage.getItem(UNITS_STORAGE_KEY) as UnitSystem;
      if (saved === 'imperial' || saved === 'metric') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'metric';
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDarkMode = (val: boolean) => {
    setIsDarkMode(val);
  };

  const toggleUnitSystem = () => {
    const next = unitSystem === 'metric' ? 'imperial' : 'metric';
    setUnitSystem(next);
    try {
      localStorage.setItem(UNITS_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        unitSystem,
        toggleUnitSystem,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
