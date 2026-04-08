import { useEffect, useState, useCallback } from 'react';
import { Box, Heading, Spinner, Text, Badge, Button, Flex, Table, Card, SimpleGrid } from '@chakra-ui/react';
import { getProviderScores, type ProviderScoreItem, type PaginatedResponse } from '../../services/analyticsService';

const tierColor: Record<string, string> = { premium: 'green', standard: 'blue', watch: 'yellow', restricted: 'red' };

export default function ProviderScoresPage() {
  const [data, setData] = useState<PaginatedResponse<ProviderScoreItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tier, setTier] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getProviderScores({ tier: tier || undefined, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tier, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Reputación de Proveedores</Heading>

      <Flex gap={2} mb={4} wrap="wrap">
        {['', 'premium', 'standard', 'watch', 'restricted'].map((t) => (
          <Button key={t} size="sm" variant={tier === t ? 'solid' : 'outline'}
            colorPalette={t ? tierColor[t] : 'gray'}
            onClick={() => { setTier(t); setPage(1); }}>
            {t || 'Todos'}
          </Button>
        ))}
      </Flex>

      {loading && <Spinner size="lg" />}
      {error && <Text color="red.500">{error}</Text>}

      {data && (
        <>
          <Text mb={2} fontSize="sm" color="fg.muted">Total: {data.total}</Text>
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                  <Table.ColumnHeader>RUC</Table.ColumnHeader>
                  <Table.ColumnHeader>Provincia</Table.ColumnHeader>
                  <Table.ColumnHeader>Cumplimiento</Table.ColumnHeader>
                  <Table.ColumnHeader>Entrega</Table.ColumnHeader>
                  <Table.ColumnHeader>Precio</Table.ColumnHeader>
                  <Table.ColumnHeader>Diversidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Total</Table.ColumnHeader>
                  <Table.ColumnHeader>Tier</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.data.map((ps) => (
                  <Table.Row key={ps.id}>
                    <Table.Cell fontWeight="bold">{ps.provider?.name ?? '—'}</Table.Cell>
                    <Table.Cell fontFamily="mono" fontSize="xs">{ps.provider?.identifier ?? '—'}</Table.Cell>
                    <Table.Cell>{ps.provider?.province ?? '—'}</Table.Cell>
                    <Table.Cell>{ps.complianceScore}</Table.Cell>
                    <Table.Cell>{ps.deliveryScore}</Table.Cell>
                    <Table.Cell>{ps.priceScore}</Table.Cell>
                    <Table.Cell>{ps.diversityScore}</Table.Cell>
                    <Table.Cell fontWeight="bold">{ps.totalScore}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={tierColor[ps.tier] ?? 'gray'}>{ps.tier}</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          <Flex mt={4} gap={2} justify="center">
            <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Text fontSize="sm" alignSelf="center">Página {page}</Text>
            <Button size="sm" disabled={data.data.length < 20} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </Flex>
        </>
      )}
    </Box>
  );
}
