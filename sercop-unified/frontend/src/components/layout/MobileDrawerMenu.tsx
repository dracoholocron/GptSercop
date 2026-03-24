/**
 * MobileDrawerMenu - Menú desplegable para dispositivos móviles
 *
 * Se muestra como un Drawer desde la izquierda cuando el usuario
 * hace clic en el icono de hamburguesa.
 */

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiX,
  FiLogOut,
  FiHome,
  FiUsers,
  FiFileText,
  FiShield,
  FiChevronDown,
  FiChevronRight,
  FiFolder,
  FiFile,
  FiCpu,
  FiArchive,
  FiMail,
  FiZap,
  FiBarChart2,
  FiHash,
  FiBriefcase,
  FiInbox,
  FiCheckSquare,
  FiMessageSquare,
  FiActivity,
  FiSearch,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface MenuItem {
  label: string;
  icon: IconType;
  path: string;
  children?: MenuItem[];
}

// Menu items completo para móvil - igual que el Sidebar
const mobileMenuItems: MenuItem[] = [
  {
    label: 'menu.dashboard',
    icon: FiHome,
    path: '/business-intelligence',
  },
  {
    label: 'menu.workbox',
    icon: FiBriefcase,
    path: '/workbox',
    children: [
      { label: 'menu.drafts', icon: FiInbox, path: '/workbox/drafts' },
      { label: 'menu.pendingApproval', icon: FiCheckSquare, path: '/workbox/pending-approval' },
      { label: 'menu.lcImports', icon: FiFile, path: '/workbox/lc-imports' },
      { label: 'menu.lcExports', icon: FiFile, path: '/workbox/lc-exports' },
      { label: 'menu.guarantees', icon: FiFile, path: '/workbox/guarantees' },
      { label: 'menu.collections', icon: FiFile, path: '/workbox/collections' },
      { label: 'menu.standbyLc', icon: FiFile, path: '/workbox/standby-lc' },
      { label: 'menu.collectionImports', icon: FiFile, path: '/workbox/collection-imports' },
      { label: 'menu.collectionExports', icon: FiFile, path: '/workbox/collection-exports' },
      { label: 'menu.guaranteeMandataria', icon: FiShield, path: '/workbox/guarantee-mandataria' },
      { label: 'menu.tradeFinancing', icon: FiFile, path: '/workbox/trade-financing' },
      { label: 'menu.avalDescuento', icon: FiFile, path: '/workbox/aval-descuento' },
    ],
  },
  {
    label: 'menu.swiftMessageCenter',
    icon: FiMessageSquare,
    path: '/swift-message-center',
  },
  {
    label: 'menu.operations',
    icon: FiActivity,
    path: '/operations',
    children: [
      { label: 'menu.activeOperations', icon: FiFile, path: '/operations/active' },
      { label: 'menu.awaitingResponse', icon: FiFile, path: '/operations/awaiting-response' },
      { label: 'menu.eventHistory', icon: FiFile, path: '/operations/event-history' },
    ],
  },
  {
    label: 'menu.lcImports',
    icon: FiFolder,
    path: '/lc-imports',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/lc-imports/issuance-wizard' },
      { label: 'menu.emisionExpert', icon: FiFile, path: '/lc-imports/issuance-expert' },
      { label: 'menu.emisionClient', icon: FiFile, path: '/lc-imports/issuance-client' },
    ],
  },
  {
    label: 'menu.lcExportation',
    icon: FiFolder,
    path: '/lc-exports',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/lc-exports/issuance-wizard' },
      { label: 'menu.emisionExpert', icon: FiFile, path: '/lc-exports/issuance-expert' },
      { label: 'menu.emisionClient', icon: FiFile, path: '/lc-exports/issuance-client' },
    ],
  },
  {
    label: 'menu.guarantees',
    icon: FiShield,
    path: '/guarantees',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/guarantees/issuance-wizard' },
      { label: 'menu.emisionExpert', icon: FiFile, path: '/guarantees/issuance-expert' },
      { label: 'menu.emisionClient', icon: FiFile, path: '/guarantees/issuance-client' },
    ],
  },
  {
    label: 'menu.collections',
    icon: FiArchive,
    path: '/collections',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/collections/issuance-wizard' },
      { label: 'menu.emisionExpert', icon: FiFile, path: '/collections/issuance-expert' },
      { label: 'menu.paymentNotice', icon: FiFile, path: '/collections/payment-notice' },
      { label: 'menu.acknowledgmentReceipt', icon: FiFile, path: '/collections/acknowledgment-receipt' },
      { label: 'menu.acceptanceNotice', icon: FiFile, path: '/collections/acceptance-notice' },
      { label: 'menu.nonPaymentNotice', icon: FiFile, path: '/collections/non-payment-notice' },
      { label: 'menu.tracerTracking', icon: FiSearch, path: '/collections/tracking' },
    ],
  },
  {
    label: 'menu.standbyLc',
    icon: FiShield,
    path: '/standby-lc',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/standby-lc/wizard' },
    ],
  },
  {
    label: 'menu.collectionImports',
    icon: FiArchive,
    path: '/collection-imports',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/collection-imports/wizard' },
    ],
  },
  {
    label: 'menu.collectionExports',
    icon: FiArchive,
    path: '/collection-exports',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/collection-exports/wizard' },
    ],
  },
  {
    label: 'menu.guaranteeMandataria',
    icon: FiShield,
    path: '/guarantee-mandataria',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/guarantee-mandataria/wizard' },
    ],
  },
  {
    label: 'menu.tradeFinancing',
    icon: FiFile,
    path: '/trade-financing',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/trade-financing/wizard' },
    ],
  },
  {
    label: 'menu.avalDescuento',
    icon: FiFile,
    path: '/aval-descuento',
    children: [
      { label: 'menu.emisionWizard', icon: FiFile, path: '/aval-descuento/wizard' },
    ],
  },
  {
    label: 'menu.documentManagement',
    icon: FiFileText,
    path: '/document-management',
  },
  {
    label: 'menu.reports',
    icon: FiFileText,
    path: '/reports',
  },
  {
    label: 'menu.users',
    icon: FiUsers,
    path: '/users',
  },
  {
    label: 'menu.catalogs',
    icon: FiFolder,
    path: '/catalogs',
    children: [
      { label: 'menu.participants', icon: FiUsers, path: '/catalogs/participants' },
      { label: 'menu.financialInstitutions', icon: FiCpu, path: '/catalogs/financial-institutions' },
      { label: 'menu.currencies', icon: FiHash, path: '/catalogs/currencies' },
      { label: 'menu.exchangeRates', icon: FiBarChart2, path: '/catalogs/exchange-rates' },
      { label: 'menu.bankAccounts', icon: FiFile, path: '/catalogs/bank-accounts' },
      { label: 'menu.commissionsCalc', icon: FiZap, path: '/catalogs/commissions' },
      { label: 'menu.emailTemplates', icon: FiMail, path: '/catalogs/email-templates' },
      { label: 'menu.documentTemplates', icon: FiFile, path: '/catalogs/templates' },
      { label: 'menu.customCatalogs', icon: FiFolder, path: '/catalogs/custom' },
      { label: 'menu.accountingRules', icon: FiFileText, path: '/catalogs/accounting-rules' },
      { label: 'menu.referenceNumbers', icon: FiHash, path: '/catalogs/reference-number' },
      { label: 'menu.swiftFields', icon: FiFile, path: '/catalogs/swift-fields' },
      { label: 'menu.eventConfig', icon: FiActivity, path: '/catalogs/event-types' },
    ],
  },
];

