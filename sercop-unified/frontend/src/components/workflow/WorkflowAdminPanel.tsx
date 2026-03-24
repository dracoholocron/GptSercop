/**
 * WorkflowAdminPanel Component
 * Unified administration panel for all workflow configuration.
 * Uses Chakra UI for styling and i18n for translations.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  SimpleGrid,
  Badge,
  Spinner,
  Alert,
} from '@chakra-ui/react';
import { DataTable, type DataTableColumn } from '../ui/DataTable';
import {
  FiSettings,
  FiUsers,
  FiGlobe,
  FiZap,
  FiArrowRight,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiCornerDownRight,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { backofficeRequestService } from '../../services/backofficeRequestService';

// Types
interface StageRoleAssignment {
  id: number;
  stageCode: string;
  roleName: string;
  canView: boolean;
  canExecute: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  approvalLevel?: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  isActive: boolean;
}

interface ExternalApiConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  baseUrl: string;
  path: string;
  httpMethod: string;
  active: boolean;
  environment?: string;
}

interface EventRule {
  id: number;
  code: string;
  name: string;
  description?: string;
  tipoOperacion: string;
  eventoTrigger: string;
  accionesJson: string;
  prioridad: number;
  activo: boolean;
}

interface WorkflowStage {
  code: string;
  nameKey: string;
  descriptionKey: string;
  color: string;
  order: number;
}

type TabId = 'overview' | 'stages' | 'roles' | 'apis' | 'rules';

const WORKFLOW_STAGES: WorkflowStage[] = [
  { code: 'RECEPCION', nameKey: 'workflow.stage.RECEPCION', descriptionKey: 'workflow.stage.RECEPCION.desc', color: 'blue', order: 1 },
  { code: 'VALIDACION', nameKey: 'workflow.stage.VALIDACION', descriptionKey: 'workflow.stage.VALIDACION.desc', color: 'cyan', order: 2 },
  { code: 'COMPLIANCE', nameKey: 'workflow.stage.COMPLIANCE', descriptionKey: 'workflow.stage.COMPLIANCE.desc', color: 'purple', order: 3 },
  { code: 'APROBACION', nameKey: 'workflow.stage.APROBACION', descriptionKey: 'workflow.stage.APROBACION.desc', color: 'yellow', order: 4 },
  { code: 'COMISIONES', nameKey: 'workflow.stage.COMISIONES', descriptionKey: 'workflow.stage.COMISIONES.desc', color: 'green', order: 5 },
  { code: 'REGISTRO', nameKey: 'workflow.stage.REGISTRO', descriptionKey: 'workflow.stage.REGISTRO.desc', color: 'teal', order: 6 },
  { code: 'FINALIZADO', nameKey: 'workflow.stage.FINALIZADO', descriptionKey: 'workflow.stage.FINALIZADO.desc', color: 'green', order: 7 },
  { code: 'RECHAZADO', nameKey: 'workflow.stage.RECHAZADO', descriptionKey: 'workflow.stage.RECHAZADO.desc', color: 'red', order: 8 },
  { code: 'DEVUELTO', nameKey: 'workflow.stage.DEVUELTO', descriptionKey: 'workflow.stage.DEVUELTO.desc', color: 'orange', order: 9 },
];

export const WorkflowAdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(false);
  const [stageRoles, setStageRoles] = useState<StageRoleAssignment[]>([]);
  const [externalApis, setExternalApis] = useState<ExternalApiConfig[]>([]);
  const [eventRules, setEventRules] = useState<EventRule[]>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const ROLE_LABELS: Record<string, string> = {
    ROLE_OPERATOR: t('workflow.role.operator', 'Operador'),
    ROLE_MANAGER: t('workflow.role.manager', 'Supervisor'),
    ROLE_ADMIN: t('workflow.role.admin', 'Jefe Comex'),
    ROLE_COMPLIANCE: t('workflow.role.compliance', 'Compliance'),
  };

  // Fetch all configuration data
  const fetchData = async () => {
    setLoading(true);
    setConfigError(null);
    let failedCount = 0;
    try {
      const rolesPromises = WORKFLOW_STAGES.map(stage =>
        backofficeRequestService.getStageConfig(stage.code)
      );
      const rolesResults = await Promise.all(rolesPromises);
      const allRoles: StageRoleAssignment[] = [];
      rolesResults.forEach(result => {
        if (result && result.roleAssignments) {
          allRoles.push(...(result.roleAssignments as StageRoleAssignment[]));
        } else {
          failedCount++;
        }
      });
      setStageRoles(allRoles);

      if (failedCount === WORKFLOW_STAGES.length) {
        setConfigError(t('workflow.error.loadFailed', 'No se pudo cargar la configuracion de roles.'));
      }

      setExternalApis(getMockApis());
      setEventRules(getMockRules());
    } catch (error) {
      console.error('Error fetching workflow configuration:', error);
      setConfigError(t('workflow.error.connectionFailed', 'Error de conexion al cargar la configuracion.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMockApis = (): ExternalApiConfig[] => [
    { id: 1, code: 'CORE_BANKING_CLIENT_CHECK', name: t('workflow.api.clientCheck', 'Verificacion Cliente'), description: t('workflow.api.clientCheck.desc', 'Verifica cliente en core'), baseUrl: '#{env.CORE_BANKING_URL}', path: '/api/v1/clients/#{clientId}/status', httpMethod: 'GET', active: true, environment: 'PRODUCTION' },
    { id: 2, code: 'CORE_BANKING_CREDIT_LINE', name: t('workflow.api.creditLine', 'Linea de Credito'), description: t('workflow.api.creditLine.desc', 'Verifica linea de credito'), baseUrl: '#{env.CORE_BANKING_URL}', path: '/api/v1/clients/#{clientId}/credit-lines', httpMethod: 'GET', active: true, environment: 'PRODUCTION' },
    { id: 3, code: 'CORE_BANKING_LIMIT_CHECK', name: t('workflow.api.limitCheck', 'Verificacion Limites'), description: t('workflow.api.limitCheck.desc', 'Verifica limites'), baseUrl: '#{env.CORE_BANKING_URL}', path: '/api/v1/clients/#{clientId}/limits', httpMethod: 'POST', active: true, environment: 'PRODUCTION' },
    { id: 4, code: 'CORE_BANKING_BLOCKS_CHECK', name: t('workflow.api.blocksCheck', 'Verificacion Bloqueos'), description: t('workflow.api.blocksCheck.desc', 'Verifica bloqueos'), baseUrl: '#{env.CORE_BANKING_URL}', path: '/api/v1/clients/#{clientId}/blocks', httpMethod: 'GET', active: true, environment: 'PRODUCTION' },
    { id: 5, code: 'CORE_BANKING_ACCOUNT_CHECK', name: t('workflow.api.accountCheck', 'Cuenta Destino'), description: t('workflow.api.accountCheck.desc', 'Verifica cuenta'), baseUrl: '#{env.CORE_BANKING_URL}', path: '/api/v1/accounts/#{accountNumber}/status', httpMethod: 'GET', active: true, environment: 'PRODUCTION' },
    { id: 6, code: 'SCREENING_OFAC_SDN', name: t('workflow.api.ofac', 'Lista OFAC'), description: t('workflow.api.ofac.desc', 'OFAC SDN'), baseUrl: '#{env.SCREENING_API_URL}', path: '/api/v1/screening/ofac/sdn', httpMethod: 'POST', active: true, environment: 'PRODUCTION' },
    { id: 7, code: 'SCREENING_UN_CONSOLIDATED', name: t('workflow.api.un', 'Lista ONU'), description: t('workflow.api.un.desc', 'ONU Consolidada'), baseUrl: '#{env.SCREENING_API_URL}', path: '/api/v1/screening/un/consolidated', httpMethod: 'POST', active: true, environment: 'PRODUCTION' },
    { id: 8, code: 'SCREENING_UAFE_NACIONAL', name: t('workflow.api.uafe', 'Lista UAFE'), description: t('workflow.api.uafe.desc', 'UAFE Nacional'), baseUrl: '#{env.SCREENING_API_URL}', path: '/api/v1/screening/uafe/national', httpMethod: 'POST', active: true, environment: 'PRODUCTION' },
    { id: 9, code: 'SCREENING_INTERNAL_LIST', name: t('workflow.api.internal', 'Lista Interna'), description: t('workflow.api.internal.desc', 'Lista interna'), baseUrl: '#{env.SCREENING_API_URL}', path: '/api/v1/screening/internal', httpMethod: 'POST', active: true, environment: 'PRODUCTION' },
    { id: 10, code: 'SCREENING_PEPS', name: t('workflow.api.peps', 'Lista PEPs'), description: t('workflow.api.peps.desc', 'PEPs'), baseUrl: '#{env.SCREENING_API_URL}', path: '/api/v1/screening/peps', httpMethod: 'POST', active: true, environment: 'PRODUCTION' },
  ];

  const getMockRules = (): EventRule[] => [
    { id: 300, code: 'CLIENT_REQUEST_VALIDACION', name: t('workflow.rule.validation', 'Validaciones'), description: t('workflow.rule.validation.desc', 'Validaciones core bancario'), tipoOperacion: 'CLIENT_REQUEST', eventoTrigger: 'INTERNAL_VALIDACION', accionesJson: '[{"tipo":"API_CALL","apiConfigCode":"CORE_BANKING_CLIENT_CHECK"}]', prioridad: 10, activo: true },
    { id: 301, code: 'CLIENT_REQUEST_COMPLIANCE', name: t('workflow.rule.compliance', 'Compliance'), description: t('workflow.rule.compliance.desc', 'Screening listas'), tipoOperacion: 'CLIENT_REQUEST', eventoTrigger: 'INTERNAL_COMPLIANCE', accionesJson: '[{"tipo":"API_CALL","apiConfigCode":"SCREENING_OFAC_SDN"}]', prioridad: 10, activo: true },
    { id: 302, code: 'CLIENT_REQUEST_APROBACION', name: t('workflow.rule.approval', 'Notificacion Aprobacion'), description: t('workflow.rule.approval.desc', 'Notifica aprobadores'), tipoOperacion: 'CLIENT_REQUEST', eventoTrigger: 'INTERNAL_APROBACION', accionesJson: '[{"tipo":"EMAIL","templateCode":"APPROVAL_PENDING"}]', prioridad: 10, activo: true },
    { id: 304, code: 'CLIENT_REQUEST_FINALIZADO', name: t('workflow.rule.completed', 'Notificacion Completada'), description: t('workflow.rule.completed.desc', 'Notifica cliente'), tipoOperacion: 'CLIENT_REQUEST', eventoTrigger: 'INTERNAL_FINALIZADO', accionesJson: '[{"tipo":"EMAIL","templateCode":"REQUEST_COMPLETED"}]', prioridad: 10, activo: true },
    { id: 305, code: 'CLIENT_REQUEST_RECHAZADO', name: t('workflow.rule.rejected', 'Notificacion Rechazo'), description: t('workflow.rule.rejected.desc', 'Notifica rechazo'), tipoOperacion: 'CLIENT_REQUEST', eventoTrigger: 'INTERNAL_RECHAZADO', accionesJson: '[{"tipo":"EMAIL","templateCode":"REQUEST_REJECTED"}]', prioridad: 10, activo: true },
  ];

  const getRolesForStage = (stageCode: string) => stageRoles.filter(r => r.stageCode === stageCode);

  const getApisForStage = (stageCode: string) => {
    if (stageCode === 'VALIDACION') return externalApis.filter(a => a.code.startsWith('CORE_BANKING_'));
    if (stageCode === 'COMPLIANCE') return externalApis.filter(a => a.code.startsWith('SCREENING_'));
    return [];
  };

  const getRulesForStage = (stageCode: string) => eventRules.filter(r => r.eventoTrigger === `INTERNAL_${stageCode}`);

  const parseActions = (accionesJson: string) => {
    try { return JSON.parse(accionesJson); } catch { return []; }
  };

  const tabs: { id: TabId; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'overview', labelKey: 'workflow.tab.overview', icon: <Icon as={FiSettings} /> },
    { id: 'stages', labelKey: 'workflow.tab.stages', icon: <Icon as={FiArrowRight} /> },
    { id: 'roles', labelKey: 'workflow.tab.roles', icon: <Icon as={FiUsers} /> },
    { id: 'apis', labelKey: 'workflow.tab.apis', icon: <Icon as={FiGlobe} /> },
    { id: 'rules', labelKey: 'workflow.tab.rules', icon: <Icon as={FiZap} /> },
  ];

  // --- Column definitions for DataTable ---

  const stageFilterOptions = WORKFLOW_STAGES.map(s => ({ value: s.code, label: t(s.nameKey, s.code) }));

  const rolesColumns: DataTableColumn<StageRoleAssignment>[] = [
    {
      key: 'stageCode',
      label: t('workflow.table.stage', 'Etapa'),
      filterType: 'select',
      filterOptions: stageFilterOptions,
      render: (row) => {
        const stage = WORKFLOW_STAGES.find(s => s.code === row.stageCode);
        return <Badge colorPalette={stage?.color || 'gray'}>{row.stageCode}</Badge>;
      },
    },
    {
      key: 'roleName',
      label: t('workflow.table.role', 'Rol'),
      render: (row) => <Text fontWeight="medium">{ROLE_LABELS[row.roleName] || row.roleName}</Text>,
    },
    {
      key: 'canView',
      label: t('workflow.perm.view', 'Ver'),
      align: 'center',
      sortable: false,
      filterable: false,
      render: (row) => <Icon as={row.canView ? FiCheckCircle : FiXCircle} color={row.canView ? 'green.500' : 'gray.300'} />,
    },
    {
      key: 'canExecute',
      label: t('workflow.perm.execute', 'Ejecutar'),
      align: 'center',
      sortable: false,
      filterable: false,
      render: (row) => <Icon as={row.canExecute ? FiCheckCircle : FiXCircle} color={row.canExecute ? 'green.500' : 'gray.300'} />,
    },
    {
      key: 'canApprove',
      label: t('workflow.perm.approve', 'Aprobar'),
      align: 'center',
      sortable: false,
      filterable: false,
      render: (row) => <Icon as={row.canApprove ? FiCheckCircle : FiXCircle} color={row.canApprove ? 'green.500' : 'gray.300'} />,
    },
    {
      key: 'canReject',
      label: t('workflow.perm.reject', 'Rechazar'),
      align: 'center',
      sortable: false,
      filterable: false,
      render: (row) => <Icon as={row.canReject ? FiCheckCircle : FiXCircle} color={row.canReject ? 'green.500' : 'gray.300'} />,
    },
    {
      key: 'canReturn',
      label: t('workflow.perm.return', 'Devolver'),
      align: 'center',
      sortable: false,
      filterable: false,
      render: (row) => <Icon as={row.canReturn ? FiCheckCircle : FiXCircle} color={row.canReturn ? 'green.500' : 'gray.300'} />,
    },
    {
      key: 'approvalLevel',
      label: t('workflow.table.level', 'Nivel'),
      align: 'center',
      filterable: false,
      render: (row) => row.approvalLevel ? <Badge colorPalette="yellow">{t('workflow.level', 'Nivel')} {row.approvalLevel}</Badge> : <Text>-</Text>,
    },
  ];

  const apiCategoryOptions = [
    { value: 'CORE_BANKING', label: t('workflow.apis.validation', 'Validacion') },
    { value: 'SCREENING', label: t('workflow.apis.screening', 'Screening') },
  ];

  const apisColumns: DataTableColumn<ExternalApiConfig>[] = [
    {
      key: 'name',
      label: t('workflow.table.name', 'Nombre'),
      render: (row) => (
        <Box>
          <Text fontWeight="medium">{row.name}</Text>
          {row.description && <Text fontSize="xs" color="gray.500">{row.description}</Text>}
        </Box>
      ),
    },
    {
      key: 'code',
      label: t('workflow.table.code', 'Codigo'),
      filterType: 'select',
      filterOptions: apiCategoryOptions,
      render: (row) => {
        const category = row.code.startsWith('CORE_BANKING_') ? 'CORE_BANKING' : row.code.startsWith('SCREENING_') ? 'SCREENING' : '';
        return <Badge variant="subtle" fontFamily="mono" fontSize="xs">{category}</Badge>;
      },
    },
    {
      key: 'httpMethod',
      label: t('workflow.table.method', 'Metodo'),
      filterType: 'select',
      filterOptions: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
      ],
      render: (row) => <Badge colorPalette="blue" fontFamily="mono">{row.httpMethod}</Badge>,
    },
    {
      key: 'path',
      label: t('workflow.table.path', 'Ruta'),
      render: (row) => <Text fontSize="sm" fontFamily="mono">{row.path}</Text>,
    },
    {
      key: 'active',
      label: t('workflow.table.status', 'Estado'),
      align: 'center',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('common.active', 'Activa') },
        { value: 'false', label: t('common.inactive', 'Inactiva') },
      ],
      render: (row) => (
        <Badge colorPalette={row.active ? 'green' : 'red'}>
          {row.active ? t('common.active', 'Activa') : t('common.inactive', 'Inactiva')}
        </Badge>
      ),
    },
  ];

  const triggerFilterOptions = [...new Set(eventRules.map(r => r.eventoTrigger))].map(trigger => {
    const stageCode = trigger.replace('INTERNAL_', '');
    return { value: trigger, label: stageCode };
  });

  const rulesColumns: DataTableColumn<EventRule>[] = [
    {
      key: 'name',
      label: t('workflow.table.name', 'Nombre'),
      render: (row) => (
        <Box>
          <HStack gap={2}>
            <Icon as={FiZap} color={row.activo ? 'yellow.500' : 'gray.400'} />
            <Text fontWeight="medium">{row.name}</Text>
          </HStack>
          {row.description && <Text fontSize="xs" color="gray.500" ml={6}>{row.description}</Text>}
        </Box>
      ),
    },
    {
      key: 'eventoTrigger',
      label: t('workflow.table.trigger', 'Evento'),
      filterType: 'select',
      filterOptions: triggerFilterOptions,
      render: (row) => {
        const stageCode = row.eventoTrigger.replace('INTERNAL_', '');
        const stage = WORKFLOW_STAGES.find(s => s.code === stageCode);
        return <Badge colorPalette={stage?.color || 'gray'}>{row.eventoTrigger}</Badge>;
      },
    },
    {
      key: 'tipoOperacion',
      label: t('workflow.table.type', 'Tipo'),
      render: (row) => <Badge variant="subtle" fontFamily="mono">{row.tipoOperacion}</Badge>,
    },
    {
      key: 'prioridad',
      label: t('workflow.table.priority', 'Prioridad'),
      align: 'center',
      render: (row) => <Text>{row.prioridad}</Text>,
    },
    {
      key: 'accionesJson',
      label: t('workflow.table.actions', 'Acciones'),
      sortable: false,
      filterable: false,
      render: (row) => {
        const actions = parseActions(row.accionesJson);
        return (
          <HStack gap={1} flexWrap="wrap">
            {actions.map((action: { tipo: string; apiConfigCode?: string; templateCode?: string }, idx: number) => (
              <Badge key={idx} colorPalette={action.tipo === 'API_CALL' ? 'green' : action.tipo === 'EMAIL' ? 'blue' : 'gray'} fontSize="xs">
                {action.tipo}: {action.apiConfigCode || action.templateCode || '-'}
              </Badge>
            ))}
          </HStack>
        );
      },
    },
    {
      key: 'activo',
      label: t('workflow.table.status', 'Estado'),
      align: 'center',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('common.active', 'Activo') },
        { value: 'false', label: t('common.inactive', 'Inactivo') },
      ],
      render: (row) => (
        <Badge colorPalette={row.activo ? 'green' : 'red'}>
          {row.activo ? t('common.active', 'Activo') : t('common.inactive', 'Inactivo')}
        </Badge>
      ),
    },
  ];

  return (
    <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" overflow="hidden" shadow="sm">
      {/* Toolbar */}
      <HStack px={4} py={3} bg="gray.50" borderBottomWidth="1px" borderColor="gray.200" justify="space-between" wrap="wrap" gap={2}>
        <HStack gap={1} overflowX="auto" flexWrap="wrap">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              size="sm"
              variant={activeTab === tab.id ? 'solid' : 'ghost'}
              colorPalette={activeTab === tab.id ? 'purple' : 'gray'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <Text ml={2} display={{ base: 'none', md: 'inline' }}>{t(tab.labelKey, tab.id)}</Text>
            </Button>
          ))}
        </HStack>
        <Button size="sm" variant="outline" onClick={fetchData} loading={loading}>
          <Icon as={FiRefreshCw} mr={2} />
          {t('common.refresh', 'Actualizar')}
        </Button>
      </HStack>

      {/* Content */}
      <Box p={6}>
        {/* Error Message */}
        {configError && (
          <Alert.Root status="warning" mb={6}>
            <Alert.Indicator>
              <Icon as={FiAlertTriangle} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>{t('workflow.error.title', 'Configuracion incompleta')}</Alert.Title>
              <Alert.Description>{configError}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {loading ? (
          <Box textAlign="center" py={12}>
            <Spinner size="xl" color="purple.500" />
            <Text mt={4} color="gray.500">{t('common.loading', 'Cargando...')}</Text>
          </Box>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <VStack gap={6} align="stretch">
                {/* Workflow Flow */}
                <Box bg="gray.50" borderRadius="lg" p={6}>
                  <Text fontWeight="semibold" mb={4}>{t('workflow.flow.title', 'Flujo del Proceso')}</Text>
                  <HStack wrap="wrap" gap={2}>
                    {WORKFLOW_STAGES.slice(0, 7).map((stage, index) => (
                      <React.Fragment key={stage.code}>
                        <Badge colorPalette={stage.color} px={3} py={1} borderRadius="md" fontSize="sm">
                          {t(stage.nameKey, stage.code)}
                        </Badge>
                        {index < 6 && <Icon as={FiArrowRight} color="gray.400" display={{ base: 'none', sm: 'block' }} />}
                      </React.Fragment>
                    ))}
                  </HStack>
                  <HStack mt={4} gap={4} wrap="wrap" fontSize="sm" color="gray.500">
                    <HStack><Icon as={FiCornerDownRight} /><Text>{t('workflow.flow.alternates', 'Estados alternativos')}:</Text></HStack>
                    <Badge colorPalette="red">{t('workflow.stage.RECHAZADO', 'Rechazado')}</Badge>
                    <Badge colorPalette="orange">{t('workflow.stage.DEVUELTO', 'Devuelto')}</Badge>
                  </HStack>
                </Box>

                {/* Summary Cards */}
                <SimpleGrid columns={{ base: 2, lg: 4 }} gap={4}>
                  <Box bg="blue.50" borderRadius="lg" p={4} borderWidth="1px" borderColor="blue.200">
                    <HStack>
                      <Icon as={FiArrowRight} boxSize={8} color="blue.500" />
                      <Box>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.700">{WORKFLOW_STAGES.length}</Text>
                        <Text fontSize="sm" color="blue.600">{t('workflow.summary.stages', 'Etapas')}</Text>
                      </Box>
                    </HStack>
                  </Box>
                  <Box bg="purple.50" borderRadius="lg" p={4} borderWidth="1px" borderColor="purple.200">
                    <HStack>
                      <Icon as={FiUsers} boxSize={8} color="purple.500" />
                      <Box>
                        <Text fontSize="2xl" fontWeight="bold" color="purple.700">{stageRoles.length}</Text>
                        <Text fontSize="sm" color="purple.600">{t('workflow.summary.roles', 'Roles')}</Text>
                      </Box>
                    </HStack>
                  </Box>
                  <Box bg="green.50" borderRadius="lg" p={4} borderWidth="1px" borderColor="green.200">
                    <HStack>
                      <Icon as={FiGlobe} boxSize={8} color="green.500" />
                      <Box>
                        <Text fontSize="2xl" fontWeight="bold" color="green.700">{externalApis.length}</Text>
                        <Text fontSize="sm" color="green.600">{t('workflow.summary.apis', 'APIs')}</Text>
                      </Box>
                    </HStack>
                  </Box>
                  <Box bg="yellow.50" borderRadius="lg" p={4} borderWidth="1px" borderColor="yellow.200">
                    <HStack>
                      <Icon as={FiZap} boxSize={8} color="yellow.500" />
                      <Box>
                        <Text fontSize="2xl" fontWeight="bold" color="yellow.700">{eventRules.length}</Text>
                        <Text fontSize="sm" color="yellow.600">{t('workflow.summary.rules', 'Reglas')}</Text>
                      </Box>
                    </HStack>
                  </Box>
                </SimpleGrid>

                {/* Configuration per Stage */}
                <Box>
                  <Text fontWeight="semibold" mb={4}>{t('workflow.stageConfig.title', 'Configuracion por Etapa')}</Text>
                  <VStack gap={3} align="stretch">
                    {WORKFLOW_STAGES.slice(0, 7).map(stage => {
                      const roles = getRolesForStage(stage.code);
                      const apis = getApisForStage(stage.code);
                      const rules = getRulesForStage(stage.code);
                      const isExpanded = expandedStage === stage.code;

                      return (
                        <Box key={stage.code} borderWidth="1px" borderRadius="lg" overflow="hidden">
                          <Box
                            as="button"
                            w="100%"
                            px={4}
                            py={3}
                            bg={`${stage.color}.50`}
                            _hover={{ bg: `${stage.color}.100` }}
                            onClick={() => setExpandedStage(isExpanded ? null : stage.code)}
                            textAlign="left"
                          >
                            <HStack justify="space-between">
                              <Box>
                                <Text fontWeight="semibold" color={`${stage.color}.800`}>{t(stage.nameKey, stage.code)}</Text>
                                <Text fontSize="xs" color={`${stage.color}.600`}>{t(stage.descriptionKey, '')}</Text>
                              </Box>
                              <HStack>
                                <Text fontSize="xs" color={`${stage.color}.600`}>
                                  {roles.length} {t('workflow.roles', 'roles')} | {apis.length} APIs | {rules.length} {t('workflow.rules', 'reglas')}
                                </Text>
                                <Icon as={isExpanded ? FiChevronDown : FiChevronRight} />
                              </HStack>
                            </HStack>
                          </Box>

                          {isExpanded && (
                            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="white">
                              {/* Roles */}
                              <Box>
                                <HStack mb={2}><Icon as={FiUsers} /><Text fontSize="sm" fontWeight="medium">{t('workflow.roles', 'Roles')}</Text></HStack>
                                {roles.length > 0 ? (
                                  <VStack gap={2} align="stretch">
                                    {roles.map(role => (
                                      <Box key={role.id} p={2} bg="gray.50" borderRadius="md" fontSize="sm">
                                        <Text fontWeight="medium">{ROLE_LABELS[role.roleName] || role.roleName}</Text>
                                        <HStack wrap="wrap" gap={1} mt={1}>
                                          {role.canView && <Badge colorPalette="blue" size="sm">{t('workflow.perm.view', 'Ver')}</Badge>}
                                          {role.canExecute && <Badge colorPalette="green" size="sm">{t('workflow.perm.execute', 'Ejecutar')}</Badge>}
                                          {role.canApprove && <Badge colorPalette="yellow" size="sm">{t('workflow.perm.approve', 'Aprobar')}</Badge>}
                                          {role.canReject && <Badge colorPalette="red" size="sm">{t('workflow.perm.reject', 'Rechazar')}</Badge>}
                                          {role.canReturn && <Badge colorPalette="orange" size="sm">{t('workflow.perm.return', 'Devolver')}</Badge>}
                                        </HStack>
                                      </Box>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color="gray.400">{t('workflow.noRoles', 'Sin roles')}</Text>
                                )}
                              </Box>

                              {/* APIs */}
                              <Box>
                                <HStack mb={2}><Icon as={FiGlobe} /><Text fontSize="sm" fontWeight="medium">APIs</Text></HStack>
                                {apis.length > 0 ? (
                                  <VStack gap={2} align="stretch">
                                    {apis.map(api => (
                                      <Box key={api.id} p={2} bg="gray.50" borderRadius="md" fontSize="sm">
                                        <Text fontWeight="medium">{api.name}</Text>
                                        <Text fontSize="xs" color="gray.500">{api.httpMethod} {api.path}</Text>
                                      </Box>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color="gray.400">{t('workflow.noApis', 'Sin APIs')}</Text>
                                )}
                              </Box>

                              {/* Rules */}
                              <Box>
                                <HStack mb={2}><Icon as={FiZap} /><Text fontSize="sm" fontWeight="medium">{t('workflow.rules', 'Reglas')}</Text></HStack>
                                {rules.length > 0 ? (
                                  <VStack gap={2} align="stretch">
                                    {rules.map(rule => (
                                      <Box key={rule.id} p={2} bg="gray.50" borderRadius="md" fontSize="sm">
                                        <Text fontWeight="medium">{rule.name}</Text>
                                        <Text fontSize="xs" color="gray.500">{parseActions(rule.accionesJson).length} {t('workflow.actions', 'acciones')}</Text>
                                      </Box>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color="gray.400">{t('workflow.noRules', 'Sin reglas')}</Text>
                                )}
                              </Box>
                            </SimpleGrid>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              </VStack>
            )}

            {/* Stages Tab */}
            {activeTab === 'stages' && (
              <VStack gap={4} align="stretch">
                <Text fontWeight="semibold">{t('workflow.stages.title', 'Etapas del Workflow')}</Text>
                <VStack gap={4} align="stretch">
                  {WORKFLOW_STAGES.map(stage => (
                    <Box key={stage.code} p={4} borderRadius="lg" bg={`${stage.color}.50`} borderWidth="1px" borderColor={`${stage.color}.200`}>
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="semibold" color={`${stage.color}.800`}>{t(stage.nameKey, stage.code)}</Text>
                          <Text fontSize="sm" color={`${stage.color}.600`}>{t(stage.descriptionKey, '')}</Text>
                        </Box>
                        <HStack gap={4}>
                          <Badge variant="subtle" fontFamily="mono">{stage.code}</Badge>
                          <Text fontSize="sm">{t('workflow.order', 'Orden')}: {stage.order}</Text>
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <VStack gap={4} align="stretch">
                <Text fontWeight="semibold">{t('workflow.roles.title', 'Roles y Permisos por Etapa')}</Text>
                <DataTable<StageRoleAssignment>
                  data={stageRoles}
                  columns={rolesColumns}
                  rowKey={(row) => String(row.id)}
                  isLoading={loading}
                  emptyMessage={t('workflow.noRoles', 'Sin roles')}
                  defaultPageSize={10}
                  size="sm"
                />
              </VStack>
            )}

            {/* APIs Tab */}
            {activeTab === 'apis' && (
              <VStack gap={4} align="stretch">
                <Text fontWeight="semibold">{t('workflow.apis.title', 'APIs Externas')}</Text>
                <DataTable<ExternalApiConfig>
                  data={externalApis}
                  columns={apisColumns}
                  rowKey={(row) => String(row.id)}
                  isLoading={loading}
                  emptyMessage={t('workflow.noApis', 'Sin APIs')}
                  defaultPageSize={10}
                  size="sm"
                />
              </VStack>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <VStack gap={4} align="stretch">
                <Text fontWeight="semibold">{t('workflow.rules.title', 'Reglas de Eventos')}</Text>
                <DataTable<EventRule>
                  data={eventRules}
                  columns={rulesColumns}
                  rowKey={(row) => String(row.id)}
                  isLoading={loading}
                  emptyMessage={t('workflow.noRules', 'Sin reglas')}
                  defaultPageSize={10}
                  size="sm"
                />
              </VStack>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default WorkflowAdminPanel;
