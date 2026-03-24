import {
  Box,
  VStack,
  Text,
  Icon,
  Flex,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiShield,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiFolder,
  FiFile,
  FiCpu,
  FiArchive,
  FiSearch,
  FiMail,
  FiZap,
  FiBarChart2,
  FiHash,
  FiBriefcase,
  FiInbox,
  FiCheckSquare,
  FiMessageSquare,
  FiActivity,
  FiSettings,
  FiDollarSign,
  FiDroplet,
  FiClock,
  FiEdit,
  FiCode,
  FiCreditCard,
  FiKey,
  FiPercent,
  FiUserCheck,
} from 'react-icons/fi';
import {
  LuBot,
  LuBuilding,
  LuCalendar,
  LuClipboardCheck,
  LuFilePen,
  LuFileInput,
  LuFileOutput,
  LuFileType,
  LuFolderOpen,
  LuHandshake,
  LuHistory,
  LuLayoutDashboard,
  LuPalette,
  LuReceipt,
  LuShieldAlert,
  LuShieldCheck,
  LuTrendingUp,
  LuUserCog,
  LuWallet,
  LuWand,
} from 'react-icons/lu';
import { LuChartColumn } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBrand } from '../contexts/BrandContext';
import { useSidebar } from '../contexts/SidebarContext';
import { menuService, type MenuItemDTO } from '../services/menuService';
import backofficeRequestService from '../services/backofficeRequestService';

// Client Portal menu items (hardcoded for CLIENT role users)
const clientPortalMenuItems: MenuItemDTO[] = [
  {
    id: 1,
    code: 'client.dashboard',
    parentId: null,
    labelKey: 'menu.clientPortal.dashboard',
    icon: 'Home',
    path: '/client/dashboard',
    displayOrder: 1,
    isSection: false,
    isActive: true,
    requiredPermissions: [],
    children: [],
    apiEndpointCodes: [],
  },
  {
    id: 2,
    code: 'client.requests',
    parentId: null,
    labelKey: 'menu.clientPortal.myRequests',
    icon: 'FileText',
    path: '/client/requests',
    displayOrder: 2,
    isSection: false,
    isActive: true,
    requiredPermissions: [],
    children: [],
    apiEndpointCodes: [],
  },
  {
    id: 3,
    code: 'client.operations',
    parentId: null,
    labelKey: 'menu.clientPortal.myOperations',
    icon: 'Briefcase',
    path: '/client/operations',
    displayOrder: 3,
    isSection: false,
    isActive: true,
    requiredPermissions: [],
    children: [],
    apiEndpointCodes: [],
  },
  {
    id: 4,
    code: 'client.documents',
    parentId: null,
    labelKey: 'menu.clientPortal.myDocuments',
    icon: 'Folder',
    path: '/client/documents',
    displayOrder: 4,
    isSection: false,
    isActive: true,
    requiredPermissions: [],
    children: [],
    apiEndpointCodes: [],
  },
  {
    id: 5,
    code: 'client.reports',
    parentId: null,
    labelKey: 'menu.clientPortal.reports',
    icon: 'BarChart',
    path: '/client/reports',
    displayOrder: 5,
    isSection: false,
    isActive: true,
    requiredPermissions: [],
    children: [],
    apiEndpointCodes: [],
  },
  {
    id: 6,
    code: 'client.profile',
    parentId: null,
    labelKey: 'menu.clientPortal.profile',
    icon: 'UserCog',
    path: '/client/profile',
    displayOrder: 6,
    isSection: false,
    isActive: true,
    requiredPermissions: [],
    children: [],
    apiEndpointCodes: [],
  },
];
import { ScheduleTimeline } from './ScheduleTimeline';

