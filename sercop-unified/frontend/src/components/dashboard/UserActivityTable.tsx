/**
 * UserActivityTable Component
 * Table showing operator/user activity metrics with maximize option
 */

import { useState } from 'react';
import { Box, Text, HStack, VStack, Badge, Table, Progress, IconButton, Portal } from '@chakra-ui/react';
import { FiUser, FiMaximize2, FiMinimize2, FiTrendingUp, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { UserActivitySummary } from '../../types/dashboard';

interface UserActivityTableProps {
  data: UserActivitySummary;
  defaultExpanded?: boolean;
}

const getProductLabel = (product: string, t: (key: string) => string): string => {
  const labels: Record<string, string> = {
    LC_IMPORT: t('businessDashboard.lcImport'),
    LC_EXPORT: t('businessDashboard.lcExport'),
    GUARANTEE: t('businessDashboard.guarantees'),
    STANDBY_LC: 'Standby LC',
    STANDBY: 'Standby LC',
    COLLECTION: t('businessDashboard.collections'),
    COLLECTION_IMPORT: t('businessDashboard.collectionImport', 'Cobranza Import'),
    COLLECTION_EXPORT: t('businessDashboard.collectionExport', 'Cobranza Export'),
  };
  return labels[product] || product || '-';
};

const PRODUCT_COLORS: Record<string, string> = {
  LC_IMPORT: 'blue',
  LC_EXPORT: 'green',
  GUARANTEE: 'purple',
  STANDBY_LC: 'orange',
  STANDBY: 'orange',
  COLLECTION: 'pink',
  COLLECTION_IMPORT: 'pink',
  COLLECTION_EXPORT: 'cyan',
};

export const UserActivityTable = ({ data }: UserActivityTableProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [isMaximized, setIsMaximized] = useState(false);

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Extract users list from the summary
  const users = data?.users || [];

  // Get max operations this month for progress bar calculation
  const maxOpsMonth = Math.max(...users.map(u => u.operationsThisMonth), 1);

  // Use totals from the summary (calculated from ALL users, not just top 15)
  const totalOpsToday = data?.totalOperationsToday || 0;
  const totalOpsMonth = data?.totalOperationsPeriod || 0;
  const totalVolume = data?.totalVolumePeriod || 0;
  const totalActiveUsers = data?.totalActiveUsers || 0;

  const containerStyles = {
    p: 5,
    borderRadius: 'xl',
    bg: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: '1px',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
  };

  const renderTable = (showAll: boolean = false) => (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row bg="transparent">
          <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase">
            {t('businessDashboard.user', 'Usuario')}
          </Table.ColumnHeader>
          <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="center">
            {t('businessDashboard.today', 'Hoy')}
          </Table.ColumnHeader>
          <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="center">
            {t('businessDashboard.week', 'Semana')}
          </Table.ColumnHeader>
          <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="center">
            {t('businessDashboard.period', 'Período')}
          </Table.ColumnHeader>
          <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="right">
            {t('businessDashboard.volume')}
          </Table.ColumnHeader>
          <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase">
            {t('businessDashboard.product')}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {(showAll ? users : users.slice(0, 5)).map((user, index) => (
          <Table.Row key={user.username} _hover={{ bg: isDark ? 'whiteAlpha.50' : 'blackAlpha.25' }}>
            <Table.Cell>
              <HStack>
                <Box
                  w={8}
                  h={8}
                  borderRadius="full"
                  bg={`${colors.primaryColor}20`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="sm"
                  color={colors.primaryColor}
                >
                  {(user.fullName || user.username).charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {user.fullName || user.username}
                  </Text>
                  <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                    {user.username}
                  </Text>
                  <Box w="60px">
                    <Progress.Root
                      value={(user.operationsThisMonth / maxOpsMonth) * 100}
                      size="xs"
                      colorPalette={index === 0 ? 'green' : index < 3 ? 'blue' : 'gray'}
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>
                </Box>
              </HStack>
            </Table.Cell>
            <Table.Cell textAlign="center">
              <Badge
                colorPalette={user.operationsToday > 0 ? 'green' : 'gray'}
                variant="subtle"
                fontWeight="bold"
              >
                {user.operationsToday}
              </Badge>
            </Table.Cell>
            <Table.Cell textAlign="center">
              <Badge colorPalette="blue" variant="subtle">
                {user.operationsThisWeek}
              </Badge>
            </Table.Cell>
            <Table.Cell textAlign="center">
              <Badge colorPalette="purple" variant="subtle" fontWeight="bold">
                {user.operationsThisMonth}
              </Badge>
            </Table.Cell>
            <Table.Cell textAlign="right">
              <Text fontWeight="bold" color={colors.textColor} fontSize="sm">
                {formatVolume(user.volumeThisMonth)}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge colorPalette={PRODUCT_COLORS[user.mostUsedProduct] || 'gray'} variant="subtle">
                {getProductLabel(user.mostUsedProduct, t)}
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );

  const renderHeader = (showClose: boolean = false) => (
    <HStack justify="space-between" align="center" mb={4}>
      <HStack>
        <FiUser size={20} color={colors.primaryColor} />
        <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
          {t('businessDashboard.userActivity', 'Actividad por Usuario')}
        </Text>
      </HStack>
      <HStack gap={2}>
        <Badge colorPalette="blue" variant="subtle">
          {totalActiveUsers} {t('businessDashboard.operators', 'operadores')}
        </Badge>
        {showClose ? (
          <IconButton
            aria-label="Cerrar"
            size="sm"
            variant="ghost"
            bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
            onClick={() => setIsMaximized(false)}
          >
            <FiX />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Expandir"
            size="sm"
            variant="ghost"
            bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
            onClick={() => setIsMaximized(true)}
          >
            <FiMaximize2 />
          </IconButton>
        )}
      </HStack>
    </HStack>
  );

  const renderSummary = () => (
    <HStack gap={6} mb={4} flexWrap="wrap">
      <VStack align="start" gap={0}>
        <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
          {t('businessDashboard.today', 'Hoy')}
        </Text>
        <HStack>
          <Text fontSize="xl" fontWeight="bold" color={colors.primaryColor}>
            {totalOpsToday}
          </Text>
          <Text fontSize="sm" color={colors.textColor} opacity={0.7}>ops</Text>
        </HStack>
      </VStack>
      <VStack align="start" gap={0}>
        <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
          {t('businessDashboard.period', 'Período')}
        </Text>
        <HStack>
          <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
            {totalOpsMonth}
          </Text>
          <Text fontSize="sm" color={colors.textColor} opacity={0.7}>ops</Text>
        </HStack>
      </VStack>
      <VStack align="start" gap={0}>
        <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
          {t('businessDashboard.volume', 'Volumen')}
        </Text>
        <Text fontSize="xl" fontWeight="bold" color="green.500">
          {formatVolume(totalVolume)}
        </Text>
      </VStack>
    </HStack>
  );

  // Maximized view (fullscreen modal)
  if (isMaximized) {
    return (
      <>
        {/* Placeholder to maintain grid layout */}
        <Box {...containerStyles} minH="200px">
          {renderHeader(false)}
          <Text color={colors.textColor} opacity={0.5} textAlign="center" py={8}>
            Vista expandida abierta...
          </Text>
        </Box>

        {/* Fullscreen overlay */}
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'}
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            onClick={() => setIsMaximized(false)}
          >
            <Box
              {...containerStyles}
              bg={isDark ? 'gray.900' : 'white'}
              maxW="1200px"
              w="100%"
              maxH="90vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(true)}
              {renderSummary()}
              {renderTable(true)}

              {users.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Text color={colors.textColor} opacity={0.5}>
                    {t('businessDashboard.noUserActivity', 'No hay actividad de usuarios')}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        </Portal>
      </>
    );
  }

  // Normal view
  return (
    <Box {...containerStyles} overflowX="auto">
      {renderHeader(false)}
      {renderTable(false)}

      {users.length > 5 && (
        <Text
          fontSize="xs"
          color={colors.primaryColor}
          textAlign="center"
          mt={2}
          cursor="pointer"
          onClick={() => setIsMaximized(true)}
          _hover={{ textDecoration: 'underline' }}
        >
          + {users.length - 5} más... (clic para ver todos)
        </Text>
      )}

      {users.length === 0 && (
        <Box textAlign="center" py={8}>
          <Text color={colors.textColor} opacity={0.5}>
            {t('businessDashboard.noUserActivity', 'No hay actividad de usuarios')}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default UserActivityTable;
