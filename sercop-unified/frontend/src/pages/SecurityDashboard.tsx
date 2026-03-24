import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  Badge,
  HStack,
  Button,
  NativeSelect,
} from '@chakra-ui/react';
import {
  FiShield,
  FiAlertTriangle,
  FiRefreshCw,
  FiDownload,
  FiLock,
  FiUserX,
  FiAlertCircle,
  FiEye,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY } from '../config/api.config';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

interface AuditEvent {
  id: number;
  eventType: string;
  severity: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  success: boolean;
  failureReason: string | null;
  details: string | null;
  timestamp: string;
}

interface AuditStatistics {
  totalEvents: number;
  failedLogins: number;
  permissionDenials: number;
  criticalEvents: number;
  byEventType: Record<string, number>;
  periodDays: number;
}

const SecurityDashboard: React.FC = () => {
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [criticalEvents, setCriticalEvents] = useState<AuditEvent[]>([]);
  const [periodDays, setPeriodDays] = useState(30);

  // Dark mode aware colors
  const itemBg = darkMode ? 'gray.700' : 'gray.50';
  const cardItemBg = darkMode ? 'gray.600' : 'white';
  const redCardBg = darkMode ? 'red.900' : 'red.50';
  const redCardBorder = darkMode ? 'red.700' : 'red.200';
  const orangeCardBg = darkMode ? 'orange.900' : 'orange.50';
  const orangeCardBorder = darkMode ? 'orange.700' : 'orange.200';
  const purpleCardBg = darkMode ? 'purple.900' : 'purple.50';
  const purpleCardBorder = darkMode ? 'purple.700' : 'purple.200';

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, eventsRes, criticalRes] = await Promise.all([
        fetch(`${API_BASE_URL_WITH_PREFIX}/admin/audit/statistics?days=${periodDays}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL_WITH_PREFIX}/admin/audit?page=0&size=50`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL_WITH_PREFIX}/admin/audit/critical?hours=24`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData.data);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setRecentEvents(eventsData.data?.content || []);
      }

      if (criticalRes.ok) {
        const criticalData = await criticalRes.json();
        setCriticalEvents(criticalData.data || []);
      }
    } catch (err) {
      console.error('Error fetching security data:', err);
      setError('Error loading security dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodDays]);

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_PREFIX}/admin/audit/export`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security_audit_${new Date().toISOString()}.csv`;
        a.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'blue';
      default: return 'gray';
    }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  // DataTable columns definition
  const columns: DataTableColumn<AuditEvent>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (row) => (
        <Text fontSize="xs" color={colors.textColorSecondary}>
          {formatTimestamp(row.timestamp)}
        </Text>
      ),
    },
    {
      key: 'eventType',
      label: 'Event',
      filterType: 'select',
      filterOptions: [
        { value: 'LOGIN_SUCCESS', label: 'Login Success' },
        { value: 'LOGIN_FAILURE', label: 'Login Failure' },
        { value: 'SSO_LOGIN_SUCCESS', label: 'SSO Success' },
        { value: 'SSO_LOGIN_FAILURE', label: 'SSO Failure' },
        { value: 'LOGOUT', label: 'Logout' },
        { value: 'PERMISSION_DENIED', label: 'Permission Denied' },
        { value: 'USER_CREATED', label: 'User Created' },
      ],
      render: (row) => (
        <Text fontSize="sm" color={colors.textColor}>
          {row.eventType.replace(/_/g, ' ')}
        </Text>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      filterType: 'select',
      filterOptions: [
        { value: 'CRITICAL', label: 'Critical' },
        { value: 'HIGH', label: 'High' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'LOW', label: 'Low' },
      ],
      render: (row) => (
        <Badge colorPalette={getSeverityColor(row.severity)} size="sm">
          {row.severity}
        </Badge>
      ),
    },
    {
      key: 'username',
      label: 'User',
      render: (row) => (
        <Text fontWeight="medium" color={colors.textColor}>
          {row.username || '-'}
        </Text>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="sm" color={colors.textColorSecondary}>
          {row.ipAddress}
        </Text>
      ),
    },
    {
      key: 'success',
      label: 'Status',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Success' },
        { value: 'false', label: 'Failed' },
      ],
      render: (row) => (
        row.success ? (
          <Badge colorPalette="green">Success</Badge>
        ) : (
          <Badge colorPalette="red">Failed</Badge>
        )
      ),
    },
    {
      key: 'failureReason',
      label: 'Details',
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="xs" color={colors.textColorSecondary} maxW="200px">
          {row.failureReason || row.action || '-'}
        </Text>
      ),
    },
  ];

  // DataTable actions definition
  const actions: DataTableAction<AuditEvent>[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: FiEye,
      colorPalette: 'blue',
      onClick: (row) => {
        console.log('View event details:', row);
      },
    },
  ];

  if (error && !loading && recentEvents.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={20} color="red.500">
          <Box mb={4} display="flex" justifyContent="center">
            <FiAlertTriangle size={48} />
          </Box>
          <Text fontSize="xl">{error}</Text>
          <Button mt={4} onClick={fetchData}>Retry</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={4}>
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <FiShield size={24} />
              <Heading size="lg">Security Dashboard</Heading>
            </Box>
            <Text color={colors.textColorSecondary}>
              Monitor authentication, SSO, and security events
            </Text>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <NativeSelect.Root size="sm" width="150px">
              <NativeSelect.Field
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Button onClick={fetchData} variant="outline" size="sm">
              <HStack gap={2}>
                <FiRefreshCw size={14} />
                <span>Refresh</span>
              </HStack>
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <Card.Root bg={colors.cardBg} borderColor={colors.borderColor} borderWidth="1px">
            <Card.Body>
              <Text fontSize="sm" color={colors.textColorSecondary} mb={1}>Total Events</Text>
              <Text fontSize="3xl" fontWeight="bold" color={colors.textColor}>{statistics?.totalEvents?.toLocaleString() || 0}</Text>
              <Text fontSize="xs" color={colors.textColorSecondary}>Last {periodDays} days</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={redCardBg} borderColor={redCardBorder} borderWidth={1}>
            <Card.Body>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <FiUserX color={darkMode ? '#FC8181' : '#C53030'} />
                <Text fontSize="sm" color={darkMode ? 'red.200' : 'red.700'}>Failed Logins</Text>
              </Box>
              <Text fontSize="3xl" fontWeight="bold" color={darkMode ? 'red.300' : 'red.600'}>
                {statistics?.failedLogins?.toLocaleString() || 0}
              </Text>
              <Text fontSize="xs" color={darkMode ? 'red.300' : 'red.500'}>
                {statistics?.totalEvents
                  ? `${((statistics.failedLogins / statistics.totalEvents) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={orangeCardBg} borderColor={orangeCardBorder} borderWidth={1}>
            <Card.Body>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <FiLock color={darkMode ? '#FBD38D' : '#C05621'} />
                <Text fontSize="sm" color={darkMode ? 'orange.200' : 'orange.700'}>Permission Denials</Text>
              </Box>
              <Text fontSize="3xl" fontWeight="bold" color={darkMode ? 'orange.300' : 'orange.600'}>
                {statistics?.permissionDenials?.toLocaleString() || 0}
              </Text>
              <Text fontSize="xs" color={darkMode ? 'orange.300' : 'orange.500'}>Access attempts blocked</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={purpleCardBg} borderColor={purpleCardBorder} borderWidth={1}>
            <Card.Body>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <FiAlertTriangle color={darkMode ? '#D6BCFA' : '#6B46C1'} />
                <Text fontSize="sm" color={darkMode ? 'purple.200' : 'purple.700'}>Critical Events</Text>
              </Box>
              <Text fontSize="3xl" fontWeight="bold" color={darkMode ? 'purple.300' : 'purple.600'}>
                {statistics?.criticalEvents?.toLocaleString() || 0}
              </Text>
              <Text fontSize="xs" color={darkMode ? 'purple.300' : 'purple.500'}>Requires attention</Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Critical Alerts */}
        {criticalEvents.length > 0 && (
          <Card.Root borderColor={darkMode ? 'red.600' : 'red.300'} borderWidth={2} bg={redCardBg}>
            <Card.Header>
              <Box display="flex" alignItems="center" gap={2}>
                <FiAlertCircle color={darkMode ? '#FC8181' : '#C53030'} size={24} />
                <Heading size="md" color={darkMode ? 'red.200' : 'red.700'}>
                  Critical Security Alerts (Last 24h)
                </Heading>
                <Badge colorPalette="red" fontSize="lg">{criticalEvents.length}</Badge>
              </Box>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                {criticalEvents.slice(0, 5).map((event) => (
                  <Box
                    key={event.id}
                    p={3}
                    bg={cardItemBg}
                    borderRadius="md"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <FiAlertCircle color={darkMode ? '#FC8181' : '#C53030'} />
                      <Text fontWeight="bold" color={colors.textColor}>{event.eventType.replace(/_/g, ' ')}</Text>
                      <Text color={colors.textColorSecondary}>by {event.username || 'Unknown'}</Text>
                    </Box>
                    <Box display="flex" alignItems="center" gap={4}>
                      <Text fontSize="sm" color={colors.textColorSecondary}>{event.ipAddress}</Text>
                      <Text fontSize="sm" color={colors.textColorSecondary}>
                        {formatTimestamp(event.timestamp)}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Event Types Breakdown */}
        {statistics?.byEventType && Object.keys(statistics.byEventType).length > 0 && (
          <Card.Root bg={colors.cardBg} borderColor={colors.borderColor} borderWidth="1px">
            <Card.Header>
              <Heading size="md">Events by Type</Heading>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={4}>
                {Object.entries(statistics.byEventType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <Box
                      key={type}
                      p={3}
                      bg={itemBg}
                      borderRadius="md"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <FiShield color={darkMode ? '#63B3ED' : '#3182CE'} />
                        <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                          {type.replace(/_/g, ' ')}
                        </Text>
                      </Box>
                      <Badge colorPalette="blue">{count}</Badge>
                    </Box>
                  ))}
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        )}

        {/* Recent Events Table - using DataTable */}
        <DataTable<AuditEvent>
          data={recentEvents}
          columns={columns}
          rowKey={(row) => String(row.id)}
          actions={actions}
          isLoading={loading}
          emptyMessage="No security events found"
          emptyIcon={FiShield}
          defaultPageSize={20}
          searchPlaceholder="Search by user, IP, action..."
          toolbarRight={
            <HStack gap={2}>
              <Button onClick={handleExport} colorPalette="blue" size="sm" disabled={loading}>
                <HStack gap={2}>
                  <FiDownload size={14} />
                  <Text>Export</Text>
                </HStack>
              </Button>
            </HStack>
          }
        />
      </VStack>
    </Container>
  );
};

export default SecurityDashboard;
