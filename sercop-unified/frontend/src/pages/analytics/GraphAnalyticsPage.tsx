import { Fragment, useEffect, useState } from 'react';
import {
  Box, Heading, Text, Spinner, SimpleGrid, Card, Table, Badge, Flex, Button,
} from '@chakra-ui/react';
import { getGraphOverview, type GraphOverview } from '../../services/analyticsService';

const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtNum = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—');

export default function GraphAnalyticsPage() {
  const [data, setData] = useState<GraphOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedCommunityId, setExpandedCommunityId] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getGraphOverview()
      .then((r) => {
        setData(r);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={8}>
        <Text color="red.500">Error: {error.message}</Text>
      </Box>
    );
  }
  if (!data) return null;

  const { riskSummary, topCommunities } = data;

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>
        Grafo de Red — Proveedores
      </Heading>
      <Text color="fg.muted" mb={6} fontSize="sm">
        Vista agregada de la red de relaciones, comunidades detectadas e indicadores de riesgo.
      </Text>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} gap={4} mb={8}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Total Proveedores en Red
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{data.totalProviders.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Total Relaciones
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{data.totalRelations.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Comunidades Detectadas
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{data.totalCommunities.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Densidad de Red
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{fmtPct(data.networkDensity)}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Grado Promedio
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{fmtNum(data.avgDegree)}</Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Heading size="md" mb={3}>
        Resumen de riesgo
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Nodos Alto Riesgo</Text>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              {riskSummary.highRiskNodes.toLocaleString()}
            </Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Candidatos Colusión</Text>
            <Text fontSize="xl" fontWeight="bold" color="orange.500">
              {riskSummary.collusionCandidates.toLocaleString()}
            </Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Ganadores Aislados</Text>
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              {riskSummary.isolatedWinners.toLocaleString()}
            </Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Heading size="md" mb={3}>
        Comunidades principales
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        Pulse una fila para ver los miembros de la comunidad.
      </Text>
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader width="48px" />
              <Table.ColumnHeader>Comunidad</Table.ColumnHeader>
              <Table.ColumnHeader>Miembros</Table.ColumnHeader>
              <Table.ColumnHeader>Licitaciones compartidas</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {topCommunities.map((c) => (
              <Fragment key={c.communityId}>
                <Table.Row
                  cursor="pointer"
                  _hover={{ bg: 'bg.muted' }}
                  onClick={() =>
                    setExpandedCommunityId(expandedCommunityId === c.communityId ? null : c.communityId)
                  }
                >
                  <Table.Cell>
                    <Button size="xs" variant="ghost">
                      {expandedCommunityId === c.communityId ? '−' : '+'}
                    </Button>
                  </Table.Cell>
                  <Table.Cell fontWeight="medium">#{c.communityId}</Table.Cell>
                  <Table.Cell>{c.memberCount}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="blue">{c.totalSharedTenders}</Badge>
                  </Table.Cell>
                </Table.Row>
                {expandedCommunityId === c.communityId && (
                  <Table.Row bg="bg.subtle">
                    <Table.Cell colSpan={4} pb={4}>
                      <Text fontSize="sm" fontWeight="600" mb={2}>
                        Miembros ({c.members.length})
                      </Text>
                      <Flex gap={2} wrap="wrap">
                        {c.members.map((m) => (
                          <Badge key={m.id} variant="outline" px={2} py={1}>
                            {m.name}
                            <Text as="span" fontSize="xs" color="fg.muted" ml={1}>
                              (grado {m.degree})
                            </Text>
                          </Badge>
                        ))}
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Fragment>
            ))}
            {topCommunities.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={4} textAlign="center" color="fg.muted">
                  No hay comunidades para mostrar.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
