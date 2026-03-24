/**
 * CPProcessListPage - Lista de procesos de contratación pública
 * Tipos de proceso, filtros y estados se cargan desde la base de datos (catálogos).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Table,
  SimpleGrid,
  Input,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiPlus,
  FiArrowLeft,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSend,
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { get } from '../../utils/apiClient';
import { getLegalHelp, type CPLegalHelpResponse } from '../../services/cpAIService';
import { productTypeConfigService, type ProductTypeConfig } from '../../services/productTypeConfigService';
import { CPAIResponseDisplay } from '../../components/compras-publicas/ai/CPAIResponseDisplay';
import {
  listProcesses,
  getStatusColor,
  getStatusLabel,
  type CPProcessData,
} from '../../services/cpProcessService';

/** Tipo de proceso cargado del catálogo BD */
interface CatalogProcessType {
  code: string;
  name: string;
  description: string;
  productType: string;
}

/** Colores cíclicos para los tipos de proceso */
const PALETTE = ['blue', 'purple', 'green', 'orange', 'red', 'teal', 'cyan', 'pink', 'yellow'];

export const CPProcessListPage: React.FC = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  const [processes, setProcesses] = useState<CPProcessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Dialog state
  const [showNewProcessDialog, setShowNewProcessDialog] = useState(false);

  // AI Assistant state (general query)
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<CPLegalHelpResponse | null>(null);
  const [aiRecommendedCode, setAiRecommendedCode] = useState<string | null>(null);

  // AI per-card help state
  const [cardAiCode, setCardAiCode] = useState<string | null>(null);
  const [cardAiLoading, setCardAiLoading] = useState(false);
  const [cardAiResponse, setCardAiResponse] = useState<CPLegalHelpResponse | null>(null);

  // Loaded from DB catalogs
  const [catalogProcessTypes, setCatalogProcessTypes] = useState<CatalogProcessType[]>([]);
  const [catalogStatuses, setCatalogStatuses] = useState<Array<{ value: string; label: string }>>([]);

  // Load process types from product_type_config
  useEffect(() => {
    productTypeConfigService.getConfigsByCategory('COMPRAS_PUBLICAS')
      .then((configs: ProductTypeConfig[]) => {
        setCatalogProcessTypes(configs.map(c => {
          // Parse description: "Nombre - Descripción detallada"
          const fullDesc = c.description || '';
          const dashIdx = fullDesc.indexOf(' - ');
          const name = dashIdx > 0 ? fullDesc.substring(0, dashIdx).trim() : fullDesc;
          const description = dashIdx > 0 ? fullDesc.substring(dashIdx + 3).trim() : fullDesc;
          return {
            code: c.productType,
            name,
            description,
            productType: c.productType,
          };
        }));
      })
      .catch(() => setCatalogProcessTypes([]));

    // Load statuses from DB catalog
    get('/api/custom-catalogs/queries/codigo-padre/CP_ESTADO_PROCESO')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('not found');
      })
      .then((resp: { success: boolean; data: Array<{ codigo: string; nombre: string }> }) => {
        if (resp.success && resp.data) {
          setCatalogStatuses([
            { value: '', label: 'Todos los estados' },
            ...resp.data.map(d => ({ value: d.codigo, label: d.nombre })),
          ]);
        }
      })
      .catch(() => {
        setCatalogStatuses([{ value: '', label: 'Todos los estados' }]);
      });
  }, []);

  useEffect(() => {
    loadProcesses();
  }, [page, statusFilter, typeFilter]);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const result = await listProcesses(
        'EC',
        typeFilter || undefined,
        statusFilter || undefined,
        undefined,
        page,
        15
      );
      setProcesses(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch {
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  /** Navigate to the wizard using the productType from catalog */
  const handleSelectProcessType = (pt: CatalogProcessType) => {
    setShowNewProcessDialog(false);
    navigate(`/cp/nuevo/${pt.productType}`);
  };

  /** AI Assistant: ask which process type to use */
  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiRecommendedCode(null);
    try {
      // Build context with available process types from DB
      const typesContext = catalogProcessTypes.map(pt => `- ${pt.code}: ${pt.name} (${pt.description})`).join('\n');
      const response = await getLegalHelp({
        processType: 'SELECTOR',
        currentStep: 'PROCESS_SELECTION',
        fieldId: 'PROCESS_TYPE',
        question: `El usuario necesita: "${aiQuery}"\n\nTipos de proceso disponibles según LOSNCP:\n${typesContext}\n\nAnaliza la necesidad del usuario y recomienda el tipo de proceso de contratación pública más adecuado según la LOSNCP. Indica el código del proceso recomendado, los artículos legales aplicables, los umbrales de monto, y los requisitos principales. Si hay alternativas, menciónalas.`,
      });
      setAiResponse(response);

      // Try to detect which process type was recommended from the response
      const responseText = (response.title + ' ' + response.content).toUpperCase();
      for (const pt of catalogProcessTypes) {
        if (responseText.includes(pt.code) || responseText.includes(pt.name.toUpperCase())) {
          setAiRecommendedCode(pt.code);
          break;
        }
      }
    } catch {
      setAiResponse({
        title: 'Error',
        content: 'No se pudo consultar al asistente IA. Verifique que el servicio de IA esté configurado.',
        legalReferences: [],
        requirements: [],
        commonErrors: [],
        tips: [],
        examples: [],
        sercopResolutions: [],
        severity: 'WARNING',
        provider: '',
        model: '',
        processingTimeMs: 0,
        confidence: 0,
      });
    } finally {
      setAiLoading(false);
    }
  };

  /** AI help for a specific process type card */
  const handleCardAIHelp = async (pt: CatalogProcessType, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't navigate
    if (cardAiCode === pt.code && cardAiResponse) {
      // Toggle off if same card
      setCardAiCode(null);
      setCardAiResponse(null);
      return;
    }
    setCardAiCode(pt.code);
    setCardAiLoading(true);
    setCardAiResponse(null);
    try {
      const response = await getLegalHelp({
        processType: pt.productType,
        currentStep: 'OVERVIEW',
        fieldId: 'PROCESS_TYPE_INFO',
        question: `Explica detalladamente el proceso de contratación "${pt.name}" (${pt.code}) según la LOSNCP de Ecuador. Incluye: artículos aplicables, umbrales de monto, requisitos obligatorios, plazos, documentos necesarios, y el flujo paso a paso del procedimiento. Menciona resoluciones SERCOP relevantes.`,
      });
      setCardAiResponse(response);
    } catch {
      setCardAiResponse({
        title: 'Error',
        content: 'No se pudo consultar al asistente IA. Verifique que el servicio esté configurado.',
        legalReferences: [],
        requirements: [],
        commonErrors: [],
        tips: [],
        examples: [],
        sercopResolutions: [],
        severity: 'WARNING',
        provider: '',
        model: '',
        processingTimeMs: 0,
        confidence: 0,
      });
    } finally {
      setCardAiLoading(false);
    }
  };

  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';

  // Build filter options from catalog
  const filterTypes = [
    { value: '', label: 'Todos los tipos' },
    ...catalogProcessTypes.map(pt => ({ value: pt.code, label: pt.name })),
  ];

  return (
    <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box bgGradient={isDark ? 'linear(to-r, purple.600, blue.600)' : 'linear(to-r, purple.500, blue.500)'} h="4px" />
          <Box p={6}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <VStack align="start" gap={1}>
                <HStack>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/cp/dashboard')}>
                    <Icon as={FiArrowLeft} />
                  </Button>
                  <Icon as={FiFileText} boxSize={6} color={colors.primaryColor} />
                  <Heading size="lg">Procesos de Contratación</Heading>
                </HStack>
                <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                  {totalElements} procesos encontrados
                </Text>
              </VStack>
              <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setShowNewProcessDialog(true)}>
                Nuevo Proceso
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* Filters - from DB catalogs */}
        <HStack gap={3} flexWrap="wrap">
          <Box w="200px">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                background: isDark ? '#2D3748' : 'white',
                color: isDark ? '#E2E8F0' : '#1A202C',
                fontSize: '14px',
              }}
            >
              {filterTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </Box>
          <Box w="200px">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                background: isDark ? '#2D3748' : 'white',
                color: isDark ? '#E2E8F0' : '#1A202C',
                fontSize: '14px',
              }}
            >
              {catalogStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Box>
        </HStack>

        {/* Table */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" />
            </Flex>
          ) : processes.length === 0 ? (
            <Box p={10} textAlign="center">
              <Icon as={FiSearch} boxSize={10} color="gray.400" mb={3} />
              <Text color={isDark ? 'gray.400' : 'gray.500'}>No se encontraron procesos</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Código</Table.ColumnHeader>
                    <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                    <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                    <Table.ColumnHeader>RUC</Table.ColumnHeader>
                    <Table.ColumnHeader>Estado</Table.ColumnHeader>
                    <Table.ColumnHeader>Versión</Table.ColumnHeader>
                    <Table.ColumnHeader>Creado</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {processes.map((proc) => (
                    <Table.Row
                      key={proc.id}
                      cursor="pointer"
                      _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                      onClick={() => navigate(`/cp/process/${proc.processId}`)}
                    >
                      <Table.Cell fontWeight="medium" fontSize="sm">{proc.processCode || '-'}</Table.Cell>
                      <Table.Cell fontSize="sm">
                        <Badge colorPalette="purple" variant="subtle" size="sm">{proc.processType}</Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm">{proc.entityName || '-'}</Table.Cell>
                      <Table.Cell fontSize="xs" fontFamily="mono">{proc.entityRuc || '-'}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getStatusColor(proc.status)} size="sm">
                          {getStatusLabel(proc.status)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs">v{proc.version}</Table.Cell>
                      <Table.Cell fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                        {proc.createdAt ? new Date(proc.createdAt).toLocaleDateString('es-EC') : '-'}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" borderColor={cardBorder}>
              <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                Página {page + 1} de {totalPages}
              </Text>
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  leftIcon={<FiChevronLeft />}
                >
                  Anterior
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  rightIcon={<FiChevronRight />}
                >
                  Siguiente
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </VStack>

      {/* Process Type Selection Dialog - all from DB catalog */}
      {showNewProcessDialog && (
        <>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.500"
            zIndex={1000}
            onClick={() => setShowNewProcessDialog(false)}
          />
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w={{ base: '95vw', md: '700px' }}
            maxH="85vh"
            overflowY="auto"
            bg={cardBg}
            borderRadius="2xl"
            shadow="2xl"
            zIndex={1001}
            borderWidth="1px"
            borderColor={cardBorder}
          >
            <Box
              bgGradient={isDark ? 'to-r' : 'to-r'}
              gradientFrom="purple.500"
              gradientTo="blue.600"
              p={5}
              borderTopRadius="2xl"
              color="white"
            >
              <Flex justify="space-between" align="center">
                <VStack align="start" gap={1}>
                  <Heading size="md">Seleccionar Tipo de Proceso</Heading>
                  <Text fontSize="sm" opacity={0.9}>
                    Procedimientos de contratación según LOSNCP
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => setShowNewProcessDialog(false)}
                >
                  <FiX />
                </Button>
              </Flex>
            </Box>

            <Box p={5}>
              {/* AI Assistant Section */}
              <Box
                mb={5}
                p={4}
                borderWidth="1px"
                borderColor={isDark ? 'purple.700' : 'purple.200'}
                borderRadius="xl"
                bg={isDark ? 'purple.900' : 'purple.50'}
              >
                <HStack mb={3} gap={2}>
                  <Icon as={LuSparkles} color="purple.500" boxSize={5} />
                  <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                    Asistente IA - ¿Qué necesita contratar?
                  </Text>
                </HStack>
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} mb={3}>
                  Describa lo que necesita y la IA le recomendará el proceso adecuado según la LOSNCP
                </Text>
                <HStack gap={2}>
                  <Input
                    placeholder="Ej: Necesito comprar 200 pares de zapatos para el personal..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAIQuery()}
                    size="sm"
                    borderColor={isDark ? 'purple.600' : 'purple.300'}
                    _focus={{ borderColor: 'purple.500' }}
                    bg={isDark ? 'gray.800' : 'white'}
                  />
                  <Button
                    size="sm"
                    colorPalette="purple"
                    onClick={handleAIQuery}
                    disabled={aiLoading || !aiQuery.trim()}
                    loading={aiLoading}
                    flexShrink={0}
                  >
                    <Icon as={FiSend} mr={1} />
                    Consultar
                  </Button>
                </HStack>

                {/* AI Loading */}
                {aiLoading && (
                  <Flex justify="center" py={4}>
                    <VStack gap={2}>
                      <Spinner size="md" color="purple.500" />
                      <Text fontSize="xs" color="purple.500">Analizando según LOSNCP...</Text>
                    </VStack>
                  </Flex>
                )}

                {/* AI Response - Using shared component */}
                {aiResponse && !aiLoading && (
                  <Box mt={4}>
                    <CPAIResponseDisplay
                      response={aiResponse}
                      headerSubtitle="Recomendación de proceso según LOSNCP"
                    />
                  </Box>
                )}
              </Box>

              {/* Process Type Grid */}
              {catalogProcessTypes.length === 0 ? (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" />
                </Flex>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    {catalogProcessTypes.map((pt, idx) => {
                      const color = PALETTE[idx % PALETTE.length];
                      const isRecommended = aiRecommendedCode === pt.code;
                      const isCardAiActive = cardAiCode === pt.code;
                      return (
                        <Box
                          key={pt.code}
                          borderWidth={isRecommended ? '2px' : '1px'}
                          borderColor={isRecommended ? 'purple.500' : isCardAiActive ? 'purple.400' : cardBorder}
                          borderRadius="xl"
                          transition="all 0.2s"
                          bg={isRecommended ? (isDark ? 'purple.900' : 'purple.50') : undefined}
                          shadow={isRecommended || isCardAiActive ? 'md' : undefined}
                          _hover={{
                            borderColor: `${color}.400`,
                            shadow: 'md',
                          }}
                          overflow="hidden"
                        >
                          <Flex
                            p={4}
                            cursor="pointer"
                            role="group"
                            _hover={{
                              bg: isDark ? `${color}.900` : `${color}.50`,
                              transform: 'translateY(-1px)',
                            }}
                            transition="all 0.2s"
                            onClick={() => handleSelectProcessType(pt)}
                            justify="space-between"
                            align="center"
                          >
                            <HStack gap={3} flex={1}>
                              <Flex
                                w={11}
                                h={11}
                                borderRadius="xl"
                                bg={`${color}.${isDark ? '900' : '50'}`}
                                color={`${color}.${isDark ? '300' : '500'}`}
                                align="center"
                                justify="center"
                                flexShrink={0}
                                boxShadow={`0 0 16px var(--chakra-colors-${color}-${isDark ? '800' : '200'}), 0 4px 12px var(--chakra-colors-${color}-${isDark ? '900' : '100'})`}
                                border="1px solid"
                                borderColor={`${color}.${isDark ? '700' : '200'}`}
                                transition="all 0.3s"
                                _groupHover={{
                                  boxShadow: `0 0 24px var(--chakra-colors-${color}-${isDark ? '700' : '300'}), 0 4px 16px var(--chakra-colors-${color}-${isDark ? '800' : '200'})`,
                                  transform: 'scale(1.05)',
                                }}
                              >
                                <Icon as={FiFileText} boxSize={5} />
                              </Flex>
                              <VStack align="start" gap={0} flex={1}>
                                <HStack flexWrap="wrap">
                                  <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                                    {pt.name}
                                  </Text>
                                  {isRecommended && (
                                    <Badge colorPalette="purple" variant="solid" size="sm">
                                      <Icon as={LuSparkles} mr={1} />
                                      Recomendado
                                    </Badge>
                                  )}
                                </HStack>
                                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                                  {pt.description}
                                </Text>
                              </VStack>
                            </HStack>
                            {/* AI Help Button */}
                            <Button
                              size="xs"
                              variant={isCardAiActive ? 'solid' : 'ghost'}
                              colorPalette="purple"
                              ml={2}
                              flexShrink={0}
                              onClick={(e) => handleCardAIHelp(pt, e)}
                              loading={cardAiLoading && cardAiCode === pt.code}
                              title="Ayuda IA sobre este proceso"
                              borderRadius="full"
                              w={8}
                              h={8}
                              p={0}
                              minW="auto"
                            >
                              <Icon as={LuSparkles} boxSize={3.5} />
                            </Button>
                          </Flex>
                        </Box>
                      );
                    })}
                  </SimpleGrid>

                  {/* Card AI Response - Using shared component */}
                  {cardAiCode && cardAiResponse && !cardAiLoading && (
                    <Box mt={4}>
                      <CPAIResponseDisplay
                        response={cardAiResponse}
                        headerSubtitle={`${catalogProcessTypes.find(p => p.code === cardAiCode)?.name} - Marco Legal`}
                        onClose={() => { setCardAiCode(null); setCardAiResponse(null); }}
                      />
                    </Box>
                  )}

                  {/* Card AI Loading indicator */}
                  {cardAiLoading && (
                    <Flex justify="center" py={6} mt={3}>
                      <VStack gap={2}>
                        <Spinner size="lg" color="purple.500" />
                        <Text fontSize="sm" color="purple.500" fontWeight="500">
                          Consultando marco legal LOSNCP...
                        </Text>
                        <Text fontSize="2xs" color={isDark ? 'gray.400' : 'gray.500'}>
                          Analizando artículos, umbrales y requisitos
                        </Text>
                      </VStack>
                    </Flex>
                  )}
                </>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CPProcessListPage;
