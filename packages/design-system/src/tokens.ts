/**
 * Design tokens – SERCOP V2 (paleta vanguardia)
 * Colores, espaciado, tipografía, breakpoints
 */
export const colors = {
  primary: '#0A66C2',
  primaryHover: '#0052A3',
  primaryLight: '#E8F4FD',
  accent: '#059669',
  accentHover: '#047857',
  backgroundHero: '#F0F7FF',
  textPrimary: '#1A1A1A',
  textSecondary: '#525252',
  success: '#059669',
  error: '#DC2626',
  warning: '#f59e0b',
  neutral50: '#fafafa',
  neutral100: '#f5f5f5',
  neutral200: '#E5E7EB',
  neutral500: '#9e9e9e',
  neutral700: '#616161',
  neutral900: '#1A1A1A',
} as const;

export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
