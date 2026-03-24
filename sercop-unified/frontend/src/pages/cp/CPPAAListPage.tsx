/**
 * CPPAAListPage - Lista de Planes Anuales de Adquisiciones
 * Muestra todos los PAAs con filtros por pais y anio fiscal.
 * Permite navegar al detalle/edicion de cada PAA y crear nuevos.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Flex,
  Spinner,
  Center,
  Button,
  Icon,
  Badge,
  Input,
  Table,
  Card,
  IconButton,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  FiPlus,
  FiEdit,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import {
  listPAAs,
  createPAA,
  getPAAStatusColor,
  formatCurrency,
  type CPPAA,
} from '../../services/cpPAAService';
import CPPAAWizardChat from '../../components/compras-publicas/ai/CPPAAWizardChat';

export const CPPAAListPage: React.FC = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  // State
  const [paas, setPaas] = useState<CPPAA[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [countryCode, setCountryCode] = useState('EC');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityRuc, setNewEntityRuc] = useState('');

  // Design tokens
  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const headerBg = isDark ? 'gray.900' : 'gray.50';
  const accentGradient = isDark
    ? 'linear(to-r, blue.600, purple.600)'
    : 'linear(to-r, blue.500, purple.500)';
  const rowHoverBg = isDark ? 'gray.700' : 'gray.50';

  // Load PAAs
  const loadPAAs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPAAs(countryCode, fiscalYear);
      setPaas(data);
    } catch (error) {
      toaster.create({
        title: t('cpPAA.errorLoading', 'Error al cargar PAAs'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Error desconocido'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [countryCode, fiscalYear, t]);

  useEffect(() => {
    loadPAAs();
  }, [loadPAAs]);

  // Open create dialog
  const openCreateDialog = () => {
    setNewEntityName('');
    setNewEntityRuc('');
    setCreateDialogOpen(true);
  };

  // Create new PAA
  const handleCreatePAA = async () => {
    if (!newEntityName.trim()) {
      toaster.create({
        title: 'Nombre de entidad requerido',
        description: 'Ingrese el nombre de la entidad contratante',
        type: 'warning',
        duration: 3000,
      });
      return;
    }
    setCreating(true);
    try {
      const newPAA = await createPAA({
        entityRuc: newEntityRuc.trim(),
        entityName: newEntityName.trim(),
        countryCode,
        fiscalYear,
      });
      setCreateDialogOpen(false);
      toaster.create({
        title: t('cpPAA.created', 'PAA creado exitosamente'),
        type: 'success',
        duration: 3000,
      });
      navigate(`/cp/paa/${newPAA.id}`);
    } catch (error) {
      toaster.create({
        title: t('cpPAA.errorCreating', 'Error al crear PAA'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Error desconocido'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  };

  // Navigate to edit
  const handleRowClick = (paa: CPPAA) => {
    navigate(`/cp/paa/${paa.id}`);
  };

  // Year options (last 3 years + next year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Handler for wizard "Create PAA" action
  const handleWizardCreatePAA = useCallback(async (data: { entityName: string; entityRuc: string }) => {
    setCreating(true);
    try {
      const newPAA = await createPAA({
        entityRuc: data.entityRuc,
        entityName: data.entityName,
        countryCode,
        fiscalYear,
      });
      toaster.create({
        title: 'PAA creado exitosamente',
        description: `PAA para "${data.entityName}" - ${fiscalYear}`,
        type: 'success',
        duration: 3000,
      });
      navigate(`/cp/paa/${newPAA.id}`);
    } catch (error) {
      toaster.create({
        title: 'Error al crear PAA',
        description: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  }, [countryCode, fiscalYear, navigate]);

  return (
    <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Header with gradient accent */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          overflow="hidden"
          shadow="sm"
        >
          <Box bgGradient={accentGradient} h="4px" />
          <Box p={6}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
              gap={4}
            >
              <VStack align="start" gap={1}>
                <HStack>
                  <Icon as={FiFileText} boxSize={6} color={colors.primaryColor} />
                  <Heading size="lg" color={colors.textColor}>
                    {t('cpPAA.title', 'Plan Anual de Adquisiciones')}
                  </Heading>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('cpPAA.subtitle', 'Gestione los planes anuales de adquisiciones de las entidades contratantes')}
                </Text>
              </VStack>

              <Button
                colorPalette="blue"
                onClick={openCreateDialog}
                loading={creating}
                disabled={creating}
                size="sm"
              >
                <Icon as={FiPlus} mr={2} />
                {t('cpPAA.create', 'Crear PAA')}
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* Filters */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          p={4}
          shadow="sm"
        >
          <HStack gap={4} flexWrap="wrap">
            <Box minW="160px">
              <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                {t('cpPAA.filters.country', 'Pais')}
              </Text>
              <NativeSelectRoot size="sm">
                <NativeSelectField
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  bg={cardBg}
                  borderColor={cardBorder}
                  color={colors.textColor}
                >
                  <option value="EC">Ecuador</option>
                  <option value="CO">Colombia</option>
                  <option value="PE">Peru</option>
                  <option value="CL">Chile</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Box>

            <Box minW="140px">
              <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                <Icon as={FiCalendar} boxSize={3} mr={1} />
                {t('cpPAA.filters.fiscalYear', 'Anio Fiscal')}
              </Text>
              <NativeSelectRoot size="sm">
                <NativeSelectField
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  bg={cardBg}
                  borderColor={cardBorder}
                  color={colors.textColor}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </Box>

            <Box flex={1} display="flex" alignItems="flex-end">
              <Badge colorPalette="blue" variant="subtle" fontSize="xs">
                {loading
                  ? t('common.loading', 'Cargando...')
                  : t('cpPAA.resultCount', '{{count}} resultados', { count: paas.length })}
              </Badge>
            </Box>
          </HStack>
        </Box>

        {/* AI Interactive Wizard */}
        <CPPAAWizardChat
          fiscalYear={fiscalYear}
          onCreatePAA={handleWizardCreatePAA}
        />

        {/* Table */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          overflow="hidden"
          shadow="sm"
        >
          {loading ? (
            <Center py={16}>
              <VStack gap={4}>
                <Spinner size="xl" color={colors.primaryColor} />
                <Text color={colors.textColorSecondary}>{t('common.loading', 'Cargando...')}</Text>
              </VStack>
            </Center>
          ) : paas.length === 0 ? (
            <Center py={16}>
              <VStack gap={4}>
                <Icon as={FiAlertTriangle} boxSize={12} color="orange.400" />
                <Text color={colors.textColor} fontSize="lg">
                  {t('cpPAA.noResults', 'No se encontraron PAAs para los filtros seleccionados')}
                </Text>
                <Button colorPalette="blue" variant="outline" onClick={handleCreatePAA} size="sm">
                  <Icon as={FiPlus} mr={2} />
                  {t('cpPAA.createFirst', 'Crear el primer PAA')}
                </Button>
              </VStack>
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row bg={headerBg}>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3}>
                      {t('cpPAA.table.entity', 'Entidad')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3}>
                      {t('cpPAA.table.ruc', 'RUC')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3} textAlign="center">
                      <Icon as={FiCalendar} boxSize={3} mr={1} />
                      {t('cpPAA.table.fiscalYear', 'Anio')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3} textAlign="center">
                      {t('cpPAA.table.version', 'Version')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3} textAlign="center">
                      {t('cpPAA.table.status', 'Estado')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3} textAlign="right">
                      <Icon as={FiDollarSign} boxSize={3} mr={1} />
                      {t('cpPAA.table.totalBudget', 'Presupuesto Total')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3} textAlign="center">
                      {t('cpPAA.table.items', 'Items')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={4} py={3} textAlign="center">
                      {t('cpPAA.table.actions', 'Acciones')}
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paas.map((paa) => (
                    <Table.Row
                      key={paa.id}
                      cursor="pointer"
                      onClick={() => handleRowClick(paa)}
                      _hover={{ bg: rowHoverBg }}
                      transition="background 0.15s"
                    >
                      <Table.Cell px={4} py={3}>
                        <VStack align="start" gap={0}>
                          <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
                            {paa.entityName || t('cpPAA.noEntityName', 'Sin nombre')}
                          </Text>
                        </VStack>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Text fontSize="sm" color={colors.textColorSecondary} fontFamily="mono">
                          {paa.entityRuc || '-'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="center">
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
                          {paa.fiscalYear}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="center">
                        <Badge colorPalette="purple" variant="subtle" size="sm">
                          v{paa.version}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="center">
                        <Badge
                          colorPalette={getPAAStatusColor(paa.status)}
                          variant="subtle"
                        >
                          {paa.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="right">
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor} fontFamily="mono">
                          {formatCurrency(paa.totalBudget)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="center">
                        <Badge colorPalette="blue" variant="outline" size="sm">
                          {paa.items?.length ?? 0}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="center">
                        <IconButton
                          aria-label={t('cpPAA.edit', 'Editar PAA')}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cp/paa/${paa.id}`);
                          }}
                        >
                          <Icon as={FiEdit} />
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>

        {/* Summary cards */}
        {!loading && paas.length > 0 && (
          <Flex gap={4} flexWrap="wrap">
            <Card.Root bg={cardBg} borderColor={cardBorder} flex={1} minW="200px">
              <Card.Body p={4}>
                <HStack gap={3}>
                  <Flex
                    w={10}
                    h={10}
                    borderRadius="lg"
                    bg={isDark ? 'blue.900' : 'blue.100'}
                    color={isDark ? 'blue.300' : 'blue.600'}
                    align="center"
                    justify="center"
                  >
                    <Icon as={FiFileText} boxSize={5} />
                  </Flex>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('cpPAA.summary.totalPAAs', 'Total PAAs')}
                    </Text>
                    <Text fontSize="xl" fontWeight="700" color={colors.textColor}>
                      {paas.length}
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg={cardBg} borderColor={cardBorder} flex={1} minW="200px">
              <Card.Body p={4}>
                <HStack gap={3}>
                  <Flex
                    w={10}
                    h={10}
                    borderRadius="lg"
                    bg={isDark ? 'green.900' : 'green.100'}
                    color={isDark ? 'green.300' : 'green.600'}
                    align="center"
                    justify="center"
                  >
                    <Icon as={FiDollarSign} boxSize={5} />
                  </Flex>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('cpPAA.summary.totalBudget', 'Presupuesto Total')}
                    </Text>
                    <Text fontSize="xl" fontWeight="700" color={colors.textColor}>
                      {formatCurrency(paas.reduce((sum, p) => sum + p.totalBudget, 0))}
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg={cardBg} borderColor={cardBorder} flex={1} minW="200px">
              <Card.Body p={4}>
                <HStack gap={3}>
                  <Flex
                    w={10}
                    h={10}
                    borderRadius="lg"
                    bg={isDark ? 'purple.900' : 'purple.100'}
                    color={isDark ? 'purple.300' : 'purple.600'}
                    align="center"
                    justify="center"
                  >
                    <Icon as={FiUsers} boxSize={5} />
                  </Flex>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('cpPAA.summary.totalItems', 'Total Items')}
                    </Text>
                    <Text fontSize="xl" fontWeight="700" color={colors.textColor}>
                      {paas.reduce((sum, p) => sum + (p.items?.length ?? 0), 0)}
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Flex>
        )}
      </VStack>

      {/* Create PAA Dialog */}
      <DialogRoot open={createDialogOpen} onOpenChange={(e) => setCreateDialogOpen(e.open)}>
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, minWidth: '500px' }}>
          <DialogHeader>
            <Heading size="md" color={colors.textColor}>
              <HStack gap={2}>
                <Icon as={FiFileText} color={colors.primaryColor} />
                <Text>Crear Plan Anual de Adquisiciones</Text>
              </HStack>
            </Heading>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                  Entidad Contratante *
                </Text>
                <Input
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="Ej: Ministerio de Educación"
                  size="sm"
                  bg={cardBg}
                  borderColor={cardBorder}
                  color={colors.textColor}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                  RUC de la Entidad
                </Text>
                <Input
                  value={newEntityRuc}
                  onChange={(e) => setNewEntityRuc(e.target.value)}
                  placeholder="Ej: 1760000160001"
                  size="sm"
                  bg={cardBg}
                  borderColor={cardBorder}
                  color={colors.textColor}
                  maxLength={13}
                  fontFamily="mono"
                />
              </Box>
              <HStack gap={3}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                    País
                  </Text>
                  <Badge colorPalette="blue" variant="subtle" px={3} py={1}>
                    {countryCode === 'EC' ? 'Ecuador' : countryCode}
                  </Badge>
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                    Año Fiscal
                  </Text>
                  <Badge colorPalette="purple" variant="subtle" px={3} py={1}>
                    {fiscalYear}
                  </Badge>
                </Box>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} size="sm">
              Cancelar
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleCreatePAA}
              loading={creating}
              disabled={creating || !newEntityName.trim()}
              size="sm"
            >
              <Icon as={FiPlus} mr={2} />
              Crear PAA
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default CPPAAListPage;
