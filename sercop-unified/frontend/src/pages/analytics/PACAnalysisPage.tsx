import { useEffect, useState } from 'react';
import { Box, Heading, Spinner, Text, Table, Badge } from '@chakra-ui/react';
import { getPacVsExecuted, type PacItem } from '../../services/analyticsService';

export default function PACAnalysisPage() {
  const [data, setData] = useState<PacItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPacVsExecuted()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (error) return <Box p={8}><Text color="red.500">{error}</Text></Box>;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>PAC vs Ejecutado</Heading>
      <Text mb={4} color="fg.muted">Comparación entre el Plan Anual de Contratación y la ejecución real por entidad.</Text>

      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Entidad</Table.ColumnHeader>
              <Table.ColumnHeader>Planificados</Table.ColumnHeader>
              <Table.ColumnHeader>Ejecutados</Table.ColumnHeader>
              <Table.ColumnHeader>Monto Plan</Table.ColumnHeader>
              <Table.ColumnHeader>Monto Ejecutado</Table.ColumnHeader>
              <Table.ColumnHeader>Tasa Ejecución</Table.ColumnHeader>
              <Table.ColumnHeader>Desviación</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((item) => (
              <Table.Row key={item.entityName}>
                <Table.Cell>{item.entityName}</Table.Cell>
                <Table.Cell>{item.planned}</Table.Cell>
                <Table.Cell>{item.executed}</Table.Cell>
                <Table.Cell>${(item.plannedAmount / 1000).toFixed(0)}k</Table.Cell>
                <Table.Cell>${(item.executedAmount / 1000).toFixed(0)}k</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={item.executionRate >= 70 ? 'green' : item.executionRate >= 40 ? 'yellow' : 'red'}>
                    {item.executionRate.toFixed(1)}%
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text color={Math.abs(item.deviation) > 50 ? 'red.500' : 'fg.muted'}>
                    {item.deviation.toFixed(1)}%
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {data.length === 0 && <Text mt={4} color="fg.muted" textAlign="center">Sin datos PAC disponibles.</Text>}
    </Box>
  );
}
