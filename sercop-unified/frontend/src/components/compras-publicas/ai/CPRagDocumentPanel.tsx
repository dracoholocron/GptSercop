import React, { useState } from 'react';
import { Box, Button, Card, HStack, Icon, Input, Text, VStack } from '@chakra-ui/react';
import { FiSearch, FiBookOpen } from 'react-icons/fi';
import { askNormativeAssistant, searchNormativeContext, type RagSearchItem } from '../../../services/gptsercopService';

export const CPRagDocumentPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RagSearchItem[]>([]);
  const [answer, setAnswer] = useState('');

  const runSearch = async () => {
    setLoading(true);
    try {
      const [chunks, ragAnswer] = await Promise.all([
        searchNormativeContext(query),
        askNormativeAssistant(query),
      ]);
      setResults(chunks);
      setAnswer(ragAnswer.answer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card.Root>
      <Card.Header>
        <VStack align="start" gap={1}>
          <Text fontWeight="bold">Inteligencia Documental (RAG)</Text>
          <Text fontSize="sm" color="gray.500">
            Consulta normativa y recupera contexto relevante para decisiones de compra publica.
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <HStack>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: requisitos para subasta inversa en etapa de pliegos"
            />
            <Button onClick={runSearch} loading={loading} colorPalette="blue">
              <Icon as={FiSearch} mr={2} />
              Buscar
            </Button>
          </HStack>

          {answer ? (
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="semibold" mb={1}>Respuesta asistida</Text>
              <Text fontSize="sm">{answer}</Text>
            </Box>
          ) : null}

          <VStack align="stretch" gap={2}>
            {results.map((item) => (
              <Box key={item.id} p={3} borderWidth="1px" borderRadius="md">
                <HStack mb={1}>
                  <Icon as={FiBookOpen} color="blue.500" />
                  <Text fontWeight="semibold" fontSize="sm">{item.title}</Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">{item.source}</Text>
                {item.snippet ? <Text mt={2} fontSize="sm">{item.snippet}</Text> : null}
              </Box>
            ))}
            {!loading && results.length === 0 ? (
              <Text fontSize="sm" color="gray.500">Sin resultados por ahora. Ajusta la consulta para obtener contexto.</Text>
            ) : null}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default CPRagDocumentPanel;
