/**
 * Design tokens – SERCOP V2
 * Colores, espaciado, tipografía, breakpoints
 */
export const colors = {
  primary: '#0d47a1',
  primaryHover: '#1565c0',
  primaryLight: '#e3f2fd',
  success: '#2e7d32',
  error: '#c62828',
  warning: '#f9a825',
  neutral50: '#fafafa',
  neutral100: '#f5f5f5',
  neutral200: '#eeeeee',
  neutral500: '#9e9e9e',
  neutral700: '#616161',
  neutral900: '#212121',
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
