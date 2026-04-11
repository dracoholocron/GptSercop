import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Spinner, Text, Badge, Button, Flex, SimpleGrid, Card,
  Table, Tabs, Progress,
} from '@chakra-ui/react';
import {
  getProviderOverview, getAlerts, getProviderNeighbors, getProviderEgoNetwork,
  type ProviderOverview, type AlertItem, type PaginatedResponse, type EgoNetwork,
} from '../../services/analyticsService';

function sharedTendersWithCenter(edges: EgoNetwork['edges'], centerId: string, nodeId: string): number {
  const e = edges.find(
    (x) =>
      (x.from === centerId && x.to === nodeId) ||
      (x.to === centerId && x.from === nodeId),
  );
  return e?.sharedTenders ?? 0;
}

const tierColor: Record<string, string> = { premium: 'green', standard: 'blue', watch: 'yellow', restricted: 'red' };
const healthColor: Record<string, string> = { healthy: 'green', warning: 'yellow', critical: 'red' };
const severityColor: Record<string, string> = { CRITICAL: 'red', WARNING: 'yellow', INFO: 'blue' };

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box mb={3}>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="sm" fontWeight="bold">{Math.round(value)}</Text>
      </Flex>
      <Progress.Root value={value} colorPalette={color} size="sm">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  );
}