interface MobileDrawerMenuProps {
  onClose: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { getColors } = useTheme();
  const colors = getColors();

  // Track expanded menu items
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isExpanded = (path: string): boolean => {
    return expandedItems.includes(path);
  };

  return (
    <Box h="100%" bg={colors.cardBg} display="flex" flexDirection="column">
      {/* Header con usuario */}
      <Box p={4} bg={colors.primaryColor} color="white">
        <HStack justify="space-between" align="start">
          <HStack gap={3}>
            <Flex
              w="40px"
              h="40px"
              borderRadius="full"
              bg="whiteAlpha.300"
              align="center"
              justify="center"
              fontWeight="bold"
              fontSize="lg"
            >
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </Flex>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" fontSize="md">
                {user?.username || 'Usuario'}
              </Text>
              <Text fontSize="xs" opacity={0.8}>
                {user?.role || 'user'}
              </Text>
            </VStack>
          </HStack>
          <Icon
            as={FiX}
            boxSize={6}
            cursor="pointer"
            onClick={onClose}
            _hover={{ opacity: 0.8 }}
          />
        </HStack>
      </Box>

      {/* Menu Items con scroll */}
      <Box flex={1} overflow="auto" py={2}>
        <VStack align="stretch" gap={0}>
          {mobileMenuItems.map((item) => (
            <Box key={item.path}>
              {item.children ? (
                <>
                  {/* Parent item with children - clickable to expand */}
                  <Box
                    py={3}
                    px={4}
                    cursor="pointer"
                    onClick={() => toggleExpand(item.path)}
                    _hover={{ bg: colors.activeBg }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between">
                      <HStack gap={3}>
                        <Icon
                          as={item.icon}
                          boxSize={5}
                          color={isActive(item.path) ? colors.primaryColor : colors.textColorSecondary}
                        />
                        <Text
                          fontSize="sm"
                          fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
                          color={colors.textColor}
                        >
                          {t(item.label)}
                        </Text>
                      </HStack>
                      <Icon
                        as={isExpanded(item.path) ? FiChevronDown : FiChevronRight}
                        boxSize={4}
                        color={colors.textColorSecondary}
                        transition="transform 0.2s"
                      />
                    </HStack>
                  </Box>

                  {/* Children - collapsible */}
                  {isExpanded(item.path) && (
                    <VStack align="stretch" gap={0} pl={4} bg={colors.activeBg + '40'}>
                      {item.children.map((child) => (
                        <Box
                          key={child.path}
                          py={2}
                          px={4}
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => handleNavigate(child.path)}
                          bg={isActive(child.path) ? colors.activeBg : 'transparent'}
                          _hover={{ bg: colors.activeBg }}
                          transition="all 0.2s"
                        >
                          <HStack gap={3}>
                            <Icon
                              as={child.icon}
                              boxSize={4}
                              color={isActive(child.path) ? colors.primaryColor : colors.textColorSecondary}
                            />
                            <Text
                              fontSize="sm"
                              color={isActive(child.path) ? colors.primaryColor : colors.textColor}
                              fontWeight={isActive(child.path) ? 'medium' : 'normal'}
                            >
                              {t(child.label)}
                            </Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </>
              ) : (
                /* Simple item without children */
                <Box
                  py={3}
                  px={4}
                  cursor="pointer"
                  onClick={() => handleNavigate(item.path)}
                  bg={isActive(item.path) ? colors.activeBg : 'transparent'}
                  _hover={{ bg: colors.activeBg }}
                  transition="all 0.2s"
                >
                  <HStack gap={3}>
                    <Icon
                      as={item.icon}
                      boxSize={5}
                      color={isActive(item.path) ? colors.primaryColor : colors.textColorSecondary}
                    />
                    <Text
                      fontSize="sm"
                      color={isActive(item.path) ? colors.primaryColor : colors.textColor}
                      fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
                    >
                      {t(item.label)}
                    </Text>
                  </HStack>
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Logout Button */}
      <Box p={4} borderTop="1px solid" borderColor={colors.borderColor}>
        <HStack
          py={3}
          px={4}
          borderRadius="md"
          cursor="pointer"
          color="red.500"
          _hover={{ bg: 'red.50' }}
          onClick={handleLogout}
          transition="all 0.2s"
        >
          <Icon as={FiLogOut} boxSize={5} />
          <Text fontSize="sm" fontWeight="medium">
            {t('menu.logout')}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

export default MobileDrawerMenu;
