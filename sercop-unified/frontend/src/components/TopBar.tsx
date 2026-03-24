import {
  Flex,
  HStack,
  Text,
  Box,
  Separator,
  VStack,
  Icon,
  Dialog,
  Portal,
  CloseButton,
  Tooltip,
} from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import { useTranslation } from 'react-i18next';
import { keyframes } from '@emotion/react';
import {
  FiLogOut,
  FiPrinter,
  FiMoon,
  FiSun,
  FiBell,
  FiRefreshCw,
  FiChevronDown,
  FiShield,
  FiHelpCircle,
  FiUser,
  FiExternalLink,
  FiInfo,
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiCpu,
  FiVideo,
  FiSearch,
} from 'react-icons/fi';
import { LuPalette } from 'react-icons/lu';
import { PlatformCapabilities } from './dashboard/PlatformCapabilities';
import GlobalAIExtractionModal from './shared/GlobalAIExtractionModal';
import { SmartCommandBar } from './mobile/SmartCommandBar';
import { AlertsWidget } from './alerts/AlertsWidget';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useBrand } from '../contexts/BrandContext';
import { scheduleService } from '../services/scheduleService';
import type { ScheduleStatus } from '../services/scheduleService';

// Animations
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(66, 153, 225, 0.4), 0 0 16px rgba(66, 153, 225, 0.2); }
  50% { box-shadow: 0 0 15px rgba(66, 153, 225, 0.6), 0 0 25px rgba(66, 153, 225, 0.3); }
`;

const bellRing = keyframes`
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(8deg); }
  20%, 40% { transform: rotate(-8deg); }
  50% { transform: rotate(0deg); }
