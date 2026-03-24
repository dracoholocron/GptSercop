import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useBrand } from './BrandContext';

export type CustomTheme = 'default' | 'blue' | 'green' | 'purple';

interface ThemeContextType {
  darkMode: boolean;
  isDark: boolean; // Alias for darkMode
  toggleDarkMode: () => void;
  customTheme: CustomTheme;
  setCustomTheme: (theme: CustomTheme) => void;
  getColors: () => ColorScheme;
}

interface ColorScheme {
  bgColor: string;
  bgColorSecondary: string;
  borderColor: string;
  textColor: string;
  textColorSecondary: string;
  cardBg: string;
  hoverBg: string;
  activeBg: string;
  activeColor: string;
  primaryColor: string;
  primaryGradient: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper functions for initial state
const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('globalcmx-darkMode');
  if (saved !== null) return saved === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getInitialTheme = (): CustomTheme => {
  if (typeof window === 'undefined') return 'default';
  return (localStorage.getItem('globalcmx-customTheme') as CustomTheme) || 'default';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [customTheme, setCustomThemeState] = useState<CustomTheme>(getInitialTheme);

  // Get brand colors if available
  const { brand } = useBrand();

  // Apply dark mode class to document and persist
  useEffect(() => {
    localStorage.setItem('globalcmx-darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Persist custom theme
  useEffect(() => {
    localStorage.setItem('globalcmx-customTheme', customTheme);
  }, [customTheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (localStorage.getItem('globalcmx-darkMode') === null) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const setCustomTheme = (theme: CustomTheme) => {
    setCustomThemeState(theme);
  };

  const getColors = useCallback((): ColorScheme => {
    // Base colors - use brand values when available
    const baseColors = darkMode
      ? {
          bgColor: brand?.sidebarBgColor || '#1A202C',
          bgColorSecondary: brand?.contentBgColorDark || '#2D3748',
          borderColor: brand?.borderColorDark || '#4A5568',
          textColor: brand?.textColorDark || '#F7FAFC',
          textColorSecondary: brand?.textColorSecondaryDark || '#A0AEC0',
          cardBg: brand?.cardBgColorDark || '#2D3748',
          hoverBg: '#4A5568',
        }
      : {
          bgColor: '#FFFFFF',
          bgColorSecondary: brand?.contentBgColor || '#F7FAFC',
          borderColor: brand?.borderColor || '#E2E8F0',
          textColor: brand?.textColor || '#1A202C',
          textColorSecondary: brand?.textColorSecondary || '#718096',
          cardBg: brand?.cardBgColor || '#FFFFFF',
          hoverBg: brand?.contentBgColor || '#F7FAFC',
        };

    // If brand is active, use brand colors
    if (brand) {
      return {
        ...baseColors,
        activeBg: darkMode ? '#3D3000' : '#FFF9E6',
        activeColor: brand.accentColor || (darkMode ? '#FFD25C' : '#CC9300'),
        primaryColor: brand.primaryColor || '#FFB800',
        primaryGradient: brand.primaryColor || '#FFB800',
      };
    }

    // Theme-specific colors (fallback when no brand)
    const themeColors = {
      default: {
        activeBg: darkMode ? '#3D3000' : '#FFF9E6',
        activeColor: darkMode ? '#FFD25C' : '#CC9300',
        primaryColor: '#FFB800',
        primaryGradient: '#FFB800',
      },
      blue: {
        activeBg: darkMode ? '#1E3A5F' : '#E6F2FF',
        activeColor: darkMode ? '#4DA6FF' : '#005CB8',
        primaryColor: '#0073E6',
        primaryGradient: '#0073E6',
      },
      green: {
        activeBg: darkMode ? '#1C4532' : '#E6F9F0',
        activeColor: darkMode ? '#48BB78' : '#2F855A',
        primaryColor: '#38A169',
        primaryGradient: '#38A169',
      },
      purple: {
        activeBg: darkMode ? '#44337A' : '#FAF5FF',
        activeColor: darkMode ? '#B794F4' : '#6B46C1',
        primaryColor: '#805AD5',
        primaryGradient: '#805AD5',
      },
    };

    return {
      ...baseColors,
      ...themeColors[customTheme],
    };
  }, [darkMode, customTheme, brand]);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        isDark: darkMode, // Alias for darkMode
        toggleDarkMode,
        customTheme,
        setCustomTheme,
        getColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
