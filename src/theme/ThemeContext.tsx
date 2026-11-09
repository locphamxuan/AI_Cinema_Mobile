import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { loadThemeMode, saveThemeMode, type ThemeMode } from '../lib/themePreference';
import { lightColors, darkColors, ThemeColors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

export type { ThemeMode };

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode; initialTheme?: ThemeMode }> = ({
  children,
  initialTheme = 'dark',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  // Set once the viewer picks a look, so a slow read of the saved one cannot undo it.
  const picked = useRef(false);

  // The saved look comes back from AsyncStorage; a missing or unreadable value keeps the default.
  useEffect(() => {
    let active = true;
    void loadThemeMode(initialTheme).then((saved) => {
      if (active && !picked.current) setThemeState(saved);
    });
    return () => {
      active = false;
    };
  }, [initialTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    picked.current = true;
    setThemeState(mode);
    void saveThemeMode(mode);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === 'light' ? 'dark' : 'light'), [setTheme, theme]);

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        setTheme,
        toggleTheme,
        spacing,
        borderRadius,
        typography,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      theme: 'dark',
      isDark: true,
      colors: darkColors,
      setTheme: () => {},
      toggleTheme: () => {},
      spacing,
      borderRadius,
      typography,
    };
  }
  return context;
};
