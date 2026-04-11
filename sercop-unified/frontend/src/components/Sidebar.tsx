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
  FiGitBranch,
  FiAlertTriangle,
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

const getFallbackInternalMenu = (): MenuItem[] => [
  {
    id: -1,
    code: 'home.dashboard',
    label: 'menu.homeDashboard',
    icon: FiHome,
    path: '/mobile-home',
    isSection: false,
    children: [],
  },
  {
    id: -2,
    code: 'section.cp',
    label: 'Compras Publicas',
    icon: LuBuilding,
    path: null,
    isSection: true,
    children: [
      {
        id: -21,
        code: 'cp.dashboard',
        label: 'menu.cp.dashboard',
        icon: LuLayoutDashboard,
        path: '/cp/dashboard',
        isSection: false,
        children: [],
      },
      {
        id: -22,
        code: 'cp.processes',
        label: 'menu.cp.processes',
        icon: LuFilePen,
        path: '/cp/processes',
        isSection: false,
        children: [],
      },
      {
        id: -23,
        code: 'cp.paa',
        label: 'menu.cp.paa',
        icon: LuCalendar,
        path: '/cp/paa',
        isSection: false,
        children: [],
      },
      {
        id: -24,
        code: 'cp.budget',
        label: 'menu.cp.budget',
        icon: LuWallet,
        path: '/cp/presupuesto',
        isSection: false,
        children: [],
      },
      {
        id: -25,
        code: 'cp.market',
        label: 'menu.cp.market',
        icon: LuTrendingUp,
        path: '/cp/estudio-mercado',
        isSection: false,
        children: [],
      },
      {
        id: -26,
        code: 'cp.aiAssistant',
        label: 'menu.gpt.assistant',
        icon: LuBot,
        path: '/cp/ai-assistant',
        isSection: false,
        children: [],
      },
      {
        id: -27,
        code: 'cp.risk',
        label: 'menu.gpt.risk',
        icon: LuShieldAlert,
        path: '/cp/risk',
        isSection: false,
        children: [],
      },
      {
        id: -28,
        code: 'cp.search',
        label: 'menu.gpt.search',
        icon: FiSearch,
        path: '/search',
        isSection: false,
        children: [],
      },
      {
        id: -29,
        code: 'cp.infima',
        label: 'Infima Cuantia',
        icon: LuFileType,
        path: '/cp/infima-cuantia',
        isSection: false,
        children: [],
      },
      {
        id: -210,
        code: 'cp.contracts',
        label: 'Contratos',
        icon: LuClipboardCheck,
        path: '/cp/contracts',
        isSection: false,
        children: [],
      },
      {
        id: -211,
        code: 'cp.catalog',
        label: 'Catálogo Electrónico',
        icon: FiCreditCard,
        path: '/cp/catalog-electronic',
        isSection: false,
        children: [],
      },
      {
        id: -212,
        code: 'cp.cpc',
        label: 'Browser CPC',
        icon: FiHash,
        path: '/cp/cpc-browser',
        isSection: false,
        children: [],
      },
      {
        id: -213,
        code: 'cp.complaints',
        label: 'Denuncias',
        icon: FiMessageSquare,
        path: '/cp/complaints',
        isSection: false,
        children: [],
      },
      {
        id: -214,
        code: 'cp.rup',
        label: 'Registro RUP',
        icon: FiUserCheck,
        path: '/providers/register',
        isSection: false,
        children: [],
      },
    ],
  },
  {
    id: -9,
    code: 'section.analytics',
    label: 'Analítica',
    icon: FiBarChart2,
    path: null,
    isSection: true,
    children: [
      { id: -91, code: 'analytics.dashboard', label: 'Dashboard Analítico', icon: LuLayoutDashboard, path: '/analytics', isSection: false, children: [] },
      { id: -92, code: 'analytics.risk', label: 'Scores de Riesgo', icon: LuShieldAlert, path: '/analytics/risk-scores', isSection: false, children: [] },
      { id: -93, code: 'analytics.competition', label: 'Competencia', icon: LuTrendingUp, path: '/analytics/competition', isSection: false, children: [] },
      { id: -94, code: 'analytics.market', label: 'Mercado', icon: FiBarChart2, path: '/analytics/market', isSection: false, children: [] },
      { id: -95, code: 'analytics.pac', label: 'PAC vs Ejecutado', icon: LuCalendar, path: '/analytics/pac', isSection: false, children: [] },
      { id: -96, code: 'analytics.alerts', label: 'Alertas', icon: FiZap, path: '/analytics/alerts', isSection: false, children: [] },
      { id: -97, code: 'analytics.network', label: 'Red de Proveedores', icon: FiUsers, path: '/analytics/provider-network', isSection: false, children: [] },
      { id: -98, code: 'analytics.providerScores', label: 'Reputación Proveedores', icon: LuShieldCheck, path: '/analytics/provider-scores', isSection: false, children: [] },
      { id: -99, code: 'analytics.priceIndex', label: 'Índice de Precios', icon: FiDollarSign, path: '/analytics/price-index', isSection: false, children: [] },
      { id: -910, code: 'analytics.contracts', label: 'Salud Contractual', icon: LuClipboardCheck, path: '/analytics/contracts', isSection: false, children: [] },
      { id: -911, code: 'analytics.fragmentation', label: 'Fragmentación', icon: FiActivity, path: '/analytics/fragmentation', isSection: false, children: [] },
      { id: -912, code: 'analytics.geo', label: 'Análisis Geográfico', icon: FiHash, path: '/analytics/geo', isSection: false, children: [] },
      { id: -913, code: 'analytics.efficiency', label: 'Eficiencia de Procesos', icon: FiClock, path: '/analytics/efficiency', isSection: false, children: [] },
      { id: -914, code: 'analytics.savings', label: 'Ahorros', icon: FiPercent, path: '/analytics/savings', isSection: false, children: [] },
      { id: -915, code: 'analytics.mipyme', label: 'Participación MIPYME', icon: FiUserCheck, path: '/analytics/mipyme', isSection: false, children: [] },
      { id: -916, code: 'analytics.emergency', label: 'Emergencias', icon: FiDroplet, path: '/analytics/emergency', isSection: false, children: [] },
      { id: -917, code: 'analytics.graph', label: 'Grafo de Red', icon: FiGitBranch, path: '/analytics/graph', isSection: false, children: [] },
      { id: -918, code: 'analytics.collusion', label: 'Detección Colusión', icon: FiSearch, path: '/analytics/collusion', isSection: false, children: [] },
      { id: -919, code: 'analytics.networkRisk', label: 'Riesgo de Red', icon: FiAlertTriangle, path: '/analytics/network-risk', isSection: false, children: [] },
    ],
  },
  {
    id: -3,
    code: 'section.workbox',
    label: 'Operaciones',
    icon: FiBriefcase,
    path: null,
    isSection: true,
    children: [
      {
        id: -31,
        code: 'workbox',
        label: 'menu.workbox',
        icon: FiBriefcase,
        path: '/workbox',
        isSection: false,
        children: [],
      },
      {
        id: -32,
        code: 'drafts',
        label: 'menu.drafts',
        icon: FiEdit,
        path: '/workbox/drafts',
        isSection: false,
        children: [],
      },
      {
        id: -33,
        code: 'pending',
        label: 'menu.pendingApproval',
        icon: FiCheckSquare,
        path: '/workbox/pending-approval',
        isSection: false,
        children: [],
      },
      {
        id: -34,
        code: 'standby-lc',
        label: 'menu.standbyLc',
        icon: FiShield,
        path: '/workbox/standby-lc',
        isSection: false,
        children: [],
      },
      {
        id: -35,
        code: 'collection-imports',
        label: 'menu.collectionImports',
        icon: FiArchive,
        path: '/workbox/collection-imports',
        isSection: false,
        children: [],
      },
      {
        id: -36,
        code: 'collection-exports',
        label: 'menu.collectionExports',
        icon: FiArchive,
        path: '/workbox/collection-exports',
        isSection: false,
        children: [],
      },
      {
        id: -37,
        code: 'guarantee-mandataria',
        label: 'menu.guaranteeMandataria',
        icon: LuShieldCheck,
        path: '/workbox/guarantee-mandataria',
        isSection: false,
        children: [],
      },
      {
        id: -38,
        code: 'trade-financing',
        label: 'menu.tradeFinancing',
        icon: LuFileType,
        path: '/workbox/trade-financing',
        isSection: false,
        children: [],
      },
      {
        id: -39,
        code: 'aval-descuento',
        label: 'menu.avalDescuento',
        icon: FiDollarSign,
        path: '/workbox/aval-descuento',
        isSection: false,
        children: [],
      },
    ],
  },
  {
    id: -4,
    code: 'section.products',
    label: 'Productos',
    icon: FiFolder,
    path: null,
    isSection: true,
    children: [
      {
        id: -51,
        code: 'standby-lc-wizard',
        label: 'Standby LC Wizard',
        icon: FiFile,
        path: '/standby-lc/wizard',
        isSection: false,
        children: [],
      },
      {
        id: -52,
        code: 'standby-lc-expert',
        label: 'Standby LC Expert',
        icon: FiFileText,
        path: '/standby-lc/expert',
        isSection: false,
        children: [],
      },
      {
        id: -53,
        code: 'collection-imports-wizard',
        label: 'Collection Imports Wizard',
        icon: FiFile,
        path: '/collection-imports/wizard',
        isSection: false,
        children: [],
      },
      {
        id: -54,
        code: 'collection-imports-expert',
        label: 'Collection Imports Expert',
        icon: FiFileText,
        path: '/collection-imports/expert',
        isSection: false,
        children: [],
      },
      {
        id: -55,
        code: 'collection-exports-wizard',
        label: 'Collection Exports Wizard',
        icon: FiFile,
        path: '/collection-exports/wizard',
        isSection: false,
        children: [],
      },
      {
        id: -56,
        code: 'collection-exports-expert',
        label: 'Collection Exports Expert',
        icon: FiFileText,
        path: '/collection-exports/expert',
        isSection: false,
        children: [],
      },
      {
        id: -57,
        code: 'guarantee-mandataria-wizard',
        label: 'Guarantee Mandataria Wizard',
        icon: FiFile,
        path: '/guarantee-mandataria/wizard',
        isSection: false,
        children: [],
      },
      {
        id: -58,
        code: 'guarantee-mandataria-expert',
        label: 'Guarantee Mandataria Expert',
        icon: FiFileText,
        path: '/guarantee-mandataria/expert',
        isSection: false,
        children: [],
      },
      {
        id: -59,
        code: 'trade-financing-wizard',
        label: 'Trade Financing Wizard',
        icon: FiFile,
        path: '/trade-financing/wizard',
        isSection: false,
        children: [],
      },
      {
        id: -60,
        code: 'trade-financing-expert',
        label: 'Trade Financing Expert',
        icon: FiFileText,
        path: '/trade-financing/expert',
        isSection: false,
        children: [],
      },
      {
        id: -61,
        code: 'aval-descuento-wizard',
        label: 'Aval Descuento Wizard',
        icon: FiFile,
        path: '/aval-descuento/wizard',
        isSection: false,
        children: [],
      },
      {
        id: -62,
        code: 'aval-descuento-expert',
        label: 'Aval Descuento Expert',
        icon: FiFileText,
        path: '/aval-descuento/expert',
        isSection: false,
        children: [],
      },
      {
        id: -63,
        code: 'ai-analysis-chat',
        label: 'AI Analysis Chat',
        icon: FiMessageSquare,
        path: '/ai-analysis/chat',
        isSection: false,
        children: [],
      },
    ],
  },
  {
    id: -5,
    code: 'section.admin',
    label: 'Administracion',
    icon: FiSettings,
    path: null,
    isSection: true,
    children: [
      {
        id: -41,
        code: 'participants',
        label: 'menu.participants',
        icon: FiUsers,
        path: '/participants',
        isSection: false,
        children: [],
      },
      {
        id: -42,
        code: 'users',
        label: 'menu.users',
        icon: LuUserCog,
        path: '/users',
        isSection: false,
        children: [],
      },
      {
        id: -43,
        code: 'catalogs',
        label: 'Catalogos',
        icon: FiFolder,
        path: '/catalogs/custom',
        isSection: false,
        children: [],
      },
      {
        id: -44,
        code: 'templates',
        label: 'menu.templates',
        icon: FiFileText,
        path: '/templates',
        isSection: false,
        children: [],
      },
      {
        id: -45,
        code: 'emailTemplates',
        label: 'Email templates',
        icon: FiMail,
        path: '/email-templates',
        isSection: false,
        children: [],
      },
      {
        id: -46,
        code: 'aiPrompts',
        label: 'Prompts IA',
        icon: FiMessageSquare,
        path: '/admin/ai-prompts',
        isSection: false,
        children: [],
      },
      {
        id: -47,
        code: 'aiUsage',
        label: 'Uso IA',
        icon: FiBarChart2,
        path: '/admin/ai-usage',
        isSection: false,
        children: [],
      },
      {
        id: -48,
        code: 'mfa',
        label: 'MFA',
        icon: FiKey,
        path: '/settings/mfa',
        isSection: false,
        children: [],
      },
      {
        id: -49,
        code: 'agentSoceAdmin',
        label: 'Agent SOCE',
        icon: FiCpu,
        path: '/agent-soce/admin',
        isSection: false,
        children: [],
      },
    ],
  },
];

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
        data-nav-id={item.code}
        id={`nav-${item.code}`}
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
      // Keep navigation usable if backend menu endpoint is down.
      setMenuItems(getFallbackInternalMenu());
      
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
    const enableStageCounts = import.meta.env.VITE_ENABLE_BACKOFFICE_STAGE_COUNTS !== 'false';
    if (!enableStageCounts) return;
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
        ) : error && menuItems.length === 0 ? (
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
