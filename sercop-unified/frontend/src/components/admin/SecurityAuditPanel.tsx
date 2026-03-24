/**
 * SecurityAuditPanel Component
 * Professional admin panel for security audit logs
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Spinner,
  Alert,
  SimpleGrid,
  Stat,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Tabs,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import {
  FaShieldAlt,
  FaSync,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaUserSecret,
  FaNetworkWired,
  FaClock,
  FaEye,
  FaCheck,
  FaBell,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { notify } from '../ui/toaster';
import { adminService } from '../../services/adminService';
import type { SecurityAuditLog, SecurityAlert, SecurityAuditStatistics, SecurityAuditFilter } from '../../services/adminService';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface SecurityAuditPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const COLORS = {
  bg: 'white',
  border: 'gray.200',
  infoBg: 'gray.50',
};

export const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const { t } = useTranslation();

  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [criticalEvents, setCriticalEvents] = useState<SecurityAuditLog[]>([]);
  const [statistics, setStatistics] = useState<SecurityAuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState('logs');

  // Filters
  const [filter, setFilter] = useState<SecurityAuditFilter>({
    page: 0,
    size: 50,
  });

  // Dialog state
  const [selectedLog, setSelectedLog] = useState<SecurityAuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [logsResponse, alertsResponse, criticalResponse, statsResponse] = await Promise.all([
        adminService.getAuditLogs(filter),
        adminService.getSecurityAlerts(true),
        adminService.getCriticalEvents(24),
        adminService.getAuditStatistics(7),
      ]);

      setLogs(logsResponse.content || []);
      setTotalElements(logsResponse.totalElements || 0);
      setAlerts(Array.isArray(alertsResponse) ? alertsResponse : []);
      setCriticalEvents(Array.isArray(criticalResponse) ? criticalResponse : []);
      setStatistics(statsResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await adminService.acknowledgeAlert(alertId);
      notify.success(
        t('securityAudit.acknowledged', 'Acknowledged'),
        t('securityAudit.alertAcknowledged', 'Alert acknowledged successfully')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to acknowledge alert'
      );
    }
  };

  // Export logs
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const blob = await adminService.exportAuditLogs(filter, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notify.success(
        t('securityAudit.exported', 'Exported'),
        t('securityAudit.exportSuccess', 'Audit logs exported successfully')
      );
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to export logs'
      );
    } finally {
      setExporting(false);
    }
  };

  // Get result badge color
  const getResultBadgeColor = (result: string): string => {
    switch (result) {
      case 'SUCCESS': return 'green';
      case 'FAILURE': return 'red';
      case 'BLOCKED': return 'orange';
      default: return 'gray';
    }
  };

  // Get threat level badge color
  const getThreatBadgeColor = (level: string): string => {
    switch (level) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'blue';
      default: return 'gray';
    }
  };

  // Get result icon
  const getResultIcon = (result: string) => {
    switch (result) {
      case 'SUCCESS': return FaCheckCircle;
      case 'FAILURE': return FaTimesCircle;
      case 'BLOCKED': return FaBan;
      default: return FaCheckCircle;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // --- DataTable column definitions ---
  const logColumns: DataTableColumn<SecurityAuditLog>[] = [
    {
      key: 'timestamp',
      label: t('securityAudit.timestamp', 'Timestamp'),
      sortable: true,
      render: (row) => <Text fontSize="sm">{formatTimestamp(row.timestamp)}</Text>,
    },
    {
      key: 'eventType',
      label: t('securityAudit.eventType', 'Event Type'),
      filterType: 'select',
      filterOptions: [
        { value: 'LOGIN', label: 'LOGIN' },
        { value: 'LOGOUT', label: 'LOGOUT' },
        { value: 'LOGIN_FAILED', label: 'LOGIN_FAILED' },
        { value: 'PASSWORD_CHANGE', label: 'PASSWORD_CHANGE' },
        { value: 'SSO_LOGIN', label: 'SSO_LOGIN' },
        { value: 'PERMISSION_CHANGE', label: 'PERMISSION_CHANGE' },
      ],
      render: (row) => <Badge colorPalette="blue">{row.eventType}</Badge>,
    },
    {
      key: 'username',
      label: t('securityAudit.user', 'User'),
      render: (row) => <Text fontWeight="medium" fontSize="sm">{row.username || '-'}</Text>,
    },
    {
      key: 'ipAddress',
      label: t('securityAudit.ip', 'IP'),
      render: (row) => <Text fontFamily="mono" fontSize="sm">{row.ipAddress}</Text>,
      hideOnMobile: true,
    },
    {
      key: 'result',
      label: t('securityAudit.result', 'Result'),
      filterType: 'select',
      filterOptions: [
        { value: 'SUCCESS', label: 'SUCCESS' },
        { value: 'FAILURE', label: 'FAILURE' },
        { value: 'BLOCKED', label: 'BLOCKED' },
      ],
      render: (row) => (
        <HStack gap={1}>
          <Icon as={getResultIcon(row.result)} color={`${getResultBadgeColor(row.result)}.500`} />
          <Badge colorPalette={getResultBadgeColor(row.result)}>{row.result}</Badge>
        </HStack>
      ),
    },
    {
      key: 'threatLevel',
      label: t('securityAudit.threatLevel', 'Threat'),
      filterType: 'select',
      filterOptions: [
        { value: 'CRITICAL', label: 'CRITICAL' },
        { value: 'HIGH', label: 'HIGH' },
        { value: 'MEDIUM', label: 'MEDIUM' },
        { value: 'LOW', label: 'LOW' },
        { value: 'NONE', label: 'NONE' },
      ],
      render: (row) => (
        <Badge colorPalette={getThreatBadgeColor(row.threatLevel)}>{row.threatLevel}</Badge>
      ),
    },
  ];

  const logActions: DataTableAction<SecurityAuditLog>[] = [
    {
      key: 'view',
      label: t('common.view', 'View'),
      icon: FaEye,
      colorPalette: 'blue',
      onClick: (row) => {
        setSelectedLog(row);
        setIsDetailOpen(true);
      },
    },
  ];

  const criticalColumns: DataTableColumn<SecurityAuditLog>[] = [
    {
      key: 'timestamp',
      label: t('securityAudit.timestamp', 'Timestamp'),
      sortable: true,
      render: (row) => <Text fontSize="sm">{formatTimestamp(row.timestamp)}</Text>,
    },
    {
      key: 'eventType',
      label: t('securityAudit.eventType', 'Event Type'),
      render: (row) => <Badge colorPalette="red">{row.eventType}</Badge>,
    },
    {
      key: 'username',
      label: t('securityAudit.user', 'User'),
      render: (row) => <Text fontWeight="medium" fontSize="sm">{row.username || '-'}</Text>,
    },
    {
      key: 'details',
      label: t('securityAudit.details', 'Details'),
      render: (row) => (
        <Text fontSize="sm" color="gray.600" maxW="300px" truncate>
          {row.details || '-'}
        </Text>
      ),
      hideOnMobile: true,
    },
    {
      key: 'threatLevel',
      label: t('securityAudit.threatLevel', 'Threat'),
      filterType: 'select',
      filterOptions: [
        { value: 'CRITICAL', label: 'CRITICAL' },
        { value: 'HIGH', label: 'HIGH' },
        { value: 'MEDIUM', label: 'MEDIUM' },
        { value: 'LOW', label: 'LOW' },
      ],
      render: (row) => (
        <Badge colorPalette={getThreatBadgeColor(row.threatLevel)}>{row.threatLevel}</Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.500">{t('common.loading', 'Loading...')}</Text>
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
          <Box p={2} borderRadius="lg" bg="red.50" color="red.600">
            <Icon as={FaShieldAlt} fontSize="2xl" />
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">
              {t('securityAudit.title', 'Security Audit')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('securityAudit.totalEvents', 'Total Events')}: {totalElements}
            </Text>
          </VStack>
        </HStack>

        <HStack gap={2}>
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            colorPalette="green"
            loading={exporting}
          >
            <Icon as={FaDownload} mr={2} />
            CSV
          </Button>
          <Button
            onClick={() => handleExport('json')}
            variant="outline"
            colorPalette="blue"
            loading={exporting}
          >
            <Icon as={FaDownload} mr={2} />
            JSON
          </Button>
          <Button onClick={fetchData} variant="outline" colorPalette="gray">
            <Icon as={FaSync} mr={2} />
            {t('common.refresh', 'Refresh')}
          </Button>
        </HStack>
      </HStack>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <Alert.Root status="warning" borderRadius="lg">
          <Alert.Indicator>
            <Icon as={FaBell} />
          </Alert.Indicator>
          <Alert.Content>
            <Text fontWeight="bold">
              {t('securityAudit.unacknowledgedAlerts', 'Unacknowledged Alerts')}: {alerts.length}
            </Text>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Statistics */}
      {statistics && (
        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={4}>
          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon as={FaClock} color="blue.500" />
                  <Text fontSize="xs">{t('securityAudit.totalEvents', 'Total Events')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="xl">{statistics.totalEvents}</Stat.ValueText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Text fontSize="xs">{t('securityAudit.successfulLogins', 'Successful Logins')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="xl">{statistics.successfulLogins}</Stat.ValueText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon as={FaTimesCircle} color="red.500" />
                  <Text fontSize="xs">{t('securityAudit.failedLogins', 'Failed Logins')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="xl">{statistics.failedLogins}</Stat.ValueText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon as={FaBan} color="orange.500" />
                  <Text fontSize="xs">{t('securityAudit.blockedAttempts', 'Blocked')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="xl">{statistics.blockedAttempts}</Stat.ValueText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon as={FaUserSecret} color="purple.500" />
                  <Text fontSize="xs">{t('securityAudit.uniqueUsers', 'Unique Users')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="xl">{statistics.uniqueUsers}</Stat.ValueText>
            </Stat.Root>
          </Box>

          <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
            <Stat.Root>
              <Stat.Label>
                <HStack gap={2}>
                  <Icon as={FaNetworkWired} color="cyan.500" />
                  <Text fontSize="xs">{t('securityAudit.uniqueIps', 'Unique IPs')}</Text>
                </HStack>
              </Stat.Label>
              <Stat.ValueText fontSize="xl">{statistics.uniqueIps}</Stat.ValueText>
            </Stat.Root>
          </Box>
        </SimpleGrid>
      )}

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Tabs.List>
          <Tabs.Trigger value="logs">
            <HStack gap={2}>
              <Icon as={FaClock} />
              <Text>{t('securityAudit.auditLogs', 'Audit Logs')}</Text>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="alerts">
            <HStack gap={2}>
              <Icon as={FaBell} />
              <Text>{t('securityAudit.alerts', 'Alerts')}</Text>
              {alerts.length > 0 && (
                <Badge colorPalette="red" borderRadius="full" size="sm">
                  {alerts.length}
                </Badge>
              )}
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="critical">
            <HStack gap={2}>
              <Icon as={FaExclamationTriangle} />
              <Text>{t('securityAudit.criticalEvents', 'Critical Events')}</Text>
              {criticalEvents.length > 0 && (
                <Badge colorPalette="orange" borderRadius="full" size="sm">
                  {criticalEvents.length}
                </Badge>
              )}
            </HStack>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Logs Tab */}
        <Tabs.Content value="logs">
          <Box pt={4}>
            <DataTable<SecurityAuditLog>
              data={logs}
              columns={logColumns}
              rowKey={(row) => String(row.id)}
              actions={logActions}
              isLoading={false}
              emptyMessage={t('securityAudit.noLogs', 'No audit logs found')}
              emptyIcon={FaShieldAlt}
              pagination="server"
              serverPagination={{
                totalItems: totalElements,
                currentPage: filter.page || 0,
                pageSize: filter.size || 50,
                onPageChange: (page) => setFilter(prev => ({ ...prev, page })),
                onPageSizeChange: (size) => setFilter(prev => ({ ...prev, size, page: 0 })),
              }}
              defaultPageSize={filter.size || 50}
              pageSizeOptions={[10, 20, 50, 100]}
              searchPlaceholder={t('securityAudit.searchUser', 'Search by username...')}
              size="sm"
            />
          </Box>
        </Tabs.Content>

        {/* Alerts Tab */}
        <Tabs.Content value="alerts">
          <VStack gap={4} align="stretch" pt={4}>
            {alerts.length === 0 ? (
              <Box p={8} textAlign="center" bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
                <Icon as={FaCheckCircle} fontSize="4xl" color="green.400" mb={4} />
                <Text color="gray.500">{t('securityAudit.noAlerts', 'No unacknowledged alerts')}</Text>
              </Box>
            ) : (
              alerts.map((alert) => (
                <Box
                  key={alert.id}
                  p={4}
                  bg={COLORS.bg}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={alert.severity === 'CRITICAL' ? 'red.300' : alert.severity === 'HIGH' ? 'orange.300' : COLORS.border}
                  borderLeft="4px solid"
                  borderLeftColor={`${getThreatBadgeColor(alert.severity)}.500`}
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" gap={2}>
                      <HStack gap={2}>
                        <Badge colorPalette={getThreatBadgeColor(alert.severity)}>{alert.severity}</Badge>
                        <Text fontWeight="bold">{alert.alertType}</Text>
                      </HStack>
                      <Text>{alert.message}</Text>
                      <HStack gap={4} fontSize="sm" color="gray.500">
                        {alert.username && <Text>{t('securityAudit.user', 'User')}: {alert.username}</Text>}
                        {alert.ipAddress && <Text>IP: {alert.ipAddress}</Text>}
                        <Text>{formatTimestamp(alert.createdAt)}</Text>
                      </HStack>
                    </VStack>
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      <Icon as={FaCheck} mr={2} />
                      {t('securityAudit.acknowledge', 'Acknowledge')}
                    </Button>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </Tabs.Content>

        {/* Critical Events Tab */}
        <Tabs.Content value="critical">
          <VStack gap={4} align="stretch" pt={4}>
            <Text fontSize="sm" color="gray.500">
              {t('securityAudit.criticalEventsLast24h', 'Critical events in the last 24 hours')}
            </Text>

            <DataTable<SecurityAuditLog>
              data={criticalEvents}
              columns={criticalColumns}
              rowKey={(row) => String(row.id)}
              isLoading={false}
              emptyMessage={t('securityAudit.noCriticalEvents', 'No critical events in the last 24 hours')}
              emptyIcon={FaCheckCircle}
              defaultPageSize={20}
              size="sm"
            />
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      {/* Detail Dialog */}
      <DialogRoot
        open={isDetailOpen}
        onOpenChange={(e) => !e.open && setIsDetailOpen(false)}
        placement="center"
        size="lg"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon as={FaEye} color="blue.500" />
              <DialogTitle>{t('securityAudit.eventDetails', 'Event Details')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            {selectedLog && (
              <VStack align="stretch" gap={3}>
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.eventType', 'Event Type')}
                    </Text>
                    <Badge colorPalette="blue">{selectedLog.eventType}</Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.category', 'Category')}
                    </Text>
                    <Text>{selectedLog.eventCategory}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.user', 'User')}
                    </Text>
                    <Text>{selectedLog.username || '-'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.timestamp', 'Timestamp')}
                    </Text>
                    <Text>{formatTimestamp(selectedLog.timestamp)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.ip', 'IP Address')}
                    </Text>
                    <Text fontFamily="mono">{selectedLog.ipAddress}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.result', 'Result')}
                    </Text>
                    <Badge colorPalette={getResultBadgeColor(selectedLog.result)}>
                      {selectedLog.result}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.threatLevel', 'Threat Level')}
                    </Text>
                    <Badge colorPalette={getThreatBadgeColor(selectedLog.threatLevel)}>
                      {selectedLog.threatLevel}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.targetResource', 'Target Resource')}
                    </Text>
                    <Text>{selectedLog.targetResource || '-'}</Text>
                  </Box>
                </SimpleGrid>

                {selectedLog.userAgent && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.userAgent', 'User Agent')}
                    </Text>
                    <Text fontSize="sm" fontFamily="mono" p={2} bg={COLORS.infoBg} borderRadius="md">
                      {selectedLog.userAgent}
                    </Text>
                  </Box>
                )}

                {selectedLog.details && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">
                      {t('securityAudit.details', 'Details')}
                    </Text>
                    <Text fontSize="sm" p={2} bg={COLORS.infoBg} borderRadius="md">
                      {selectedLog.details}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </DialogBody>

          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
};

export default SecurityAuditPanel;
