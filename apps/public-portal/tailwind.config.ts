import type { Config } from 'tailwindcss';
import { colors, shadows, radii, fontSize } from '../../packages/design-system/src/tokens';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: colors.primary, hover: colors.primaryHover, light: colors.primaryLight },
        accent: { DEFAULT: colors.accent, hover: colors.accentHover },
        error: colors.error,
        'hero-bg': colors.backgroundHero,
        'text-primary': colors.textPrimary,
        'text-secondary': colors.textSecondary,
      },
      boxShadow: {
        sm: shadows.sm,
        md: shadows.md,
        lg: shadows.lg,
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
      },
      fontSize: {
        xs: [fontSize.xs, { lineHeight: '1rem' }],
        sm: [fontSize.sm, { lineHeight: '1.25rem' }],
        base: [fontSize.base, { lineHeight: '1.5rem' }],
        lg: [fontSize.lg, { lineHeight: '1.75rem' }],
        xl: [fontSize.xl, { lineHeight: '1.75rem' }],
        '2xl': [fontSize['2xl'], { lineHeight: '2rem' }],
        '3xl': [fontSize['3xl'], { lineHeight: '2.25rem' }],
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
