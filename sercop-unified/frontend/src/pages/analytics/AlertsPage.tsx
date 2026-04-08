import { useEffect, useState, useCallback } from 'react';
import {
  Box, Heading, Spinner, Text, Badge, Button, Flex, Table,
  Dialog, Textarea, Input, NativeSelect,
} from '@chakra-ui/react';
import {
  getAlerts, resolveAlert as resolveAlertApi,
  type AlertItem, type PaginatedResponse,
} from '../../services/analyticsService';

const severityColor: Record<string, string> = { CRITICAL: 'red', WARNING: 'yellow', INFO: 'blue' };

export default function AlertsPage() {
  const [data, setData] = useState<PaginatedResponse<AlertItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [resolved, setResolved] = useState('false');
  const [page, setPage] = useState(1);

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<AlertItem | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAction, setResolveAction] = useState('');
  const [resolvedBy, setResolvedBy] = useState('');
  const [resolving, setResolving] = useState(false);

  // Metadata drawer state
  const [metaTarget, setMetaTarget] = useState<AlertItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAlerts({ severity: severity || undefined, resolved, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [severity, resolved, page]);

  useEffect(() => { load(); }, [load]);

  const openResolveModal = (a: AlertItem) => {
    setResolveTarget(a);
    setResolveNotes('');
    setResolveAction('');
    setResolvedBy('');
  };

  const handleResolveSubmit = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await resolveAlertApi(resolveTarget.id, {
        notes: resolveNotes || undefined,
        actionTaken: resolveAction || undefined,
        resolvedBy: resolvedBy || undefined,
      });
      setResolveTarget(null);
      load();
    } finally {
      setResolving(false);
    }
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
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader>Acción</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.data.map((a) => (
                  <Table.Row
                    key={a.id}
                    cursor="pointer"
                    _hover={{ bg: 'bg.muted' }}
                    onClick={() => setMetaTarget(a)}
                  >
                    <Table.Cell><Badge>{a.alertType}</Badge></Table.Cell>
                    <Table.Cell><Badge colorPalette={severityColor[a.severity] ?? 'gray'}>{a.severity}</Badge></Table.Cell>
                    <Table.Cell maxW="300px" truncate>{a.message}</Table.Cell>
                    <Table.Cell fontSize="xs">{new Date(a.createdAt).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>
                      {a.resolvedAt
                        ? <Badge colorPalette="green">Resuelta</Badge>
                        : <Badge colorPalette="red">Abierta</Badge>}
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      {!a.resolvedAt && (
                        <Button size="xs" colorPalette="green" onClick={() => openResolveModal(a)}>
                          Resolver
                        </Button>
                      )}
                      {a.resolvedAt && (
                        <Text fontSize="xs" color="fg.muted">
                          {new Date(a.resolvedAt).toLocaleDateString()}
                        </Text>
                      )}
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

      {/* Resolve Modal */}
      <Dialog.Root open={!!resolveTarget} onOpenChange={(d) => { if (!d.open) setResolveTarget(null); }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Resolver Alerta</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              {resolveTarget && (
                <Box>
                  <Text fontSize="sm" mb={1} color="fg.muted">Tipo: <strong>{resolveTarget.alertType}</strong></Text>
                  <Text fontSize="sm" mb={4} color="fg.muted">{resolveTarget.message}</Text>

                  <Box mb={3}>
                    <Text fontSize="sm" mb={1} fontWeight="600">Acción Tomada</Text>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field value={resolveAction} onChange={(e) => setResolveAction(e.target.value)}>
                        <option value="">Seleccionar acción...</option>
                        <option value="investigation_opened">Investigación abierta</option>
                        <option value="corrective_action">Acción correctiva aplicada</option>
                        <option value="false_positive">Falso positivo — sin acción</option>
                        <option value="escalated">Escalado a instancia superior</option>
                        <option value="monitoring">Bajo monitoreo continuo</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>

                  <Box mb={3}>
                    <Text fontSize="sm" mb={1} fontWeight="600">Resuelto por</Text>
                    <Input
                      size="sm"
                      placeholder="Nombre del responsable"
                      value={resolvedBy}
                      onChange={(e) => setResolvedBy(e.target.value)}
                    />
                  </Box>

                  <Box mb={3}>
                    <Text fontSize="sm" mb={1} fontWeight="600">Notas adicionales</Text>
                    <Textarea
                      size="sm"
                      placeholder="Describe las acciones tomadas o contexto adicional..."
                      rows={4}
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                    />
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancelar</Button>
              <Button
                colorPalette="green"
                loading={resolving}
                onClick={handleResolveSubmit}
              >
                Confirmar Resolución
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Metadata Drawer */}
      <Dialog.Root
        open={!!metaTarget}
        onOpenChange={(d) => { if (!d.open) setMetaTarget(null); }}
        size="md"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Detalle de Alerta</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              {metaTarget && (
                <Box>
                  <Flex gap={2} mb={3} wrap="wrap">
                    <Badge colorPalette={severityColor[metaTarget.severity] ?? 'gray'} size="lg">
                      {metaTarget.severity}
                    </Badge>
                    <Badge>{metaTarget.alertType}</Badge>
                    {metaTarget.resolvedAt
                      ? <Badge colorPalette="green">Resuelta</Badge>
                      : <Badge colorPalette="red">Abierta</Badge>}
                  </Flex>

                  <Text mb={3}>{metaTarget.message}</Text>

                  <Box mb={3}>
                    <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1}>ID</Text>
                    <Text fontFamily="mono" fontSize="xs">{metaTarget.id}</Text>
                  </Box>
                  <Box mb={3}>
                    <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1}>Entidad/Proceso Relacionado</Text>
                    <Text fontFamily="mono" fontSize="xs">{metaTarget.entityType}: {metaTarget.entityId}</Text>
                  </Box>
                  <Box mb={3}>
                    <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1}>Creada</Text>
                    <Text fontSize="sm">{new Date(metaTarget.createdAt).toLocaleString()}</Text>
                  </Box>
                  {metaTarget.resolvedAt && (
                    <Box mb={3}>
                      <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1}>Resuelta</Text>
                      <Text fontSize="sm">{new Date(metaTarget.resolvedAt).toLocaleString()}</Text>
                    </Box>
                  )}
                  {metaTarget.metadata && Object.keys(metaTarget.metadata).length > 0 && (
                    <Box mb={3}>
                      <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={1}>Metadatos</Text>
                      <Box
                        bg="bg.muted"
                        p={3}
                        borderRadius="md"
                        fontFamily="mono"
                        fontSize="xs"
                        whiteSpace="pre-wrap"
                      >
                        {JSON.stringify(metaTarget.metadata, null, 2)}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={() => setMetaTarget(null)}>Cerrar</Button>
              {metaTarget && !metaTarget.resolvedAt && (
                <Button colorPalette="green" onClick={() => { setMetaTarget(null); openResolveModal(metaTarget); }}>
                  Resolver Esta Alerta
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
