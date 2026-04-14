import { useState, useEffect } from 'react';
import {
  Box, Heading, Text, Flex, Spinner, SimpleGrid, Card,
  Table, Badge, Progress, NativeSelect,
} from '@chakra-ui/react';
import { getProcessEfficiency, type EfficiencyItem } from '../../services/analyticsService';

const fmtDays = (d: number | null) => (d === null ? '-' : `${d.toFixed(1)} días`);

const efficiencyColor = (days: number | null): string => {
  if (days === null) return 'gray';
  if (days <= 15) return 'green';
  if (days <= 30) return 'yellow';
  return 'red';
};

export default function ProcessEfficiencyPage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const [data, setData] = useState<Awaited<ReturnType<typeof getProcessEfficiency>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getProcessEfficiency(year)
      .then((r) => { setData(r); setIsLoading(false); })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, [year]);

  const totalProcesses = data?.data.reduce((s, d) => s + d.count, 0) ?? 0;
  const maxDays = data
    ? Math.max(...data.data.map((d) => d.avgPublishToBidsDays ?? 0), 1)
    : 1;

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>Eficiencia de Procesos</Heading>
      <Text color="fg.muted" mb={4} fontSize="sm">
        Duración promedio de los procesos de contratación pública por tipo de procedimiento.
      </Text>

      <Flex gap={3} mb={6} wrap="wrap">
        <NativeSelect.Root size="sm" width="180px">
          <NativeSelect.Field
            value={year ? String(year) : ''}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">Todos los años</option>
            {[2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Flex>

      {isLoading && <Flex justify="center" py={10}><Spinner /></Flex>}
      {error && <Text color="red.500">Error al cargar datos de eficiencia.</Text>}

      {data && (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Tipos de proceso</Text>
                <Text fontSize="2xl" fontWeight="bold">{data.data.length}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Total procesos</Text>
                <Text fontSize="2xl" fontWeight="bold">{totalProcesses.toLocaleString()}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Promedio publicación → ofertas</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {fmtDays(
                    data.data.reduce((s, d) => s + (d.avgPublishToBidsDays ?? 0), 0) /
                      Math.max(data.data.filter((d) => d.avgPublishToBidsDays !== null).length, 1),
                  )}
                </Text>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <Text fontSize="xs" color="fg.muted">Procesos cancelados</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {data.data.reduce((s, d) => s + d.cancelledCount, 0).toLocaleString()}
                </Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Visual bars */}
          <Card.Root mb={6}>
            <Card.Header>
              <Text fontWeight="semibold">Duración promedio: publicación → recepción de ofertas</Text>
            </Card.Header>
            <Card.Body>
              {data.data.map((item: EfficiencyItem) => (
                <Box key={item.processType} mb={4}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">{item.processType}</Text>
                    <Flex gap={2} align="center">
                      <Badge colorPalette={efficiencyColor(item.avgPublishToBidsDays)} size="sm">
                        {fmtDays(item.avgPublishToBidsDays)}
                      </Badge>
                      <Text fontSize="xs" color="fg.muted">{item.count} procesos</Text>
                    </Flex>
                  </Flex>
                  <Progress.Root
                    value={item.avgPublishToBidsDays ? (item.avgPublishToBidsDays / maxDays) * 100 : 0}
                    size="sm"
                    colorPalette={efficiencyColor(item.avgPublishToBidsDays)}
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                </Box>
              ))}
            </Card.Body>
          </Card.Root>

          {/* Detail table */}
          <Card.Root>
            <Card.Header>
              <Text fontWeight="semibold">Detalle por tipo de proceso</Text>
            </Card.Header>
            <Card.Body>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Tipo de proceso</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Procesos</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Cancelados</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Días pub. → ofertas</Table.ColumnHeader>
                      <Table.ColumnHeader isNumeric>Días ofertas → contrato</Table.ColumnHeader>
                      <Table.ColumnHeader>Eficiencia</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.data.map((item: EfficiencyItem) => (
                      <Table.Row key={item.processType} _hover={{ bg: 'bg.muted' }}>
                        <Table.Cell fontWeight="medium">{item.processType}</Table.Cell>
                        <Table.Cell isNumeric>{item.count.toLocaleString()}</Table.Cell>
                        <Table.Cell isNumeric>
                          <Text color={item.cancelledCount > 0 ? 'red.500' : 'fg.default'}>
                            {item.cancelledCount}
                          </Text>
                        </Table.Cell>
                        <Table.Cell isNumeric>
                          <Badge colorPalette={efficiencyColor(item.avgPublishToBidsDays)} size="sm">
                            {fmtDays(item.avgPublishToBidsDays)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell isNumeric>
                          <Badge colorPalette={efficiencyColor(item.avgBidsToAwardDays)} size="sm">
                            {fmtDays(item.avgBidsToAwardDays)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          {item.avgPublishToBidsDays !== null && item.avgPublishToBidsDays <= 15
                            ? <Badge colorPalette="green">Rápido</Badge>
                            : item.avgPublishToBidsDays !== null && item.avgPublishToBidsDays <= 30
                            ? <Badge colorPalette="yellow">Normal</Badge>
                            : item.avgPublishToBidsDays !== null
                            ? <Badge colorPalette="red">Lento</Badge>
                            : <Badge colorPalette="gray">Sin datos</Badge>}
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
