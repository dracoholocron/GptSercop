import { useState } from 'react';
import { Box, Flex, Heading, Text, VStack, Input, Button, Checkbox, HStack, Badge, Icon } from '@chakra-ui/react';
import { apiClient } from '../../utils/apiClient';
import { LuSearch, LuSparkles, LuCalendar, LuBuilding } from 'react-icons/lu';

// Chakra UI v3 Checkbox wrapper (Checkbox is a namespace, not a direct component)
const CheckboxItem = ({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) => (
  <Checkbox.Root checked={checked} onCheckedChange={onChange} size="sm" cursor="pointer">
    <Checkbox.HiddenInput />
    <Checkbox.Control />
    <Checkbox.Label>{children}</Checkbox.Label>
  </Checkbox.Root>
);

export const AdvancedSearchPage = () => {
  const [filters, setFilters] = useState({ q: '', ragQuery: '', minAmount: '', maxAmount: '', processTypes: [] as string[], statuses: [] as string[] });
  const [results, setResults] = useState<any[]>([]);
  const [ragSummary, setRagSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ totalCount: 0 });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Transform arrays if needed
    const payload = {
      ...filters,
      minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined
    };

    try {
      const res = await apiClient('/v1/tenders/advanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResults(data.data || []);
      setRagSummary(data.ragSummary || '');
      if (data.pagination) setPagination(data.pagination);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayFilter = (field: 'processTypes' | 'statuses', val: string) => {
    setFilters(prev => {
      const arr = prev[field];
      if (arr.includes(val)) return { ...prev, [field]: arr.filter(x => x !== val) };
      return { ...prev, [field]: [...arr, val] };
    });
  };

  return (
    <Flex bg="gray.50" minH="100vh" w="100%">
      {/* Sidebar Filtros */}
      <Box w="320px" bg="white" borderRight="1px solid" borderColor="gray.200" p={6} display={{ base: 'none', md: 'block' }}>
        <Heading size="md" mb={6} color="gray.800">Filtros Avanzados</Heading>
        
        <VStack align="stretch" gap={6}>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Palabra Clave (Título)</Text>
            <Input size="sm" placeholder="Construcción, Laptops..." value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Rango de Monto (USD)</Text>
            <HStack>
              <Input size="sm" type="number" placeholder="Min" value={filters.minAmount} onChange={e => setFilters({...filters, minAmount: e.target.value})} />
              <Text color="gray.400">-</Text>
              <Input size="sm" type="number" placeholder="Max" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: e.target.value})} />
            </HStack>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Tipo de Procedimiento</Text>
            <VStack align="start">
              <CheckboxItem checked={filters.processTypes.includes('LICITACION')} onChange={() => toggleArrayFilter('processTypes', 'LICITACION')}>Licitación</CheckboxItem>
              <CheckboxItem checked={filters.processTypes.includes('INFIMA_CUANTIA')} onChange={() => toggleArrayFilter('processTypes', 'INFIMA_CUANTIA')}>Ínfima Cuantía</CheckboxItem>
              <CheckboxItem checked={filters.processTypes.includes('SUBASTA_INVERSA')} onChange={() => toggleArrayFilter('processTypes', 'SUBASTA_INVERSA')}>Subasta Inversa</CheckboxItem>
            </VStack>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Estado del Proceso</Text>
            <VStack align="start">
              <CheckboxItem checked={filters.statuses.includes('published')} onChange={() => toggleArrayFilter('statuses', 'published')}>Publicado</CheckboxItem>
              <CheckboxItem checked={filters.statuses.includes('awarded')} onChange={() => toggleArrayFilter('statuses', 'awarded')}>Adjudicado</CheckboxItem>
            </VStack>
          </Box>

              <Button mt={4} colorPalette="blue" onClick={() => handleSearch()} w="full">Aplicar Filtros</Button>
        </VStack>
      </Box>

      {/* Main Content */}
      <Flex flex={1} direction="column" p={8} gap={6} overflowY="auto">
        
        {/* RAG Search Bar */}
        <Box bg="white" p={6} borderRadius="xl" borderWidth="1px" borderColor="blue.100" boxShadow="sm">
          <HStack mb={2} color="blue.800">
            <Icon as={LuSparkles} boxSize={6} color="blue.500" />
            <Heading size="md">Búsqueda Semántica Asistida (RAG)</Heading>
          </HStack>
          <Text color="gray.500" fontSize="sm" mb={4}>Escribe en lenguaje natural lo que buscas. Nuestro bot analizará pliegos, resoluciones y CPCs vinculados.</Text>
          <Box as="form" onSubmit={handleSearch}>
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <Input size="lg" flex={1} borderColor="blue.200" focusBorderColor="blue.500" placeholder="Ej: Quiero ver licitaciones de mantenimiento de aires acondicionados en Guayas del último mes..." value={filters.ragQuery} onChange={e => setFilters({...filters, ragQuery: e.target.value})} />
              <Button type="submit" size="lg" colorPalette="blue" px={8} loading={loading}>Consultar</Button>
            </Flex>
          </Box>
        </Box>

        {/* Results Metadata */}
        <HStack justify="space-between" align="flex-end">
          <Text fontWeight="medium" color="gray.600">
            Se encontraron <Text as="span" color="blue.600" fontWeight="bold">{pagination.totalCount}</Text> procesos
          </Text>
        </HStack>

        {/* RAG Summary Box */}
        {ragSummary && (
          <Box bg="teal.50" borderColor="teal.200" borderWidth="1px" p={5} borderRadius="lg" color="teal.800" fontSize="sm" lineHeight="tall">
            <Text fontWeight="bold" color="teal.900" mb={2}>💡 Análisis de IA (GPT-Sercop):</Text>
            {ragSummary}
          </Box>
        )}

        {/* Cards Grid */}
        <VStack align="stretch" gap={4}>
          {results.map(r => (
            <Flex key={r.id} bg="white" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.200" _hover={{ boxShadow: 'md', borderColor: 'blue.300' }} transition="all 0.2s" direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={4} cursor="pointer">
              <Box flex={1}>
                <HStack mb={2}>
                  <Badge colorPalette="blue" px={2} py={0.5} borderRadius="md">{r.processType || 'LICITACION'}</Badge>
                  <Badge colorPalette={r.status === 'published' ? 'green' : 'gray'} px={2} py={0.5} borderRadius="md">{r.status?.toUpperCase()}</Badge>
                </HStack>
                <Heading size="sm" color="gray.800" mb={1} _hover={{ color: 'blue.600' }}>{r.title}</Heading>
                <Text fontSize="sm" color="gray.500" lineClamp={2}>{r.description || 'Sin descripción detallada.'}</Text>
                <HStack fontSize="xs" fontWeight="medium" color="gray.400" mt={3} gap={4}>
                  <HStack><Icon as={LuBuilding} /> <Text>{r.procurementPlan?.entity?.name || 'ENTIDAD STUB'}</Text></HStack>
                  <HStack><Icon as={LuCalendar} /> <Text>{new Date(r.publishedAt || r.createdAt).toLocaleDateString()}</Text></HStack>
                </HStack>
              </Box>
              <Box textAlign={{ base: 'left', md: 'right' }} flexShrink={0}>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Monto Estimado</Text>
                <Text fontSize="2xl" fontWeight="black" color="gray.700">${Number(r.estimatedAmount || 0).toLocaleString()}</Text>
              </Box>
            </Flex>
          ))}
          {!loading && results.length === 0 && (
            <Box textAlign="center" py={16} color="gray.400" bg="gray.50" borderWidth="2px" borderStyle="dashed" borderColor="gray.200" borderRadius="xl">
              <Icon as={LuSearch} boxSize={10} mb={2} />
              <Text>No se encontraron resultados para tu búsqueda.</Text>
            </Box>
          )}
        </VStack>
      </Flex>
    </Flex>
  );
};

export default AdvancedSearchPage;
