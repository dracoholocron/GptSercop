import { useEffect, useState, useCallback } from 'react';
import { Box, Heading, Spinner, Text, Badge, Button, Flex, Table } from '@chakra-ui/react';
import { getAlerts, resolveAlert as resolveAlertApi, type AlertItem, type PaginatedResponse } from '../../services/analyticsService';

const severityColor: Record<string, string> = { CRITICAL: 'red', WARNING: 'yellow', INFO: 'blue' };

export default function AlertsPage() {
  const [data, setData] = useState<PaginatedResponse<AlertItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [resolved, setResolved] = useState('false');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getAlerts({ severity: severity || undefined, resolved, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [severity, resolved, page]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string) => {
    await resolveAlertApi(id);
    load();
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Alertas del Sistema</Heading>

      <Flex gap={2} mb={2} wrap="wrap">
        {['', 'CRITICAL', 'WARNING', 'INFO'].map((s) => (
          <Button key={s} size="sm" variant={severity === s ? 'solid' : 'outline'}
            colorPalette={s ? severityColor[s] : 'gray'}
            onClick={() => { setSeverity(s); setPage(1); }}>
            {s || 'Todos'}
          </Button>
        ))}
      </Flex>
      <Flex gap={2} mb={4}>
        <Button size="sm" variant={resolved === 'false' ? 'solid' : 'outline'} onClick={() => { setResolved('false'); setPage(1); }}>
          Sin Resolver
        </Button>
        <Button size="sm" variant={resolved === 'true' ? 'solid' : 'outline'} onClick={() => { setResolved('true'); setPage(1); }}>
          Resueltas
        </Button>
        <Button size="sm" variant={resolved === '' ? 'solid' : 'outline'} onClick={() => { setResolved(''); setPage(1); }}>
          Todas
        </Button>
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
                  <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                  <Table.ColumnHeader>Severidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Mensaje</Table.ColumnHeader>
                  <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  <Table.ColumnHeader>Acción</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.data.map((a) => (
                  <Table.Row key={a.id}>
                    <Table.Cell><Badge>{a.alertType}</Badge></Table.Cell>
                    <Table.Cell><Badge colorPalette={severityColor[a.severity] ?? 'gray'}>{a.severity}</Badge></Table.Cell>
                    <Table.Cell maxW="300px" truncate>{a.message}</Table.Cell>
                    <Table.Cell fontSize="xs">{new Date(a.createdAt).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>
                      {!a.resolvedAt && (
                        <Button size="xs" colorPalette="green" onClick={() => handleResolve(a.id)}>Resolver</Button>
                      )}
                      {a.resolvedAt && <Badge colorPalette="green">Resuelta</Badge>}
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
