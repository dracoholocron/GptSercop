/**
 * LockAdminPanel Component
 * Admin panel for managing operation locks
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Avatar,
  Spinner,
  Alert,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Stat,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaLock, FaUnlock, FaSync, FaUsers, FaChartBar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { notify } from '../../components/ui/toaster';
import { operationLockService } from '../../services/operationLockService';
import type { OperationLock, LockStatistics } from '../../services/operationLockService';
import { LockTimer } from '../locks/LockTimer';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface LockAdminPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Color constants (light mode)
const COLORS = {
  bg: 'white',
  border: 'gray.200',
  infoBg: 'gray.50',
};

export const LockAdminPanel: React.FC<LockAdminPanelProps> = ({
  autoRefresh = true,
  refreshInterval = 10000,
}) => {
  const { t } = useTranslation();

  const [locks, setLocks] = useState<OperationLock[]>([]);
  const [statistics, setStatistics] = useState<LockStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLock, setSelectedLock] = useState<OperationLock | null>(null);
  const [forceReleasing, setForceReleasing] = useState(false);
  const [isForceReleaseOpen, setIsForceReleaseOpen] = useState(false);

  // Fetch locks and statistics
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [locksResponse, statsResponse] = await Promise.all([
        operationLockService.getActiveLocks(),
        operationLockService.getLockStatistics(),
      ]);
      setLocks(locksResponse.data);
      setStatistics(statsResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Force release lock
  const handleForceRelease = async () => {
    if (!selectedLock) return;

    setForceReleasing(true);
    try {
      await operationLockService.forceReleaseLock(selectedLock.operationId, {
        reason: 'Admin force release',
      });

      notify.success(
        t('locks.forceRelease', 'Force Release'),
        t('locks.forceReleaseSuccess', 'Lock released successfully')
      );

      // Refresh data
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to release lock'
      );
    } finally {
      setForceReleasing(false);
      setIsForceReleaseOpen(false);
      setSelectedLock(null);
    }
  };

  // Unique users for select filter
  const uniqueUsers = useMemo(() => [...new Set(locks.map(l => l.lockedBy))], [locks]);
  const uniqueProductTypes = useMemo(
    () => [...new Set(locks.map(l => l.productType).filter(Boolean))] as string[],
    [locks],
  );

  // DataTable columns
  const columns: DataTableColumn<OperationLock>[] = useMemo(() => [
    {
      key: 'operationId',
      label: t('common.operation', 'Operation'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium" fontFamily="mono">
            {row.operationId}
          </Text>
          {row.operationReference && (
            <Text fontSize="sm" color="gray.500">
              {row.operationReference}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'lockedBy',
      label: t('locks.lockedByUser', 'Locked By'),
      filterType: 'select',
      filterOptions: uniqueUsers.map(u => ({ value: u, label: u })),
      render: (row) => (
        <HStack gap={2}>
          <Avatar.Root size="sm">
            <Avatar.Fallback name={row.lockedByFullName || row.lockedBy} />
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Text fontWeight="medium">
              {row.lockedByFullName || row.lockedBy}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {row.lockedBy}
            </Text>
          </VStack>
        </HStack>
      ),
    },
    {
      key: 'productType',
      label: t('common.productType', 'Product Type'),
      filterType: 'select',
      filterOptions: uniqueProductTypes.map(pt => ({ value: pt, label: pt })),
      render: (row) =>
        row.productType ? (
          <Badge colorPalette="purple">{row.productType}</Badge>
        ) : (
          <Text color="gray.400">-</Text>
        ),
    },
    {
      key: 'remainingSeconds',
      label: t('locks.timeRemaining', 'Time Remaining'),
      filterable: false,
      render: (row) => (
        <LockTimer
          remainingSeconds={row.remainingSeconds}
          isExpiringSoon={row.isExpiringSoon}
          size="md"
        />
      ),
    },
  ], [t, uniqueUsers, uniqueProductTypes]);

  // DataTable actions
  const tableActions: DataTableAction<OperationLock>[] = useMemo(() => [
    {
      key: 'release',
      label: t('locks.release', 'Release'),
      icon: FaUnlock,
      colorPalette: 'red',
      onClick: (row) => {
        setSelectedLock(row);
        setIsForceReleaseOpen(true);
      },
    },
  ], [t]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.500">
          {t('common.loading', 'Loading...')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" borderRadius="lg">
        <Alert.Indicator />
        <Alert.Content>{error}</Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
            <Icon fontSize="2xl">
              <FaLock />
            </Icon>
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">
              {t('locks.adminPanel', 'Lock Management')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('locks.activeLocks', 'Active Locks')}: {locks.length}
            </Text>
          </VStack>
        </HStack>

        <Button
          onClick={fetchData}
          variant="outline"
          colorPalette="blue"
        >
          <Icon mr={2}>
            <FaSync />
          </Icon>
          {t('common.refresh', 'Refresh')}
        </Button>
      </HStack>

      {/* Statistics */}
      {statistics && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon color="blue.500">
                    <FaLock />
                  </Icon>
                  <Text>{t('locks.activeLocks', 'Active Locks')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="2xl">{statistics.activeLocks}</Stat.ValueText>
              <Stat.HelpText>{t('locks.currentlyActive', 'Currently active')}</Stat.HelpText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon color="green.500">
                    <FaUsers />
                  </Icon>
                  <Text>{t('locks.byUser', 'By User')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="2xl">{Object.keys(statistics.byUser).length}</Stat.ValueText>
              <Stat.HelpText>{t('locks.uniqueUsers', 'Unique users')}</Stat.HelpText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon color="purple.500">
                    <FaChartBar />
                  </Icon>
                  <Text>{t('locks.byProductType', 'By Product Type')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="2xl">{Object.keys(statistics.byProductType).length}</Stat.ValueText>
              <Stat.HelpText>{t('locks.productTypes', 'Product types')}</Stat.HelpText>
            </Stat.Root>
          </Box>
        </SimpleGrid>
      )}

      {/* Locks Table */}
      <DataTable<OperationLock>
        data={locks}
        columns={columns}
        rowKey={(row) => row.operationId}
        actions={tableActions}
        isLoading={false}
        emptyMessage={t('locks.noActiveLocks', 'No active locks')}
        emptyIcon={FaLock}
        defaultPageSize={10}
        searchPlaceholder={t('common.search', 'Search...')}
      />

      {/* Force Release Confirmation Dialog */}
      <DialogRoot
        open={isForceReleaseOpen}
        onOpenChange={(e) => !e.open && setIsForceReleaseOpen(false)}
        placement="center"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="red.500">
                <FaUnlock />
              </Icon>
              <DialogTitle>{t('locks.forceRelease', 'Force Release')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="start" gap={3}>
              <Text>
                {t('locks.forceReleaseConfirm', 'Are you sure you want to force release this lock? The user will lose access immediately.')}
              </Text>
              {selectedLock && (
                <Box p={3} bg={COLORS.infoBg} borderRadius="md" w="full">
                  <VStack align="start" gap={1}>
                    <HStack>
                      <Text fontWeight="bold">{t('common.operation', 'Operation')}:</Text>
                      <Text fontFamily="mono">{selectedLock.operationId}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">{t('locks.lockedByUser', 'Locked By')}:</Text>
                      <Text>{selectedLock.lockedByFullName || selectedLock.lockedBy}</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </VStack>
          </DialogBody>

          <DialogFooter gap={3}>
            <Button variant="ghost" onClick={() => setIsForceReleaseOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorPalette="red"
              onClick={handleForceRelease}
              loading={forceReleasing}
            >
              <Icon mr={2}>
                <FaUnlock />
              </Icon>
              {t('locks.forceRelease', 'Force Release')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
};

export default LockAdminPanel;
