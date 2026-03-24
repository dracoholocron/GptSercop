/**
 * Test Setup File
 *
 * Configures the testing environment for React components
 * with proper mocks for external dependencies.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      // Return key with params for testing purposes
      if (params) {
        let result = key;
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
        return result;
      }
      return key;
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock ThemeContext
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    getColors: () => ({
      textColor: '#1A202C',
      bgColor: '#FFFFFF',
      borderColor: '#E2E8F0',
    }),
  }),
}));

// Mock toaster
vi.mock('../components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

// Mock operationsApi
vi.mock('../services/operationsApi', () => ({
  operationCommands: {
    markResponseReceived: vi.fn(),
  },
}));

// Test wrapper with providers
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      {children}
    </ChakraProvider>
  );
}

// Custom render function that wraps components with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Reset all mocks and localStorage before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
