/**
 * ResponsiveLayout - Layout adaptativo que cambia según el dispositivo
 *
 * - Desktop (≥992px): Sidebar completo + TopBar + Content
 * - Tablet (768-991px): Mini sidebar (iconos) + TopBar + Content
 * - Móvil (<768px): TopBar + Content + BottomNav con FAB + SmartCommandBar overlay
 *
 * Supports Cmd+K / Ctrl+K keyboard shortcut to open smart search on all layouts.
 */

import { Box, Flex } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useResponsiveSafe } from '../../hooks/useResponsive';
import { useTheme } from '../../contexts/ThemeContext';
import { Sidebar } from '../Sidebar';
import { TopBar } from '../TopBar';
import { Footer } from '../Footer';
import { BottomNavigation } from './BottomNavigation';
import { MobileDrawerMenu } from './MobileDrawerMenu';
import { MobileTopBar } from './MobileTopBar';
import { SmartCommandBar } from '../mobile/SmartCommandBar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { isMobile, isTablet } = useResponsiveSafe();
  const { getColors } = useTheme();
  const colors = getColors();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const openCommandBar = useCallback(() => setIsCommandBarOpen(true), []);
  const closeCommandBar = useCallback(() => setIsCommandBarOpen(false), []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // =====================
  // MOBILE LAYOUT
  // =====================
  if (isMobile) {
    return (
      <Flex h="100vh" direction="column" bg={colors.bgColorSecondary}>
        {/* Mobile Top Bar - sin hamburger */}
        <MobileTopBar />

        {/* Custom Drawer - Backdrop */}
        {isDrawerOpen && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex={1000}
            onClick={closeDrawer}
            opacity={isDrawerOpen ? 1 : 0}
            transition="opacity 0.3s ease"
          />
        )}

        {/* Custom Drawer - Content */}
        <Box
          position="fixed"
          top={0}
          left={0}
          h="100vh"
          w="280px"
          bg={colors.cardBg}
          zIndex={1001}
          transform={isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)'}
          transition="transform 0.3s ease"
          boxShadow={isDrawerOpen ? 'lg' : 'none'}
        >
          <MobileDrawerMenu onClose={closeDrawer} />
        </Box>

        {/* Content Area - con padding para bottom nav + safe area */}
        <Flex direction="column" flex={1} overflow="hidden">
          <Box
            flex={1}
            overflowY="auto"
            pb="calc(70px + env(safe-area-inset-bottom, 0px))"
            style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))' }}
          >
            {children}
          </Box>
        </Flex>

        {/* Bottom Navigation con FAB y callbacks */}
        <BottomNavigation
          onSearchOpen={openCommandBar}
          onMenuOpen={openDrawer}
        />

        {/* Smart Command Bar overlay */}
        {isCommandBarOpen && (
          <SmartCommandBar onClose={closeCommandBar} />
        )}
      </Flex>
    );
  }

  // =====================
  // TABLET LAYOUT
  // =====================
  if (isTablet) {
    return (
      <Flex h="100vh" direction="column" bg={colors.bgColorSecondary}>
        <Flex flex={1} overflow="hidden">
          {/* Mini Sidebar (colapsado, solo iconos) */}
          <Box w="70px" flexShrink={0}>
            <Sidebar collapsed />
          </Box>

          {/* Main Content Area */}
          <Flex direction="column" flex={1} overflow="hidden">
            <TopBar />
            <Flex direction="column" flex={1} overflowY="auto">
              <Box flex={1}>{children}</Box>
              <Footer />
            </Flex>
          </Flex>
        </Flex>

        {/* Smart Command Bar overlay - also available on tablet */}
        {isCommandBarOpen && (
          <SmartCommandBar onClose={closeCommandBar} />
        )}
      </Flex>
    );
  }

  // =====================
  // DESKTOP LAYOUT (default)
  // =====================
  return (
    <Flex h="100vh" direction="column" bg={colors.bgColorSecondary}>
      <Flex flex={1} overflow="hidden">
        {/* Full Sidebar - Spectacular Version */}
        <Sidebar />

        {/* Main Content Area */}
        <Flex direction="column" flex={1} overflow="hidden">
          <TopBar />
          <Flex direction="column" flex={1} overflowY="auto">
            <Box flex={1}>{children}</Box>
            <Footer />
          </Flex>
        </Flex>
      </Flex>

      {/* Smart Command Bar overlay - also available on desktop via Cmd+K */}
      {isCommandBarOpen && (
        <SmartCommandBar onClose={closeCommandBar} />
      )}
    </Flex>
  );
};

export default ResponsiveLayout;
