import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Spinner, Text, Table, Badge, SimpleGrid, Card } from '@chakra-ui/react';
import { getCompetition, type CompetitionData } from '../../services/analyticsService';

export default function CompetitionPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCompetition()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (error) return <Box p={8}><Text color="red.500">{error}</Text></Box>;
  if (!data) return null;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Análisis de Competencia</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
        <Card.Root><Card.Body>
          <Text fontSize="sm" color="fg.muted">Promedio Oferentes</Text>
          <Text fontSize="2xl" fontWeight="bold">{data.avgBidders}</Text>
        </Card.Body></Card.Root>
        <Card.Root><Card.Body>
          <Text fontSize="sm" color="fg.muted">Sectores Analizados</Text>
          <Text fontSize="2xl" fontWeight="bold">{data.bySector.length}</Text>
        </Card.Body></Card.Root>
        <Card.Root><Card.Body>
          <Text fontSize="sm" color="fg.muted">Entidades con HHI</Text>
          <Text fontSize="2xl" fontWeight="bold">{data.hhiByEntity.length}</Text>
        </Card.Body></Card.Root>
      </SimpleGrid>

      <Heading size="md" mb={3}>Competencia por Sector</Heading>
      <Box overflowX="auto" mb={6}>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Tipo Proceso</Table.ColumnHeader>
              <Table.ColumnHeader>Procesos</Table.ColumnHeader>
              <Table.ColumnHeader>Oferente Único</Table.ColumnHeader>
              <Table.ColumnHeader>% Oferente Único</Table.ColumnHeader>
              <Table.ColumnHeader>Prom. Oferentes</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.bySector.map((s) => (
              <Table.Row
                key={s.processType}
                cursor="pointer"
                _hover={{ bg: 'bg.muted' }}
                onClick={() => navigate(`/analytics/risk-scores?processType=${encodeURIComponent(s.processType)}`)}
              >
                <Table.Cell color="blue.500">{s.processType}</Table.Cell>
                <Table.Cell>{s.tenderCount}</Table.Cell>
                <Table.Cell>{s.singleBidderCount}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={s.singleBidderPct > 50 ? 'red' : s.singleBidderPct > 25 ? 'yellow' : 'green'}>
                    {s.singleBidderPct.toFixed(1)}%
                  </Badge>
                </Table.Cell>
                <Table.Cell>{s.avgBidders.toFixed(1)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <Heading size="md" mb={3}>HHI por Entidad</Heading>
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Entidad</Table.ColumnHeader>
              <Table.ColumnHeader>HHI</Table.ColumnHeader>
              <Table.ColumnHeader>Nivel</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.hhiByEntity.map((e) => (
              <Table.Row
                key={e.entityName}
                cursor="pointer"
                _hover={{ bg: 'bg.muted' }}
                onClick={() => e.entityId && navigate(`/analytics/entities/${e.entityId}`)}
              >
                <Table.Cell color="blue.500">{e.entityName}</Table.Cell>
                <Table.Cell fontWeight="bold">{e.hhi.toFixed(0)}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={e.hhi > 2500 ? 'red' : e.hhi > 1500 ? 'yellow' : 'green'}>
                    {e.hhi > 2500 ? 'Alta concentración' : e.hhi > 1500 ? 'Moderada' : 'Competitivo'}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
