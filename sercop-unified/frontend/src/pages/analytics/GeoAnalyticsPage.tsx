import { useState } from 'react';
import {
  Box, Heading, Text, Select, Flex, Spinner, SimpleGrid, Card,
  Table, Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGeoAnalytics, type GeoItem } from '../../services/analyticsService';

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

export default function GeoAnalyticsPage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['geoAnalytics', year],
    queryFn: () => getGeoAnalytics(year),
  });

  const maxAmount = data ? Math.max(...data.data.map((d) => d.totalAmount), 1) : 1;

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Análisis Geográfico</Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        Distribución del gasto en contratación pública por provincia del proveedor.
      </Text>

      <Flex gap={3} mb={6} wrap="wrap">
        <Select.Root
          value={year ? [String(year)] : ['']}
          onValueChange={(v) => setYear(v.value[0] ? parseInt(v.value[0]) : undefined)}
          size="sm"
          width="150px"
          collection={{ items: [{ label: 'Todos los años', value: '' }, ...[2022, 2023, 2024, 2025, 2026].map((y) => ({ label: String(y), value: String(y) }))] } as Parameters<typeof Select.Root>[0]['collection']}
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
      {error && <Text color="red.500">Error al cargar datos geográficos.</Text>}

      {data && (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Provincias con actividad</Text>
                <Text fontSize="2xl" fontWeight="bold">{data.data.length}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Total contratos</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {data.data.reduce((s, d) => s + d.contractCount, 0).toLocaleString()}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Monto total</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {fmt(data.data.reduce((s, d) => s + d.totalAmount, 0))}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Provincia líder</Text>
                <Text fontSize="2xl" fontWeight="bold">{data.data[0]?.province ?? '-'}</Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Visual bars */}
          <Card.Root mb={6}>
            <Card.Header>
              <Text fontWeight="semibold">Distribución por provincia</Text>
            </Card.Header>
            <Card.Body>
              <Box>
                {data.data.slice(0, 15).map((item: GeoItem) => (
                  <Box key={item.province} mb={3}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="sm">{item.province}</Text>
                      <Text fontSize="sm" color="fg.muted">{fmt(item.totalAmount)}</Text>
                    </Flex>
                    <Box bg="bg.muted" borderRadius="full" h="8px" overflow="hidden">
                      <Box
                        bg="blue.500"
                        h="100%"
                        borderRadius="full"
                        style={{ width: `${(item.totalAmount / maxAmount) * 100}%` }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Table */}
          <Card.Root>
            <Card.Header>
              <Text fontWeight="semibold">Detalle por provincia</Text>
            </Card.Header>
            <Card.Body>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Provincia</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Contratos</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Entidades</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Monto total</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>% del total</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.data.map((item: GeoItem, idx: number) => {
                      const totalAmt = data.data.reduce((s, d) => s + d.totalAmount, 0);
                      const pct = totalAmt > 0 ? ((item.totalAmount / totalAmt) * 100).toFixed(1) : '0.0';
                      return (
                        <Table.Row
                          key={item.province}
                          cursor="pointer"
                          _hover={{ bg: 'bg.muted' }}
                          onClick={() => navigate(`/analytics/risk-scores?province=${encodeURIComponent(item.province)}`)}
                        >
                          <Table.Cell>
                            <Flex align="center" gap={2}>
                              {idx < 3 && <Badge colorPalette="gold" size="sm">#{idx + 1}</Badge>}
                              {item.province}
                            </Flex>
                          </Table.Cell>
                          <Table.Cell isNumeric>{item.contractCount.toLocaleString()}</Table.Cell>
                          <Table.Cell isNumeric>{item.entityCount.toLocaleString()}</Table.Cell>
                          <Table.Cell isNumeric>{fmt(item.totalAmount)}</Table.Cell>
                          <Table.Cell isNumeric>
                            <Badge colorPalette={parseFloat(pct) > 20 ? 'red' : parseFloat(pct) > 10 ? 'yellow' : 'green'}>
                              {pct}%
                            </Badge>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Card.Body>
          </Card.Root>
        </>
      )}
    </Box>
  );
}
