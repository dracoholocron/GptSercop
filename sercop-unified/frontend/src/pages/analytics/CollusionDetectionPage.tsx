import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Spinner, SimpleGrid, Card, Table, Badge, Flex,
} from '@chakra-ui/react';
import { getCollusionCandidates, type CollusionCandidate } from '../../services/analyticsService';

const riskPalette: Record<CollusionCandidate['riskLevel'], string> = {
  CRITICAL: 'red',
  WARNING: 'orange',
  INFO: 'blue',
};

export default function CollusionDetectionPage() {
  const [rows, setRows] = useState<CollusionCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getCollusionCandidates()
      .then((r) => {
        setRows(r.data);
        setTotal(r.total);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e);
        setIsLoading(false);
      });
  }, []);

  const uniqueProviderIds = new Set<string>();
  for (const c of rows) {
    for (const m of c.members) uniqueProviderIds.add(m.id);
  }
  const totalAmountSum = rows.reduce((s, c) => s + c.totalAmount, 0);

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={8}>
        <Text color="red.500">Error: {error.message}</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>
        Detección de colusión
      </Heading>
      <Text color="fg.muted" mb={6} fontSize="sm">
        Clusters con evidencia de co-participación, rotación y similitud de ofertas.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Anillos Sospechosos
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{total.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Proveedores Flaggeados
            </Text>
            <Text fontSize="2xl" fontWeight="bold">{uniqueProviderIds.size.toLocaleString()}</Text>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="600">
              Monto Total Involucrado
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              ${(totalAmountSum / 1_000_000).toFixed(2)}M
            </Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Cluster ID</Table.ColumnHeader>
              <Table.ColumnHeader>Miembros</Table.ColumnHeader>
              <Table.ColumnHeader>Evidencia</Table.ColumnHeader>
              <Table.ColumnHeader>Monto total</Table.ColumnHeader>
              <Table.ColumnHeader>Nivel de riesgo</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((c) => (
              <Table.Row key={c.clusterId}>
                <Table.Cell fontFamily="mono">#{c.clusterId}</Table.Cell>
                <Table.Cell>
                  <Text fontWeight="medium" mb={1}>{c.members.length} proveedores</Text>
                  <Text fontSize="xs" color="fg.muted" maxW="280px" whiteSpace="normal">
                    {c.members.map((m) => m.name).join(', ')}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap={1} fontSize="xs">
                    <Text>Licit. compartidas: <strong>{c.evidence.sharedTenders}</strong></Text>
                    <Text>Rotación: <strong>{c.evidence.rotationScore.toFixed(3)}</strong></Text>
                    <Text>Similitud ofertas: <strong>{c.evidence.bidSimilarityScore.toFixed(3)}</strong></Text>
                    <Badge
                      colorPalette={c.evidence.sameAddress ? 'red' : 'gray'}
                      variant={c.evidence.sameAddress ? 'solid' : 'outline'}
                      width="fit-content"
                    >
                      Misma dirección: {c.evidence.sameAddress ? 'Sí' : 'No'}
                    </Badge>
                  </Flex>
                </Table.Cell>
                <Table.Cell fontWeight="semibold">
                  ${(c.totalAmount / 1000).toFixed(0)}k
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={riskPalette[c.riskLevel]}>{c.riskLevel}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
            {rows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5} textAlign="center" color="fg.muted">
                  No hay candidatos de colusión en este momento.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
