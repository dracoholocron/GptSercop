import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Spinner, Text, Badge, Button, Flex, SimpleGrid, Card,
  Table, Tabs,
} from '@chakra-ui/react';
import {
  getEntityOverview, getRiskScores, getAlerts, getPacVsExecuted, getContractHealth,
  type EntityOverview, type RiskScoreItem, type AlertItem, type PacItem,
  type ContractHealthItem, type PaginatedResponse,
} from '../../services/analyticsService';

const levelColor: Record<string, string> = { high: 'red', medium: 'yellow', low: 'green' };
const healthColor: Record<string, string> = { healthy: 'green', warning: 'yellow', critical: 'red' };
const severityColor: Record<string, string> = { CRITICAL: 'red', WARNING: 'yellow', INFO: 'blue' };

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card.Root>
      <Card.Body>
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">{label}</Text>
        <Text fontSize="2xl" fontWeight="bold">{value}</Text>
        {sub && <Text fontSize="xs" color="fg.muted">{sub}</Text>}
      </Card.Body>
    </Card.Root>
  );
}

export default function AnalyticsEntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<EntityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab data
  const [riskScores, setRiskScores] = useState<PaginatedResponse<RiskScoreItem> | null>(null);
  const [contracts, setContracts] = useState<PaginatedResponse<ContractHealthItem> | null>(null);
  const [alerts, setAlerts] = useState<PaginatedResponse<AlertItem> | null>(null);
  const [pac, setPac] = useState<PacItem | null>(null);
  const [tabLoading, setTabLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('procesos');
  const [riskPage, setRiskPage] = useState(1);
  const [contractPage, setContractPage] = useState(1);
  const [alertPage, setAlertPage] = useState(1);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    getEntityOverview(entityId)
      .then(setOverview)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [entityId]);

  const loadTabData = useCallback(async (tab: string) => {
    if (!entityId) return;
    setTabLoading(true);
    try {
      if (tab === 'procesos') {
        const data = await getRiskScores({ entityId, page: riskPage, limit: 15 });
        setRiskScores(data);
      } else if (tab === 'contratos') {
        const data = await getContractHealth({ page: contractPage, limit: 15 });
        setContracts(data);
      } else if (tab === 'alertas') {
        const data = await getAlerts({ entityId, page: alertPage, limit: 15 });
        setAlerts(data);
      } else if (tab === 'pac') {
        const data = await getPacVsExecuted(undefined, entityId);
        setPac(data.data[0] ?? null);
      }
    } finally {
      setTabLoading(false);
    }
  }, [entityId, riskPage, contractPage, alertPage]);

  useEffect(() => {
    if (overview) loadTabData(activeTab);
  }, [overview, activeTab, riskPage, contractPage, alertPage, loadTabData]);

  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (error) return <Box p={8}><Text color="red.500">Error: {error}</Text></Box>;
  if (!overview) return null;

  const { entity } = overview;

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header */}
      <Flex align="center" gap={3} mb={6} wrap="wrap">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
        <Box flex="1">
          <Flex align="center" gap={2} wrap="wrap">
            <Heading size="lg">{entity.name}</Heading>
            {entity.code && <Badge colorPalette="blue" variant="subtle">{entity.code}</Badge>}
            {entity.organizationType && (
              <Badge colorPalette="gray" variant="outline">{entity.organizationType}</Badge>
            )}
          </Flex>
          <Text fontSize="sm" color="fg.muted" mt={1}>Detalle analítico de entidad contratante</Text>
        </Box>
      </Flex>

      {/* KPI cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={8}>
        <KPICard label="Procesos" value={overview.totalTenders} />
        <KPICard label="Contratos" value={overview.totalContracts} />
        <KPICard
          label="Gasto Total"
          value={`$${(overview.totalSpend / 1_000_000).toFixed(2)}M`}
        />
        <KPICard label="Prom. Oferentes" value={overview.avgBidders} />
      </SimpleGrid>

      {/* Risk distribution */}
      <Flex gap={3} mb={8} wrap="wrap" align="center">
        <Text fontSize="sm" fontWeight="600" color="fg.muted">Distribución de Riesgo:</Text>
        <Badge colorPalette="red" px={2} py={1}>Alto: {overview.riskDistribution.high}</Badge>
        <Badge colorPalette="yellow" px={2} py={1}>Medio: {overview.riskDistribution.medium}</Badge>
        <Badge colorPalette="green" px={2} py={1}>Bajo: {overview.riskDistribution.low}</Badge>
        {overview.openAlerts > 0 && (
          <Badge colorPalette="orange" px={2} py={1}>⚠ {overview.openAlerts} alertas abiertas</Badge>
        )}
      </Flex>

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(d) => { setActiveTab(d.value); }}
        variant="enclosed"
      >
        <Tabs.List mb={4}>
          <Tabs.Trigger value="procesos">Procesos / Riesgo</Tabs.Trigger>
          <Tabs.Trigger value="contratos">Contratos</Tabs.Trigger>
          <Tabs.Trigger value="alertas">Alertas</Tabs.Trigger>
          <Tabs.Trigger value="pac">PAC vs Ejecutado</Tabs.Trigger>
        </Tabs.List>

        {/* PROCESOS TAB */}
        <Tabs.Content value="procesos">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && riskScores && (
            <>
              <Text fontSize="sm" color="fg.muted" mb={2}>Total: {riskScores.total}</Text>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Código</Table.ColumnHeader>
                      <Table.ColumnHeader>Título</Table.ColumnHeader>
                      <Table.ColumnHeader>Score</Table.ColumnHeader>
                      <Table.ColumnHeader>Nivel</Table.ColumnHeader>
                      <Table.ColumnHeader>Flags</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {riskScores.data.map((rs) => (
                      <Table.Row
                        key={rs.id}
                        cursor="pointer"
                        _hover={{ bg: 'bg.muted' }}
                        onClick={() => rs.tenderId && navigate(`/cp/processes/${rs.tenderId}`)}
                      >
                        <Table.Cell fontFamily="mono" fontSize="xs">{rs.tender?.code ?? '—'}</Table.Cell>
                        <Table.Cell maxW="250px" truncate>{rs.tender?.title ?? '—'}</Table.Cell>
                        <Table.Cell fontWeight="bold">{rs.totalScore}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={levelColor[rs.riskLevel] ?? 'gray'}>{rs.riskLevel}</Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap={1} wrap="wrap">
                            {rs.flags.slice(0, 2).map((f) => <Badge key={f} size="sm">{f}</Badge>)}
                            {rs.flags.length > 2 && <Badge size="sm">+{rs.flags.length - 2}</Badge>}
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
              <Flex mt={3} gap={2} justify="center">
                <Button size="sm" disabled={riskPage <= 1} onClick={() => setRiskPage((p) => p - 1)}>Anterior</Button>
                <Text fontSize="sm" alignSelf="center">Pág {riskPage}</Text>
                <Button size="sm" disabled={riskScores.data.length < 15} onClick={() => setRiskPage((p) => p + 1)}>Siguiente</Button>
              </Flex>
            </>
          )}
        </Tabs.Content>

        {/* CONTRATOS TAB */}
        <Tabs.Content value="contratos">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && contracts && (
            <>
              <Text fontSize="sm" color="fg.muted" mb={2}>Total: {contracts.total}</Text>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Contrato</Table.ColumnHeader>
                      <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                      <Table.ColumnHeader>Monto</Table.ColumnHeader>
                      <Table.ColumnHeader>Modificaciones</Table.ColumnHeader>
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
                        <Table.Cell>{c.providerName}</Table.Cell>
                        <Table.Cell>${(c.amount / 1000).toFixed(0)}k</Table.Cell>
                        <Table.Cell>{c.amendmentCount}</Table.Cell>
                        <Table.Cell><Badge>{c.status}</Badge></Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={healthColor[c.healthLevel] ?? 'gray'}>{c.healthLevel}</Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
              <Flex mt={3} gap={2} justify="center">
                <Button size="sm" disabled={contractPage <= 1} onClick={() => setContractPage((p) => p - 1)}>Anterior</Button>
                <Text fontSize="sm" alignSelf="center">Pág {contractPage}</Text>
                <Button size="sm" disabled={contracts.data.length < 15} onClick={() => setContractPage((p) => p + 1)}>Siguiente</Button>
              </Flex>
            </>
          )}
        </Tabs.Content>

        {/* ALERTAS TAB */}
        <Tabs.Content value="alertas">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && alerts && (
            <>
              <Text fontSize="sm" color="fg.muted" mb={2}>Total: {alerts.total}</Text>
              {alerts.total === 0
                ? <Text color="fg.muted" textAlign="center" py={6}>Sin alertas para esta entidad.</Text>
                : (
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                          <Table.ColumnHeader>Severidad</Table.ColumnHeader>
                          <Table.ColumnHeader>Mensaje</Table.ColumnHeader>
                          <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                          <Table.ColumnHeader>Estado</Table.ColumnHeader>
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
                            <Table.Cell>
                              {a.resolvedAt
                                ? <Badge colorPalette="green">Resuelta</Badge>
                                : <Badge colorPalette="red">Abierta</Badge>}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )
              }
              <Flex mt={3} gap={2} justify="center">
                <Button size="sm" disabled={alertPage <= 1} onClick={() => setAlertPage((p) => p - 1)}>Anterior</Button>
                <Text fontSize="sm" alignSelf="center">Pág {alertPage}</Text>
                <Button size="sm" disabled={alerts.data.length < 15} onClick={() => setAlertPage((p) => p + 1)}>Siguiente</Button>
              </Flex>
            </>
          )}
        </Tabs.Content>

        {/* PAC TAB */}
        <Tabs.Content value="pac">
          {tabLoading && <Spinner size="md" />}
          {!tabLoading && !pac && (
            <Text color="fg.muted" textAlign="center" py={6}>Sin datos PAC disponibles para esta entidad.</Text>
          )}
          {!tabLoading && pac && (
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
              <KPICard label="Procesos Planificados" value={pac.planned} />
              <KPICard label="Procesos Ejecutados" value={pac.executed} />
              <KPICard label="Monto Planificado" value={`$${(pac.plannedAmount / 1000).toFixed(0)}k`} />
              <KPICard label="Monto Ejecutado" value={`$${(pac.executedAmount / 1000).toFixed(0)}k`} />
              <Card.Root>
                <Card.Body>
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Tasa de Ejecución</Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={pac.executionRate >= 70 ? 'green.500' : pac.executionRate >= 40 ? 'yellow.500' : 'red.500'}
                  >
                    {pac.executionRate.toFixed(1)}%
                  </Text>
                </Card.Body>
              </Card.Root>
              <Card.Root>
                <Card.Body>
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">Desviación</Text>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={Math.abs(pac.deviation) > 50000 ? 'red.500' : 'fg.default'}
                  >
                    ${(Math.abs(pac.deviation) / 1000).toFixed(0)}k
                  </Text>
                  <Text fontSize="xs" color="fg.muted">{pac.deviation < 0 ? 'sub-ejecutado' : 'sobre-ejecutado'}</Text>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
