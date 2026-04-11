import { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, Table } from '@chakra-ui/react';
import {
  getCentralityRankings,
  getRiskPropagation,
  type CentralityItem,
  type RiskPropagationItem,
} from '../../services/analyticsService';

export default function NetworkRiskPage() {
  const [centrality, setCentrality] = useState<CentralityItem[]>([]);
  const [propagation, setPropagation] = useState<RiskPropagationItem[]>([]);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingP, setLoadingP] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingC(true);
    getCentralityRankings(50)
      .then((r) => setCentrality(r.data))
      .catch((e) => setError((prev) => prev || e.message))
      .finally(() => setLoadingC(false));
  }, []);

  useEffect(() => {
    setLoadingP(true);
    getRiskPropagation(50)
      .then((r) => setPropagation(r.data))
      .catch((e) => setError((prev) => prev || e.message))
      .finally(() => setLoadingP(false));
  }, []);

  return (
    <Box p={6}>
      <Heading size="lg" mb={1}>
        Riesgo de red
      </Heading>
      <Text color="fg.muted" mb={6} fontSize="sm">
        Centralidad de proveedores y propagación de riesgo en el grafo de relaciones.
      </Text>

      {error && <Text color="red.500" mb={4}>Error: {error}</Text>}

      <Heading size="md" mb={3}>
        Rankings de centralidad
      </Heading>
      {loadingC && <Spinner size="md" mb={8} />}
      {!loadingC && (
        <Box overflowX="auto" mb={10}>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                <Table.ColumnHeader>Provincia</Table.ColumnHeader>
                <Table.ColumnHeader>Grado</Table.ColumnHeader>
                <Table.ColumnHeader>PageRank</Table.ColumnHeader>
                <Table.ColumnHeader>Contratos</Table.ColumnHeader>
                <Table.ColumnHeader>Monto total</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {centrality.map((row) => (
                <Table.Row key={row.providerId}>
                  <Table.Cell fontWeight="medium">{row.providerName}</Table.Cell>
                  <Table.Cell>{row.province ?? '—'}</Table.Cell>
                  <Table.Cell>{row.degree}</Table.Cell>
                  <Table.Cell>{row.pageRank.toFixed(6)}</Table.Cell>
                  <Table.Cell>{row.contractCount}</Table.Cell>
                  <Table.Cell>${(row.totalAmount / 1000).toFixed(0)}k</Table.Cell>
                </Table.Row>
              ))}
              {centrality.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={6} textAlign="center" color="fg.muted">
                    Sin datos de centralidad.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <Heading size="md" mb={3}>
        Propagación de riesgo
      </Heading>
      {loadingP && <Spinner size="md" />}
      {!loadingP && (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Proveedor</Table.ColumnHeader>
                <Table.ColumnHeader>Riesgo propio</Table.ColumnHeader>
                <Table.ColumnHeader>Riesgo red</Table.ColumnHeader>
                <Table.ColumnHeader>Vecinos alto riesgo</Table.ColumnHeader>
                <Table.ColumnHeader>Incremento riesgo</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {propagation.map((row) => (
                <Table.Row key={row.providerId}>
                  <Table.Cell fontWeight="medium">{row.providerName}</Table.Cell>
                  <Table.Cell>{row.ownRiskScore.toFixed(3)}</Table.Cell>
                  <Table.Cell>{row.networkRiskScore.toFixed(3)}</Table.Cell>
                  <Table.Cell>{row.connectedHighRisk}</Table.Cell>
                  <Table.Cell>{row.riskIncrease.toFixed(3)}</Table.Cell>
                </Table.Row>
              ))}
              {propagation.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={5} textAlign="center" color="fg.muted">
                    Sin datos de propagación.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
}
