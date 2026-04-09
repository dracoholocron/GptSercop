import { useState, useEffect } from 'react';
import {
  Box, Heading, Text, Select, Flex, Spinner, SimpleGrid, Card,
  Table, Badge, Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getEmergencyContracts, type EmergencyItem } from '../../services/analyticsService';

const fmt = (n: number | null) => {
  if (n === null) return '-';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusColor: Record<string, string> = {
  awarded: 'green',
  active: 'blue',
  draft: 'gray',
  cancelled: 'red',
  closed: 'purple',
};

export default function EmergencyContractsPage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [data, setData] = useState<Awaited<ReturnType<typeof getEmergencyContracts>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getEmergencyContracts({ year, page, limit: 20 })
      .then((r) => { setData(r); setIsLoading(false); })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, [year, page]);

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Contrataciones de Emergencia</Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        Monitoreo de procesos bajo régimen de emergencia. Alta concentración puede indicar
        uso indebido de la modalidad para eludir controles.
      </Text>

      <Flex gap={3} mb={6} wrap="wrap">
        <Select.Root
          value={year ? [String(year)] : ['']}
          onValueChange={(v) => {
            setYear(v.value[0] ? parseInt(v.value[0]) : undefined);
            setPage(1);
          }}
          size="sm"
          width="150px"
          collection={{ items: [] } as Parameters<typeof Select.Root>[0]['collection']}
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Año" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item item={{ label: 'Todos los años', value: '' }}>Todos los años</Select.Item>
            {[2022, 2023, 2024, 2025, 2026].map((y) => (
              <Select.Item key={y} item={{ label: String(y), value: String(y) }}>{y}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      {isLoading && <Flex justify="center" py={10}><Spinner /></Flex>}
      {error && <Text color="red.500">Error al cargar contrataciones de emergencia.</Text>}

      {data && (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            <Card.Root borderColor="red.200" borderWidth="1px">
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Procesos de emergencia</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">{data.total.toLocaleString()}</Text>
                <Text fontSize="xs" color="fg.muted">{data.emergencyPct}% del total</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Total procesos</Text>
                <Text fontSize="2xl" fontWeight="bold">{data.allTendersCount.toLocaleString()}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root borderColor="orange.200" borderWidth="1px">
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Monto emergencia</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {fmt(data.emergencyAmountTotal)}
                </Text>
                <Text fontSize="xs" color="fg.muted">{data.emergencyAmountPct}% del total</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Monto total contratos</Text>
                <Text fontSize="2xl" fontWeight="bold">{fmt(data.allAmountTotal)}</Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {data.emergencyPct > 10 && (
            <Box bg="red.50" borderColor="red.200" borderWidth="1px" borderRadius="md" p={4} mb={6}>
              <Text fontWeight="semibold" color="red.700">
                Alerta: Alta tasa de emergencia ({data.emergencyPct}%)
              </Text>
              <Text fontSize="sm" color="red.600" mt={1}>
                Un porcentaje superior al 10% de procesos de emergencia puede indicar uso inadecuado
                del régimen. Se recomienda auditoría de estas contrataciones.
              </Text>
            </Box>
          )}

          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Text fontWeight="semibold">
                  Procesos de emergencia ({data.total.toLocaleString()} total)
                </Text>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Código</Table.ColumnHeader>
                      <Table.ColumnHeader>Objeto</Table.ColumnHeader>
                      <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                      <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Presupuesto</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Contrato</Table.ColumnHeader>
                      <Table.ColumnHeader>Estado</Table.ColumnHeader>
                      <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.data.map((item: EmergencyItem) => (
                      <Table.Row
                        key={item.id}
                        cursor="pointer"
                        _hover={{ bg: 'bg.muted' }}
                        onClick={() => navigate(`/cp/processes/${item.id}`)}
                      >
                        <Table.Cell>
                          <Text fontSize="xs" fontFamily="mono" color="blue.600">
                            {item.code ?? item.id.slice(0, 8)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell maxW="200px">
                          <Text truncate fontSize="sm">{item.title}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          {item.entityId ? (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/analytics/entities/${item.entityId}`);
                              }}
                            >
                              {item.entityName ?? '-'}
                            </Button>
                          ) : (
                            <Text fontSize="xs">{item.entityName ?? '-'}</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {item.providerId ? (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/analytics/providers/${item.providerId}`);
                              }}
                            >
                              {item.providerName ?? '-'}
                            </Button>
                          ) : (
                            <Text fontSize="xs">{item.providerName ?? '-'}</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell isNumeric>{fmt(item.estimatedAmount)}</Table.Cell>
                        <Table.Cell isNumeric>{fmt(item.contractAmount)}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={statusColor[item.status] ?? 'gray'} size="sm">
                            {item.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell fontSize="xs">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
              <Flex mt={4} gap={2} justify="center">
                <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Text fontSize="sm" alignSelf="center">Página {page}</Text>
                <Button
                  size="sm"
                  disabled={data.data.length < 20}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </Flex>
            </Card.Body>
          </Card.Root>
        </>
      )}
    </Box>
  );
}
