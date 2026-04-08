import { useEffect, useState, useCallback } from 'react';
import { Box, Heading, Spinner, Text, Table, Button, Flex } from '@chakra-ui/react';
import { getMarket, type MarketItem } from '../../services/analyticsService';

const groups = [
  { value: 'entity', label: 'Por Entidad' },
  { value: 'province', label: 'Por Provincia' },
  { value: 'processType', label: 'Por Tipo de Proceso' },
];

export default function MarketPage() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState('entity');

  const load = useCallback(() => {
    setLoading(true);
    getMarket(groupBy)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [groupBy]);

  useEffect(() => { load(); }, [load]);

  const labelCol = groupBy === 'entity' ? 'Entidad' : groupBy === 'province' ? 'Provincia' : 'Tipo Proceso';
  const labelKey = groupBy === 'entity' ? 'entityName' : groupBy === 'province' ? 'province' : 'processType';

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Análisis de Mercado</Heading>

      <Flex gap={2} mb={4}>
        {groups.map((g) => (
          <Button key={g.value} size="sm" variant={groupBy === g.value ? 'solid' : 'outline'} onClick={() => setGroupBy(g.value)}>
            {g.label}
          </Button>
        ))}
      </Flex>

      {loading && <Spinner size="lg" />}
      {error && <Text color="red.500">{error}</Text>}

      {!loading && (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{labelCol}</Table.ColumnHeader>
                <Table.ColumnHeader>Contratos/Procesos</Table.ColumnHeader>
                <Table.ColumnHeader>Monto Total</Table.ColumnHeader>
                {groupBy === 'province' && <Table.ColumnHeader>Proveedores</Table.ColumnHeader>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.map((item, i) => (
                <Table.Row key={i}>
                  <Table.Cell>{(item as Record<string, unknown>)[labelKey] as string ?? '—'}</Table.Cell>
                  <Table.Cell>{item.contractCount ?? item.tenderCount ?? 0}</Table.Cell>
                  <Table.Cell fontWeight="bold">${(item.totalAmount / 1000).toFixed(0)}k</Table.Cell>
                  {groupBy === 'province' && <Table.Cell>{item.providerCount ?? '—'}</Table.Cell>}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
}
