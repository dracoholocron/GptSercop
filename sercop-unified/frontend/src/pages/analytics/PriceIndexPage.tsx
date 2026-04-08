import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Spinner, Text, Table, Badge } from '@chakra-ui/react';
import { getPriceIndex, getPriceAnomalies, type PriceIndexItem, type PriceAnomalyItem } from '../../services/analyticsService';

export default function PriceIndexPage() {
  const navigate = useNavigate();
  const [indexData, setIndexData] = useState<PriceIndexItem[]>([]);
  const [anomalies, setAnomalies] = useState<PriceAnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getPriceIndex().then((r) => setIndexData(r.data)),
      getPriceAnomalies().then((r) => setAnomalies(r.data)),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box p={8} textAlign="center"><Spinner size="xl" /></Box>;
  if (error) return <Box p={8}><Text color="red.500">{error}</Text></Box>;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Índice Nacional de Precios</Heading>

      {anomalies.length > 0 && (
        <>
          <Heading size="md" mb={3} color="red.500">Anomalías de Precio Detectadas ({anomalies.length})</Heading>
          <Box overflowX="auto" mb={6}>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Código</Table.ColumnHeader>
                  <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto Contrato</Table.ColumnHeader>
                  <Table.ColumnHeader>Promedio Nacional</Table.ColumnHeader>
                  <Table.ColumnHeader>Desviación</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {anomalies.map((a) => (
                  <Table.Row key={a.tenderId}>
                    <Table.Cell
                      fontFamily="mono"
                      fontSize="xs"
                      cursor="pointer"
                      color="blue.500"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => navigate(`/cp/processes/${a.tenderId}`)}
                    >
                      {a.tenderCode}
                    </Table.Cell>
                    <Table.Cell>{a.entityName}</Table.Cell>
                    <Table.Cell>${a.contractAmount.toLocaleString()}</Table.Cell>
                    <Table.Cell>${a.nationalAvg.toLocaleString()}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={a.deviationPct > 100 ? 'red' : 'yellow'}>+{a.deviationPct.toFixed(1)}%</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </>
      )}

      <Heading size="md" mb={3}>Comparación de Precios por Entidad y Tipo</Heading>
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Tipo Proceso</Table.ColumnHeader>
              <Table.ColumnHeader>Entidad</Table.ColumnHeader>
              <Table.ColumnHeader>Precio Promedio</Table.ColumnHeader>
              <Table.ColumnHeader>Promedio Nacional</Table.ColumnHeader>
              <Table.ColumnHeader>Desviación</Table.ColumnHeader>
              <Table.ColumnHeader>Contratos</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {indexData.map((item, i) => (
              <Table.Row key={i}>
                <Table.Cell>{item.processType}</Table.Cell>
                <Table.Cell
                  cursor={item.entityId ? 'pointer' : undefined}
                  color={item.entityId ? 'blue.500' : undefined}
                  _hover={item.entityId ? { textDecoration: 'underline' } : undefined}
                  onClick={() => item.entityId && navigate(`/analytics/entities/${item.entityId}`)}
                >
                  {item.entityName}
                </Table.Cell>
                <Table.Cell>${item.avgContractPrice.toLocaleString()}</Table.Cell>
                <Table.Cell>${item.nationalAvg.toLocaleString()}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={Math.abs(item.deviation) > 50 ? 'red' : Math.abs(item.deviation) > 20 ? 'yellow' : 'green'}>
                    {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                  </Badge>
                </Table.Cell>
                <Table.Cell>{item.contractCount}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {indexData.length === 0 && <Text mt={4} color="fg.muted" textAlign="center">Sin datos de precios disponibles.</Text>}
    </Box>
  );
}
