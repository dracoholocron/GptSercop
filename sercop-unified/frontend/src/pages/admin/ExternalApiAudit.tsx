import React, { useState, useEffect } from 'react';
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
  Tabs,
  Card,
  Grid,
  GridItem,
  Stat,
  Code,
  Menu,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { get } from '../../utils/apiClient';
import { FiDownload, FiEye } from 'react-icons/fi';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';

const API_BASE_URL = '/api/admin/external-api';

interface ApiCallLog {
  id: number;
  apiConfigId: number;
  apiConfigCode: string;
  requestUrl: string;
  requestMethod: string;
  requestHeadersJson: string | null;
  requestBody: string | null;
  responseStatusCode: number | null;
  responseBody: string | null;
  executionTimeMs: number;
  attemptNumber: number;
  success: boolean;
  errorMessage: string | null;
  errorType: string | null;
  correlationId: string;
  operationId: string | null;
  operationType: string | null;
  eventType: string | null;
  triggeredBy: string | null;
  createdAt: string;
}

interface TestResult {
  id: number;
  apiConfigId: number;
  testType: string;
  success: boolean;
  responseStatusCode: number | null;
  responseBody: string | null;
  executionTimeMs: number;
  errorMessage: string | null;
  testedBy: string;
  testedAt: string;
}

interface ApiConfig {
  id: number;
  code: string;
  name: string;
  baseUrl: string;
  path: string;
  httpMethod: string;
  active: boolean;
  environment: string;
  metricsSummary?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
    avgResponseTimeMs: number | null;
  };
}

interface ApiMetrics {
  apiConfigId: number;
  apiConfigCode: string;
  period: string;
  summary: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
    avgResponseTimeMs: number | null;
  };
  dailyMetrics: Array<{
    date: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
  }>;
}

interface DailyMetric {
  date: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
}

