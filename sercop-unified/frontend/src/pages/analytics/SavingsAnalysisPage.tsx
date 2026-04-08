import { useState } from 'react';
import {
  Box, Heading, Text, Select, Flex, Spinner, SimpleGrid, Card,
  Table, Badge,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { getSavingsAnalysis, type SavingsItem } from '../../services/analyticsService';

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

export default function SavingsAnalysisPage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<'processType' | 'entity'>('processType');

  const { data, isLoading, error } = useQuery({
    queryKey: ['savingsAnalysis', year, groupBy],
    queryFn: () => getSavingsAnalysis(year, groupBy),
  });

  const totalEstimated = data?.data.reduce((s, d) => s + d.totalEstimated, 0) ?? 0;
  const totalAwarded = data?.data.reduce((s, d) => s + d.totalAwarded, 0) ?? 0;
  const totalSavings = totalEstimated - totalAwarded;
  const totalSavingsPct = totalEstimated > 0 ? (totalSavings / totalEstimated) * 100 : 0;

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Análisis de Ahorros</Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        Comparación entre presupuesto referencial y monto adjudicado en contratos públicos.
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

        <Select.Root
          value={[groupBy]}
          onValueChange={(v) => setGroupBy((v.value[0] as 'processType' | 'entity') || 'processType')}
          size="sm"
          width="170px"
          collection={{ items: [] } as Parameters<typeof Select.Root>[0]['collection']}
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Agrupar por" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item item={{ label: 'Por tipo de proceso', value: 'processType' }}>Por tipo de proceso</Select.Item>
            <Select.Item item={{ label: 'Por entidad', value: 'entity' }}>Por entidad</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {isLoading && <Flex justify="center" py={10}><Spinner /></Flex>}
      {error && <Text color="red.500">Error al cargar datos de ahorros.</Text>}

      {data && (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Presupuesto total</Text>
                <Text fontSize="2xl" fontWeight="bold">{fmt(totalEstimated)}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Monto adjudicado</Text>
                <Text fontSize="2xl" fontWeight="bold">{fmt(totalAwarded)}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Ahorro total</Text>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={totalSavings > 0 ? 'green.500' : 'red.500'}
                >
                  {fmt(Math.abs(totalSavings))}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">% ahorro promedio</Text>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={totalSavingsPct > 0 ? 'green.500' : 'red.500'}
                >
                  {totalSavingsPct.toFixed(1)}%
                </Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          <Card.Root>
            <Card.Header>
              <Text fontWeight="semibold">
                {groupBy === 'entity' ? 'Ahorros por entidad' : 'Ahorros por tipo de proceso'}
              </Text>
            </Card.Header>
            <Card.Body>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {groupBy === 'entity' ? 'Entidad' : 'Tipo de proceso'}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Contratos</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Presupuesto</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Adjudicado</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Ahorro</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>% Ahorro</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.data.map((item: SavingsItem) => (
                      <Table.Row key={item.groupKey} _hover={{ bg: 'bg.muted' }}>
                        <Table.Cell fontWeight="medium" maxW="250px">
                          <Text truncate>{item.groupKey}</Text>
                        </Table.Cell>
                        <Table.Cell isNumeric>{item.count.toLocaleString()}</Table.Cell>
                        <Table.Cell isNumeric>{fmt(item.totalEstimated)}</Table.Cell>
                        <Table.Cell isNumeric>{fmt(item.totalAwarded)}</Table.Cell>
                        <Table.Cell isNumeric>
                          <Text color={item.savingsAmount > 0 ? 'green.600' : 'red.600'} fontWeight="semibold">
                            {item.savingsAmount > 0 ? '+' : ''}{fmt(item.savingsAmount)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell isNumeric>
                          <Badge
                            colorPalette={
                              item.savingsPct > 10 ? 'green' :
                              item.savingsPct > 0 ? 'yellow' : 'red'
                            }
                          >
                            {item.savingsPct > 0 ? '+' : ''}{item.savingsPct}%
                          </Badge>
                        </Table.Cell>
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
