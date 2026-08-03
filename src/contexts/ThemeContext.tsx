'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export type ThemePalette = 'seafoam' | 'beige' | 'pink';
export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  palette: ThemePalette;
  mode: ThemeMode;
  setPalette: (palette: ThemePalette) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  palette: 'seafoam',
  mode: 'light',
  setPalette: () => {},
  setMode: () => {},
  toggleMode: () => {},
});

// Theme Config Definitions with Lighter, Soft & Harmonious Color Palettes
const THEME_CONFIGS = {
  seafoam: {
    name: 'Seafoam',
    icon: '🌿',
    light: {
      primary: '#2A6B5D',
      secondary: '#4D9B8C',
      accent: '#66CDAA',
      cream: '#FFF8ED',
      bgDefault: '#F2F8F6',
      bgPaper: '#FFFFFF',
      textPrimary: '#123029',
      textSecondary: '#3B6B60',
      glassBgLight: 'rgba(255, 255, 255, 0.88)',
      glassBgDark: 'linear-gradient(135deg, rgba(42, 107, 93, 0.92) 0%, rgba(26, 68, 59, 0.96) 100%)',
      glassBorder: 'rgba(102, 205, 170, 0.45)',
      glassShadow: '0 12px 32px 0 rgba(42, 107, 93, 0.08)'
    },
    dark: {
      primary: '#66CDAA',
      secondary: '#52A694',
      accent: '#80E5C2',
      cream: '#344540',
      bgDefault: '#0E1A17',
      bgPaper: '#172A26',
      textPrimary: '#F2FAF7',
      textSecondary: '#A5E6D2',
      glassBgLight: 'rgba(23, 42, 38, 0.88)',
      glassBgDark: 'linear-gradient(135deg, rgba(18, 36, 32, 0.96) 0%, rgba(10, 20, 18, 0.98) 100%)',
      glassBorder: 'rgba(102, 205, 170, 0.32)',
      glassShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.4)'
    }
  },
  beige: {
    name: 'Beige',
    icon: '🌾',
    light: {
      primary: '#735740',
      secondary: '#B58D67',
      accent: '#EBD2B5',
      cream: '#FFFBF5',
      bgDefault: '#FAF6F0',
      bgPaper: '#FFFFFF',
      textPrimary: '#2B1E14',
      textSecondary: '#664E3A',
      glassBgLight: 'rgba(255, 255, 255, 0.88)',
      glassBgDark: 'linear-gradient(135deg, rgba(115, 87, 64, 0.92) 0%, rgba(77, 56, 40, 0.96) 100%)',
      glassBorder: 'rgba(212, 175, 137, 0.48)',
      glassShadow: '0 12px 32px 0 rgba(115, 87, 64, 0.08)'
    },
    dark: {
      primary: '#EBD2B5',
      secondary: '#D4AF89',
      accent: '#F5E4D3',
      cream: '#42362C',
      bgDefault: '#17120D',
      bgPaper: '#241D16',
      textPrimary: '#FAF6F0',
      textSecondary: '#E8D4C1',
      glassBgLight: 'rgba(36, 29, 22, 0.88)',
      glassBgDark: 'linear-gradient(135deg, rgba(28, 22, 17, 0.96) 0%, rgba(14, 11, 8, 0.98) 100%)',
      glassBorder: 'rgba(235, 210, 181, 0.32)',
      glassShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.45)'
    }
  },
  pink: {
    name: 'Pink',
    icon: '🌸',
    light: {
      primary: '#8A3859',
      secondary: '#C9658E',
      accent: '#F7C6DC',
      cream: '#FFF5F8',
      bgDefault: '#FAF2F5',
      bgPaper: '#FFFFFF',
      textPrimary: '#33101E',
      textSecondary: '#702D49',
      glassBgLight: 'rgba(255, 255, 255, 0.88)',
      glassBgDark: 'linear-gradient(135deg, rgba(138, 56, 89, 0.92) 0%, rgba(92, 35, 58, 0.96) 100%)',
      glassBorder: 'rgba(247, 198, 220, 0.55)',
      glassShadow: '0 12px 32px 0 rgba(138, 56, 89, 0.08)'
    },
    dark: {
      primary: '#F7C6DC',
      secondary: '#E38CB1',
      accent: '#FADAE7',
      cream: '#422834',
      bgDefault: '#1A0B12',
      bgPaper: '#29121E',
      textPrimary: '#FAF2F5',
      textSecondary: '#EBBACE',
      glassBgLight: 'rgba(41, 18, 30, 0.88)',
      glassBgDark: 'linear-gradient(135deg, rgba(31, 13, 22, 0.96) 0%, rgba(15, 6, 11, 0.98) 100%)',
      glassBorder: 'rgba(247, 198, 220, 0.35)',
      glassShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.45)'
    }
  }
};

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const [palette, setPaletteState] = useState<ThemePalette>('seafoam');
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedPalette = localStorage.getItem('medizo_theme_palette') as ThemePalette;
    const savedMode = localStorage.getItem('medizo_theme_mode') as ThemeMode;

    if (savedPalette && THEME_CONFIGS[savedPalette]) {
      setPaletteState(savedPalette);
    }
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setModeState(savedMode);
    }
  }, []);

  const setPalette = (p: ThemePalette) => {
    setPaletteState(p);
    localStorage.setItem('medizo_theme_palette', p);
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('medizo_theme_mode', m);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const currentTokens = THEME_CONFIGS[palette][mode];

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    document.body.setAttribute('data-theme', mode);

    root.style.setProperty('--color-forest', currentTokens.primary);
    root.style.setProperty('--color-teal', currentTokens.secondary);
    root.style.setProperty('--color-mint', currentTokens.accent);
    root.style.setProperty('--color-cream', currentTokens.cream);
    root.style.setProperty('--color-light-bg', currentTokens.bgDefault);
    root.style.setProperty('--glass-bg-light', currentTokens.glassBgLight);
    root.style.setProperty('--glass-border', currentTokens.glassBorder);
    root.style.setProperty('--glass-shadow', currentTokens.glassShadow);
    
    document.body.style.backgroundColor = currentTokens.bgDefault;
    document.body.style.color = currentTokens.textPrimary;
  }, [palette, mode, currentTokens]);

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: mode,
        primary: {
          main: currentTokens.primary,
          light: currentTokens.secondary,
          dark: currentTokens.primary,
          contrastText: '#FFFFFF'
        },
        secondary: {
          main: currentTokens.secondary,
          light: currentTokens.accent,
        },
        background: {
          default: currentTokens.bgDefault,
          paper: currentTokens.bgPaper,
        },
        text: {
          primary: currentTokens.textPrimary,
          secondary: currentTokens.textSecondary,
        }
      },
      typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        button: {
          textTransform: 'none',
          fontWeight: 700,
        },
      },
      shape: {
        borderRadius: 18,
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: 'none',
            }
          }
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: currentTokens.textSecondary,
              fontWeight: 600,
              '&.Mui-focused': {
                color: currentTokens.primary,
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              color: currentTokens.textPrimary,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'light' 
                  ? 'rgba(42, 107, 93, 0.35)' 
                  : 'rgba(102, 205, 170, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTokens.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: currentTokens.primary,
              },
            },
            input: {
              color: currentTokens.textPrimary,
              '&::placeholder': {
                color: currentTokens.textSecondary,
                opacity: 0.8,
              },
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              color: currentTokens.textPrimary,
            },
            input: {
              color: currentTokens.textPrimary,
              '&::placeholder': {
                color: currentTokens.textSecondary,
                opacity: 0.8,
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            select: {
              color: currentTokens.textPrimary,
            },
            icon: {
              color: currentTokens.textSecondary,
            },
          },
        },
      }
    });
  }, [palette, mode, currentTokens]);

  return (
    <ThemeContext.Provider value={{ palette, mode, setPalette, setMode, toggleMode }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
