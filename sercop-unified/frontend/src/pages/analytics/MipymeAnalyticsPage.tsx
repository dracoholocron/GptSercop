import { useState } from 'react';
import {
  Box, Heading, Text, Select, Flex, Spinner, SimpleGrid, Card,
  Table, Badge, Progress,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { getMipymeAnalytics, type MipymeItem } from '../../services/analyticsService';

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

const categoryColor: Record<string, string> = {
  Microempresa: 'green',
  'Pequeña empresa': 'blue',
  'Mediana empresa': 'yellow',
  'Gran empresa': 'red',
  'No clasificado': 'gray',
};

const categoryOrder = ['Microempresa', 'Pequeña empresa', 'Mediana empresa', 'Gran empresa', 'No clasificado'];

export default function MipymeAnalyticsPage() {
  const [year, setYear] = useState<number | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mipymeAnalytics', year],
    queryFn: () => getMipymeAnalytics(year),
  });

  const sorted = data
    ? [...data.data].sort(
        (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
      )
    : [];

  const mipymeContracts = sorted
    .filter((d) => ['Microempresa', 'Pequeña empresa', 'Mediana empresa'].includes(d.category))
    .reduce((s, d) => s + d.contractCount, 0);
  const totalContracts = sorted.reduce((s, d) => s + d.contractCount, 0);
  const mipymePct = totalContracts > 0 ? ((mipymeContracts / totalContracts) * 100).toFixed(1) : '0';

  const mipymeAmount = sorted
    .filter((d) => ['Microempresa', 'Pequeña empresa', 'Mediana empresa'].includes(d.category))
    .reduce((s, d) => s + d.totalAmount, 0);
  const totalAmount = sorted.reduce((s, d) => s + d.totalAmount, 0);
  const mipymeAmtPct = totalAmount > 0 ? ((mipymeAmount / totalAmount) * 100).toFixed(1) : '0';

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Participación MIPYME</Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        Participación de micro, pequeñas y medianas empresas en la contratación pública.
        Clasificación basada en patrimonio declarado (MIPYME: &lt; $5M, Gran empresa: ≥ $5M).
      </Text>

      <Flex gap={3} mb={6} wrap="wrap">
        <Select.Root
          value={year ? [String(year)] : ['']}
          onValueChange={(v) => setYear(v.value[0] ? parseInt(v.value[0]) : undefined)}
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
      {error && <Text color="red.500">Error al cargar datos MIPYME.</Text>}

      {data && (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Contratos MIPYME</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {mipymeContracts.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="fg.muted">{mipymePct}% del total</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Monto MIPYME</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">{fmt(mipymeAmount)}</Text>
                <Text fontSize="xs" color="fg.muted">{mipymeAmtPct}% del total</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Total contratos</Text>
                <Text fontSize="2xl" fontWeight="bold">{totalContracts.toLocaleString()}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Monto total</Text>
                <Text fontSize="2xl" fontWeight="bold">{fmt(totalAmount)}</Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Distribution bars */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Distribución por número de contratos</Text>
              </Card.Header>
              <Card.Body>
                {sorted.map((item: MipymeItem) => (
                  <Box key={item.category} mb={3}>
                    <Flex justify="space-between" mb={1}>
                      <Flex align="center" gap={2}>
                        <Badge colorPalette={categoryColor[item.category] ?? 'gray'} size="sm">
                          {item.category}
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" color="fg.muted">{item.contractPct}%</Text>
                    </Flex>
                    <Progress.Root
                      value={item.contractPct}
                      size="sm"
                      colorPalette={categoryColor[item.category] ?? 'gray'}
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>
                ))}
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Distribución por monto</Text>
              </Card.Header>
              <Card.Body>
                {sorted.map((item: MipymeItem) => (
                  <Box key={item.category} mb={3}>
                    <Flex justify="space-between" mb={1}>
                      <Flex align="center" gap={2}>
                        <Badge colorPalette={categoryColor[item.category] ?? 'gray'} size="sm">
                          {item.category}
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" color="fg.muted">{item.amountPct}%</Text>
                    </Flex>
                    <Progress.Root
                      value={item.amountPct}
                      size="sm"
                      colorPalette={categoryColor[item.category] ?? 'gray'}
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>
                ))}
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          <Card.Root>
            <Card.Header>
              <Text fontWeight="semibold">Detalle por categoría empresarial</Text>
            </Card.Header>
            <Card.Body>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Categoría</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Proveedores</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Contratos</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>% contratos</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Monto total</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>% monto</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sorted.map((item: MipymeItem) => (
                      <Table.Row key={item.category} _hover={{ bg: 'bg.muted' }}>
                        <Table.Cell>
                          <Badge colorPalette={categoryColor[item.category] ?? 'gray'}>
                            {item.category}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell isNumeric>{item.providerCount.toLocaleString()}</Table.Cell>
                        <Table.Cell isNumeric>{item.contractCount.toLocaleString()}</Table.Cell>
                        <Table.Cell isNumeric>{item.contractPct}%</Table.Cell>
                        <Table.Cell isNumeric>{fmt(item.totalAmount)}</Table.Cell>
                        <Table.Cell isNumeric>{item.amountPct}%</Table.Cell>
                      </Table.Row>
                    ))}
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
