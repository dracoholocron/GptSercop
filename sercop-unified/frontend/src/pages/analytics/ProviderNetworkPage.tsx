import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Spinner, Text, Button, Flex, Table, Badge, Card, SimpleGrid } from '@chakra-ui/react';
import { getProviderNetwork, type NetworkData } from '../../services/analyticsService';

export default function ProviderNetworkPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minShared, setMinShared] = useState(2);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getProviderNetwork(minShared)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [minShared]);

  useEffect(() => { load(); }, [load]);

  const selectedEdges = selectedNode
    ? data?.edges.filter((e) => e.source === selectedNode || e.target === selectedNode) ?? []
    : [];
  const connectedNodes = selectedNode
    ? new Set(selectedEdges.flatMap((e) => [e.source, e.target]))
    : new Set<string>();
  connectedNodes.delete(selectedNode ?? '');

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Red de Proveedores</Heading>
      <Text mb={4} color="fg.muted">Visualización de proveedores que compiten juntos en procesos de contratación.</Text>

      <Flex gap={2} mb={4} align="center">
        <Text fontSize="sm">Min. procesos compartidos:</Text>
        {[1, 2, 3, 5].map((n) => (
          <Button key={n} size="sm" variant={minShared === n ? 'solid' : 'outline'} onClick={() => setMinShared(n)}>{n}</Button>
        ))}
      </Flex>

      {loading && <Spinner size="lg" />}
      {error && <Text color="red.500">{error}</Text>}

      {data && (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
            <Card.Root><Card.Body>
              <Text fontSize="sm" color="fg.muted">Nodos (Proveedores)</Text>
              <Text fontSize="2xl" fontWeight="bold">{data.nodes.length}</Text>
            </Card.Body></Card.Root>
            <Card.Root><Card.Body>
              <Text fontSize="sm" color="fg.muted">Relaciones</Text>
              <Text fontSize="2xl" fontWeight="bold">{data.edges.length}</Text>
            </Card.Body></Card.Root>
            <Card.Root><Card.Body>
              <Text fontSize="sm" color="fg.muted">Max Compartidos</Text>
              <Text fontSize="2xl" fontWeight="bold">{data.edges.length > 0 ? Math.max(...data.edges.map((e) => e.sharedTenders)) : 0}</Text>
            </Card.Body></Card.Root>
          </SimpleGrid>

          <Heading size="md" mb={3}>Proveedores en la Red</Heading>
          <Box overflowX="auto" mb={6}>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                  <Table.ColumnHeader>Contratos</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto Total</Table.ColumnHeader>
                  <Table.ColumnHeader>Acción</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.nodes.map((n) => (
                  <Table.Row key={n.id} bg={selectedNode === n.id ? 'blue.50' : undefined}>
                    <Table.Cell fontWeight={connectedNodes.has(n.id) ? 'bold' : 'normal'}>
                      {n.name}
                      {connectedNodes.has(n.id) && <Badge ml={2} colorPalette="purple">Conectado</Badge>}
                    </Table.Cell>
                    <Table.Cell>{n.contractCount}</Table.Cell>
                    <Table.Cell>${(n.totalAmount / 1000).toFixed(0)}k</Table.Cell>
                    <Table.Cell>
                      <Flex gap={1}>
                        <Button size="xs" variant="outline" onClick={() => setSelectedNode(selectedNode === n.id ? null : n.id)}>
                          {selectedNode === n.id ? 'Deseleccionar' : 'Relaciones'}
                        </Button>
                        <Button size="xs" colorPalette="blue" variant="ghost" onClick={() => navigate(`/analytics/providers/${n.id}`)}>
                          Ver detalle
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          {selectedNode && selectedEdges.length > 0 && (
            <>
              <Heading size="md" mb={3}>Relaciones del proveedor seleccionado</Heading>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Proveedor A</Table.ColumnHeader>
                      <Table.ColumnHeader>Proveedor B</Table.ColumnHeader>
                      <Table.ColumnHeader>Procesos Compartidos</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {selectedEdges.map((e, i) => (
                      <Table.Row key={i}>
                        <Table.Cell>{data.nodes.find((n) => n.id === e.source)?.name ?? e.source}</Table.Cell>
                        <Table.Cell>{data.nodes.find((n) => n.id === e.target)?.name ?? e.target}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={e.sharedTenders >= 4 ? 'red' : e.sharedTenders >= 2 ? 'yellow' : 'green'}>
                            {e.sharedTenders}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
