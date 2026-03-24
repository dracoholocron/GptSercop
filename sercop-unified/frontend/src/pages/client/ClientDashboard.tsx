import { Box, Heading, Text, SimpleGrid, Card, Stat, Icon, VStack, HStack, Badge, Skeleton } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCorporationOptional } from '../../contexts/CorporationContext';
import { FiHome, FiFileText, FiBriefcase, FiClock, FiCheckCircle, FiAlertCircle, FiMail, FiPhone, FiMapPin, FiUser, FiLayers, FiGrid } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import clientPortalService from '../../services/clientPortalService';
import type { ClientCompanyInfo } from '../../services/clientPortalTypes';
import CompanySwitcher from '../../components/CompanySwitcher';

interface DashboardStats {
  pendingRequests: number;
  activeOperations: number;
  completedThisMonth: number;
  pendingDocuments: number;
}

export const ClientDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const corporation = useCorporationOptional();
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    activeOperations: 0,
    completedThisMonth: 0,
    pendingDocuments: 0,
  });
  const [companyInfo, setCompanyInfo] = useState<ClientCompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(true);

  // Color values for the UI
  const subtleTextColor = 'gray.600';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [activeOps, pendingReqs] = await Promise.all([
          clientPortalService.getActiveOperationsCount(),
          clientPortalService.getPendingRequestsCount(),
        ]);
        setStats({
          pendingRequests: pendingReqs.count,
          activeOperations: activeOps.count,
          completedThisMonth: 0,
          pendingDocuments: 0,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        setCompanyLoading(true);
        const info = await clientPortalService.getMyCompany();
        setCompanyInfo(info);
      } catch (error) {
        console.error('Error loading company info:', error);
      } finally {
        setCompanyLoading(false);
      }
    };
    loadCompanyInfo();
  }, []);

  const getHierarchyIcon = (hierarchyType?: string) => {
    switch (hierarchyType) {
      case 'CORPORATION':
        return FiLayers;
      case 'BRANCH':
        return FiGrid;
      default:
        return FiBriefcase;
    }
  };

  const getHierarchyLabel = (hierarchyType?: string) => {
    switch (hierarchyType) {
      case 'CORPORATION':
        return t('clientPortal.hierarchy.corporation', 'Corporation');
      case 'BRANCH':
        return t('clientPortal.hierarchy.branch', 'Branch');
      default:
        return t('clientPortal.hierarchy.company', 'Company');
    }
  };

  const getHierarchyColor = (hierarchyType?: string) => {
    switch (hierarchyType) {
      case 'CORPORATION':
        return 'purple';
      case 'BRANCH':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const statCards = [
    {
      label: t('clientPortal.dashboard.pendingRequests', 'Pending Requests'),
      value: stats.pendingRequests,
      icon: FiClock,
      color: 'orange.500',
    },
    {
      label: t('clientPortal.dashboard.activeOperations', 'Active Operations'),
      value: stats.activeOperations,
      icon: FiBriefcase,
      color: 'blue.500',
    },
    {
      label: t('clientPortal.dashboard.completedThisMonth', 'Completed This Month'),
      value: stats.completedThisMonth,
      icon: FiCheckCircle,
      color: 'green.500',
    },
    {
      label: t('clientPortal.dashboard.pendingDocuments', 'Pending Documents'),
      value: stats.pendingDocuments,
      icon: FiAlertCircle,
      color: 'red.500',
    },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Company/Corporation Header Card */}
        <Card.Root borderWidth="1px">
          <Card.Body>
            {companyLoading ? (
              <HStack gap={4}>
                <Skeleton boxSize="60px" borderRadius="lg" />
                <VStack align="start" gap={2} flex={1}>
                  <Skeleton height="24px" width="200px" />
                  <Skeleton height="16px" width="150px" />
                </VStack>
              </HStack>
            ) : companyInfo ? (
              <HStack gap={4} align="start" flexWrap="wrap">
                <Box p={3} borderRadius="lg" bg={`${getHierarchyColor(companyInfo.hierarchyType)}.100`}>
                  <Icon
                    as={getHierarchyIcon(companyInfo.hierarchyType)}
                    boxSize={8}
                    color={`${getHierarchyColor(companyInfo.hierarchyType)}.600`}
                  />
                </Box>
                <VStack align="start" gap={1} flex={1} minW="200px">
                  <HStack>
                    <Heading size="md">{companyInfo.nombres} {companyInfo.apellidos || ''}</Heading>
                    <Badge colorScheme={getHierarchyColor(companyInfo.hierarchyType)}>
                      {getHierarchyLabel(companyInfo.hierarchyType)}
                    </Badge>
                  </HStack>
                  <Text color={subtleTextColor} fontSize="sm">
                    {companyInfo.identificacion} {companyInfo.tipoReferencia ? `(${companyInfo.tipoReferencia})` : ''}
                  </Text>
                  <HStack gap={4} flexWrap="wrap" mt={2}>
                    {companyInfo.email && (
                      <HStack fontSize="sm" color={subtleTextColor}>
                        <Icon as={FiMail} />
                        <Text>{companyInfo.email}</Text>
                      </HStack>
                    )}
                    {companyInfo.telefono && (
                      <HStack fontSize="sm" color={subtleTextColor}>
                        <Icon as={FiPhone} />
                        <Text>{companyInfo.telefono}</Text>
                      </HStack>
                    )}
                    {companyInfo.direccion && (
                      <HStack fontSize="sm" color={subtleTextColor}>
                        <Icon as={FiMapPin} />
                        <Text noOfLines={1}>{companyInfo.direccion}</Text>
                      </HStack>
                    )}
                  </HStack>
                  {companyInfo.ejecutivoAsignado && (
                    <HStack mt={2} fontSize="sm">
                      <Icon as={FiUser} color="blue.500" />
                      <Text color={subtleTextColor}>
                        {t('clientPortal.assignedExecutive', 'Account Executive')}:
                      </Text>
                      <Text fontWeight="medium">{companyInfo.ejecutivoAsignado}</Text>
                      {companyInfo.correoEjecutivo && (
                        <Text color={subtleTextColor}>({companyInfo.correoEjecutivo})</Text>
                      )}
                    </HStack>
                  )}
                </VStack>

                {/* Company Switcher for corporation users */}
                {corporation?.hasMultipleCompanies && (
                  <Box minW="250px">
                    <Text fontSize="sm" fontWeight="medium" mb={2} color={subtleTextColor}>
                      {t('clientPortal.switchCompany', 'Switch Company')}
                    </Text>
                    <CompanySwitcher variant="default" />
                  </Box>
                )}
              </HStack>
            ) : (
              <Text color={subtleTextColor}>
                {t('clientPortal.noCompanyInfo', 'Company information not available')}
              </Text>
            )}
          </Card.Body>
        </Card.Root>

        {/* Welcome message */}
        <Box>
          <Heading size="lg" mb={2}>
            {t('clientPortal.dashboard.welcome', 'Welcome')}, {user?.name || user?.username}
          </Heading>
          <Text color={subtleTextColor}>
            {t('clientPortal.dashboard.subtitle', 'Manage your trade finance operations')}
            {corporation?.selectedCompany && (
              <Text as="span" fontWeight="medium" color="blue.500">
                {' - '}{corporation.selectedCompany.displayName}
              </Text>
            )}
            {corporation?.isViewingAllCompanies() && (
              <Text as="span" fontWeight="medium" color="purple.500">
                {' - '}{t('clientPortal.viewingAllCompanies', 'Viewing all companies')}
              </Text>
            )}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
          {statCards.map((stat, index) => (
            <Card.Root key={index}>
              <Card.Body>
                <Stat.Root>
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Stat.Label color="gray.500">{stat.label}</Stat.Label>
                      <Stat.ValueText fontSize="3xl" fontWeight="bold">
                        {loading ? '...' : stat.value}
                      </Stat.ValueText>
                    </VStack>
                    <Box p={3} borderRadius="full" bg={`${stat.color}20`}>
                      <Icon as={stat.icon} boxSize={6} color={stat.color} />
                    </Box>
                  </HStack>
                </Stat.Root>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          <Card.Root>
            <Card.Header>
              <HStack>
                <Icon as={FiFileText} />
                <Heading size="md">{t('clientPortal.dashboard.recentRequests', 'Recent Requests')}</Heading>
              </HStack>
            </Card.Header>
            <Card.Body>
              <Text color="gray.500">
                {t('clientPortal.dashboard.noRecentRequests', 'No recent requests')}
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <HStack>
                <Icon as={FiBriefcase} />
                <Heading size="md">{t('clientPortal.dashboard.recentOperations', 'Recent Operations')}</Heading>
              </HStack>
            </Card.Header>
            <Card.Body>
              <Text color="gray.500">
                {t('clientPortal.dashboard.noRecentOperations', 'No recent operations')}
              </Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ClientDashboard;
