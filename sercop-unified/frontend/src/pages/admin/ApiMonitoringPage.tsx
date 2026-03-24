import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  Input,
  Button,
  HStack,
  VStack,
  Spinner,
  Tabs,
  Card,
  Grid,
  GridItem,
  Stat,
  Code,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiRefreshCw, FiDownload, FiActivity, FiUsers, FiServer, FiAlertTriangle } from 'react-icons/fi';
import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY } from '../../config/api.config';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';

const API_BASE_URL = '/api/monitoring';

interface ApiAccessLog {
  id: number;
  username: string;
  httpMethod: string;
  urlPattern: string;
  requestUri: string;
  ipAddress: string;
  userAgent: string;
  responseTimeMs: number;
  responseStatus: number;
  accessGranted: boolean;
  deniedReason: string | null;
  accessedAt: string;
}

interface ApiStatistics {
  totalRequests: number;
  grantedRequests: number;
  deniedRequests: number;
  avgResponseTime: number;
}

interface TopUser {
  username: string;
  count: number;
}

interface TopEndpoint {
  httpMethod: string;
  urlPattern: string;
  count: number;
}

interface SecurityAlert {
  username: string;
  deniedCount: number;
}

const ApiMonitoringPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('logs');

  // Logs state
  const [logs, setLogs] = useState<ApiAccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(0);
  const [logsTotalElements, setLogsTotalElements] = useState(0);

  // Statistics state
  const [statistics, setStatistics] = useState<ApiStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Top users/endpoints state
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<TopEndpoint[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  // Denied logs state
  const [deniedLogs, setDeniedLogs] = useState<ApiAccessLog[]>([]);
  const [deniedLoading, setDeniedLoading] = useState(false);

  // Page size for logs
  const [logsPageSize, setLogsPageSize] = useState(20);

  // Filters
  const [usernameFilter, setUsernameFilter] = useState('');
  const [hoursFilter, setHoursFilter] = useState(24);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchWithAuth = async (url: string) => {
    const response = await fetch(`${API_BASE_URL_WITH_PREFIX}${url.replace('/api', '')}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  useEffect(() => {
    loadStatistics();
    loadTopData();
  }, [hoursFilter]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'denied') {
      loadDeniedLogs();
    }
  }, [activeTab, logsPage, logsPageSize]);

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/stats?hours=${hoursFilter}`);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTopData = async () => {
    try {
      const [usersData, endpointsData, alertsData] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/top-users?hours=${hoursFilter}&limit=10`),
        fetchWithAuth(`${API_BASE_URL}/top-endpoints?hours=${hoursFilter}&limit=10`),
        fetchWithAuth(`${API_BASE_URL}/security-alerts?hours=${hoursFilter}&limit=10`),
      ]);
      setTopUsers(usersData || []);
      setTopEndpoints(endpointsData || []);
      setSecurityAlerts(alertsData || []);
    } catch (error) {
      console.error('Error loading top data:', error);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/logs?page=${logsPage}&size=${logsPageSize}`);
      setLogs(data?.content || []);
      setLogsTotalElements(data?.totalElements || 0);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadDeniedLogs = async () => {
    setDeniedLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/logs/denied?page=0&size=50`);
      setDeniedLogs(data?.content || []);
    } catch (error) {
      console.error('Error loading denied logs:', error);
    } finally {
      setDeniedLoading(false);
    }
  };

  const loadUserLogs = async () => {
    if (!usernameFilter.trim()) {
      loadLogs();
      return;
    }
    setLogsLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/logs/user/${usernameFilter}?page=${logsPage}&size=${logsPageSize}`);
      setLogs(data?.content || []);
      setLogsTotalElements(data?.totalElements || 0);
    } catch (error) {
      console.error('Error loading user logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStatistics();
    loadTopData();
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'denied') {
      loadDeniedLogs();
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'blue',
      POST: 'green',
      PUT: 'orange',
      DELETE: 'red',
      PATCH: 'purple',
    };
    return <Badge colorPalette={colors[method] || 'gray'}>{method}</Badge>;
  };

  const getStatusBadge = (granted: boolean, status: number) => {
    if (granted) {
      return <Badge colorPalette="green">{status || 'OK'}</Badge>;
    }
    return <Badge colorPalette="red">{status || t('apiMonitoring.denied')}</Badge>;
  };

  // --- Column definitions ---

  const logsColumns: DataTableColumn<ApiAccessLog>[] = useMemo(() => [
    {
      key: 'accessedAt',
      label: t('apiMonitoring.table.timestamp', 'Timestamp'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <Text whiteSpace="nowrap" fontSize="xs">{formatDateTime(row.accessedAt)}</Text>
      ),
    },
    {
      key: 'username',
      label: t('apiMonitoring.table.user', 'User'),
      sortable: false,
      render: (row) => <Text fontWeight="medium">{row.username || '-'}</Text>,
    },
    {
      key: 'httpMethod',
      label: t('apiMonitoring.table.method', 'Method'),
      sortable: false,
      filterType: 'select',
      filterOptions: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
      ],
      render: (row) => getMethodBadge(row.httpMethod),
    },
    {
      key: 'requestUri',
      label: t('apiMonitoring.table.endpoint', 'Endpoint'),
      sortable: false,
      render: (row) => (
        <Code fontSize="xs" truncate title={row.requestUri} maxW="300px" display="block">
          {row.requestUri}
        </Code>
      ),
    },
    {
      key: 'ipAddress',
      label: t('apiMonitoring.table.ip', 'IP'),
      sortable: false,
      render: (row) => <Text fontSize="xs">{row.ipAddress}</Text>,
    },
    {
      key: 'accessGranted',
      label: t('apiMonitoring.table.status', 'Status'),
      sortable: false,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'OK' },
        { value: 'false', label: t('apiMonitoring.denied', 'Denied') },
      ],
      render: (row) => getStatusBadge(row.accessGranted, row.responseStatus),
    },
    {
      key: 'responseTimeMs',
      label: t('apiMonitoring.table.responseTime', 'Time'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <Badge colorPalette={row.responseTimeMs > 1000 ? 'orange' : 'gray'}>
          {row.responseTimeMs}ms
        </Badge>
      ),
    },
  ], [t]);

  const deniedLogsColumns: DataTableColumn<ApiAccessLog>[] = useMemo(() => [
    {
      key: 'accessedAt',
      label: t('apiMonitoring.table.timestamp', 'Timestamp'),
      render: (row) => (
        <Text whiteSpace="nowrap" fontSize="xs">{formatDateTime(row.accessedAt)}</Text>
      ),
    },
    {
      key: 'username',
      label: t('apiMonitoring.table.user', 'User'),
      render: (row) => <Text fontWeight="medium">{row.username || '-'}</Text>,
    },
    {
      key: 'httpMethod',
      label: t('apiMonitoring.table.method', 'Method'),
      filterType: 'select',
      filterOptions: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
      ],
      render: (row) => getMethodBadge(row.httpMethod),
    },
    {
      key: 'requestUri',
      label: t('apiMonitoring.table.endpoint', 'Endpoint'),
      render: (row) => (
        <Code fontSize="xs" truncate title={row.requestUri} maxW="300px" display="block">
          {row.requestUri}
        </Code>
      ),
    },
    {
      key: 'ipAddress',
      label: t('apiMonitoring.table.ip', 'IP'),
      render: (row) => <Text fontSize="xs">{row.ipAddress}</Text>,
    },
    {
      key: 'deniedReason',
      label: t('apiMonitoring.table.reason', 'Reason'),
      render: (row) => (
        <Badge colorPalette="red">{row.deniedReason || t('apiMonitoring.accessDenied', 'Access Denied')}</Badge>
      ),
    },
  ], [t]);

  const topUsersColumns: DataTableColumn<TopUser>[] = useMemo(() => [
    {
      key: 'username',
      label: t('apiMonitoring.user', 'User'),
      render: (row) => <Text fontWeight="medium">{row.username}</Text>,
    },
    {
      key: 'count',
      label: t('apiMonitoring.requests', 'Requests'),
      align: 'right' as const,
      render: (row) => <Badge colorPalette="blue">{row.count?.toLocaleString()}</Badge>,
    },
  ], [t]);

  const topEndpointsColumns: DataTableColumn<TopEndpoint>[] = useMemo(() => [
    {
      key: 'httpMethod',
      label: t('apiMonitoring.method', 'Method'),
      filterType: 'select',
      filterOptions: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
      ],
      render: (row) => getMethodBadge(row.httpMethod),
    },
    {
      key: 'urlPattern',
      label: t('apiMonitoring.endpoint', 'Endpoint'),
      render: (row) => (
        <Code fontSize="xs" truncate title={row.urlPattern} maxW="200px" display="block">
          {row.urlPattern}
        </Code>
      ),
    },
    {
      key: 'count',
      label: t('apiMonitoring.calls', 'Calls'),
      align: 'right' as const,
      render: (row) => <Badge colorPalette="green">{row.count?.toLocaleString()}</Badge>,
    },
  ], [t]);

  const securityAlertsColumns: DataTableColumn<SecurityAlert>[] = useMemo(() => [
    {
      key: 'username',
      label: t('apiMonitoring.user', 'User'),
      render: (row) => <Text fontWeight="medium">{row.username}</Text>,
    },
    {
      key: 'deniedCount',
      label: t('apiMonitoring.deniedAttempts', 'Denied Attempts'),
      align: 'right' as const,
      render: (row) => <Badge colorPalette="red">{row.deniedCount}</Badge>,
    },
  ], [t]);

  const exportToCSV = () => {
    const headers = ['ID', 'Timestamp', 'Username', 'Method', 'URL', 'IP', 'Status', 'Response Time (ms)', 'Granted'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log =>
        [
          log.id,
          log.accessedAt,
          log.username,
          log.httpMethod,
          `"${log.requestUri}"`,
          log.ipAddress,
          log.responseStatus,
          log.responseTimeMs,
          log.accessGranted,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `api_access_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Flex align="center" gap={2}>
              <FiActivity size={24} />
              <Heading size="lg">{t('apiMonitoring.title', 'API Monitoring')}</Heading>
            </Flex>
            <Text color="gray.500" mt={1}>
              {t('apiMonitoring.subtitle', 'Monitor all API calls to the system')}
            </Text>
          </Box>
          <HStack gap={2}>
            <Box>
              <select
                value={hoursFilter}
                onChange={(e) => setHoursFilter(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value={1}>{t('apiMonitoring.lastHour', 'Last hour')}</option>
                <option value={6}>{t('apiMonitoring.last6Hours', 'Last 6 hours')}</option>
                <option value={24}>{t('apiMonitoring.last24Hours', 'Last 24 hours')}</option>
                <option value={48}>{t('apiMonitoring.last48Hours', 'Last 48 hours')}</option>
                <option value={168}>{t('apiMonitoring.last7Days', 'Last 7 days')}</option>
              </select>
            </Box>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <FiRefreshCw /> {t('apiMonitoring.refresh', 'Refresh')}
            </Button>
            <Button colorPalette="green" size="sm" onClick={exportToCSV}>
              <FiDownload /> {t('apiMonitoring.export', 'Export CSV')}
            </Button>
          </HStack>
        </Flex>

        {/* Statistics Cards */}
        {statsLoading ? (
          <Flex justify="center" py={4}>
            <Spinner />
          </Flex>
        ) : (
          <Grid templateColumns="repeat(4, 1fr)" gap={4}>
            <GridItem>
              <Card.Root>
                <Card.Body>
                  <Stat.Root>
                    <Stat.Label>{t('apiMonitoring.totalRequests', 'Total Requests')}</Stat.Label>
                    <Stat.ValueText>{statistics?.totalRequests?.toLocaleString() || 0}</Stat.ValueText>
                    <Stat.HelpText>{t('apiMonitoring.inPeriod', 'in selected period')}</Stat.HelpText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
            </GridItem>
            <GridItem>
              <Card.Root>
                <Card.Body>
                  <Stat.Root>
                    <Stat.Label>{t('apiMonitoring.grantedRequests', 'Granted')}</Stat.Label>
                    <Stat.ValueText color="green.500">{statistics?.grantedRequests?.toLocaleString() || 0}</Stat.ValueText>
                    <Stat.HelpText>
                      {statistics?.totalRequests
                        ? `${((statistics.grantedRequests / statistics.totalRequests) * 100).toFixed(1)}%`
                        : '0%'}
                    </Stat.HelpText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
            </GridItem>
            <GridItem>
              <Card.Root>
                <Card.Body>
                  <Stat.Root>
                    <Stat.Label>{t('apiMonitoring.deniedRequests', 'Denied')}</Stat.Label>
                    <Stat.ValueText color="red.500">{statistics?.deniedRequests?.toLocaleString() || 0}</Stat.ValueText>
                    <Stat.HelpText>
                      {statistics?.totalRequests
                        ? `${((statistics.deniedRequests / statistics.totalRequests) * 100).toFixed(1)}%`
                        : '0%'}
                    </Stat.HelpText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
            </GridItem>
            <GridItem>
              <Card.Root>
                <Card.Body>
                  <Stat.Root>
                    <Stat.Label>{t('apiMonitoring.avgResponseTime', 'Avg Response Time')}</Stat.Label>
                    <Stat.ValueText>{statistics?.avgResponseTime?.toFixed(0) || 0} ms</Stat.ValueText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
            </GridItem>
          </Grid>
        )}

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
          <Tabs.List>
            <Tabs.Trigger value="logs">
              <FiServer style={{ marginRight: 8 }} />
              {t('apiMonitoring.tabs.allLogs', 'All API Logs')}
            </Tabs.Trigger>
            <Tabs.Trigger value="denied">
              <FiAlertTriangle style={{ marginRight: 8 }} />
              {t('apiMonitoring.tabs.deniedLogs', 'Denied Access')}
            </Tabs.Trigger>
            <Tabs.Trigger value="analytics">
              <FiUsers style={{ marginRight: 8 }} />
              {t('apiMonitoring.tabs.analytics', 'Analytics')}
            </Tabs.Trigger>
          </Tabs.List>

          {/* All Logs Tab */}
          <Tabs.Content value="logs">
            <VStack align="stretch" gap={4} mt={4}>
              {/* Username server-side filter */}
              <Box bg="gray.50" p={4} borderRadius="md" _dark={{ bg: 'gray.800' }}>
                <HStack gap={4}>
                  <Box flex={1}>
                    <Text fontSize="sm" mb={1} fontWeight="medium">{t('apiMonitoring.filterByUser', 'Filter by username')}</Text>
                    <Input
                      placeholder={t('apiMonitoring.enterUsername', 'Enter username...')}
                      value={usernameFilter}
                      onChange={(e) => setUsernameFilter(e.target.value)}
                      size="sm"
                    />
                  </Box>
                  <Box pt={6}>
                    <HStack>
                      <Button colorPalette="blue" size="sm" onClick={loadUserLogs}>
                        {t('apiMonitoring.search', 'Search')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUsernameFilter('');
                          setLogsPage(0);
                          loadLogs();
                        }}
                      >
                        {t('apiMonitoring.clear', 'Clear')}
                      </Button>
                    </HStack>
                  </Box>
                </HStack>
              </Box>

              <DataTable<ApiAccessLog>
                data={logs}
                columns={logsColumns}
                rowKey={(row) => String(row.id)}
                isLoading={logsLoading}
                emptyMessage={t('apiMonitoring.noLogs', 'No API logs found')}
                searchable={false}
                pagination="server"
                defaultPageSize={20}
                serverPagination={{
                  totalItems: logsTotalElements,
                  currentPage: logsPage,
                  pageSize: logsPageSize,
                  onPageChange: (page) => setLogsPage(page),
                  onPageSizeChange: (size) => {
                    setLogsPageSize(size);
                    setLogsPage(0);
                  },
                }}
                size="sm"
              />
            </VStack>
          </Tabs.Content>

          {/* Denied Logs Tab */}
          <Tabs.Content value="denied">
            <Box mt={4}>
              <DataTable<ApiAccessLog>
                data={deniedLogs}
                columns={deniedLogsColumns}
                rowKey={(row) => String(row.id)}
                isLoading={deniedLoading}
                emptyMessage={t('apiMonitoring.noDeniedLogs', 'No denied access attempts found')}
                emptyIcon={FiAlertTriangle}
                defaultPageSize={20}
                size="sm"
              />
            </Box>
          </Tabs.Content>

          {/* Analytics Tab */}
          <Tabs.Content value="analytics">
            <Grid templateColumns="repeat(2, 1fr)" gap={6} mt={4}>
              {/* Top Users */}
              <Card.Root>
                <Card.Header>
                  <Flex align="center" gap={2}>
                    <FiUsers />
                    <Heading size="sm">{t('apiMonitoring.topUsers', 'Most Active Users')}</Heading>
                  </Flex>
                </Card.Header>
                <Card.Body>
                  <DataTable<TopUser>
                    data={topUsers}
                    columns={topUsersColumns}
                    rowKey={(row) => row.username}
                    emptyMessage={t('apiMonitoring.noData', 'No data available')}
                    pagination="none"
                    searchable={false}
                    size="sm"
                  />
                </Card.Body>
              </Card.Root>

              {/* Top Endpoints */}
              <Card.Root>
                <Card.Header>
                  <Flex align="center" gap={2}>
                    <FiServer />
                    <Heading size="sm">{t('apiMonitoring.topEndpoints', 'Most Called Endpoints')}</Heading>
                  </Flex>
                </Card.Header>
                <Card.Body>
                  <DataTable<TopEndpoint>
                    data={topEndpoints}
                    columns={topEndpointsColumns}
                    rowKey={(row) => `${row.httpMethod}-${row.urlPattern}`}
                    emptyMessage={t('apiMonitoring.noData', 'No data available')}
                    pagination="none"
                    searchable={false}
                    size="sm"
                  />
                </Card.Body>
              </Card.Root>

              {/* Security Alerts */}
              <Card.Root gridColumn="span 2">
                <Card.Header>
                  <Flex align="center" gap={2}>
                    <FiAlertTriangle color="orange" />
                    <Heading size="sm">{t('apiMonitoring.securityAlerts', 'Users with Denied Access')}</Heading>
                  </Flex>
                </Card.Header>
                <Card.Body>
                  <DataTable<SecurityAlert>
                    data={securityAlerts}
                    columns={securityAlertsColumns}
                    rowKey={(row) => row.username}
                    emptyMessage={t('apiMonitoring.noSecurityAlerts', 'No security alerts - All clear!')}
                    emptyIcon={FiAlertTriangle}
                    pagination="none"
                    searchable={false}
                    size="sm"
                  />
                </Card.Body>
              </Card.Root>
            </Grid>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Box>
  );
};

export default ApiMonitoringPage;
