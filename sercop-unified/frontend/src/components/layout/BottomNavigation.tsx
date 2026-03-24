/**
 * BottomNavigation - Premium bottom tab bar for mobile
 *
 * 5 tabs: Home, Ops, Search (FAB central), SWIFT, Menu
 * Features:
 * - Central FAB with pulse glow animation
 * - Glassmorphism bar
 * - Notification badges with counts
 * - Active tab indicator with smooth transitions
 */

import { Box, Flex, VStack, Text, Icon } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiBriefcase,
  FiSearch,
  FiMessageSquare,
  FiMenu,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface NavItem {
  key: string;
  icon: IconType;
  labelKey: string;
  action: 'navigate' | 'callback';
  path?: string;
  callbackKey?: 'onSearchOpen' | 'onMenuOpen';
  matchPaths?: string[];
  isFab?: boolean;
}

const navItems: NavItem[] = [
  {
    key: 'home',
    icon: FiHome,
    labelKey: 'mobileHome.tabs.home',
    action: 'navigate',
    path: '/mobile-home',
    matchPaths: ['/mobile-home', '/business-intelligence'],
  },
  {
    key: 'ops',
    icon: FiBriefcase,
    labelKey: 'mobileHome.tabs.ops',
    action: 'navigate',
    path: '/workbox/drafts',
    matchPaths: ['/workbox', '/lc-imports', '/lc-exports', '/guarantees', '/collections', '/operations'],
  },
  {
    key: 'search',
    icon: FiSearch,
    labelKey: 'mobileHome.tabs.search',
    action: 'callback',
    callbackKey: 'onSearchOpen',
    isFab: true,
  },
  {
    key: 'swift',
    icon: FiMessageSquare,
    labelKey: 'mobileHome.tabs.swift',
    action: 'navigate',
    path: '/swift-message-center',
  },
  {
    key: 'menu',
    icon: FiMenu,
    labelKey: 'mobileHome.tabs.menu',
    action: 'callback',
    callbackKey: 'onMenuOpen',
  },
];

interface BottomNavigationProps {
  onSearchOpen: () => void;
  onMenuOpen: () => void;
  badgeCounts?: {
    ops?: number;
    swift?: number;
  };
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onSearchOpen,
  onMenuOpen,
  badgeCounts,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();

  const callbacks: Record<string, () => void> = {
    onSearchOpen,
    onMenuOpen,
  };

  const isActive = (item: NavItem): boolean => {
    if (!item.path) return false;
    if (location.pathname === item.path) return true;
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    return location.pathname.startsWith(item.path);
  };

  const handleClick = (item: NavItem) => {
    if (item.action === 'navigate' && item.path) {
      navigate(item.path);
    } else if (item.action === 'callback' && item.callbackKey) {
      callbacks[item.callbackKey]();
    }
  };

  const getBadgeCount = (key: string): number | undefined => {
    if (!badgeCounts) return undefined;
    if (key === 'ops') return badgeCounts.ops;
    if (key === 'swift') return badgeCounts.swift;
    return undefined;
  };

  const barBg = darkMode
    ? 'rgba(26,32,44,0.85)'
    : 'rgba(255,255,255,0.85)';

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={barBg}
      borderTop="1px solid"
      borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
      zIndex={1000}
      pb="max(8px, env(safe-area-inset-bottom))"
      style={{
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      boxShadow="0 -4px 20px rgba(0,0,0,0.08)"
    >
      <Flex h="60px" justify="space-around" align="center" px={2} position="relative">
        {navItems.map((item) => {
          const active = isActive(item);
          const badge = getBadgeCount(item.key);

          // FAB central search button
          if (item.isFab) {
            return (
              <Flex
                key={item.key}
                flex={1}
                justify="center"
                align="center"
                position="relative"
              >
                <Box
                  position="absolute"
                  bottom="8px"
                  w="56px"
                  h="56px"
                  borderRadius="full"
                  bg={`linear-gradient(135deg, ${colors.primaryColor}, ${darkMode ? '#4F9CF7' : '#0056B3'})`}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow={`0 4px 16px ${colors.primaryColor}40`}
                  transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                  _active={{ transform: 'scale(0.88)' }}
                  onClick={() => handleClick(item)}
                  className="pulse-glow"
                >
                  <Icon as={item.icon} boxSize={6} />
                </Box>
              </Flex>
            );
          }

          // Regular tabs
          return (
            <VStack
              key={item.key}
              gap={0}
              cursor="pointer"
              onClick={() => handleClick(item)}
              color={active ? colors.primaryColor : colors.textColorSecondary}
              flex={1}
              py={2}
              position="relative"
              transition="all 0.2s"
              _active={{ transform: 'scale(0.9)' }}
            >
              {/* Active indicator dot */}
              {active && (
                <Box
                  position="absolute"
                  top="2px"
                  w="4px"
                  h="4px"
                  borderRadius="full"
                  bg={colors.primaryColor}
                  className="animate-scale-in"
                />
              )}

              <Box position="relative">
                <Icon
                  as={item.icon}
                  boxSize={active ? 6 : 5}
                  transition="all 0.2s"
                />
                {/* Notification badge */}
                {badge !== undefined && badge > 0 && (
                  <Box
                    position="absolute"
                    top="-4px"
                    right="-8px"
                    minW="16px"
                    h="16px"
                    borderRadius="full"
                    bg="#EF4444"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={1}
                    border="2px solid"
                    borderColor={darkMode ? 'rgba(26,32,44,0.85)' : 'rgba(255,255,255,0.85)'}
                  >
                    <Text fontSize="2xs" fontWeight="800" color="white" lineHeight="1">
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </Box>
                )}
              </Box>
              <Text
                fontSize="2xs"
                fontWeight={active ? '700' : '500'}
                mt={1}
                transition="all 0.2s"
              >
                {t(item.labelKey)}
              </Text>
            </VStack>
          );
        })}
      </Flex>
    </Box>
  );
};

export default BottomNavigation;
