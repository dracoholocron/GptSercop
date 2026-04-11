import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, SimpleGrid, Text, Spinner, Badge, Card, Button, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { getDashboard, type DashboardData } from '../../services/analyticsService';

const KPICard = ({
  label, value, subtitle, color, onClick,
}: {
  label: string;
  value?: string | number;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
}) => (
  <Card.Root
    onClick={onClick}
    cursor={onClick ? 'pointer' : undefined}
    _hover={onClick ? { borderColor: 'colorPalette.500', shadow: 'md' } : undefined}
    transition="box-shadow 0.15s, border-color 0.15s"
  >
    <Card.Body>
      <Text fontSize="sm" color="fg.muted">{label}</Text>
      {subtitle && (
        <Text fontSize="xs" color="fg.subtle" mt={0.5} mb={1}>
          {subtitle}
        </Text>
      )}
      {value !== undefined && (
        <Text fontSize="2xl" fontWeight="bold" color={color}>{value}</Text>
      )}
      {onClick && <Text fontSize="xs" color="fg.subtle" mt={1}>Ver detalle →</Text>}
    </Card.Body>
  </Card.Root>
);

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (error) return <Box p={8}><Text color="red.500">Error: {error}</Text></Box>;
  if (!data) return null;

  const navItems = [
    { label: 'Scores de Riesgo', path: '/analytics/risk-scores', color: 'red' },
    { label: 'Competencia', path: '/analytics/competition', color: 'blue' },
    { label: 'Mercado', path: '/analytics/market', color: 'green' },
    { label: 'PAC vs Ejecutado', path: '/analytics/pac', color: 'orange' },
    { label: 'Alertas', path: '/analytics/alerts', color: 'yellow' },
    { label: 'Red de Proveedores', path: '/analytics/provider-network', color: 'purple' },
    { label: 'Reputación Proveedores', path: '/analytics/provider-scores', color: 'teal' },
    { label: 'Índice de Precios', path: '/analytics/price-index', color: 'cyan' },
    { label: 'Salud Contractual', path: '/analytics/contracts', color: 'pink' },
    { label: 'Fragmentación', path: '/analytics/fragmentation', color: 'gray' },
  ];

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Dashboard Analítico</Heading>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={8}>
        <KPICard label="Total Procesos" value={data.totalTenders} onClick={() => navigate('/analytics/risk-scores')} />
        <KPICard label="Contratos" value={data.totalContracts} onClick={() => navigate('/analytics/contracts')} />
        <KPICard label="Proveedores" value={data.totalProviders} onClick={() => navigate('/analytics/provider-scores')} />
        <KPICard label="Entidades" value={data.totalEntities} onClick={() => navigate('/analytics/competition')} />
        <KPICard label="Monto Total Contratos" value={`$${(data.totalContractAmount / 1000000).toFixed(1)}M`} onClick={() => navigate('/analytics/market')} />
        <KPICard label="Promedio Oferentes" value={data.avgBidders} onClick={() => navigate('/analytics/competition')} />
        <KPICard label="Alertas Abiertas" value={data.openAlerts} color={data.openAlerts > 0 ? 'red.500' : undefined} onClick={() => navigate('/analytics/alerts')} />
        <KPICard label="Riesgo Alto" value={data.riskDistribution.high} color="red.500" onClick={() => navigate('/analytics/risk-scores?level=high')} />
        <KPICard
          label="Red de Proveedores"
          subtitle="Comunidades y riesgo de red"
          onClick={() => navigate('/analytics/graph')}
        />
      </SimpleGrid>

      <Heading size="md" mb={4}>Distribución de Riesgo</Heading>
      <Flex gap={4} mb={8} wrap="wrap">
        <Badge colorPalette="red" px={3} py={1} fontSize="md">Alto: {data.riskDistribution.high}</Badge>
        <Badge colorPalette="yellow" px={3} py={1} fontSize="md">Medio: {data.riskDistribution.medium}</Badge>
        <Badge colorPalette="green" px={3} py={1} fontSize="md">Bajo: {data.riskDistribution.low}</Badge>
      </Flex>

      <Heading size="md" mb={4}>Módulos Analíticos</Heading>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} gap={4}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="outline"
            colorPalette={item.color}
            onClick={() => navigate(item.path)}
            size="sm"
          >
            {item.label}
          </Button>
        ))}
      </SimpleGrid>
    </Box>
  );
}