export default function AnalyticsProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<ProviderOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractPage, setContractPage] = useState(1);

  const [activeTab, setActiveTab] = useState('contratos');
  const [alerts, setAlerts] = useState<PaginatedResponse<AlertItem> | null>(null);
  const [neighbors, setNeighbors] = useState<Array<{ providerId: string; name: string; sharedTenders: number }>>([]);
  const [egoNetwork, setEgoNetwork] = useState<EgoNetwork | null>(null);
  const [tabLoading, setTabLoading] = useState(false);

  const loadOverview = useCallback(() => {
    if (!providerId) return;
    setLoading(true);
    getProviderOverview(providerId, contractPage, 15)
      .then(setOverview)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [providerId, contractPage]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useEffect(() => {
    setEgoNetwork(null);
  }, [providerId]);

  const loadTabData = useCallback(async (tab: string) => {
    if (!providerId) return;
    setTabLoading(true);
    try {
      if (tab === 'alertas') {
        const data = await getAlerts({ page: 1, limit: 20 });
        setAlerts(data);
      } else if (tab === 'red') {
        const data = await getProviderNeighbors(providerId);
        setNeighbors(data.data);
      } else if (tab === 'conexiones') {
        const data = await getProviderEgoNetwork(providerId);
        setEgoNetwork(data);
      }
    } finally {
      setTabLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (overview) loadTabData(activeTab);
  }, [overview, activeTab, loadTabData]);

  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (error) return <Box p={8}><Text color="red.500">Error: {error}</Text></Box>;
  if (!overview) return null;

  const { provider, score, contracts, bidsCount, neighborCount } = overview;

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header */}
      <Flex align="flex-start" gap={3} mb={6} wrap="wrap">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
        <Box flex="1">
          <Flex align="center" gap={2} wrap="wrap">
            <Heading size="lg">{provider.name}</Heading>
            {score && (
              <Badge colorPalette={tierColor[score.tier] ?? 'gray'} fontSize="sm" px={3} py={1}>
                {score.tier.toUpperCase()}
              </Badge>
            )}
            <Badge colorPalette={provider.status === 'active' ? 'green' : 'gray'} variant="outline">
              {provider.status}
            </Badge>
          </Flex>
          <Flex gap={3} mt={1} wrap="wrap">
            {provider.identifier && (
              <Text fontSize="sm" color="fg.muted">RUC: <strong>{provider.identifier}</strong></Text>
            )}
            {provider.province && (
              <Text fontSize="sm" color="fg.muted">Provincia: <strong>{provider.province}</strong></Text>
            )}
          </Flex>
        </Box>
      </Flex>

      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Contratos</Text>
            <Text fontSize="2xl" fontWeight="bold">{contracts.total}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Participaciones</Text>
            <Text fontSize="2xl" fontWeight="bold">{bidsCount}</Text>
            <Text fontSize="xs" color="fg.muted">Procesos en los que ha ofertado</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Conexiones de Red</Text>
            <Text fontSize="2xl" fontWeight="bold">{neighborCount}</Text>
          </Card.Body>
        </Card.Root>
        {score && (
          <Card.Root>
            <Card.Body>
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Score Total</Text>
              <Text fontSize="2xl" fontWeight="bold" color={
                score.totalScore >= 80 ? 'green.500' : score.totalScore >= 50 ? 'blue.500' : score.totalScore >= 30 ? 'yellow.500' : 'red.500'
              }>{Math.round(score.totalScore)}</Text>
            </Card.Body>
          </Card.Root>
        )}
      </SimpleGrid>

      {/* Score card */}
      {score && (
        <Card.Root mb={6}>
          <Card.Body>
            <Heading size="sm" mb={4}>Dimensiones de Reputación</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Box>
                <ScoreBar label="Cumplimiento Contractual" value={score.complianceScore} color="blue" />
                <ScoreBar label="Puntualidad de Entrega" value={score.deliveryScore} color="teal" />
              </Box>
              <Box>
                <ScoreBar label="Competitividad de Precios" value={score.priceScore} color="purple" />
                <ScoreBar label="Diversificación de Clientes" value={score.diversityScore} color="orange" />
              </Box>
            </SimpleGrid>
            <Text fontSize="xs" color="fg.muted" mt={2}>
              Calculado: {new Date(score.calculatedAt).toLocaleDateString()}
            </Text>
          </Card.Body>
        </Card.Root>
      )}

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(d) => setActiveTab(d.value)}
        variant="enclosed"
      >
        <Tabs.List mb={4}>
          <Tabs.Trigger value="contratos">Contratos ({contracts.total})</Tabs.Trigger>
          <Tabs.Trigger value="red">Red ({neighborCount})</Tabs.Trigger>
          <Tabs.Trigger value="conexiones">Red de Conexiones</Tabs.Trigger>
          <Tabs.Trigger value="alertas">Alertas</Tabs.Trigger>
        </Tabs.List>

        {/* CONTRATOS TAB */}
        <Tabs.Content value="contratos">
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Contrato</Table.ColumnHeader>
                  <Table.ColumnHeader>Proceso</Table.ColumnHeader>
                  <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader>Salud</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {contracts.data.map((c) => (
                  <Table.Row
                    key={c.contractId}
                    cursor="pointer"
                    _hover={{ bg: 'bg.muted' }}
                    onClick={() => navigate(`/cp/contracts/${c.contractId}`)}
                  >
                    <Table.Cell fontFamily="mono" fontSize="xs">{c.contractNo || c.contractId.slice(-8)}</Table.Cell>
                    <Table.Cell maxW="200px" truncate>{c.tenderTitle ?? '—'}</Table.Cell>
                    <Table.Cell>{c.entityName ?? '—'}</Table.Cell>
                    <Table.Cell>${(c.amount / 1000).toFixed(0)}k</Table.Cell>
                    <Table.Cell><Badge>{c.status}</Badge></Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={healthColor[c.healthLevel] ?? 'gray'}>{c.healthLevel}</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {contracts.data.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" color="fg.muted">Sin contratos registrados.</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
          <Flex mt={3} gap={2} justify="center">
            <Button size="sm" disabled={contractPage <= 1} onClick={() => setContractPage((p) => p - 1)}>Anterior</Button>
            <Text fontSize="sm" alignSelf="center">Pág {contractPage}</Text>
            <Button size="sm" disabled={contracts.data.length < 15} onClick={() => setContractPage((p) => p + 1)}>Siguiente</Button>
          </Flex>
        </Tabs.Content>

        {/* RED TAB */}
        <Tabs.Content value="red">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && neighbors.length === 0 && (
            <Text color="fg.muted" textAlign="center" py={6}>
              Este proveedor no comparte procesos con otros en la red actual.
            </Text>
          )}
          {!tabLoading && neighbors.length > 0 && (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Proveedor Conectado</Table.ColumnHeader>
                    <Table.ColumnHeader>Procesos Compartidos</Table.ColumnHeader>
                    <Table.ColumnHeader>Acción</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {neighbors.map((n) => (
                    <Table.Row key={n.providerId}>
                      <Table.Cell fontWeight="medium">{n.name}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={n.sharedTenders >= 4 ? 'red' : n.sharedTenders >= 2 ? 'yellow' : 'green'}>
                          {n.sharedTenders}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Button size="xs" variant="outline" onClick={() => navigate(`/analytics/providers/${n.providerId}`)}>
                          Ver perfil
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Tabs.Content>

        {/* RED DE CONEXIONES (grafo) */}
        <Tabs.Content value="conexiones">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && egoNetwork && (
            <>
              <Text fontSize="sm" color="fg.muted" mb={3}>
                Red de egocentrado respecto a <strong>{egoNetwork.center.name}</strong>
                {egoNetwork.center.riskScore != null && (
                  <> — Riesgo centro: <strong>{egoNetwork.center.riskScore.toFixed(2)}</strong></>
                )}
              </Text>
              <Text fontSize="sm" fontWeight="600" mb={2}>
                Total conexiones:{' '}
                {egoNetwork.nodes.filter((n) => n.id !== egoNetwork.center.id).length}
              </Text>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Proveedor conectado</Table.ColumnHeader>
                      <Table.ColumnHeader>Licitaciones compartidas</Table.ColumnHeader>
                      <Table.ColumnHeader>Grado</Table.ColumnHeader>
                      <Table.ColumnHeader>Riesgo</Table.ColumnHeader>
                      <Table.ColumnHeader />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {egoNetwork.nodes
                      .filter((n) => n.id !== egoNetwork.center.id)
                      .map((n) => (
                        <Table.Row key={n.id}>
                          <Table.Cell fontWeight="medium">{n.name}</Table.Cell>
                          <Table.Cell>
                            <Badge>
                              {sharedTendersWithCenter(egoNetwork.edges, egoNetwork.center.id, n.id)}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>{n.degree}</Table.Cell>
                          <Table.Cell>
                            {n.riskLevel ? (
                              <Badge colorPalette={severityColor[n.riskLevel] ?? 'gray'}>{n.riskLevel}</Badge>
                            ) : (
                              '—'
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <Button size="xs" variant="outline" onClick={() => navigate(`/analytics/providers/${n.id}`)}>
                              Ver perfil
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    {egoNetwork.nodes.filter((n) => n.id !== egoNetwork.center.id).length === 0 && (
                      <Table.Row>
                        <Table.Cell colSpan={5} textAlign="center" color="fg.muted">
                          Sin nodos conectados en el grafo analítico.
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>
            </>
          )}
          {!tabLoading && !egoNetwork && (
            <Text color="fg.muted" textAlign="center" py={6}>
              No se pudo cargar la red de conexiones.
            </Text>
          )}
        </Tabs.Content>

        {/* ALERTAS TAB */}
        <Tabs.Content value="alertas">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && alerts && alerts.total === 0 && (
            <Text color="fg.muted" textAlign="center" py={6}>Sin alertas disponibles.</Text>
          )}
          {!tabLoading && alerts && alerts.total > 0 && (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                    <Table.ColumnHeader>Severidad</Table.ColumnHeader>
                    <Table.ColumnHeader>Mensaje</Table.ColumnHeader>
                    <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {alerts.data.map((a) => (
                    <Table.Row key={a.id}>
                      <Table.Cell><Badge>{a.alertType}</Badge></Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={severityColor[a.severity] ?? 'gray'}>{a.severity}</Badge>
                      </Table.Cell>
                      <Table.Cell maxW="300px" truncate>{a.message}</Table.Cell>
                      <Table.Cell fontSize="xs">{new Date(a.createdAt).toLocaleDateString()}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
