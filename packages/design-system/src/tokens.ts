/**
 * Design tokens – SERCOP V2 (paleta vanguardia)
 * Colores, espaciado, tipografía, sombras, radios, breakpoints.
 * Usar en theme de Tailwind de cada app para consistencia.
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
  neutral300: '#d4d4d4',
  neutral400: '#a3a3a3',
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

/** Sombras para cards, botones y elevación */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

/** Radios de borde para botones, cards, inputs */
export const radii = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
} as const;

/** Tamaños de fuente para títulos y cuerpo */
export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
