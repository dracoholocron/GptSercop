import { useEffect, useState, useCallback } from 'react';
import { Box, Heading, Spinner, Text, Table, Badge, Button, Flex } from '@chakra-ui/react';
import { getFragmentationAlerts, type FragmentationAlertItem, type PaginatedResponse } from '../../services/analyticsService';

const severityColor: Record<string, string> = { CRITICAL: 'red', WARNING: 'yellow', INFO: 'blue' };

export default function FragmentationPage() {
  const [data, setData] = useState<PaginatedResponse<FragmentationAlertItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getFragmentationAlerts({ severity: severity || undefined, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [severity, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Detección de Fragmentación</Heading>
      <Text mb={4} color="fg.muted">Identificación de contratos fraccionados que podrían evadir umbrales de contratación.</Text>

      <Flex gap={2} mb={4}>
        {['', 'CRITICAL', 'WARNING', 'INFO'].map((s) => (
          <Button key={s} size="sm" variant={severity === s ? 'solid' : 'outline'}
            colorPalette={s ? severityColor[s] : 'gray'}
            onClick={() => { setSeverity(s); setPage(1); }}>
            {s || 'Todos'}
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
                  <Table.ColumnHeader>Patrón</Table.ColumnHeader>
                  <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Contratos</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto Total</Table.ColumnHeader>
                  <Table.ColumnHeader>Período (días)</Table.ColumnHeader>
                  <Table.ColumnHeader>Severidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.data.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell><Badge>{item.pattern}</Badge></Table.Cell>
                    <Table.Cell>{item.entityId}</Table.Cell>
                    <Table.Cell>{item.contractCount}</Table.Cell>
                    <Table.Cell fontWeight="bold">${(item.totalAmount / 1000).toFixed(0)}k</Table.Cell>
                    <Table.Cell>{item.periodDays}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={severityColor[item.severity] ?? 'gray'}>{item.severity}</Badge>
                    </Table.Cell>
                    <Table.Cell fontSize="xs">{new Date(item.createdAt).toLocaleDateString()}</Table.Cell>
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

      {data && data.total === 0 && (
        <Text mt={4} textAlign="center" color="fg.muted">No se detectaron patrones de fragmentación.</Text>
      )}
    </Box>
  );
}