`;

export const TopBar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin or manager role
  const canViewAbout = isAdmin || hasRole('ROLE_MANAGER') || user?.role === 'admin' || user?.role === 'manager';
  const { toggleDarkMode, getColors, isDark } = useTheme();
  const { brand } = useBrand();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showAIExtractionModal, setShowAIExtractionModal] = useState(false);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [unreadMessages] = useState(3);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Fetch schedule status
  useEffect(() => {
    const fetchScheduleStatus = async () => {
      try {
        const status = await scheduleService.getCurrentStatus();
        setScheduleStatus(status);
      } catch {
        // Silently fail - schedule feature might not be enabled
      }
    };

    fetchScheduleStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchScheduleStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Available languages with flags and native names
  const languages = [
    { code: 'en', flag: '🇺🇸', name: 'English', nativeName: 'English' },
    { code: 'es', flag: '🇪🇸', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', flag: '🇫🇷', name: 'French', nativeName: 'Français' },
    { code: 'pt', flag: '🇧🇷', name: 'Portuguese', nativeName: 'Português' },
    { code: 'de', flag: '🇩🇪', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', flag: '🇮🇹', name: 'Italian', nativeName: 'Italiano' },
    { code: 'zh', flag: '🇨🇳', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', flag: '🇯🇵', name: 'Japanese', nativeName: '日本語' },
    { code: 'ar', flag: '🇸🇦', name: 'Arabic', nativeName: 'العربية' },
    { code: 'ko', flag: '🇰🇷', name: 'Korean', nativeName: '한국어' },
  ];

  // Get language code (handle cases like 'en-US' -> 'en')
  const currentLangCode = i18n.language?.split('-')[0] || 'en';
  const currentLanguage = languages.find(l => l.code === currentLangCode) || languages[0];

  const colors = getColors();
  const { bgColor, textColor, primaryColor, textColorSecondary } = colors;
  const glowColor = isDark ? 'rgba(66, 153, 225, 0.5)' : 'rgba(66, 153, 225, 0.4)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageMenu(false);
  };

  const handlePrint = () => window.print();
  const handleRefresh = () => window.location.reload();

  const handleProfileClick = () => {
    setShowUserMenu(false);
    toaster.create({
      title: t('topBar.comingSoon', 'Próximamente'),
      description: t('topBar.profileComingSoon', 'La página de perfil estará disponible pronto'),
      type: 'info',
      duration: 3000,
    });
  };

  const handleSecurityClick = () => {
    setShowUserMenu(false);
    navigate('/security');
  };

  const handleBrandTemplatesClick = () => {
    setShowUserMenu(false);
    navigate('/catalogs/brand-templates');
  };

  const handleHelpClick = () => {
    setShowUserMenu(false);
    window.open('https://docs.globalcmx.com', '_blank');
  };

  const handleAboutClick = () => {
    setShowUserMenu(false);
    setShowAboutDialog(true);
  };

  const getUserInitials = () => {
    const name = user?.name || user?.username || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const iconButtonStyles = {
    p: 2.5,
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    bg: 'transparent',
    _hover: {
      bg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      transform: 'scale(1.08)',
    },
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      minH="76px"
      maxH="76px"
      px={6}
      py={4}
      bg={brand?.headerBgColor
        || (isDark
          ? 'linear-gradient(90deg, rgba(13, 17, 28, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)'
          : 'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)')}
      borderBottom="1px solid"
      borderColor={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
      flexShrink={0}
      zIndex={10}
      boxShadow={isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.06)'}
      backdropFilter="blur(20px)"
      position="relative"
      css={{
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(66, 153, 225, 0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(66, 153, 225, 0.2), transparent)',
        }
      }}
    >
      {/* Left side - Actions */}
      <HStack gap={2}>
        {/* Refresh Button */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={handleRefresh}
              aria-label={t('topBar.refresh', 'Actualizar')}
              p={2.5}
              borderRadius="12px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s ease"
              bg={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
              _hover={{
                bg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                transform: 'scale(1.05)',
              }}
            >
              <Icon as={FiRefreshCw} boxSize={5} color={textColorSecondary} />
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={3} py={1.5} borderRadius="lg" fontSize="xs" fontWeight="500">
              {t('topBar.refresh', 'Actualizar')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        {/* Print Button */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={handlePrint}
              aria-label={t('topBar.print', 'Imprimir')}
              p={2.5}
              borderRadius="12px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s ease"
              bg={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
              _hover={{
                bg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                transform: 'scale(1.05)',
              }}
            >
              <Icon as={FiPrinter} boxSize={5} color={textColorSecondary} />
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={3} py={1.5} borderRadius="lg" fontSize="xs" fontWeight="500">
              {t('topBar.print', 'Imprimir')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        <Separator orientation="vertical" h="24px" borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'} />

        {/* AI Extraction Tool Button */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={() => setShowAIExtractionModal(true)}
              aria-label={t('topBar.aiExtraction', 'Extracción IA')}
              px={3}
              py={2}
              borderRadius="12px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={2}
              transition="all 0.2s ease"
              bg={isDark ? 'rgba(147, 51, 234, 0.12)' : 'rgba(147, 51, 234, 0.08)'}
              _hover={{
                bg: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.15)',
                transform: 'scale(1.02)',
              }}
            >
              <Icon as={FiCpu} boxSize={4.5} color={isDark ? '#D6BCFA' : '#9333EA'} />
              <Text fontSize="sm" fontWeight="600" color={isDark ? '#D6BCFA' : '#9333EA'} display={{ base: 'none', md: 'block' }}>
                {t('topBar.aiExtraction', 'Extracción IA')}
              </Text>
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={3} py={1.5} borderRadius="lg" fontSize="xs" fontWeight="500">
              {t('topBar.aiExtraction', 'Extracción IA')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        {/* Agenda Button */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={() => navigate('/alerts')}
              aria-label={t('topBar.agenda', 'Agenda')}
              px={3}
              py={2}
              borderRadius="12px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={2}
              transition="all 0.2s ease"
              bg={isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)'}
              _hover={{
                bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                transform: 'scale(1.02)',
              }}
            >
              <Icon as={FiBell} boxSize={4.5} color={isDark ? '#93C5FD' : '#3B82F6'} />
              <Text fontSize="sm" fontWeight="600" color={isDark ? '#93C5FD' : '#3B82F6'} display={{ base: 'none', md: 'block' }}>
                {t('topBar.agenda', 'Agenda')}
              </Text>
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={3} py={1.5} borderRadius="lg" fontSize="xs" fontWeight="500">
              {t('topBar.agenda', 'Agenda de Alertas')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        {/* Video Conference Button */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={() => navigate('/video-conference')}
              aria-label={t('videoConference.videoCall', 'Videollamada')}
              px={3}
              py={2}
              borderRadius="12px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={2}
              transition="all 0.2s ease"
              bg={isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'}
              _hover={{
                bg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                transform: 'scale(1.02)',
              }}
            >
              <Icon as={FiVideo} boxSize={4.5} color={isDark ? '#6EE7B7' : '#10B981'} />
              <Text fontSize="sm" fontWeight="600" color={isDark ? '#6EE7B7' : '#10B981'} display={{ base: 'none', md: 'block' }}>
                {t('videoConference.videoCall', 'Videollamada')}
              </Text>
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={3} py={1.5} borderRadius="lg" fontSize="xs" fontWeight="500">
              {t('videoConference.scheduleMeeting', 'Programar Reunión')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        <Separator orientation="vertical" h="24px" borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'} />

        {/* Smart Search Button */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={() => setShowSmartSearch(true)}
              aria-label={t('mobileHome.tabs.search', 'Search')}
              px={3}
              py={2}
              borderRadius="12px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={2}
              transition="all 0.2s ease"
              bg={isDark ? 'rgba(0, 115, 230, 0.12)' : 'rgba(0, 115, 230, 0.08)'}
              _hover={{
                bg: isDark ? 'rgba(0, 115, 230, 0.2)' : 'rgba(0, 115, 230, 0.15)',
                transform: 'scale(1.02)',
              }}
            >
              <Icon as={FiSearch} boxSize={4.5} color={isDark ? '#93C5FD' : '#0073E6'} />
              <Text fontSize="sm" fontWeight="600" color={isDark ? '#93C5FD' : '#0073E6'} display={{ base: 'none', md: 'block' }}>
                {t('mobileHome.tabs.search', 'Buscar')}
              </Text>
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={3} py={1.5} borderRadius="lg" fontSize="xs" fontWeight="500">
              {t('mobileHome.search.placeholder', 'Buscar operación por ID o referencia...')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </HStack>

      {/* Right side */}
      <HStack gap={2}>
        {/* Language Selector */}
        <Box position="relative" ref={languageMenuRef}>
          <Box
            as="button"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            title={t('topBar.language')}
            px={3}
            py={2}
            borderRadius="12px"
            cursor="pointer"
            display="flex"
            alignItems="center"
            gap={2}
            transition="all 0.25s ease"
            bg={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}
            _hover={{
              bg: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              transform: 'scale(1.02)',
            }}
          >
            <Text fontSize="lg">{currentLanguage.flag}</Text>
            <Text fontSize="sm" fontWeight="600" color={textColor}>
              {currentLanguage.code.toUpperCase()}
            </Text>
            <Icon
              as={FiChevronDown}
              boxSize={4}
              color={textColorSecondary}
              transition="transform 0.2s ease"
              transform={showLanguageMenu ? 'rotate(180deg)' : 'rotate(0deg)'}
            />
          </Box>

          {/* Language Dropdown */}
          {showLanguageMenu && (
            <Box
              position="absolute"
              top="100%"
              right={0}
              mt={2}
              bg={isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
              border="1px solid"
              borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              borderRadius="16px"
              boxShadow={isDark ? '0 15px 50px rgba(0, 0, 0, 0.5)' : '0 15px 50px rgba(0, 0, 0, 0.15)'}
              p={2}
              minW="200px"
              maxH="400px"
              overflowY="auto"
              zIndex={1000}
              backdropFilter="blur(20px)"
            >
              <Text fontSize="xs" fontWeight="600" color={textColorSecondary} px={3} py={2} textTransform="uppercase" letterSpacing="0.05em">
                {t('topBar.selectLanguage', 'Select Language')}
              </Text>
              <VStack gap={1} align="stretch">
                {languages.map((lang) => (
                  <Box
                    key={lang.code}
                    as="button"
                    onClick={() => changeLanguage(lang.code)}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    px={3}
                    py={2.5}
                    borderRadius="10px"
                    transition="all 0.2s ease"
                    bg={currentLangCode === lang.code
                      ? (isDark ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)')
                      : 'transparent'
                    }
                    _hover={{
                      bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      transform: 'translateX(4px)',
                    }}
                  >
                    <Text fontSize="xl">{lang.flag}</Text>
                    <Box flex={1} textAlign="left">
                      <Text fontSize="14px" fontWeight="500" color={textColor}>
                        {lang.nativeName}
                      </Text>
                      <Text fontSize="11px" color={textColorSecondary}>
                        {lang.name}
                      </Text>
                    </Box>
                    {currentLangCode === lang.code && (
                      <Icon as={FiCheck} boxSize={4} color={primaryColor} />
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </Box>

        <Separator orientation="vertical" h="28px" borderColor={isDark ? 'whiteAlpha.200' : 'blackAlpha.200'} />

        {/* Dark Mode Toggle */}
        <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
          <Tooltip.Trigger asChild>
            <Box
              as="button"
              onClick={toggleDarkMode}
              aria-label={t('topBar.darkMode')}
              p={2.5}
              borderRadius="14px"
              cursor="pointer"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              bg={isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(99, 102, 241, 0.1)'}
              _hover={{
                transform: 'scale(1.1) rotate(15deg)',
                boxShadow: isDark ? '0 0 20px rgba(251, 191, 36, 0.4)' : '0 0 20px rgba(99, 102, 241, 0.3)',
              }}
            >
              {isDark ? <Icon as={FiSun} boxSize={5} color="#FBBF24" /> : <Icon as={FiMoon} boxSize={5} color="#6366F1" />}
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={2} py={1} borderRadius="md" fontSize="xs">
              {t('topBar.darkMode')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        <Separator orientation="vertical" h="28px" borderColor={isDark ? 'whiteAlpha.200' : 'blackAlpha.200'} />

        {/* Schedule Status Indicator */}
        {scheduleStatus && (
          <Tooltip.Root openDelay={100} positioning={{ placement: 'bottom' }}>
            <Tooltip.Trigger asChild>
              <Box
                as="button"
                onClick={() => navigate('/admin/schedules')}
                aria-label={scheduleStatus.isAllowed ? t('topBar.scheduleActive', 'En horario') : t('topBar.scheduleInactive', 'Fuera de horario')}
                px={3}
                py={1.5}
                borderRadius="10px"
                display="flex"
                alignItems="center"
                gap={2}
                transition="all 0.2s ease"
                bg={scheduleStatus.isAllowed
                  ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                  : (isDark ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)')
                }
                _hover={{
                  bg: scheduleStatus.isAllowed
                    ? (isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.15)')
                    : (isDark ? 'rgba(251, 146, 60, 0.25)' : 'rgba(251, 146, 60, 0.15)'),
                  transform: 'scale(1.02)',
                }}
              >
                <Icon
                  as={scheduleStatus.isAllowed ? FiClock : FiAlertTriangle}
                  boxSize={4}
                  color={scheduleStatus.isAllowed ? 'green.500' : 'orange.500'}
                />
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={scheduleStatus.isAllowed ? 'green.500' : 'orange.500'}
                  display={{ base: 'none', lg: 'block' }}
                >
                  {scheduleStatus.isAllowed
                    ? (scheduleStatus.minutesRemaining && scheduleStatus.minutesRemaining <= 30
                        ? `${scheduleStatus.minutesRemaining} min`
                        : scheduleStatus.currentTimeFormatted || 'OK')
                    : 'OFF'}
                </Text>
              </Box>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content bg={isDark ? 'gray.700' : 'gray.800'} color="white" px={2} py={1} borderRadius="md" fontSize="xs">
                {scheduleStatus.isAllowed
                  ? `${t('topBar.scheduleActive', 'En horario')}${scheduleStatus.minutesRemaining ? ` - ${scheduleStatus.minutesRemaining} min` : ''}`
                  : t('topBar.scheduleInactive', 'Fuera de horario')
                }
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        )}

        <Separator orientation="vertical" h="28px" borderColor={isDark ? 'whiteAlpha.200' : 'blackAlpha.200'} />

        {/* Alerts Widget */}
        <AlertsWidget refreshInterval={60000} />

        <Separator orientation="vertical" h="28px" borderColor={isDark ? 'whiteAlpha.200' : 'blackAlpha.200'} />

        {/* User Profile */}
        <Box position="relative" ref={userMenuRef}>
          <Flex
            as="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            align="center"
            gap={3}
            px={3}
            py={2}
            borderRadius="16px"
            cursor="pointer"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            bg={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}
            _hover={{
              bg: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 4px 20px ' + glowColor,
            }}
          >
            <Box
              w="42px"
              h="42px"
              borderRadius="14px"
              bgGradient="linear(135deg, blue.400 0%, blue.600 50%, purple.500 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow={'0 4px 15px ' + glowColor}
              transition="all 0.3s ease"
              css={{ animation: pulseGlow + ' 4s ease-in-out infinite' }}
            >
              <Text fontSize="14px" fontWeight="700" color="white">{getUserInitials()}</Text>
            </Box>

            <Box display={{ base: 'none', md: 'block' }} textAlign="left">
              <Text fontSize="14px" fontWeight="600" color={textColor} lineHeight="1.2">
                {user?.name || user?.username}
              </Text>
              <Text fontSize="11px" color={textColorSecondary} fontWeight="500" textTransform="uppercase" letterSpacing="0.05em" mt="2px">
                {user?.role}
              </Text>
            </Box>

            <Icon as={FiChevronDown} boxSize={4} color={textColorSecondary} transition="transform 0.3s ease" transform={showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'} />
          </Flex>

          {showUserMenu && (
            <Box
              position="absolute"
              top="100%"
              right={0}
              mt={2}
              bg={isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
              border="1px solid"
              borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              borderRadius="18px"
              boxShadow={isDark ? '0 15px 50px rgba(0, 0, 0, 0.5)' : '0 15px 50px rgba(0, 0, 0, 0.15)'}
              p={2}
              minW="260px"
              zIndex={1000}
              backdropFilter="blur(20px)"
              overflow="hidden"
            >
              <Flex align="center" gap={3} px={3} py={3} mb={2}>
                <Box
                  w="50px"
                  h="50px"
                  borderRadius="16px"
                  bgGradient="linear(135deg, blue.400 0%, blue.600 50%, purple.500 100%)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow={'0 6px 20px ' + glowColor}
                >
                  <Text fontSize="18px" fontWeight="700" color="white">{getUserInitials()}</Text>
                </Box>
                <Box flex={1}>
                  <Text fontSize="15px" fontWeight="600" color={textColor}>{user?.name || user?.username}</Text>
                  <Text fontSize="12px" color={textColorSecondary}>{user?.email || user?.username}</Text>
                </Box>
              </Flex>

              <Separator borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'} />

              <VStack gap={1} align="stretch" py={2}>
                <Box as="button" onClick={handleProfileClick} display="flex" alignItems="center" gap={3} px={3} py={2.5} borderRadius="12px" transition="all 0.2s ease" _hover={{ bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', transform: 'translateX(4px)' }}>
                  <Icon as={FiUser} boxSize={5} color={textColorSecondary} />
                  <Text fontSize="14px" fontWeight="500" color={textColor}>{t('topBar.profile', 'Mi Perfil')}</Text>
                  <Text fontSize="10px" color={primaryColor} ml="auto" fontWeight="600">PRONTO</Text>
                </Box>

                <Box as="button" onClick={handleSecurityClick} display="flex" alignItems="center" gap={3} px={3} py={2.5} borderRadius="12px" transition="all 0.2s ease" _hover={{ bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', transform: 'translateX(4px)' }}>
                  <Icon as={FiShield} boxSize={5} color={textColorSecondary} />
                  <Text fontSize="14px" fontWeight="500" color={textColor}>{t('topBar.security', 'Seguridad')}</Text>
                </Box>

                <Box as="button" onClick={handleBrandTemplatesClick} display="flex" alignItems="center" gap={3} px={3} py={2.5} borderRadius="12px" transition="all 0.2s ease" _hover={{ bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', transform: 'translateX(4px)' }}>
                  <Icon as={LuPalette} boxSize={5} color={textColorSecondary} />
                  <Text fontSize="14px" fontWeight="500" color={textColor}>{t('topBar.brandTemplates', 'Personalizar Marca')}</Text>
                </Box>

                <Box as="button" onClick={handleHelpClick} display="flex" alignItems="center" gap={3} px={3} py={2.5} borderRadius="12px" transition="all 0.2s ease" _hover={{ bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', transform: 'translateX(4px)' }}>
                  <Icon as={FiHelpCircle} boxSize={5} color={textColorSecondary} />
                  <Text fontSize="14px" fontWeight="500" color={textColor}>{t('topBar.help', 'Ayuda')}</Text>
                  <Icon as={FiExternalLink} boxSize={4} color={textColorSecondary} ml="auto" />
                </Box>

                {canViewAbout && (
                  <Box as="button" onClick={handleAboutClick} display="flex" alignItems="center" gap={3} px={3} py={2.5} borderRadius="12px" transition="all 0.2s ease" _hover={{ bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', transform: 'translateX(4px)' }}>
                    <Icon as={FiInfo} boxSize={5} color={textColorSecondary} />
                    <Text fontSize="14px" fontWeight="500" color={textColor}>{t('topBar.about', 'Acerca de')}</Text>
                  </Box>
                )}
              </VStack>

              <Separator borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'} />

              <Box as="button" onClick={handleLogout} display="flex" alignItems="center" gap={3} w="full" px={3} py={3} mt={2} borderRadius="12px" transition="all 0.25s ease" bg="rgba(239, 68, 68, 0.1)" _hover={{ bg: 'rgba(239, 68, 68, 0.2)', transform: 'scale(1.02)' }}>
                <Icon as={FiLogOut} boxSize={5} color="#EF4444" />
                <Text fontSize="14px" fontWeight="600" color="#EF4444">{t('topBar.logout')}</Text>
              </Box>
            </Box>
          )}
        </Box>
      </HStack>

      {/* About Dialog */}
      <Dialog.Root open={showAboutDialog} onOpenChange={(e) => setShowAboutDialog(e.open)} size="cover" placement="center">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg={isDark ? 'gray.900' : 'gray.50'}
              maxW="95vw"
              maxH="95vh"
              overflow="auto"
              borderRadius="2xl"
              p={0}
            >
              <Dialog.Header
                px={6}
                py={4}
                borderBottom="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
                position="sticky"
                top={0}
                bg={isDark ? 'gray.900' : 'gray.50'}
                zIndex={10}
              >
                <Dialog.Title fontSize="xl" fontWeight="bold" color={textColor}>
                  {t('topBar.about', 'Acerca de GlobalCX')}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild position="absolute" top={4} right={4}>
                  <CloseButton size="lg" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={0}>
                <PlatformCapabilities />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Global AI Extraction Modal */}
      <GlobalAIExtractionModal
        isOpen={showAIExtractionModal}
        onClose={() => setShowAIExtractionModal(false)}
      />

      {/* Smart Command Bar Overlay */}
      {showSmartSearch && (
        <SmartCommandBar onClose={() => setShowSmartSearch(false)} />
      )}
    </Flex>
  );
};
