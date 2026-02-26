import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  accent: string;
  muted: string;
  authBg: string;
  authFg: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  isLoading: boolean;
}

const defaultColors: ThemeColors = {
  primary: 'var(--color-primary, #CC0000)',
  accent: 'var(--color-accent, #CC0000)',
  muted: 'var(--color-muted, #a7b0c6)',
  authBg: 'var(--auth-bg, #CC0000)',
  authFg: 'var(--auth-fg, #fff)',
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  isLoading: false,
});

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider reads VITE_FRONTEND_THEME from environment.
 *
 * VITE_FRONTEND_THEME can be:
 * - Empty/undefined: uses CSS variables (default)
 * - JSON string: e.g., '{"primary":"#FF0000","accent":"#00FF00"}'
 * - URL to JSON file: e.g., 'https://example.com/theme.json'
 *
 * Theme JSON format:
 * {
 *   "primary": "#CC0000",
 *   "accent": "#CC0000",
 *   "muted": "#a7b0c6",
 *   "authBg": "#CC0000",
 *   "authFg": "#ffffff"
 * }
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const themeConfig = import.meta.env.VITE_FRONTEND_THEME;

    if (!themeConfig || themeConfig.trim() === '') {
      // No theme override; use CSS variables
      return;
    }

    const loadTheme = async () => {
      setIsLoading(true);
      try {
        let themeData: Partial<ThemeColors>;

        // Check if it's a URL
        if (themeConfig.startsWith('http://') || themeConfig.startsWith('https://')) {
          const response = await fetch(themeConfig);
          if (!response.ok) {
            throw new Error(`Failed to fetch theme: ${response.status}`);
          }
          themeData = await response.json();
        } else {
          // Assume it's a JSON string
          themeData = JSON.parse(themeConfig);
        }

        // Merge with defaults (only override provided values)
        setColors(prev => ({
          ...prev,
          ...themeData,
        }));

        // Apply theme colors to CSS variables on document root
        applyThemeToCSS(themeData);
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Fall back to defaults
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Apply theme colors to CSS custom properties on document root.
 * This allows the entire app to pick up the custom theme.
 */
function applyThemeToCSS(theme: Partial<ThemeColors>) {
  const root = document.documentElement;

  if (theme.primary) {
    root.style.setProperty('--color-primary', theme.primary);
  }
  if (theme.accent) {
    root.style.setProperty('--color-accent', theme.accent);
  }
  if (theme.muted) {
    root.style.setProperty('--color-muted', theme.muted);
  }
  if (theme.authBg) {
    root.style.setProperty('--auth-bg', theme.authBg);
  }
  if (theme.authFg) {
    root.style.setProperty('--auth-fg', theme.authFg);
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
