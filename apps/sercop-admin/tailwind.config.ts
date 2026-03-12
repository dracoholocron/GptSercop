import type { Config } from 'tailwindcss';
import { colors } from '../../packages/design-system/src/tokens';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/design-system/src/**/*.{js,ts,jsx,tsx,mdx}'],
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
    },
  },
  plugins: [],
};
export default config;
