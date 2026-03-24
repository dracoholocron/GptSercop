/**
 * CP Dashboard - Panel principal de Compras Públicas
 * Muestra resumen de procesos, PAA, presupuesto, riesgos y accesos rápidos
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Card,
  Grid,
  Table,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
  FiArrowRight,
  FiPlus,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
} from 'react-icons/fi';
import { LuScale, LuBrain } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { listProcesses, getStatusColor, getStatusLabel, type CPProcessData } from '../../services/cpProcessService';
import { listPAAs, formatCurrency, getPAAStatusColor, type CPPAA } from '../../services/cpPAAService';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: IconComp, color, onClick }) => {
  const { isDark } = useTheme();
  return (
    <Card.Root
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { shadow: 'md', transform: 'translateY(-2px)' } : undefined}
      transition="all 0.2s"
    >
      <Card.Body p={4}>
        <HStack justify="space-between">
          <VStack align="start" gap={0}>
            <Text fontSize="xs" fontWeight="600" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase">
              {label}
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
          </VStack>
          <Flex
            w={12}
            h={12}
            borderRadius="xl"
            bg={`${color}.${isDark ? '900' : '100'}`}
            color={`${color}.${isDark ? '300' : '600'}`}
            align="center"
            justify="center"
          >
            <Icon as={IconComp} boxSize={6} />
          </Flex>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
};

export const CPDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  const [processes, setProcesses] = useState<CPProcessData[]>([]);
  const [paas, setPaas] = useState<CPPAA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [procResult, paaResult] = await Promise.allSettled([
        listProcesses('EC', undefined, undefined, undefined, 0, 10),
        listPAAs('EC', new Date().getFullYear()),
      ]);

      if (procResult.status === 'fulfilled') setProcesses(procResult.value.content || []);
      if (paaResult.status === 'fulfilled') setPaas(paaResult.value || []);
    } catch {
      // Silently handle - dashboard shows empty state
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const accentGradient = isDark
    ? 'linear(to-r, blue.600, purple.600)'
    : 'linear(to-r, blue.500, purple.500)';

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text>{t('common.loading', 'Cargando...')}</Text>
        </VStack>
      </Flex>
    );
  }

  const processStats = {
    total: processes.length,
    draft: processes.filter(p => p.status === 'BORRADOR').length,
    active: processes.filter(p => ['EN_REVISION', 'APROBADO', 'PUBLICADO'].includes(p.status)).length,
    completed: processes.filter(p => p.status === 'FINALIZADO').length,
  };

  const totalPAABudget = paas.reduce((sum, p) => sum + (p.totalBudget || 0), 0);

  // Quick access modules
  const modules = [
    { label: 'PAA', description: 'Plan Anual de Adquisiciones', icon: FiCalendar, color: 'blue', path: '/cp/paa' },
    { label: 'Procesos', description: 'Gestión de procesos', icon: FiFileText, color: 'purple', path: '/cp/processes' },
    { label: 'Presupuesto', description: 'Certificaciones presupuestarias', icon: FiDollarSign, color: 'green', path: '/cp/budget' },
    { label: 'Mercado', description: 'Estudio de mercado y RFI', icon: FiTrendingUp, color: 'teal', path: '/cp/market' },
    { label: 'Riesgos', description: 'Matriz de riesgos', icon: FiShield, color: 'orange', path: '/cp/risk' },
    { label: 'IA', description: 'Asistente de IA', icon: LuBrain, color: 'pink', path: '/cp/ai-assistant' },
  ];

  return (
    <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box bgGradient={accentGradient} h="4px" />
          <Box p={6}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <VStack align="start" gap={1}>
                <HStack>
                  <Icon as={LuScale} boxSize={6} color={colors.primaryColor} />
                  <Heading size="lg">Compras Públicas Ecuador</Heading>
                </HStack>
                <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                  Panel de control - Sistema Nacional de Contratación Pública
                </Text>
              </VStack>
              <HStack gap={2}>
                <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => navigate('/cp/paa')}>
                  Nuevo PAA
                </Button>
                <Button size="sm" variant="outline" leftIcon={<FiFileText />} onClick={() => navigate('/cp/processes')}>
                  Nuevo Proceso
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <StatCard label="Procesos" value={processStats.total} icon={FiFileText} color="purple" />
          <StatCard label="Activos" value={processStats.active} icon={FiClock} color="blue" />
          <StatCard label="PAAs" value={paas.length} icon={FiCalendar} color="teal" />
          <StatCard label="Presupuesto PAA" value={formatCurrency(totalPAABudget)} icon={FiDollarSign} color="green" />
        </SimpleGrid>

        {/* Quick Access Modules */}
        <Box>
          <Heading size="md" mb={4}>Módulos</Heading>
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap={3}>
            {modules.map((mod) => (
              <Card.Root
                key={mod.label}
                cursor="pointer"
                onClick={() => navigate(mod.path)}
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <Card.Body p={4} textAlign="center">
                  <Flex
                    w={10}
                    h={10}
                    borderRadius="xl"
                    bg={`${mod.color}.${isDark ? '900' : '100'}`}
                    color={`${mod.color}.${isDark ? '300' : '600'}`}
                    align="center"
                    justify="center"
                    mx="auto"
                    mb={2}
                  >
                    <Icon as={mod.icon} boxSize={5} />
                  </Flex>
                  <Text fontWeight="bold" fontSize="sm">{mod.label}</Text>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{mod.description}</Text>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        </Box>

        {/* Recent Processes */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box px={5} py={4} borderBottomWidth="1px" borderColor={cardBorder}>
            <Flex justify="space-between" align="center">
              <Heading size="sm">Procesos Recientes</Heading>
              <Button size="xs" variant="ghost" rightIcon={<FiArrowRight />} onClick={() => navigate('/cp/processes')}>
                Ver todos
              </Button>
            </Flex>
          </Box>
          <Box overflowX="auto">
            {processes.length === 0 ? (
              <Box p={8} textAlign="center">
                <Icon as={FiFileText} boxSize={8} color="gray.400" mb={2} />
                <Text color={isDark ? 'gray.400' : 'gray.500'}>No hay procesos aún</Text>
              </Box>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Código</Table.ColumnHeader>
                    <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                    <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                    <Table.ColumnHeader>Estado</Table.ColumnHeader>
                    <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {processes.slice(0, 5).map((proc) => (
                    <Table.Row
                      key={proc.id}
                      cursor="pointer"
                      _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                      onClick={() => navigate(`/cp/process/${proc.processId}`)}
                    >
                      <Table.Cell fontWeight="medium" fontSize="sm">{proc.processCode || '-'}</Table.Cell>
                      <Table.Cell fontSize="sm">{proc.processType}</Table.Cell>
                      <Table.Cell fontSize="sm">{proc.entityName || '-'}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getStatusColor(proc.status)} size="sm">{getStatusLabel(proc.status)}</Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                        {proc.createdAt ? new Date(proc.createdAt).toLocaleDateString('es-EC') : '-'}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </Box>

        {/* PAA Summary */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box px={5} py={4} borderBottomWidth="1px" borderColor={cardBorder}>
            <Flex justify="space-between" align="center">
              <Heading size="sm">Plan Anual de Adquisiciones {new Date().getFullYear()}</Heading>
              <Button size="xs" variant="ghost" rightIcon={<FiArrowRight />} onClick={() => navigate('/cp/paa')}>
                Ver PAA
              </Button>
            </Flex>
          </Box>
          <Box overflowX="auto">
            {paas.length === 0 ? (
              <Box p={8} textAlign="center">
                <Icon as={FiCalendar} boxSize={8} color="gray.400" mb={2} />
                <Text color={isDark ? 'gray.400' : 'gray.500'}>No hay PAA para este año</Text>
              </Box>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                    <Table.ColumnHeader>RUC</Table.ColumnHeader>
                    <Table.ColumnHeader>Versión</Table.ColumnHeader>
                    <Table.ColumnHeader>Estado</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Presupuesto</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paas.map((paa) => (
                    <Table.Row
                      key={paa.id}
                      cursor="pointer"
                      _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                      onClick={() => navigate(`/cp/paa/${paa.id}`)}
                    >
                      <Table.Cell fontWeight="medium" fontSize="sm">{paa.entityName}</Table.Cell>
                      <Table.Cell fontSize="sm">{paa.entityRuc}</Table.Cell>
                      <Table.Cell><Badge size="sm">v{paa.version}</Badge></Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getPAAStatusColor(paa.status)} size="sm">{paa.status}</Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontSize="sm" fontWeight="medium">
                        {formatCurrency(paa.totalBudget || 0)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default CPDashboardPage;