// Animations
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(66, 153, 225, 0.5), 0 0 16px rgba(66, 153, 225, 0.3); }
  50% { box-shadow: 0 0 20px rgba(66, 153, 225, 0.7), 0 0 35px rgba(66, 153, 225, 0.4); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glowPulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const iconMap: Record<string, IconType> = {
  Home: FiHome, Users: FiUsers, FileText: FiFileText, Shield: FiShield,
  Folder: FiFolder, File: FiFile, Cpu: FiCpu, Archive: FiArchive,
  Search: FiSearch, Mail: FiMail, Zap: FiZap, BarChart: FiBarChart2,
  Hash: FiHash, Briefcase: FiBriefcase, Inbox: FiInbox, CheckSquare: FiCheckSquare,
  MessageSquare: FiMessageSquare, Activity: FiActivity, Settings: FiSettings,
  DollarSign: FiDollarSign, Droplet: FiDroplet, Clock: FiClock, Edit: FiEdit,
  Code: FiCode, CreditCard: FiCreditCard, Key: FiKey, Percent: FiPercent,
  UserCheck: FiUserCheck, Bot: LuBot, Building: LuBuilding, FileEdit: LuFilePen,
  FileInput: LuFileInput, FileOutput: LuFileOutput, FileType: LuFileType,
  FolderOpen: LuFolderOpen, Handshake: LuHandshake, History: LuHistory,
  LayoutDashboard: LuLayoutDashboard, Calendar: LuCalendar,
  TrendingUp: LuTrendingUp, ShieldAlert: LuShieldAlert,
  ClipboardCheck: LuClipboardCheck, FileSignature: LuFilePen,
  BarChart3: LuChartColumn,
  Palette: LuPalette, Receipt: LuReceipt, ShieldCheck: LuShieldCheck,
  UserCog: LuUserCog, Wallet: LuWallet, Wand: LuWand,
};

const getIcon = (iconName: string | null): IconType => {
  if (!iconName) return FiFile;
  return iconMap[iconName] || FiFile;
};

interface MenuItem {
  id: number;
  code: string;
  label: string;
  icon: IconType;
  path: string | null;
  isSection: boolean;
  children: MenuItem[];
}

const convertMenuItem = (dto: MenuItemDTO): MenuItem => ({
  id: dto.id,
  code: dto.code,
  label: dto.labelKey,
  icon: getIcon(dto.icon),
  path: dto.path,
  isSection: dto.isSection,
  children: dto.children?.map(convertMenuItem) || [],
});

// Map menu item codes to stage codes for badge display
const menuCodeToStage: Record<string, string> = {
  STAGE_RECEPCION: 'RECEPCION',
  STAGE_VALIDACION: 'VALIDACION',
  STAGE_COMPLIANCE: 'COMPLIANCE',
  STAGE_APROBACION: 'APROBACION',
  STAGE_COMISIONES: 'COMISIONES',
  STAGE_REGISTRO: 'REGISTRO',
  STAGE_FINALIZADO: 'FINALIZADO',
};

const SidebarItem = ({
  item, isActive, isCollapsed, index, sidebarTextColor, stageCounts,
}: {
  item: MenuItem; isActive: boolean; isCollapsed: boolean; index: number; sidebarTextColor: string; stageCounts?: Record<string, number>;
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const colors = getColors();
  const { primaryColor } = colors;
  // Use sidebar text color from brand prop
  const textColor = sidebarTextColor;
  const textColorSecondary = sidebarTextColor + 'B3'; // ~70% opacity via hex alpha

  const activeBg = isDark
    ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.28) 0%, rgba(99, 179, 237, 0.18) 100%)'
    : 'linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(99, 179, 237, 0.12) 100%)';
  const hoverBg = isDark
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)'
    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.03) 100%)';
  const activeAccentColor = primaryColor;
  const glowColor = isDark ? 'rgba(66, 153, 225, 0.6)' : 'rgba(66, 153, 225, 0.5)';

  const handleClick = () => {
    if (hasChildren) setIsOpen(!isOpen);
    else if (item.path) navigate(item.path);
  };

  const handleChildClick = (path: string | null) => {
    if (path) navigate(path);
  };

  useEffect(() => {
    if (hasChildren) {
      const childActive = item.children.some(child =>
        child.path && location.pathname.startsWith(child.path)
      );
      if (childActive) setIsOpen(true);
    }
  }, [location.pathname, hasChildren, item.children]);

  if (isCollapsed) {
    return (
      <Box w="full" px={2}>
        <Tooltip.Root positioning={{ placement: 'right' }} openDelay={0} closeDelay={0}>
          <Tooltip.Trigger asChild>
            <Flex
              align="center"
              justify="center"
              h="54px"
              cursor="pointer"
              position="relative"
              color={isActive ? activeAccentColor : textColorSecondary}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              _hover={{ color: activeAccentColor }}
              bg={isActive ? activeBg : isHovered ? hoverBg : 'transparent'}
              borderRadius="16px"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              onClick={handleClick}
              boxShadow={isActive ? `0 0 30px \${glowColor}, inset 0 0 25px rgba(66, 153, 225, 0.15)` : 'none'}
              css={isActive ? { animation: `\${pulseGlow} 3s ease-in-out infinite` } : {}}
            >
              {isActive && (
                <Box
                  position="absolute"
                  left="0"
                  top="50%"
                  transform="translateY(-50%)"
                  w="5px"
                  h="30px"
                  bgGradient="linear(to-b, blue.300, blue.500, purple.400)"
                  borderRadius="0 8px 8px 0"
                  boxShadow={`0 0 15px \${glowColor}`}
                  css={{ animation: `\${glowPulse} 2s ease-in-out infinite` }}
                />
              )}
              <Icon
                as={item.icon}
                boxSize="26px"
                transition="all 0.3s ease"
                transform={isHovered ? 'scale(1.2)' : 'scale(1)'}
                filter={isActive ? `drop-shadow(0 0 8px \${glowColor})` : 'none'}
              />
            </Flex>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content
              bg={isDark ? 'gray.800' : 'gray.900'}
              color={sidebarTextColor}
              px={4}
              py={2}
              borderRadius="14px"
              fontSize="14px"
              fontWeight="600"
              boxShadow="0 10px 40px rgba(0, 0, 0, 0.5)"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              {t(item.label)}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Box>
    );
  }

  return (
    <Box w="full" css={{ animation: `\${slideIn} 0.4s ease-out \${index * 0.05}s both` }}>
      <Flex
        align="center"
        px={4}
        h="56px"
        cursor="pointer"
        position="relative"
        color={isActive ? activeAccentColor : textColor}
        bg={isActive ? activeBg : 'transparent'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        _hover={{ bg: isActive ? activeBg : hoverBg }}
        borderRadius="16px"
        mx={2}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        onClick={handleClick}
        boxShadow={isActive ? `0 8px 25px \${glowColor}` : isHovered ? '0 6px 20px rgba(0,0,0,0.2)' : 'none'}
      >
        {isActive && (
          <Box
            position="absolute"
            left="0"
            top="50%"
            transform="translateY(-50%)"
            w="6px"
            h="36px"
            bgGradient="linear(to-b, blue.300, blue.500, purple.400)"
            borderRadius="0 8px 8px 0"
            boxShadow={`0 0 18px \${glowColor}`}
          />
        )}
        <Box
          p={2.5}
          borderRadius="14px"
          bg={isActive ? 'rgba(66, 153, 225, 0.25)' : isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
          transition="all 0.3s ease"
          boxShadow={isActive ? 'inset 0 0 15px rgba(66, 153, 225, 0.25)' : 'none'}
        >
          <Icon
            as={item.icon}
            boxSize="24px"
            transition="all 0.3s ease"
            transform={isHovered ? 'scale(1.1)' : 'scale(1)'}
            filter={isActive ? `drop-shadow(0 0 6px \${glowColor})` : 'none'}
          />
        </Box>
        <Text
          ml={3}
          fontSize="15px"
          fontWeight={isActive ? '700' : '500'}
          flex={1}
          css={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          textShadow={isActive ? `0 0 25px \${glowColor}` : 'none'}
        >
          {t(item.label)}
        </Text>
        {hasChildren && (
          <Icon
            as={isOpen ? FiChevronDown : FiChevronRight}
            boxSize="20px"
            color={textColorSecondary}
            transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
          />
        )}
      </Flex>

      {hasChildren && isOpen && (
        <VStack
          gap={1}
          align="stretch"
          mt={2}
          ml={5}
          pl={4}
          borderLeft="3px solid"
          borderColor={isDark ? 'blue.400' : 'blue.500'}
          position="relative"
          css={{
            '&::before': {
              content: '""',
              position: 'absolute',
              left: '-3px',
              top: 0,
              bottom: 0,
              width: '3px',
              background: `linear-gradient(to bottom, rgba(66, 153, 225, 0.9), rgba(159, 122, 234, 0.5), transparent)`,
              boxShadow: `0 0 12px \${glowColor}`,
            }
          }}
        >
          {item.children?.map((child, childIndex) => {
            const isChildActive = child.path ? location.pathname === child.path : false;
            const stageCode = menuCodeToStage[child.code];
            const badgeCount = stageCode && stageCounts ? stageCounts[stageCode] : undefined;
            return (
              <Flex
                key={child.id}
                align="center"
                px={3}
                h="48px"
                cursor="pointer"
                color={isChildActive ? activeAccentColor : textColorSecondary}
                bg={isChildActive ? activeBg : 'transparent'}
                _hover={{
                  bg: isChildActive ? activeBg : hoverBg,
                  color: isChildActive ? activeAccentColor : textColor,
                  transform: 'translateX(8px)',
                }}
                borderRadius="14px"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={() => handleChildClick(child.path)}
                css={{ animation: `\${slideIn} 0.35s ease-out \${childIndex * 0.07}s both` }}
                boxShadow={isChildActive ? `0 6px 18px \${glowColor}` : 'none'}
              >
                <Icon as={child.icon} boxSize="20px" />
                <Text
                  ml={3}
                  fontSize="14px"
                  fontWeight={isChildActive ? '600' : '500'}
                  flex={1}
                  css={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {t(child.label)}
                </Text>
                {badgeCount !== undefined && badgeCount > 0 && (
                  <Box
                    ml={2}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    bg={isChildActive ? activeAccentColor : isDark ? 'whiteAlpha.200' : 'blackAlpha.100'}
                    color={isChildActive ? 'white' : textColorSecondary}
                    fontSize="11px"
                    fontWeight="700"
                    lineHeight="1"
                    minW="22px"
                    textAlign="center"
                  >
                    {badgeCount}
                  </Box>
                )}
                {isChildActive && !badgeCount && (
                  <Box
                    ml="auto"
                    w="10px"
                    h="10px"
                    borderRadius="full"
                    bg={activeAccentColor}
                    boxShadow={`0 0 15px \${glowColor}, 0 0 25px \${glowColor}`}
                    css={{ animation: `\${glowPulse} 1.5s ease-in-out infinite` }}
                  />
                )}
              </Flex>
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: forcedCollapsed }) => {
  const { getColors, isDark } = useTheme();
  const { t } = useTranslation();
  const { isCollapsed: contextCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { isAuthenticated, hasRole } = useAuth();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});

  const isCollapsed = forcedCollapsed !== undefined ? forcedCollapsed : contextCollapsed;

  const colors = getColors();
  const { textColorSecondary, primaryColor } = colors;
  const { brand } = useBrand();

  // Use brand sidebar text color, with sensible defaults per mode
  const sidebarTextColor = brand?.sidebarTextColor || (isDark ? '#FFFFFF' : '#1A202C');

  // Use brand sidebar background if available, else default gradient
  const sidebarBg = isDark
    ? (brand?.sidebarBgColor || 'linear-gradient(180deg, rgba(13, 17, 28, 0.98) 0%, rgba(8, 12, 21, 0.99) 50%, rgba(13, 17, 28, 0.98) 100%)')
    : (brand?.sidebarBgColor || 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 50%, rgba(255, 255, 255, 0.98) 100%)');

  const hoverBg = isDark
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)'
    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.03) 100%)';

  const loadMenu = useCallback(async () => {
    if (!isAuthenticated) {
      setMenuItems([]);
      setLoading(false);
      return;
    }

    // For CLIENT users, use the hardcoded client portal menu
    if (hasRole('ROLE_CLIENT')) {
      const converted = clientPortalMenuItems.map(convertMenuItem);
      setMenuItems(converted);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const items = await menuService.getUserMenu();
      const converted = items.map(convertMenuItem);
      // Inject "Home Dashboard" as first item
      const homeDashboardItem: MenuItem = {
        id: -1,
        code: 'home.dashboard',
        label: 'menu.homeDashboard',
        icon: FiHome,
        path: '/mobile-home',
        isSection: false,
        children: [],
      };
      setMenuItems([homeDashboardItem, ...converted]);
    } catch (err) {
      console.error('Error loading menu:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load menu';
      setError(errorMessage);
      setMenuItems([]);
      
      // Si el error es 403 o indica token inválido, el apiClient ya debería haber redirigido
      // Pero por si acaso, verificar si es un error de autenticación
      if (errorMessage.includes('Session expired') || errorMessage.includes('token') || errorMessage.includes('authentication')) {
        // El apiClient debería haber manejado la redirección, pero por si acaso
        // No hacer nada aquí, el apiClient ya redirigió
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        // Si es solo un problema de permisos, mostrar un mensaje más claro
        setError('No tienes permisos para acceder al menú. Contacta al administrador.');
        const token = localStorage.getItem('globalcmx_token');
        if (!token) {
          // No hay token, redirigir a login
          window.location.href = '/login';
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hasRole]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Fetch stage counts for badge display
  useEffect(() => {
    if (!isAuthenticated || hasRole('ROLE_CLIENT')) return;

    const fetchStageCounts = async () => {
      try {
        const counts = await backofficeRequestService.getStageCounts();
        setStageCounts(counts);
      } catch {
        // Silently fail - badges just won't show
      }
    };

    fetchStageCounts();
    const interval = setInterval(fetchStageCounts, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, hasRole]);

  const sidebarWidth = isCollapsed ? '86px' : '300px';

  return (
    <Box
      w={sidebarWidth}
      minW={sidebarWidth}
      h="100vh"
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)'}
      position="sticky"
      top={0}
      display="flex"
      flexDirection="column"
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      backdropFilter="blur(30px)"
      zIndex={100}
      boxShadow={isDark ? '8px 0 40px rgba(0, 0, 0, 0.5)' : '8px 0 40px rgba(0, 0, 0, 0.12)'}
      overflow="hidden"
      css={{
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: isDark
            ? 'radial-gradient(ellipse at top left, rgba(66, 153, 225, 0.15) 0%, transparent 55%)'
            : 'radial-gradient(ellipse at top left, rgba(66, 153, 225, 0.1) 0%, transparent 55%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: isDark
            ? 'radial-gradient(ellipse at bottom right, rgba(159, 122, 234, 0.12) 0%, transparent 55%)'
            : 'radial-gradient(ellipse at bottom right, rgba(159, 122, 234, 0.08) 0%, transparent 55%)',
          pointerEvents: 'none',
        }
      }}
    >
      {/* Header */}
      <Box
        px={isCollapsed ? 2 : 5}
        py={6}
        flexShrink={0}
        borderBottom="1px solid"
        borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        position="relative"
        zIndex={1}
      >
        {isCollapsed ? (
          <Flex justify="center" align="center" h="56px">
            <Box
              w="54px"
              h="54px"
              borderRadius="18px"
              bgGradient="linear(135deg, blue.400 0%, blue.600 50%, purple.500 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 8px 32px rgba(66, 153, 225, 0.55)"
              transition="all 0.35s ease"
              _hover={{
                transform: 'scale(1.1) rotate(3deg)',
                boxShadow: '0 12px 45px rgba(66, 153, 225, 0.7)',
              }}
              css={{ animation: `\${pulseGlow} 4s ease-in-out infinite` }}
            >
              <Text fontSize="20px" fontWeight="800" color="white" letterSpacing="-0.02em">
                {(brand?.companyShortName || 'GX').substring(0, 3)}
              </Text>
            </Box>
          </Flex>
        ) : (
          <Flex align="center" h="56px">
            <Box
              w="58px"
              h="58px"
              borderRadius="18px"
              bgGradient="linear(135deg, blue.400 0%, blue.600 50%, purple.500 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mr={4}
              boxShadow="0 8px 32px rgba(66, 153, 225, 0.55)"
              transition="all 0.35s ease"
              _hover={{
                transform: 'scale(1.08) rotate(3deg)',
                boxShadow: '0 12px 45px rgba(66, 153, 225, 0.7)',
              }}
            >
              <Text fontSize="21px" fontWeight="800" color="white" letterSpacing="-0.02em">
                {(brand?.companyShortName || 'GX').substring(0, 3)}
              </Text>
            </Box>
            <Box flex={1} overflow="hidden">
              <Text
                fontSize={(brand?.companyName || 'GLOBAL CX').length > 15 ? '15px' : '22px'}
                fontWeight="800"
                letterSpacing="-0.02em"
                lineHeight="1.2"
                css={{
                  background: `linear-gradient(90deg, \${primaryColor} 0%, #63B3ED 35%, #9F7AEA 65%, \${primaryColor} 100%)`,
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: `\${shimmer} 5s linear infinite`,
                }}
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                title={brand?.companyName || 'GLOBAL CX'}
              >
                {brand?.companyName || 'GLOBAL CX'}
              </Text>
              <Text
                fontSize="11px"
                color={textColorSecondary}
                fontWeight="600"
                letterSpacing="0.1em"
                mt="4px"
                textTransform="uppercase"
              >
                {t('login.subtitle')}
              </Text>
            </Box>
          </Flex>
        )}
      </Box>

      {/* Menu Items */}
      <Box
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        py={5}
        position="relative"
        zIndex={1}
        css={{
          '&::-webkit-scrollbar': { width: '7px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)',
          },
        }}
      >
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner
              size="lg"
              color={primaryColor}
              thickness="4px"
              css={{ animation: `\${pulseGlow} 2s ease-in-out infinite` }}
            />
          </Flex>
        ) : error ? (
          <Box px={4} py={4}>
            <Text color="red.400" fontSize="14px" textAlign="center">{error}</Text>
          </Box>
        ) : menuItems.length === 0 ? (
          <Box px={4} py={4}>
            <Text color={textColorSecondary} fontSize="14px" textAlign="center">
              {t('menu.noItems', 'No menu items available')}
            </Text>
          </Box>
        ) : (
          <VStack gap={2} align="stretch">
            {menuItems.map((item, index) => {
              const isActive = item.path
                ? location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                : false;
              return (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  index={index}
                  sidebarTextColor={sidebarTextColor}
                  stageCounts={stageCounts}
                />
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Footer */}
      <Box
        px={isCollapsed ? 2 : 4}
        pt={3}
        pb={4}
        borderTop="1px solid"
        borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        flexShrink={0}
        position="relative"
        zIndex={1}
      >
        {/* Schedule Timeline - moved to footer */}
        <Box mb={3}>
          <ScheduleTimeline isCollapsed={isCollapsed} />
        </Box>
        {isCollapsed ? (
          <Tooltip.Root positioning={{ placement: 'right' }} openDelay={0} closeDelay={0}>
            <Tooltip.Trigger asChild>
              <Flex
                align="center"
                justify="center"
                h="54px"
                cursor="pointer"
                color={textColorSecondary}
                _hover={{
                  bg: hoverBg,
                  color: primaryColor,
                  transform: 'scale(1.08)',
                }}
                borderRadius="16px"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={toggleSidebar}
              >
                <Icon as={FiChevronRight} boxSize="26px" />
              </Flex>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content
                bg={isDark ? 'gray.800' : 'gray.900'}
                color={sidebarTextColor}
                px={4}
                py={2}
                borderRadius="14px"
                fontSize="14px"
                fontWeight="600"
                boxShadow="0 10px 40px rgba(0, 0, 0, 0.5)"
              >
                {t('sidebar.expand', 'Expand menu')}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        ) : (
          <Flex
            align="center"
            px={4}
            h="54px"
            cursor="pointer"
            color={textColorSecondary}
            _hover={{ bg: hoverBg, color: primaryColor }}
            borderRadius="16px"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            onClick={toggleSidebar}
          >
            <Box
              p={2.5}
              borderRadius="14px"
              bg={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}
              transition="all 0.25s ease"
            >
              <Icon as={FiChevronLeft} boxSize="22px" />
            </Box>
            <Text ml={3} fontSize="15px" fontWeight="500">
              {t('sidebar.collapse', 'Collapse')}
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
};
