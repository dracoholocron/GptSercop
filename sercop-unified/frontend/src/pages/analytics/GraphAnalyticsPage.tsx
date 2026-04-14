import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  Box, Heading, Text, Spinner, SimpleGrid, Card, Table, Badge, Flex, Button,
  NativeSelect, Drawer, CloseButton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  getGraphOverview,
  getVisualNetwork,
  type GraphOverview,
  type VisualNetworkData,
  type VisualNode,
} from '../../services/analyticsService';
import { NetworkGraph, GraphLegend, riskColor } from '../../components/analytics/NetworkGraph';

const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtNum = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—');
const fmtAmount = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export default function GraphAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<GraphOverview | null>(null);
  const [network, setNetwork] = useState<VisualNetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedCommunityId, setExpandedCommunityId] = useState<number | null>(null);
  const [communityFilter, setCommunityFilter] = useState<number | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getGraphOverview(), getVisualNetwork()])
      .then(([overview, net]) => {
        setData(overview);
        setNetwork(net);
        setIsLoading(false);
      })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, []);

  useEffect(() => {
    getVisualNetwork(communityFilter).then(setNetwork).catch(() => {});
  }, [communityFilter]);

  const handleNodeClick = useCallback((node: VisualNode) => setSelectedNode(node), []);

  if (isLoading) {
    return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  }
  if (error) {
    return <Box p={8}><Text color="red.500">Error: {error.message}</Text></Box>;
  }
  if (!data) return null;

  const { riskSummary, topCommunities } = data;

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Grafo de Red — Proveedores</Heading>
      <Text color="fg.muted" mb={6} fontSize="sm">
        Vista agregada de la red de relaciones, comunidades detectadas e indicadores de riesgo.
      </Text>

      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} gap={4} mb={8}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Total Proveedores en Red</Text>
            <Text fontSize="2xl" fontWeight="bold">{data.totalProviders.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Total Relaciones</Text>
            <Text fontSize="2xl" fontWeight="bold">{data.totalRelations.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Comunidades Detectadas</Text>
            <Text fontSize="2xl" fontWeight="bold">{data.totalCommunities.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Densidad de Red</Text>
            <Text fontSize="2xl" fontWeight="bold">{fmtPct(data.networkDensity)}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Grado Promedio</Text>
            <Text fontSize="2xl" fontWeight="bold">{fmtNum(data.avgDegree)}</Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Interactive Force Graph */}
      <Card.Root mb={8}>
        <Card.Header>
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Text fontWeight="semibold" fontSize="md">Visualización de la Red de Proveedores</Text>
            <Flex align="center" gap={2}>
              <Text fontSize="sm" color="fg.muted">Comunidad:</Text>
              <NativeSelect.Root size="sm" width="200px">
                <NativeSelect.Field
                  value={communityFilter != null ? String(communityFilter) : ''}
                  onChange={(e) => setCommunityFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">Todas las comunidades</option>
                  {topCommunities.map((c) => (
                    <option key={c.communityId} value={c.communityId}>
                      Comunidad #{c.communityId} ({c.memberCount} miembros)
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Flex>
          </Flex>
        </Card.Header>
        <Card.Body p={0}>
          {network && network.nodes.length > 0 ? (
            <NetworkGraph
              nodes={network.nodes}
              links={network.links}
              height={520}
              onNodeClick={handleNodeClick}
              highlightNodeId={selectedNode?.id}
            />
          ) : (
            <Flex justify="center" py={12}>
              <Text color="fg.muted">No hay datos de red para mostrar.</Text>
            </Flex>
          )}
        </Card.Body>
        <Card.Footer>
          <Flex justify="space-between" align="center" width="100%" wrap="wrap" gap={2}>
            <GraphLegend />
            {network && (
              <Text fontSize="xs" color="fg.muted">
                Mostrando {network.nodes.length} de {network.stats.totalNodes} nodos
                • {network.links.length} de {network.stats.totalLinks} relaciones
              </Text>
            )}
          </Flex>
        </Card.Footer>
      </Card.Root>

      {/* Risk Summary */}
      <Heading size="md" mb={3}>Resumen de riesgo</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Nodos Alto Riesgo</Text>
            <Text fontSize="xl" fontWeight="bold" color="red.500">{riskSummary.highRiskNodes.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Candidatos Colusión</Text>
            <Text fontSize="xl" fontWeight="bold" color="orange.500">{riskSummary.collusionCandidates.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Ganadores Aislados</Text>
            <Text fontSize="xl" fontWeight="bold" color="blue.500">{riskSummary.isolatedWinners.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Communities Table */}
      <Heading size="md" mb={3}>Comunidades principales</Heading>
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

      {/* Provider Detail Drawer */}
      <Drawer.Root
        open={selectedNode != null}
        onOpenChange={(d) => { if (!d.open) setSelectedNode(null); }}
        placement="end"
        size="sm"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>{selectedNode?.name ?? 'Proveedor'}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              {selectedNode && (
                <Box>
                  <SimpleGrid columns={2} gap={3} mb={4}>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">Nivel de riesgo</Text>
                      <Badge
                        colorPalette={selectedNode.riskLevel === 'high' ? 'red' : selectedNode.riskLevel === 'medium' ? 'orange' : selectedNode.riskLevel === 'low' ? 'green' : 'gray'}
                        mt={1}
                      >
                        {selectedNode.riskLevel ?? 'Sin evaluación'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">Provincia</Text>
                      <Text fontWeight="medium">{selectedNode.province ?? '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">Grado (conexiones)</Text>
                      <Text fontWeight="bold" fontSize="lg">{selectedNode.degree}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">PageRank</Text>
                      <Text fontWeight="bold" fontSize="lg">{selectedNode.pageRank.toFixed(4)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">Monto total contratado</Text>
                      <Text fontWeight="bold" fontSize="lg">{fmtAmount(selectedNode.totalAmount)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">Comunidad</Text>
                      <Text fontWeight="medium">#{selectedNode.communityId}</Text>
                    </Box>
                  </SimpleGrid>

                  <Flex direction="column" gap={2} mt={4}>
                    <Button
                      colorPalette="blue"
                      size="sm"
                      onClick={() => { setSelectedNode(null); navigate(`/analytics/providers/${selectedNode.id}`); }}
                    >
                      Ver perfil completo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCommunityFilter(selectedNode.communityId >= 0 ? selectedNode.communityId : undefined);
                        setSelectedNode(null);
                      }}
                    >
                      Filtrar comunidad #{selectedNode.communityId}
                    </Button>
                  </Flex>
                </Box>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}
