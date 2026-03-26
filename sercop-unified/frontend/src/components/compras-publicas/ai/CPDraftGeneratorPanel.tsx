import React, { useState } from 'react';
import { Box, Button, Card, HStack, Input, Text, Textarea, VStack, Badge } from '@chakra-ui/react';
import { analyzeProcurementWithGpt } from '../../../services/gptsercopService';

export const CPDraftGeneratorPanel: React.FC = () => {
  const [tenderId, setTenderId] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();

  const generateDraft = async () => {
    setLoading(true);
    try {
      const response = await analyzeProcurementWithGpt({ tenderId, question });
      setSummary(response.summary);
      setRecommendations(response.recommendations);
      setFallbackReason(response.fallbackReason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card.Root>
      <Card.Header>
        <VStack align="start" gap={1}>
          <Text fontWeight="bold">Flujo Avanzado de Generacion</Text>
          <Text fontSize="sm" color="gray.500">
            Genera borradores y recomendaciones accionables para el proceso con analisis GPTsercop.
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Input
            placeholder="ID de proceso (opcional)"
            value={tenderId}
            onChange={(e) => setTenderId(e.target.value)}
          />
          <Textarea
            placeholder="Describe el objetivo del borrador o pregunta avanzada"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
          />
          <Button onClick={generateDraft} loading={loading} colorPalette="teal">
            Generar borrador asistido
          </Button>

          {summary ? (
            <Box p={3} borderWidth="1px" borderRadius="md">
              <HStack mb={2}>
                <Text fontWeight="semibold">Resumen generado</Text>
                {fallbackReason ? <Badge colorPalette="orange">{fallbackReason}</Badge> : null}
              </HStack>
              <Text fontSize="sm">{summary}</Text>
            </Box>
          ) : null}

          {recommendations.length > 0 ? (
            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontWeight="semibold" mb={2}>Recomendaciones</Text>
              <VStack align="start" gap={1}>
                {recommendations.map((item, idx) => (
                  <Text key={`${item}-${idx}`} fontSize="sm">- {item}</Text>
                ))}
              </VStack>
            </Box>
          ) : null}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default CPDraftGeneratorPanel;
