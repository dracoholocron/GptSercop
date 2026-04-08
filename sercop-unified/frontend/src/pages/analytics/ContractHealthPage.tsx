import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Spinner, Text, Table, Badge, Button, Flex } from '@chakra-ui/react';
import {
  getContractHealth,
  getAmendmentPatterns,
  type ContractHealthItem,
  type AmendmentPatternItem,
  type PaginatedResponse,
} from '../../services/analyticsService';

const healthColor: Record<string, string> = { healthy: 'green', warning: 'yellow', critical: 'red' };

export default function ContractHealthPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<PaginatedResponse<ContractHealthItem> | null>(null);
  const [patterns, setPatterns] = useState<AmendmentPatternItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [healthLevel, setHealthLevel] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getContractHealth({ healthLevel: healthLevel || undefined, page, limit: 20 }).then(setContracts),
      getAmendmentPatterns().then((r) => setPatterns(r.data)),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [healthLevel, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Salud Contractual</Heading>

      {patterns.length > 0 && (
        <>
          <Heading size="md" mb={3}>Patrones de Modificación por Entidad</Heading>
          <Box overflowX="auto" mb={6}>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Total Contratos</Table.ColumnHeader>
                  <Table.ColumnHeader>Con Modificaciones</Table.ColumnHeader>
                  <Table.ColumnHeader>Total Modificaciones</Table.ColumnHeader>
                  <Table.ColumnHeader>Tasa Modificación</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {patterns.map((p) => (
                  <Table.Row
                    key={p.entityName}
                    cursor={p.entityId ? 'pointer' : undefined}
                    _hover={p.entityId ? { bg: 'bg.muted' } : undefined}
                    onClick={() => p.entityId && navigate(`/analytics/entities/${p.entityId}`)}
                  >
                    <Table.Cell color={p.entityId ? 'blue.500' : undefined}>{p.entityName}</Table.Cell>
                    <Table.Cell>{p.totalContracts}</Table.Cell>
                    <Table.Cell>{p.contractsWithAmendments}</Table.Cell>
                    <Table.Cell>{p.totalAmendments}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={p.amendmentRate > 50 ? 'red' : p.amendmentRate > 25 ? 'yellow' : 'green'}>
                        {p.amendmentRate.toFixed(1)}%
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </>
      )}

      <Heading size="md" mb={3}>Contratos</Heading>
      <Flex gap={2} mb={4}>
        {['', 'healthy', 'warning', 'critical'].map((h) => (
          <Button key={h} size="sm" variant={healthLevel === h ? 'solid' : 'outline'}
            colorPalette={h ? healthColor[h] : 'gray'}
            onClick={() => { setHealthLevel(h); setPage(1); }}>
            {h || 'Todos'}
          </Button>
        ))}
      </Flex>

      {loading && <Spinner size="lg" />}
      {error && <Text color="red.500">{error}</Text>}

      {contracts && (
        <>
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Contrato</Table.ColumnHeader>
                  <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                  <Table.ColumnHeader>Entidad</Table.ColumnHeader>
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
                    <Table.Cell fontFamily="mono" fontSize="xs" color="blue.500">{c.contractNo}</Table.Cell>
                    <Table.Cell>{c.providerName}</Table.Cell>
                    <Table.Cell>{c.entityName}</Table.Cell>
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

          <Flex mt={4} gap={2} justify="center">
            <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Text fontSize="sm" alignSelf="center">Página {page}</Text>
            <Button size="sm" disabled={contracts.data.length < 20} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </Flex>
        </>
      )}
    </Box>
  );
}
