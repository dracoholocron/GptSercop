/**
 * Design tokens – SERCOP V2 (paleta vanguardia)
 * Colores, espaciado, tipografía, sombras, radios, breakpoints.
 * Usar en theme de Tailwind de cada app para consistencia.
 */
export const colors = {
  // CMX Theme (Banco Pichincha)
  primary: '#FFB800',        // Amarillo/Dorado principal
  primaryHover: '#E5A600',   // Hover Oscurecido
  primaryLight: '#FFF8E5',   // Fondo suave
  accent: '#0073E6',         // Azul secundario
  accentHover: '#005BB8',
  backgroundHero: '#F4F7FB', // Gris azulado de fondo
  textPrimary: '#1A202C',    // Texto oscuro profundo
  textSecondary: '#4A5568',  // Texto secundario (slate)
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral700: '#374151',
  neutral900: '#111827',
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
