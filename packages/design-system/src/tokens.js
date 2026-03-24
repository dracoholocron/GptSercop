/**
 * Design tokens – SERCOP V2 (CommonJS para Tailwind PostCSS en Node).
 * Mantener en sync con tokens.ts.
 */
const colors = {
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
};

const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

const radii = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
};

const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
};

module.exports = { colors, shadows, radii, fontSize };
