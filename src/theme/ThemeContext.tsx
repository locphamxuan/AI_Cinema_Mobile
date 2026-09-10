import React, { createContext, useContext, useState, ReactNode } from 'react';
import { lightColors, darkColors, ThemeColors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

export type ThemeMode = 'light' | 'dark';

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
  initialTheme = 'light', // DEFAULT IS PURE WHITE LIGHT THEME
}) => {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
      theme: 'light',
      isDark: false,
      colors: lightColors,
      setTheme: () => {},
      toggleTheme: () => {},
      spacing,
      borderRadius,
      typography,
    };
  }
  return context;
};
