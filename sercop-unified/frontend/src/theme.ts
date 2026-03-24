import { createSystem, defaultConfig } from '@chakra-ui/react';

// Banco Pichincha brand colors
const customConfig = {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#FFF9E6' },
          100: { value: '#FFECB8' },
          200: { value: '#FFDF8A' },
          300: { value: '#FFD25C' },
          400: { value: '#FFC52E' },
          500: { value: '#FFB800' }, // Primary yellow/gold
          600: { value: '#CC9300' },
          700: { value: '#996E00' },
          800: { value: '#664900' },
          900: { value: '#332500' },
        },
        primary: {
          50: { value: '#E6F2FF' },
          100: { value: '#B3D9FF' },
          200: { value: '#80BFFF' },
          300: { value: '#4DA6FF' },
          400: { value: '#1A8CFF' },
          500: { value: '#0073E6' }, // Primary blue
          600: { value: '#005CB8' },
          700: { value: '#00458A' },
          800: { value: '#002E5C' },
          900: { value: '#00172E' },
        },
      },
    },
  },
};

const system = createSystem(defaultConfig, customConfig);

export default system;