const ExternalApiAudit: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('logs');

  // Call Logs state
  const [logs, setLogs] = useState<ApiCallLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(0);
  const [logsPageSize, setLogsPageSize] = useState(20);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsTotalElements, setLogsTotalElements] = useState(0);

  // Test Results state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);

  // Configs state
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);

  // Metrics state
  const [selectedMetricsApi, setSelectedMetricsApi] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState('7D');

  // Server-side filters for logs
  const [selectedApiId, setSelectedApiId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [successFilter, setSuccessFilter] = useState<string>('');

  // Selected log for detail view
  const [selectedLog, setSelectedLog] = useState<ApiCallLog | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'tests') {
      loadTestResults();
    }
  }, [activeTab, logsPage, logsPageSize]);

  useEffect(() => {
    if (selectedMetricsApi) {
      loadMetrics(selectedMetricsApi);
    }
  }, [selectedMetricsApi, metricsPeriod]);

  const loadConfigs = async () => {
    setConfigsLoading(true);
    try {
      const response = await get(`${API_BASE_URL}/queries`);
      if (response.ok) {
        const result = await response.json();
        setConfigs(result.data || []);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setConfigsLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      let url = `${API_BASE_URL}/queries/logs?page=${logsPage}&size=${logsPageSize}`;
      if (selectedApiId) url += `&apiConfigId=${selectedApiId}`;
      if (fromDate) url += `&from=${fromDate}T00:00:00`;
      if (toDate) url += `&to=${toDate}T23:59:59`;
      if (successFilter) url += `&success=${successFilter === 'true'}`;

      const response = await get(url);
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data?.content || []);
        setLogsTotalPages(result.data?.totalPages || 0);
        setLogsTotalElements(result.data?.totalElements || 0);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadTestResults = async () => {
    setTestsLoading(true);
    try {
      const response = await get(`${API_BASE_URL}/queries/test-results?page=0&size=50`);
      if (response.ok) {
        const result = await response.json();
        setTestResults(result.data?.content || []);
      }
    } catch (error) {
      console.error('Error loading test results:', error);
    } finally {
      setTestsLoading(false);
    }
  };

  const loadMetrics = async (apiConfigId: number) => {
    setMetricsLoading(true);
    try {
      const response = await get(`${API_BASE_URL}/queries/${apiConfigId}/metrics?period=${metricsPeriod}`);
      if (response.ok) {
        const result = await response.json();
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleSearch = () => {
    setLogsPage(0);
    loadLogs();
  };

  const handleClearFilters = () => {
    setSelectedApiId('');
    setFromDate('');
    setToDate('');
    setSuccessFilter('');
    setLogsPage(0);
    setTimeout(loadLogs, 100);
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

  const getStatusBadge = (success: boolean, statusCode: number | null) => {
    if (success) {
      return <Badge colorPalette="green">{t('externalApiAudit.status.success')} {statusCode && `(${statusCode})`}</Badge>;
    }
    return <Badge colorPalette="red">{t('externalApiAudit.status.failed')} {statusCode && `(${statusCode})`}</Badge>;
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

  const formatJson = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  // Export functions
  const exportToCSV = (data: Record<string, unknown>[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportLogs = async () => {
    try {
      let url = `${API_BASE_URL}/queries/logs?page=0&size=10000`;
      if (selectedApiId) url += `&apiConfigId=${selectedApiId}`;
      if (fromDate) url += `&from=${fromDate}T00:00:00`;
      if (toDate) url += `&to=${toDate}T23:59:59`;
      if (successFilter) url += `&success=${successFilter === 'true'}`;

      const response = await get(url);
      if (response.ok) {
        const result = await response.json();
        const data = result.data?.content || [];
        const headers = [
          'id', 'createdAt', 'apiConfigCode', 'requestMethod', 'requestUrl',
          'responseStatusCode', 'executionTimeMs', 'success', 'errorMessage',
          'triggeredBy', 'operationType', 'correlationId'
        ];
        exportToCSV(data, 'external_api_logs', headers);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const exportTestResults = async () => {
    try {
      const response = await get(`${API_BASE_URL}/queries/test-results?page=0&size=10000`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data?.content || [];
        const headers = [
          'id', 'testedAt', 'apiConfigId', 'testType', 'success',
          'responseStatusCode', 'executionTimeMs', 'errorMessage', 'testedBy'
        ];
        exportToCSV(data, 'external_api_test_results', headers);
      }
    } catch (error) {
      console.error('Error exporting test results:', error);
    }
  };

  const exportConfigs = () => {
    const headers = [
      'id', 'code', 'name', 'httpMethod', 'baseUrl', 'path',
      'environment', 'active', 'totalCalls', 'successRate'
    ];
    const data = configs.map(c => ({
      ...c,
      totalCalls: c.metricsSummary?.totalCalls || 0,
      successRate: c.metricsSummary?.successRate?.toFixed(2) || '0'
    }));
    exportToCSV(data as unknown as Record<string, unknown>[], 'external_api_configs', headers);
  };

  // Summary stats from configs
  const summaryStats = {
    totalApis: configs.length,
    activeApis: configs.filter(c => c.active).length,
    totalCalls24h: configs.reduce((sum, c) => sum + (c.metricsSummary?.totalCalls || 0), 0),
    avgSuccessRate: configs.length > 0
      ? configs.reduce((sum, c) => sum + (c.metricsSummary?.successRate || 0), 0) / configs.length
      : 0,
  };

  // ---------- Column & Action definitions ----------

  // Logs columns
  const logsColumns: DataTableColumn<ApiCallLog>[] = [
    {
      key: 'createdAt',
      label: t('externalApiAudit.table.dateTime'),
      render: (row) => <Text whiteSpace="nowrap">{formatDateTime(row.createdAt)}</Text>,
    },
    {
      key: 'apiConfigCode',
      label: t('externalApiAudit.table.api'),
      render: (row) => <Text fontWeight="medium">{row.apiConfigCode}</Text>,
    },
    {
      key: 'requestMethod',
      label: t('externalApiAudit.table.method'),
      render: (row) => getMethodBadge(row.requestMethod),
    },
    {
      key: 'requestUrl',
      label: t('externalApiAudit.table.url'),
      render: (row) => (
        <Text truncate maxW="200px" title={row.requestUrl}>{row.requestUrl}</Text>
      ),
      hideOnMobile: true,
    },
    {
      key: 'success',
      label: t('externalApiAudit.table.status'),
      render: (row) => getStatusBadge(row.success, row.responseStatusCode),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('externalApiAudit.filters.successful') },
        { value: 'false', label: t('externalApiAudit.filters.failed') },
      ],
    },
    {
      key: 'executionTimeMs',
      label: t('externalApiAudit.table.time'),
      render: (row) => (
        <Badge colorPalette={row.executionTimeMs > 1000 ? 'orange' : 'gray'}>
          {row.executionTimeMs}ms
        </Badge>
      ),
    },
    {
      key: 'attemptNumber',
      label: t('externalApiAudit.table.attempt'),
      render: (row) => (
        row.attemptNumber > 1
          ? <Badge colorPalette="orange">#{row.attemptNumber}</Badge>
          : <Text>1</Text>
      ),
      hideOnMobile: true,
    },
    {
      key: 'triggeredBy',
      label: t('externalApiAudit.table.user'),
      render: (row) => <Text>{row.triggeredBy || '-'}</Text>,
      hideOnMobile: true,
    },
    {
      key: 'correlationId',
      label: t('externalApiAudit.table.correlationId'),
      render: (row) => (
        <Text fontSize="xs" fontFamily="mono" truncate maxW="120px" title={row.correlationId}>
          {row.correlationId?.slice(0, 8)}...
        </Text>
      ),
      hideOnMobile: true,
    },
  ];

  const logsActions: DataTableAction<ApiCallLog>[] = [
    {
      key: 'view',
      label: t('externalApiAudit.table.view'),
      icon: FiEye,
      colorPalette: 'blue',
      onClick: (row) => setSelectedLog(row),
    },
  ];

  // Test Results columns
  const testColumns: DataTableColumn<TestResult>[] = [
    {
      key: 'testedAt',
      label: t('externalApiAudit.table.dateTime'),
      render: (row) => <Text whiteSpace="nowrap">{formatDateTime(row.testedAt)}</Text>,
    },
    {
      key: 'apiConfigId',
      label: t('externalApiAudit.table.apiConfigId'),
    },
    {
      key: 'testType',
      label: t('externalApiAudit.table.testType'),
      render: (row) => <Badge colorPalette="purple">{row.testType}</Badge>,
    },
    {
      key: 'success',
      label: t('externalApiAudit.table.status'),
      render: (row) => getStatusBadge(row.success, row.responseStatusCode),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('externalApiAudit.filters.successful') },
        { value: 'false', label: t('externalApiAudit.filters.failed') },
      ],
    },
    {
      key: 'executionTimeMs',
      label: t('externalApiAudit.table.time'),
      render: (row) => (
        <Badge colorPalette={row.executionTimeMs > 1000 ? 'orange' : 'gray'}>
          {row.executionTimeMs}ms
        </Badge>
      ),
    },
    {
      key: 'testedBy',
      label: t('externalApiAudit.table.testedBy'),
      render: (row) => <Text>{row.testedBy || '-'}</Text>,
    },
    {
      key: 'errorMessage',
      label: t('externalApiAudit.table.error'),
      render: (row) => (
        row.errorMessage
          ? <Text color="red.500" fontSize="xs" truncate maxW="200px" title={row.errorMessage}>{row.errorMessage}</Text>
          : <Text>-</Text>
      ),
      hideOnMobile: true,
    },
  ];

  // Configs columns
  const configColumns: DataTableColumn<ApiConfig>[] = [
    {
      key: 'id',
      label: t('externalApiAudit.table.id'),
    },
    {
      key: 'code',
      label: t('externalApiAudit.table.code'),
      render: (row) => <Code>{row.code}</Code>,
    },
    {
      key: 'name',
      label: t('externalApiAudit.table.name'),
      render: (row) => <Text fontWeight="medium">{row.name}</Text>,
    },
    {
      key: 'httpMethod',
      label: t('externalApiAudit.table.method'),
      render: (row) => getMethodBadge(row.httpMethod),
    },
    {
      key: 'baseUrl',
      label: t('externalApiAudit.table.baseUrl'),
      render: (row) => <Text truncate maxW="200px" title={row.baseUrl}>{row.baseUrl}</Text>,
      hideOnMobile: true,
    },
    {
      key: 'path',
      label: t('externalApiAudit.table.path'),
      render: (row) => <Text truncate maxW="150px" title={row.path}>{row.path}</Text>,
      hideOnMobile: true,
    },
    {
      key: 'environment',
      label: t('externalApiAudit.table.environment'),
      render: (row) => (
        <Badge colorPalette={row.environment === 'PRODUCTION' ? 'red' : 'blue'}>
          {row.environment}
        </Badge>
      ),
      filterType: 'select',
      filterOptions: [
        { value: 'PRODUCTION', label: 'Production' },
        { value: 'STAGING', label: 'Staging' },
        { value: 'DEVELOPMENT', label: 'Development' },
      ],
    },
    {
      key: 'active',
      label: t('externalApiAudit.table.status'),
      render: (row) => (
        <Badge colorPalette={row.active ? 'green' : 'gray'}>
          {row.active ? t('externalApiAudit.status.active') : t('externalApiAudit.status.inactive')}
        </Badge>
      ),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('externalApiAudit.status.active') },
        { value: 'false', label: t('externalApiAudit.status.inactive') },
      ],
    },
    {
      key: 'metricsSummary',
      label: t('externalApiAudit.table.calls24h'),
      sortable: false,
      filterable: false,
      render: (row) => <Text>{row.metricsSummary?.totalCalls || 0}</Text>,
    },
    {
      key: 'successRate',
      label: t('externalApiAudit.table.successRate'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <Badge colorPalette={(row.metricsSummary?.successRate || 0) >= 90 ? 'green' : 'orange'}>
          {(row.metricsSummary?.successRate || 0).toFixed(1)}%
        </Badge>
      ),
    },
  ];

  // Daily Metrics columns
  const dailyMetricsColumns: DataTableColumn<DailyMetric>[] = [
    {
      key: 'date',
      label: t('externalApiAudit.metrics.date'),
    },
    {
      key: 'totalCalls',
      label: t('externalApiAudit.metrics.total'),
    },
    {
      key: 'successfulCalls',
      label: t('externalApiAudit.metrics.successful'),
      render: (row) => <Text color="green.500">{row.successfulCalls}</Text>,
    },
    {
      key: 'failedCalls',
      label: t('externalApiAudit.metrics.failed'),
      render: (row) => <Text color="red.500">{row.failedCalls}</Text>,
    },
    {
      key: 'successRate',
      label: t('externalApiAudit.metrics.successRate'),
      render: (row) => (
        <Badge colorPalette={row.successRate >= 90 ? 'green' : 'orange'}>
          {row.successRate.toFixed(1)}%
        </Badge>
      ),
    },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg">{t('externalApiAudit.title')}</Heading>
            <Text color="gray.500" mt={1}>
              {t('externalApiAudit.subtitle')}
            </Text>
          </Box>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button colorPalette="green" size="sm">
                <HStack gap={2}><FiDownload /><Text>{t('externalApiAudit.export.button')}</Text></HStack>
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="logs" onClick={exportLogs}>
                    {t('externalApiAudit.export.logs')}
                  </Menu.Item>
                  <Menu.Item value="tests" onClick={exportTestResults}>
                    {t('externalApiAudit.export.testResults')}
                  </Menu.Item>
                  <Menu.Item value="configs" onClick={exportConfigs}>
                    {t('externalApiAudit.export.configs')}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>

        {/* Summary Cards */}
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          <GridItem>
            <Card.Root>
              <Card.Body>
                <Stat.Root>
                  <Stat.Label>{t('externalApiAudit.summary.configuredApis')}</Stat.Label>
                  <Stat.ValueText>{summaryStats.totalApis}</Stat.ValueText>
                  <Stat.HelpText>{summaryStats.activeApis} {t('externalApiAudit.summary.active')}</Stat.HelpText>
                </Stat.Root>
              </Card.Body>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root>
              <Card.Body>
                <Stat.Root>
                  <Stat.Label>{t('externalApiAudit.summary.calls24h')}</Stat.Label>
                  <Stat.ValueText>{summaryStats.totalCalls24h}</Stat.ValueText>
                </Stat.Root>
              </Card.Body>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root>
              <Card.Body>
                <Stat.Root>
                  <Stat.Label>{t('externalApiAudit.summary.auditLogs')}</Stat.Label>
                  <Stat.ValueText>{logsTotalElements}</Stat.ValueText>
                </Stat.Root>
              </Card.Body>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root>
              <Card.Body>
                <Stat.Root>
                  <Stat.Label>{t('externalApiAudit.summary.avgSuccessRate')}</Stat.Label>
                  <Stat.ValueText>{summaryStats.avgSuccessRate.toFixed(1)}%</Stat.ValueText>
                </Stat.Root>
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
          <Tabs.List>
            <Tabs.Trigger value="logs">{t('externalApiAudit.tabs.callLogs')}</Tabs.Trigger>
            <Tabs.Trigger value="tests">{t('externalApiAudit.tabs.testResults')}</Tabs.Trigger>
            <Tabs.Trigger value="configs">{t('externalApiAudit.tabs.configurations')}</Tabs.Trigger>
            <Tabs.Trigger value="metrics">{t('externalApiAudit.tabs.metrics')}</Tabs.Trigger>
          </Tabs.List>

          {/* Logs Tab */}
          <Tabs.Content value="logs">
            <VStack align="stretch" gap={4} mt={4}>
              {/* Server-side Filters */}
              <Box bg="gray.50" p={4} borderRadius="md" _dark={{ bg: 'gray.800' }}>
                <HStack gap={4} flexWrap="wrap">
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">{t('externalApiAudit.filters.api')}</Text>
                    <select
                      value={selectedApiId}
                      onChange={(e) => setSelectedApiId(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        minWidth: '200px',
                      }}
                    >
                      <option value="">{t('externalApiAudit.filters.allApis')}</option>
                      {configs.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.name}
                        </option>
                      ))}
                    </select>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">{t('externalApiAudit.filters.from')}</Text>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      size="sm"
                      width="150px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">{t('externalApiAudit.filters.to')}</Text>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      size="sm"
                      width="150px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">{t('externalApiAudit.filters.status')}</Text>
                    <select
                      value={successFilter}
                      onChange={(e) => setSuccessFilter(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        minWidth: '120px',
                      }}
                    >
                      <option value="">{t('externalApiAudit.filters.all')}</option>
                      <option value="true">{t('externalApiAudit.filters.successful')}</option>
                      <option value="false">{t('externalApiAudit.filters.failed')}</option>
                    </select>
                  </Box>
                  <Box pt={6}>
                    <HStack gap={2}>
                      <Button colorPalette="blue" size="sm" onClick={handleSearch}>
                        {t('externalApiAudit.filters.search')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        {t('externalApiAudit.filters.clear')}
                      </Button>
                    </HStack>
                  </Box>
                </HStack>
              </Box>

              {/* Logs DataTable with server-side pagination */}
              <DataTable<ApiCallLog>
                data={logs}
                columns={logsColumns}
                rowKey={(row) => String(row.id)}
                actions={logsActions}
                isLoading={logsLoading}
                emptyMessage={t('externalApiAudit.empty.noLogs')}
                searchable={false}
                pagination="server"
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
                defaultPageSize={logsPageSize}
              />

              {/* Log Detail Modal */}
              {selectedLog && (
                <Box
                  position="fixed"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="blackAlpha.600"
                  zIndex="modal"
                  onClick={() => setSelectedLog(null)}
                >
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    bg="white"
                    _dark={{ bg: 'gray.800' }}
                    p={6}
                    borderRadius="lg"
                    maxW="800px"
                    w="90%"
                    maxH="80vh"
                    overflow="auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Flex justify="space-between" mb={4}>
                      <Heading size="md">{t('externalApiAudit.detail.title')}</Heading>
                      <Button size="sm" onClick={() => setSelectedLog(null)}>{t('externalApiAudit.detail.close')}</Button>
                    </Flex>
                    <VStack align="stretch" gap={4}>
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.api')}</Text>
                          <Text>{selectedLog.apiConfigCode}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.dateTime')}</Text>
                          <Text>{formatDateTime(selectedLog.createdAt)}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.method')}</Text>
                          {getMethodBadge(selectedLog.requestMethod)}
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.status')}</Text>
                          {getStatusBadge(selectedLog.success, selectedLog.responseStatusCode)}
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.executionTime')}</Text>
                          <Text>{selectedLog.executionTimeMs}ms</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.attemptNumber')}</Text>
                          <Text>{selectedLog.attemptNumber}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.user')}</Text>
                          <Text>{selectedLog.triggeredBy || '-'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.operationType')}</Text>
                          <Text>{selectedLog.operationType || '-'}</Text>
                        </Box>
                      </Grid>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.url')}</Text>
                        <Code p={2} borderRadius="md" display="block" overflowX="auto">
                          {selectedLog.requestUrl}
                        </Code>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.correlationId')}</Text>
                        <Code p={2} borderRadius="md" display="block">
                          {selectedLog.correlationId}
                        </Code>
                      </Box>
                      {selectedLog.requestHeadersJson && (
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.requestHeaders')}</Text>
                          <Code p={2} borderRadius="md" display="block" whiteSpace="pre" overflowX="auto">
                            {formatJson(selectedLog.requestHeadersJson)}
                          </Code>
                        </Box>
                      )}
                      {selectedLog.requestBody && (
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.requestBody')}</Text>
                          <Code p={2} borderRadius="md" display="block" whiteSpace="pre" overflowX="auto" maxH="200px">
                            {formatJson(selectedLog.requestBody)}
                          </Code>
                        </Box>
                      )}
                      {selectedLog.responseBody && (
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">{t('externalApiAudit.detail.responseBody')}</Text>
                          <Code p={2} borderRadius="md" display="block" whiteSpace="pre" overflowX="auto" maxH="200px">
                            {formatJson(selectedLog.responseBody)}
                          </Code>
                        </Box>
                      )}
                      {selectedLog.errorMessage && (
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="red.500">{t('externalApiAudit.detail.errorMessage')}</Text>
                          <Code p={2} borderRadius="md" display="block" colorPalette="red">
                            {selectedLog.errorMessage}
                          </Code>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                </Box>
              )}
            </VStack>
          </Tabs.Content>

          {/* Test Results Tab */}
          <Tabs.Content value="tests">
            <Box mt={4}>
              <DataTable<TestResult>
                data={testResults}
                columns={testColumns}
                rowKey={(row) => String(row.id)}
                isLoading={testsLoading}
                emptyMessage={t('externalApiAudit.empty.noTestResults')}
                defaultPageSize={20}
              />
            </Box>
          </Tabs.Content>

          {/* Configs Tab */}
          <Tabs.Content value="configs">
            <Box mt={4}>
              <DataTable<ApiConfig>
                data={configs}
                columns={configColumns}
                rowKey={(row) => String(row.id)}
                isLoading={configsLoading}
                emptyMessage={t('externalApiAudit.empty.noConfigs')}
                defaultPageSize={20}
              />
            </Box>
          </Tabs.Content>

          {/* Metrics Tab */}
          <Tabs.Content value="metrics">
            <VStack align="stretch" gap={4} mt={4}>
              <HStack gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} fontWeight="medium">{t('externalApiAudit.metrics.selectApi')}</Text>
                  <select
                    value={selectedMetricsApi || ''}
                    onChange={(e) => setSelectedMetricsApi(Number(e.target.value) || null)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      minWidth: '250px',
                    }}
                  >
                    <option value="">-- {t('externalApiAudit.metrics.selectApiPlaceholder')} --</option>
                    {configs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} fontWeight="medium">{t('externalApiAudit.metrics.period')}</Text>
                  <select
                    value={metricsPeriod}
                    onChange={(e) => setMetricsPeriod(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      minWidth: '150px',
                    }}
                  >
                    <option value="24H">{t('externalApiAudit.metrics.last24h')}</option>
                    <option value="7D">{t('externalApiAudit.metrics.last7d')}</option>
                    <option value="30D">{t('externalApiAudit.metrics.last30d')}</option>
                    <option value="90D">{t('externalApiAudit.metrics.last90d')}</option>
                  </select>
                </Box>
              </HStack>

              {!selectedMetricsApi ? (
                <Box textAlign="center" py={10} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.800' }}>
                  <Text color="gray.500">{t('externalApiAudit.empty.selectApi')}</Text>
                </Box>
              ) : metricsLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" />
                </Flex>
              ) : metrics ? (
                <VStack align="stretch" gap={4}>
                  {/* Metrics Summary Cards */}
                  <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    <GridItem>
                      <Card.Root>
                        <Card.Body>
                          <Stat.Root>
                            <Stat.Label>{t('externalApiAudit.metrics.totalCalls')}</Stat.Label>
                            <Stat.ValueText>{metrics.summary.totalCalls}</Stat.ValueText>
                          </Stat.Root>
                        </Card.Body>
                      </Card.Root>
                    </GridItem>
                    <GridItem>
                      <Card.Root>
                        <Card.Body>
                          <Stat.Root>
                            <Stat.Label>{t('externalApiAudit.metrics.successful')}</Stat.Label>
                            <Stat.ValueText color="green.500">{metrics.summary.successfulCalls}</Stat.ValueText>
                          </Stat.Root>
                        </Card.Body>
                      </Card.Root>
                    </GridItem>
                    <GridItem>
                      <Card.Root>
                        <Card.Body>
                          <Stat.Root>
                            <Stat.Label>{t('externalApiAudit.metrics.failed')}</Stat.Label>
                            <Stat.ValueText color="red.500">{metrics.summary.failedCalls}</Stat.ValueText>
                          </Stat.Root>
                        </Card.Body>
                      </Card.Root>
                    </GridItem>
                    <GridItem>
                      <Card.Root>
                        <Card.Body>
                          <Stat.Root>
                            <Stat.Label>{t('externalApiAudit.metrics.successRate')}</Stat.Label>
                            <Stat.ValueText>{metrics.summary.successRate.toFixed(1)}%</Stat.ValueText>
                          </Stat.Root>
                        </Card.Body>
                      </Card.Root>
                    </GridItem>
                  </Grid>

                  {/* Daily Metrics DataTable */}
                  {metrics.dailyMetrics && metrics.dailyMetrics.length > 0 && (
                    <Box>
                      <Heading size="sm" mb={3}>{t('externalApiAudit.metrics.dailyMetrics')}</Heading>
                      <DataTable<DailyMetric>
                        data={metrics.dailyMetrics}
                        columns={dailyMetricsColumns}
                        rowKey={(row) => row.date}
                        searchable={false}
                        pagination="none"
                      />
                    </Box>
                  )}
                </VStack>
              ) : (
                <Box textAlign="center" py={10} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.800' }}>
                  <Text color="gray.500">{t('externalApiAudit.empty.noMetrics')}</Text>
                </Box>
              )}
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Box>
  );
};

export default ExternalApiAudit;
