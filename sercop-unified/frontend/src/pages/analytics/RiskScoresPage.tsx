import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Heading, Spinner, Text, Badge, Button, Flex, Table } from '@chakra-ui/react';
import { getRiskScores, type RiskScoreItem, type PaginatedResponse } from '../../services/analyticsService';

const levelColor: Record<string, string> = { high: 'red', medium: 'yellow', low: 'green' };

export default function RiskScoresPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResponse<RiskScoreItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState(searchParams.get('level') ?? '');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getRiskScores({ level: level || undefined, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [level, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Scores de Riesgo</Heading>

      <Flex gap={3} mb={4} wrap="wrap" align="center">
        {['', 'high', 'medium', 'low'].map((l) => (
          <Button
            key={l}
            size="sm"
            variant={level === l ? 'solid' : 'outline'}
            colorPalette={l ? levelColor[l] : 'gray'}
            onClick={() => { setLevel(l); setPage(1); }}
          >
            {l || 'Todos'}
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
                  <Table.ColumnHeader>Código</Table.ColumnHeader>
                  <Table.ColumnHeader>Título</Table.ColumnHeader>
                  <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Score</Table.ColumnHeader>
                  <Table.ColumnHeader>Nivel</Table.ColumnHeader>
                  <Table.ColumnHeader>Flags</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.data.map((rs) => (
                  <Table.Row key={rs.id}>
                    <Table.Cell
                      fontFamily="mono"
                      fontSize="xs"
                      cursor="pointer"
                      color="blue.500"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => rs.tenderId && navigate(`/cp/processes/${rs.tenderId}`)}
                    >
                      {rs.tender?.code ?? '—'}
                    </Table.Cell>
                    <Table.Cell maxW="200px" truncate>{rs.tender?.title ?? '—'}</Table.Cell>
                    <Table.Cell
                      cursor="pointer"
                      color="blue.500"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => {
                        const entityId = rs.tender?.procurementPlan?.entity?.id;
                        if (entityId) navigate(`/analytics/entities/${entityId}`);
                      }}
                    >
                      {rs.tender?.procurementPlan?.entity?.name ?? '—'}
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">{rs.totalScore}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={levelColor[rs.riskLevel] ?? 'gray'}>{rs.riskLevel}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap={1} wrap="wrap">
                        {rs.flags.slice(0, 3).map((f) => <Badge key={f} size="sm">{f}</Badge>)}
                        {rs.flags.length > 3 && <Badge size="sm">+{rs.flags.length - 3}</Badge>}
                      </Flex>
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
