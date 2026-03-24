/**
 * useResponsive - Hook centralizado para detección de dispositivo y responsive design
 *
 * Proporciona información sobre el dispositivo actual y helpers para diseño responsive.
 * Usar con ResponsiveProvider para acceso global via context.
 */

import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';

// Breakpoints consistentes con Chakra UI
const BREAKPOINTS = {
  mobile: 0,
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
  '2xl': 1536,
} as const;

export interface ResponsiveState {
  // Breakpoints booleanos
  isMobile: boolean;        // < 768px
  isTablet: boolean;        // 768px - 991px
  isDesktop: boolean;       // >= 992px
  isLargeDesktop: boolean;  // >= 1280px

  // Orientación
  isPortrait: boolean;
  isLandscape: boolean;

  // Capacidades
  isTouchDevice: boolean;

  // Dimensiones
  screenWidth: number;
  screenHeight: number;

  // Helpers
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'largeDesktop';
  containerPadding: number;
  gridColumns: number;
}

/**
 * Hook que detecta el tamaño de pantalla y proporciona información responsive
 */
export const useResponsive = (): ResponsiveState => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Usar ResizeObserver si está disponible (mejor performance)
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(document.body);
      return () => resizeObserver.disconnect();
    }

    // Fallback a window resize event
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const state = useMemo((): ResponsiveState => {
    const { width, height } = dimensions;

    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg;
    const isLargeDesktop = width >= BREAKPOINTS.xl;

    const breakpoint = isMobile
      ? 'mobile'
      : isTablet
        ? 'tablet'
        : isLargeDesktop
          ? 'largeDesktop'
          : 'desktop';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      isPortrait: height > width,
      isLandscape: width > height,
      isTouchDevice: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
      screenWidth: width,
      screenHeight: height,
      breakpoint,
      containerPadding: isMobile ? 16 : isTablet ? 24 : 32,
      gridColumns: isMobile ? 1 : isTablet ? 2 : 3,
    };
  }, [dimensions]);

  return state;
};

// Context para acceso global
const ResponsiveContext = createContext<ResponsiveState | null>(null);

interface ResponsiveProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que envuelve la aplicación y proporciona estado responsive global
 */
export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const responsive = useResponsive();

  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
};

/**
 * Hook para acceder al estado responsive desde el context
 * Debe usarse dentro de ResponsiveProvider
 */
export const useResponsiveContext = (): ResponsiveState => {
  const context = useContext(ResponsiveContext);

  if (!context) {
    throw new Error('useResponsiveContext must be used within ResponsiveProvider');
  }

  return context;
};

/**
 * Hook opcional que no requiere provider (fallback seguro)
 * Útil para componentes que pueden usarse fuera del provider
 */
export const useResponsiveSafe = (): ResponsiveState => {
  const context = useContext(ResponsiveContext);
  const directHook = useResponsive();

  return context || directHook;
};

export default useResponsive;
