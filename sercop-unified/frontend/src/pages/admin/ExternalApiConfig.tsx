/**
 * External API Configuration Page
 * Manage external API endpoints for transversal integrations
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Input,
  Icon,
  Tabs,
  Grid,
  Spinner,
  Textarea,
  Card,
  Table,
  IconButton,
  Fieldset,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  Field,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FiCloud,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiCheck,
  FiX,
  FiActivity,
  FiLock,
  FiRefreshCw,
  FiSettings,
  FiFileText,
  FiClock,
  FiAlertTriangle,
  FiZap,
  FiArrowRight,
  FiArrowLeft,
  FiBell,
  FiDatabase,
  FiUpload,
  FiLink,
  FiCode,
} from 'react-icons/fi';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';
import * as mappingService from '../../services/externalApiMappingService';
import { toaster } from '../../components/ui/toaster';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { get, post, put, del } from '../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../../config/api.config';

// Types
interface ExternalApiConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  baseUrl: string;
  path?: string;
  httpMethod: string;
  contentType: string;
  timeoutMs: number;
  retryCount: number;
  circuitBreakerEnabled: boolean;
  active: boolean;
  environment: string;
  mockEnabled?: boolean;
  mockProvider?: string;
  mockCustomUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthConfig {
  id?: number;
  apiConfigId: number;
  authType: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: string;
  username?: string;
  password?: string;
  staticToken?: string;
  oauth2TokenUrl?: string;
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2Scope?: string;
  active: boolean;
}

interface ApiMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTimeMs: number;
  successRate: number;
}

// OpenAPI Import Types
interface OpenApiEndpoint {
  path: string;
  httpMethod: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  contentType: string;
  requestBodyTemplate?: string;
  queryParameters?: OpenApiParameter[];
  headerParameters?: OpenApiParameter[];
  successCodes?: string[];
  security?: string[];
  suggestedCode: string;
  suggestedName: string;
}

interface OpenApiParameter {
  name: string;
  in: string;
  type: string;
  description?: string;
  required: boolean;
}

interface OpenApiSecurityScheme {
  name: string;
  type: string;
  scheme?: string;
  in?: string;
  parameterName?: string;
  tokenUrl?: string;
  scopes?: string[];
  mappedAuthType: string;
}

interface OpenApiParseResponse {
  title?: string;
  description?: string;
  version?: string;
  baseUrl?: string;
  endpoints: OpenApiEndpoint[];
  securitySchemes: OpenApiSecurityScheme[];
  messages?: string[];
}

// Auth types will be translated using i18n

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ENVIRONMENTS = ['PRODUCTION', 'STAGING', 'DEVELOPMENT'];
const MOCK_PROVIDERS = [
  { value: 'HTTPBIN', label: 'HTTPBin (httpbin.org)', needsUrl: false },
  { value: 'WEBHOOK_SITE', label: 'Webhook.site', needsUrl: true },
  { value: 'REQUESTBIN', label: 'RequestBin', needsUrl: true },
  { value: 'MOCKAPI', label: 'MockAPI.io', needsUrl: true },
  { value: 'CUSTOM', label: 'Custom URL', needsUrl: true },
];

export default function ExternalApiConfig() {
  const { t } = useTranslation();
  const { colorMode } = useTheme();

  const [configs, setConfigs] = useState<ExternalApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<ExternalApiConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testPayload, setTestPayload] = useState<string>('{}');
  const [showTestForm, setShowTestForm] = useState(true);

  // Form state
  const [formData, setFormData] = useState<Partial<ExternalApiConfig>>({
    code: '',
    name: '',
    description: '',
    baseUrl: '',
    path: '',
    httpMethod: 'POST',
    contentType: 'application/json',
    timeoutMs: 30000,
    retryCount: 3,
    circuitBreakerEnabled: true,
    active: true,
    environment: 'PRODUCTION',
    mockEnabled: false,
    mockProvider: '',
    mockCustomUrl: '',
  });

  const [authData, setAuthData] = useState<Partial<AuthConfig>>({
    authType: 'NONE',
    apiKeyLocation: 'HEADER',
    active: true,
  });

  // OpenAPI Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'url'>('file');
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [parsedOpenApi, setParsedOpenApi] = useState<OpenApiParseResponse | null>(null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<number>>(new Set());

  // Mappings state
  const [requestMappings, setRequestMappings] = useState<mappingService.RequestMapping[]>([]);
  const [responseMappings, setResponseMappings] = useState<mappingService.ResponseMapping[]>([]);
  const [responseListeners, setResponseListeners] = useState<mappingService.ResponseListener[]>([]);
  const [templateVariables, setTemplateVariables] = useState<{ code: string; name: string }[]>([]);
  const [actionTypes, setActionTypes] = useState<mappingService.ActionTypeOption[]>([]);
  const [sourceTypes, setSourceTypes] = useState<mappingService.SourceTypeOption[]>([]);
  const [calculatedFunctions, setCalculatedFunctions] = useState<mappingService.CalculatedFunctionOption[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadEnums();
  }, []);

  const loadEnums = async () => {
    try {
      const [vars, actions, sources, calcFuncs] = await Promise.all([
        mappingService.getTemplateVariables(),
        mappingService.getActionTypes(),
        mappingService.getSourceTypes(),
        mappingService.getCalculatedFunctions(),
      ]);
      setTemplateVariables(vars);
      setActionTypes(actions);
      setSourceTypes(sources);
      setCalculatedFunctions(calcFuncs);
    } catch (error) {
      console.error('Error loading enums:', error);
    }
  };

  const loadMappings = async (apiConfigId: number) => {
    try {
      setLoadingMappings(true);
      const [reqMappings, resMappings, listeners] = await Promise.all([
        mappingService.getRequestMappings(apiConfigId),
        mappingService.getResponseMappings(apiConfigId),
        mappingService.getResponseListeners(apiConfigId),
      ]);
      setRequestMappings(reqMappings);
      setResponseMappings(resMappings);
      setResponseListeners(listeners);
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await get(`${API_BASE_URL}/admin/external-api/queries`);
      if (response.ok) {
        const result = await response.json();
        setConfigs(result.data || []);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      toaster.create({
        title: t('common.error'),
        description: t('externalApiConfig.errors.loadFailed'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedConfig(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      baseUrl: '',
      path: '',
      httpMethod: 'POST',
      contentType: 'application/json',
      timeoutMs: 30000,
      retryCount: 3,
      circuitBreakerEnabled: true,
      active: true,
      environment: 'PRODUCTION',
      mockEnabled: false,
      mockProvider: '',
      mockCustomUrl: '',
    });
    setAuthData({
      authType: 'NONE',
      apiKeyLocation: 'HEADER',
      active: true,
    });
    setRequestMappings([]);
    setResponseMappings([]);
    setResponseListeners([]);
    setActiveTab('general');
    setIsDialogOpen(true);
  };

  // OpenAPI Import handlers
  const handleOpenImportDialog = () => {
    setParsedOpenApi(null);
    setSelectedEndpoints(new Set());
    setImportUrl('');
    setImportMode('file');
    setIsImportDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/external-api/commands/parse-openapi`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success && result.data) {
        setParsedOpenApi(result.data);
        // Auto-select all endpoints by default
        setSelectedEndpoints(new Set(result.data.endpoints.map((_: OpenApiEndpoint, i: number) => i)));
        toaster.create({
          title: t('common.success'),
          description: `${result.data.endpoints?.length || 0} endpoints encontrados`,
          type: 'success',
        });
      } else {
        throw new Error(result.message || 'Error al parsear el archivo');
      }
    } catch (error: any) {
      toaster.create({
        title: t('common.error'),
        description: error.message || 'Error al procesar el archivo',
        type: 'error',
      });
    } finally {
      setImportLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      toaster.create({
        title: t('common.error'),
        description: 'Ingrese una URL valida',
        type: 'error',
      });
      return;
    }

    setImportLoading(true);
    try {
      const response = await post(`${API_BASE_URL}/admin/external-api/commands/parse-openapi-url`, {
        url: importUrl,
      });

      const result = await response.json();
      if (result.success && result.data) {
        setParsedOpenApi(result.data);
        setSelectedEndpoints(new Set(result.data.endpoints.map((_: OpenApiEndpoint, i: number) => i)));
        toaster.create({
          title: t('common.success'),
          description: `${result.data.endpoints?.length || 0} endpoints encontrados`,
          type: 'success',
        });
      } else {
        throw new Error(result.message || 'Error al parsear desde URL');
      }
    } catch (error: any) {
      toaster.create({
        title: t('common.error'),
        description: error.message || 'Error al procesar la URL',
        type: 'error',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportEndpoint = (endpoint: OpenApiEndpoint) => {
    // Find matching security scheme
    const securityScheme = parsedOpenApi?.securitySchemes?.find(
      (s) => endpoint.security?.includes(s.name)
    );

    // Populate form with endpoint data
    setFormData({
      code: endpoint.suggestedCode,
      name: endpoint.suggestedName,
      description: endpoint.description || endpoint.summary || '',
      baseUrl: parsedOpenApi?.baseUrl || '',
      path: endpoint.path,
      httpMethod: endpoint.httpMethod,
      contentType: endpoint.contentType || 'application/json',
      timeoutMs: 30000,
      retryCount: 3,
      circuitBreakerEnabled: true,
      active: true,
      environment: 'DEVELOPMENT', // Default to dev for imported APIs
      mockEnabled: false,
      mockProvider: '',
      mockCustomUrl: '',
    });

    // Set auth based on security scheme
    if (securityScheme) {
      const authConfig: Partial<AuthConfig> = {
        authType: securityScheme.mappedAuthType || 'NONE',
        active: true,
      };

      if (securityScheme.mappedAuthType === 'API_KEY') {
        authConfig.apiKeyName = securityScheme.parameterName || 'X-API-Key';
        authConfig.apiKeyLocation = securityScheme.in?.toUpperCase() === 'QUERY' ? 'QUERY' : 'HEADER';
      } else if (securityScheme.mappedAuthType === 'OAUTH2_CLIENT_CREDENTIALS') {
        authConfig.oauth2TokenUrl = securityScheme.tokenUrl || '';
        authConfig.oauth2Scope = securityScheme.scopes?.join(' ') || '';
      }

      setAuthData(authConfig);
    } else {
      setAuthData({ authType: 'NONE', apiKeyLocation: 'HEADER', active: true });
    }

    setSelectedConfig(null);
    setRequestMappings([]);
    setResponseMappings([]);
    setResponseListeners([]);
    setActiveTab('general');
    setIsImportDialogOpen(false);
    setIsDialogOpen(true);
  };

  const toggleEndpointSelection = (index: number) => {
    const newSelection = new Set(selectedEndpoints);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedEndpoints(newSelection);
  };

  const handleEdit = async (config: ExternalApiConfig) => {
    setSelectedConfig(config);
    setFormData(config);
    // Load auth config from details endpoint
    try {
      const response = await get(`${API_BASE_URL}/admin/external-api/queries/${config.id}`);
      if (response.ok) {
        const result = await response.json();
        const auth = result.data?.authConfig;
        setAuthData(auth || { authType: 'NONE', apiKeyLocation: 'HEADER', active: true });
      }
    } catch (error) {
      setAuthData({ authType: 'NONE', apiKeyLocation: 'HEADER', active: true });
    }
    // Load mappings
    loadMappings(config.id);
    setActiveTab('general');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        authConfig: authData.authType !== 'NONE' ? authData : null,
      };

      const response = selectedConfig
        ? await put(`${API_BASE_URL}/admin/external-api/commands/${selectedConfig.id}`, payload)
        : await post(`${API_BASE_URL}/admin/external-api/commands`, payload);

      if (response.ok) {
        toaster.create({
          title: t('common.success'),
          description: selectedConfig ? t('externalApiConfig.messages.updated') : t('externalApiConfig.messages.created'),
          type: 'success',
        });
        setIsDialogOpen(false);
        loadConfigs();
      } else {
        const error = await response.json();
        throw new Error(error.message || t('externalApiConfig.errors.saveFailed'));
      }
    } catch (error: any) {
      toaster.create({
        title: t('common.error'),
        description: error.message || t('externalApiConfig.errors.saveFailed'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: ExternalApiConfig) => {
    if (!confirm(t('externalApiConfig.messages.confirmDelete', { name: config.name }))) return;

    try {
      const response = await del(`${API_BASE_URL}/admin/external-api/commands/${config.id}`);

      if (response.ok) {
        toaster.create({
          title: t('common.success'),
          description: t('externalApiConfig.messages.deleted'),
          type: 'success',
        });
        loadConfigs();
      }
    } catch (error) {
      toaster.create({
        title: t('common.error'),
        description: t('externalApiConfig.errors.deleteFailed'),
        type: 'error',
      });
    }
  };

  // Generate example value based on variable name
  const generateExampleValue = (varName: string): string | number | object => {
    const name = varName.toLowerCase();
    if (name.includes('email')) return 'test@example.com';
    if (name.includes('name')) return 'Test Name';
    if (name.includes('id') || name.includes('userid')) return 1;
    if (name.includes('amount')) return 1000.00;
    if (name.includes('title')) return 'Test Title';
    if (name.includes('body') || name.includes('content') || name.includes('message')) return 'Test content message';
    if (name.includes('subject')) return 'Test Subject';
    if (name.includes('url')) return 'https://example.com';
    if (name.includes('date') || name.includes('time')) return new Date().toISOString();
    if (name.includes('currency')) return 'USD';
    if (name.includes('type')) return 'TEST';
    if (name.includes('status')) return 'ACTIVE';
    if (name.includes('reference')) return 'REF-001';
    if (name.includes('html')) return '<p>Test HTML content</p>';
    return 'test_value';
  };

  // Convert template with placeholders to example JSON
  const templateToExample = (template: string): string => {
    if (!template) return '{}';

    // Replace {{variable}} with example values
    let result = template;
    const mustachePattern = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = mustachePattern.exec(template)) !== null) {
      const varName = match[1];
      const exampleValue = generateExampleValue(varName);
      const replacement = typeof exampleValue === 'string' ? `"${exampleValue}"` : String(exampleValue);
      result = result.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), replacement);
    }

    // Also handle ${variable} pattern
    const dollarPattern = /\$\{(\w+)\}/g;
    while ((match = dollarPattern.exec(template)) !== null) {
      const varName = match[1];
      const exampleValue = generateExampleValue(varName);
      const replacement = typeof exampleValue === 'string' ? `"${exampleValue}"` : String(exampleValue);
      result = result.replace(new RegExp(`\\$\\{${varName}\\}`, 'g'), replacement);
    }

    // Try to parse and re-stringify to format nicely
    try {
      const parsed = JSON.parse(result);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return result;
    }
  };

  const openTestDialog = (config: ExternalApiConfig) => {
    setSelectedConfig(config);
    setTestResult(null);
    setShowTestForm(true);
    setTestPayload('{\n  \n}');
    setIsTestDialogOpen(true);

    // Load test example from API config details
    get(`${API_BASE_URL}/admin/external-api/queries/${config.id}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(result => {
        // Find the default template or first one
        const templates = result?.data?.requestTemplates;
        const template = templates?.find((t: any) => t.isDefault) || templates?.[0];

        if (template?.testPayloadExample) {
          // Use stored test example
          setTestPayload(template.testPayloadExample);
        } else if (template?.bodyTemplate) {
          // Fallback: convert template placeholders to example values
          const examplePayload = templateToExample(template.bodyTemplate);
          setTestPayload(examplePayload);
        } else if (config.httpMethod === 'GET') {
          setTestPayload('// GET request - no payload needed\n{}');
        } else {
          // Generate a basic example if no templates exist
          setTestPayload(JSON.stringify({
            message: "Test message from GlobalCMX",
            timestamp: new Date().toISOString(),
            data: {
              operationId: "TEST-001",
              amount: 1000.00
            }
          }, null, 2));
        }
      })
      .catch(() => {
        // Default payload on error
        if (config.httpMethod === 'GET') {
          setTestPayload('// GET request - no payload needed\n{}');
        } else {
          setTestPayload(JSON.stringify({
            message: "Test message from GlobalCMX",
            timestamp: new Date().toISOString()
          }, null, 2));
        }
      });
  };

  const handleTest = async () => {
    if (!selectedConfig) return;

    setShowTestForm(false);
    setTesting(true);

    try {
      let payload = {};
      try {
        payload = JSON.parse(testPayload);
      } catch (e) {
        // Invalid JSON, use empty object
      }

      const response = await post(`${API_BASE_URL}/admin/external-api/commands/${selectedConfig.id}/test`, { testData: payload });

      const result = await response.json();
      setTestResult(result.data || result);
    } catch (error: any) {
      setTestResult({
        success: false,
        errorMessage: error.message || t('externalApiConfig.errors.testFailed'),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleActive = async (config: ExternalApiConfig) => {
    try {
      const response = await post(`${API_BASE_URL}/admin/external-api/commands/${config.id}/toggle-active`, {});

      if (response.ok) {
        toaster.create({
          title: t('common.success'),
          description: config.active ? t('externalApiConfig.messages.deactivated') : t('externalApiConfig.messages.activated'),
          type: 'success',
        });
        loadConfigs();
      }
    } catch (error) {
      toaster.create({
        title: t('common.error'),
        description: t('externalApiConfig.errors.toggleFailed'),
        type: 'error',
      });
    }
  };

  const configColumns: DataTableColumn<ExternalApiConfig>[] = [
    {
      key: 'name',
      label: t('externalApiConfig.fields.name'),
      sortable: true,
      render: (row) => (
        <VStack align="start" gap={0}>
          <HStack>
            <Icon as={FiCloud} color={row.active ? 'green.500' : 'gray.400'} />
            <Text fontWeight="bold">{row.name}</Text>
          </HStack>
          <Text fontSize="xs" color="gray.500">{row.code}</Text>
        </VStack>
      ),
    },
    {
      key: 'httpMethod',
      label: t('externalApiConfig.fields.method'),
      filterType: 'select',
      filterOptions: HTTP_METHODS.map((m) => ({ value: m, label: m })),
      render: (row) => (
        <Badge colorPalette="purple" variant="subtle">{row.httpMethod}</Badge>
      ),
    },
    {
      key: 'baseUrl',
      label: 'URL',
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="sm" color="gray.600" isTruncated maxW="300px">
          {row.mockEnabled ? (
            <>
              <Text as="span" textDecoration="line-through" color="gray.400">{row.baseUrl}{row.path}</Text>
              {' → '}
              <Text as="span" color="orange.600" fontWeight="medium">
                {row.mockProvider === 'HTTPBIN'
                  ? `httpbin.org/${row.httpMethod.toLowerCase()}`
                  : row.mockCustomUrl || 'mock'}
              </Text>
            </>
          ) : (
            `${row.baseUrl}${row.path || ''}`
          )}
        </Text>
      ),
    },
    {
      key: 'environment',
      label: t('externalApiConfig.fields.environment'),
      filterType: 'select',
      filterOptions: ENVIRONMENTS.map((e) => ({ value: e, label: t(`externalApiConfig.environments.${e.toLowerCase()}`) })),
      render: (row) => (
        <Badge colorPalette={
          row.environment === 'PRODUCTION' ? 'red' :
          row.environment === 'STAGING' ? 'yellow' : 'blue'
        }>
          {t(`externalApiConfig.environments.${row.environment.toLowerCase()}`)}
        </Badge>
      ),
    },
    {
      key: 'active',
      label: t('common.status'),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.inactive') },
      ],
      render: (row) => (
        <HStack>
          {row.mockEnabled && (
            <Badge colorPalette="orange">
              <Icon as={FiZap} mr={1} />
              MOCK
            </Badge>
          )}
          <Badge colorPalette={row.active ? 'green' : 'gray'}>
            {row.active ? t('common.active') : t('common.inactive')}
          </Badge>
        </HStack>
      ),
    },
    {
      key: 'timeoutMs',
      label: t('externalApiConfig.fields.timeout'),
      hideOnMobile: true,
      render: (row) => (
        <HStack fontSize="xs" color="gray.500">
          <Icon as={FiClock} />
          <Text>{row.timeoutMs}ms</Text>
        </HStack>
      ),
    },
  ];

  const configActions: DataTableAction<ExternalApiConfig>[] = [
    {
      key: 'test',
      label: 'Test',
      icon: FiPlay,
      colorPalette: 'green',
      onClick: (row) => openTestDialog(row),
    },
    {
      key: 'edit',
      label: t('common.edit'),
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'toggle',
      label: t('common.deactivate'),
      icon: FiActivity,
      colorPalette: 'orange',
      onClick: (row) => handleToggleActive(row),
    },
    {
      key: 'delete',
      label: t('common.delete'),
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDelete(row),
    },
  ];

  return (
    <Box p={6}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" gap={1}>
          <HStack>
            <Icon as={FiCloud} boxSize={6} color="blue.500" />
            <Heading size="lg">{t('externalApiConfig.title')}</Heading>
          </HStack>
          <Text color="gray.500">
            {t('externalApiConfig.subtitle')}
          </Text>
        </VStack>
      </HStack>

      {/* Info Card */}
      <Card.Root mb={6} bg="blue.50" borderColor="blue.200" borderWidth={1}>
        <Card.Body py={3}>
          <HStack>
            <Icon as={FiActivity} color="blue.500" />
            <Text fontSize="sm" color="blue.700">
              {t('externalApiConfig.infoMessage')}
            </Text>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* API Config Table */}
      <DataTable<ExternalApiConfig>
        data={configs}
        columns={configColumns}
        rowKey={(row) => String(row.id)}
        actions={configActions}
        isLoading={loading}
        emptyMessage={t('externalApiConfig.noApis')}
        emptyIcon={FiCloud}
        defaultPageSize={10}
        size="sm"
        toolbarRight={
          <HStack gap={2}>
            <Button colorPalette="teal" variant="outline" onClick={handleOpenImportDialog}>
              <Icon as={FiUpload} mr={2} />
              Importar desde Swagger
            </Button>
            <Button colorPalette="blue" onClick={handleCreate}>
              <Icon as={FiPlus} mr={2} />
              {t('externalApiConfig.newApi')}
            </Button>
          </HStack>
        }
      />

      {/* Create/Edit Dialog */}
      <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} size="xl">
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto',
            maxWidth: '800px',
            width: '95%'
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedConfig ? t('externalApiConfig.dialog.editTitle') : t('externalApiConfig.dialog.createTitle')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
              <Tabs.List mb={4} flexWrap="wrap">
                <Tabs.Trigger value="general">
                  <Icon as={FiSettings} mr={2} />
                  {t('externalApiConfig.tabs.general')}
                </Tabs.Trigger>
                <Tabs.Trigger value="auth">
                  <Icon as={FiLock} mr={2} />
                  {t('externalApiConfig.tabs.auth')}
                </Tabs.Trigger>
                <Tabs.Trigger value="requestMappings" disabled={!selectedConfig}>
                  <Icon as={FiArrowRight} mr={2} />
                  {t('externalApiConfig.tabs.requestMappings', 'Request')}
                </Tabs.Trigger>
                <Tabs.Trigger value="responseMappings" disabled={!selectedConfig}>
                  <Icon as={FiArrowLeft} mr={2} />
                  {t('externalApiConfig.tabs.responseMappings', 'Response')}
                </Tabs.Trigger>
                <Tabs.Trigger value="listeners" disabled={!selectedConfig}>
                  <Icon as={FiBell} mr={2} />
                  {t('externalApiConfig.tabs.listeners', 'Listeners')}
                </Tabs.Trigger>
                <Tabs.Trigger value="advanced">
                  <Icon as={FiActivity} mr={2} />
                  {t('externalApiConfig.tabs.advanced')}
                </Tabs.Trigger>
                <Tabs.Trigger value="mock">
                  <Icon as={FiZap} mr={2} />
                  {t('externalApiConfig.tabs.mock')}
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="general">
                <VStack gap={4} align="stretch">
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Field.Root required>
                      <Field.Label>{t('externalApiConfig.fields.code')}</Field.Label>
                      <Input
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="CORE_BANKING_API"
                        disabled={!!selectedConfig}
                      />
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>{t('externalApiConfig.fields.name')}</Field.Label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('externalApiConfig.placeholders.name')}
                      />
                    </Field.Root>
                  </Grid>

                  <Field.Root>
                    <Field.Label>{t('externalApiConfig.fields.description')}</Field.Label>
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('externalApiConfig.placeholders.description')}
                      rows={2}
                    />
                  </Field.Root>

                  <Grid templateColumns="1fr 2fr" gap={4}>
                    <Field.Root required>
                      <Field.Label>{t('externalApiConfig.fields.httpMethod')}</Field.Label>
                      <NativeSelectRoot>
                        <NativeSelectField
                          value={formData.httpMethod || 'POST'}
                          onChange={(e) => setFormData({ ...formData, httpMethod: e.target.value })}
                        >
                          {HTTP_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </NativeSelectField>
                      </NativeSelectRoot>
                    </Field.Root>
                    <Field.Root required>
                      <Field.Label>{t('externalApiConfig.fields.baseUrl')}</Field.Label>
                      <Input
                        value={formData.baseUrl || ''}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        placeholder="https://api.example.com"
                      />
                    </Field.Root>
                  </Grid>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Field.Root>
                      <Field.Label>{t('externalApiConfig.fields.path')}</Field.Label>
                      <Input
                        value={formData.path || ''}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        placeholder="/v1/operations/validate"
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t('externalApiConfig.fields.contentType')}</Field.Label>
                      <Input
                        value={formData.contentType || 'application/json'}
                        onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                      />
                    </Field.Root>
                  </Grid>

                  <Field.Root>
                    <Field.Label>{t('externalApiConfig.fields.environment')}</Field.Label>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={formData.environment || 'PRODUCTION'}
                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                      >
                        {ENVIRONMENTS.map(env => (
                          <option key={env} value={env}>{t(`externalApiConfig.environments.${env.toLowerCase()}`)}</option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field.Root>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="auth">
                <VStack gap={4} align="stretch">
                  <Field.Root required>
                    <Field.Label>{t('externalApiConfig.auth.type')}</Field.Label>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={authData.authType || 'NONE'}
                        onChange={(e) => setAuthData({ ...authData, authType: e.target.value })}
                      >
                        <option value="NONE">{t('externalApiConfig.auth.types.none')}</option>
                        <option value="API_KEY">{t('externalApiConfig.auth.types.apiKey')}</option>
                        <option value="BASIC_AUTH">{t('externalApiConfig.auth.types.basicAuth')}</option>
                        <option value="BEARER_TOKEN">{t('externalApiConfig.auth.types.bearerToken')}</option>
                        <option value="OAUTH2_CLIENT_CREDENTIALS">{t('externalApiConfig.auth.types.oauth2')}</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field.Root>

                  {authData.authType === 'API_KEY' && (
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.headerName')}</Field.Label>
                        <Input
                          value={authData.apiKeyName || ''}
                          onChange={(e) => setAuthData({ ...authData, apiKeyName: e.target.value })}
                          placeholder="X-API-Key"
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.value')}</Field.Label>
                        <Input
                          type="password"
                          value={authData.apiKeyValue || ''}
                          onChange={(e) => setAuthData({ ...authData, apiKeyValue: e.target.value })}
                          placeholder="••••••••"
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.location')}</Field.Label>
                        <NativeSelectRoot>
                          <NativeSelectField
                            value={authData.apiKeyLocation || 'HEADER'}
                            onChange={(e) => setAuthData({ ...authData, apiKeyLocation: e.target.value })}
                          >
                            <option value="HEADER">{t('externalApiConfig.auth.locations.header')}</option>
                            <option value="QUERY">{t('externalApiConfig.auth.locations.query')}</option>
                          </NativeSelectField>
                        </NativeSelectRoot>
                      </Field.Root>
                    </Grid>
                  )}

                  {authData.authType === 'BASIC_AUTH' && (
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.username')}</Field.Label>
                        <Input
                          value={authData.username || ''}
                          onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.password')}</Field.Label>
                        <Input
                          type="password"
                          value={authData.password || ''}
                          onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                        />
                      </Field.Root>
                    </Grid>
                  )}

                  {authData.authType === 'BEARER_TOKEN' && (
                    <Field.Root>
                      <Field.Label>{t('externalApiConfig.auth.token')}</Field.Label>
                      <Input
                        type="password"
                        value={authData.staticToken || ''}
                        onChange={(e) => setAuthData({ ...authData, staticToken: e.target.value })}
                        placeholder="eyJhbGciOiJIUzI1NiIs..."
                      />
                    </Field.Root>
                  )}

                  {authData.authType === 'OAUTH2_CLIENT_CREDENTIALS' && (
                    <VStack gap={4} align="stretch">
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.tokenUrl')}</Field.Label>
                        <Input
                          value={authData.oauth2TokenUrl || ''}
                          onChange={(e) => setAuthData({ ...authData, oauth2TokenUrl: e.target.value })}
                          placeholder="https://auth.example.com/oauth/token"
                        />
                      </Field.Root>
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <Field.Root>
                          <Field.Label>{t('externalApiConfig.auth.clientId')}</Field.Label>
                          <Input
                            value={authData.oauth2ClientId || ''}
                            onChange={(e) => setAuthData({ ...authData, oauth2ClientId: e.target.value })}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>{t('externalApiConfig.auth.clientSecret')}</Field.Label>
                          <Input
                            type="password"
                            value={authData.oauth2ClientSecret || ''}
                            onChange={(e) => setAuthData({ ...authData, oauth2ClientSecret: e.target.value })}
                          />
                        </Field.Root>
                      </Grid>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.auth.scope')}</Field.Label>
                        <Input
                          value={authData.oauth2Scope || ''}
                          onChange={(e) => setAuthData({ ...authData, oauth2Scope: e.target.value })}
                          placeholder="read write"
                        />
                      </Field.Root>
                    </VStack>
                  )}

                  {authData.authType === 'NONE' && (
                    <Card.Root bg="gray.50">
                      <Card.Body py={4} textAlign="center">
                        <Icon as={FiLock} boxSize={8} color="gray.400" mb={2} />
                        <Text color="gray.500">
                          {t('externalApiConfig.auth.noAuthRequired')}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  )}
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="advanced">
                <VStack gap={4} align="stretch">
                  <Fieldset.Root>
                    <Fieldset.Legend>{t('externalApiConfig.advanced.timeoutsRetries')}</Fieldset.Legend>
                    <Fieldset.Content>
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <Field.Root>
                          <Field.Label>{t('externalApiConfig.advanced.timeoutMs')}</Field.Label>
                          <Input
                            type="number"
                            value={formData.timeoutMs || 30000}
                            onChange={(e) => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>{t('externalApiConfig.advanced.retryCount')}</Field.Label>
                          <Input
                            type="number"
                            value={formData.retryCount || 3}
                            onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) })}
                          />
                        </Field.Root>
                      </Grid>
                    </Fieldset.Content>
                  </Fieldset.Root>

                  <Fieldset.Root>
                    <Fieldset.Legend>{t('externalApiConfig.advanced.circuitBreaker')}</Fieldset.Legend>
                    <Fieldset.Content>
                      <HStack justify="space-between">
                        <Text>{t('externalApiConfig.advanced.enableCircuitBreaker')}</Text>
                        <Button
                          size="sm"
                          variant={formData.circuitBreakerEnabled ? 'solid' : 'outline'}
                          colorPalette={formData.circuitBreakerEnabled ? 'green' : 'gray'}
                          onClick={() => setFormData({ ...formData, circuitBreakerEnabled: !formData.circuitBreakerEnabled })}
                        >
                          {formData.circuitBreakerEnabled ? t('common.enabled') : t('common.disabled')}
                        </Button>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        {t('externalApiConfig.advanced.circuitBreakerDescription')}
                      </Text>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="mock">
                <VStack gap={4} align="stretch">
                  <Card.Root bg="orange.50" borderColor="orange.200" borderWidth={1}>
                    <Card.Body py={3}>
                      <HStack>
                        <Icon as={FiZap} color="orange.500" />
                        <Text fontSize="sm" color="orange.700">
                          {t('externalApiConfig.mock.infoMessage')}
                        </Text>
                      </HStack>
                    </Card.Body>
                  </Card.Root>

                  <Fieldset.Root>
                    <Fieldset.Legend>{t('externalApiConfig.mock.title')}</Fieldset.Legend>
                    <Fieldset.Content>
                      <HStack justify="space-between">
                        <VStack align="start" gap={0}>
                          <Text>{t('externalApiConfig.mock.enableMock')}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {t('externalApiConfig.mock.enableMockDescription')}
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          variant={formData.mockEnabled ? 'solid' : 'outline'}
                          colorPalette={formData.mockEnabled ? 'orange' : 'gray'}
                          onClick={() => setFormData({ ...formData, mockEnabled: !formData.mockEnabled })}
                        >
                          {formData.mockEnabled ? t('common.enabled') : t('common.disabled')}
                        </Button>
                      </HStack>
                    </Fieldset.Content>
                  </Fieldset.Root>

                  {formData.mockEnabled && (
                    <>
                      <Field.Root>
                        <Field.Label>{t('externalApiConfig.mock.provider')}</Field.Label>
                        <NativeSelectRoot>
                          <NativeSelectField
                            value={formData.mockProvider || ''}
                            onChange={(e) => setFormData({ ...formData, mockProvider: e.target.value, mockCustomUrl: '' })}
                          >
                            <option value="">{t('externalApiConfig.mock.selectProvider')}</option>
                            {MOCK_PROVIDERS.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </NativeSelectField>
                        </NativeSelectRoot>
                      </Field.Root>

                      {formData.mockProvider === 'HTTPBIN' && (
                        <Card.Root bg="blue.50" borderColor="blue.200" borderWidth={1}>
                          <Card.Body py={3}>
                            <Text fontSize="sm" color="blue.700">
                              {t('externalApiConfig.mock.httpbinInfo')}
                            </Text>
                            <Text fontSize="sm" fontFamily="mono" mt={1} color="blue.800">
                              https://httpbin.org/{(formData.httpMethod || 'post').toLowerCase()}
                            </Text>
                          </Card.Body>
                        </Card.Root>
                      )}

                      {formData.mockProvider && MOCK_PROVIDERS.find(p => p.value === formData.mockProvider)?.needsUrl && (
                        <Field.Root>
                          <Field.Label>{t('externalApiConfig.mock.customUrl')}</Field.Label>
                          <Input
                            value={formData.mockCustomUrl || ''}
                            onChange={(e) => setFormData({ ...formData, mockCustomUrl: e.target.value })}
                            placeholder={
                              formData.mockProvider === 'WEBHOOK_SITE' ? 'https://webhook.site/your-uuid' :
                              formData.mockProvider === 'REQUESTBIN' ? 'https://your-bin.requestbin.com' :
                              formData.mockProvider === 'MOCKAPI' ? 'https://your-project.mockapi.io/api/v1/endpoint' :
                              'https://your-mock-endpoint.com/api'
                            }
                          />
                        </Field.Root>
                      )}

                      <Card.Root bg="orange.50" borderColor="orange.300" borderWidth={1}>
                        <Card.Body py={3}>
                          <HStack>
                            <Icon as={FiAlertTriangle} color="orange.600" />
                            <Text fontSize="sm" color="orange.700" fontWeight="medium">
                              {t('externalApiConfig.mock.warning')}
                            </Text>
                          </HStack>
                        </Card.Body>
                      </Card.Root>
                    </>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Request Mappings Tab */}
              <Tabs.Content value="requestMappings">
                <VStack gap={4} align="stretch">
                  {!selectedConfig ? (
                    <Card.Root bg="yellow.50" borderColor="yellow.200" borderWidth={1}>
                      <Card.Body py={3}>
                        <Text fontSize="sm" color="yellow.700">
                          {t('externalApiConfig.mappings.saveFirst', 'Save the API configuration first to add request mappings.')}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  ) : (
                    <>
                      <Card.Root bg="blue.50" borderColor="blue.200" borderWidth={1}>
                        <Card.Body py={3}>
                          <HStack>
                            <Icon as={FiArrowRight} color="blue.500" />
                            <Text fontSize="sm" color="blue.700">
                              {t('externalApiConfig.mappings.requestInfo', 'Configure which variables are sent to the external API and how they map to request parameters.')}
                            </Text>
                          </HStack>
                        </Card.Body>
                      </Card.Root>

                      <HStack justify="space-between">
                        <Text fontWeight="medium">{t('externalApiConfig.mappings.requestMappings', 'Request Mappings')}</Text>
                        <Button
                          size="sm"
                          colorPalette="blue"
                          onClick={() => {
                            // Add a local draft row (negative ID means not saved yet)
                            const newMapping: mappingService.RequestMapping = {
                              id: -Date.now(), // Temporary negative ID
                              apiConfigId: selectedConfig.id,
                              sourceType: 'TEMPLATE_VARIABLE',
                              variableCode: '',
                              parameterName: '',
                              parameterLocation: 'QUERY',
                              required: false,
                              displayOrder: requestMappings.length,
                              active: true,
                            };
                            setRequestMappings([...requestMappings, newMapping]);
                          }}
                        >
                          <Icon as={FiPlus} mr={1} />
                          {t('externalApiConfig.requestMappings.addMapping', 'Add Mapping')}
                        </Button>
                      </HStack>

                      {loadingMappings ? (
                        <Spinner />
                      ) : requestMappings.length === 0 ? (
                        <Card.Root>
                          <Card.Body textAlign="center" py={6}>
                            <Icon as={FiDatabase} boxSize={8} color="gray.300" mb={2} />
                            <Text color="gray.500">{t('externalApiConfig.mappings.noRequestMappings', 'No request mappings configured')}</Text>
                          </Card.Body>
                        </Card.Root>
                      ) : (
                        <Table.Root size="sm">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader width="120px">{t('externalApiConfig.requestMappings.fields.sourceType', 'Source')}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('externalApiConfig.requestMappings.fields.value', 'Value')}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('externalApiConfig.requestMappings.fields.parameterName', 'Parameter')}</Table.ColumnHeader>
                              <Table.ColumnHeader width="100px">{t('externalApiConfig.requestMappings.fields.parameterLocation', 'Location')}</Table.ColumnHeader>
                              <Table.ColumnHeader width="80px">{t('externalApiConfig.requestMappings.fields.required', 'Req')}</Table.ColumnHeader>
                              <Table.ColumnHeader width="50px"></Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {requestMappings.map((mapping, idx) => {
                              // Helper to check if mapping can be saved
                              const canSaveMapping = () => {
                                if (!mapping.parameterName) return false;
                                switch (mapping.sourceType) {
                                  case 'TEMPLATE_VARIABLE': return !!mapping.variableCode;
                                  case 'CONSTANT': return !!mapping.constantValue;
                                  case 'CALCULATED': return !!mapping.calculatedExpression;
                                  default: return false;
                                }
                              };
                              const isNewRow = !mapping.id || mapping.id < 0;

                              // Helper function to save mapping
                              const saveMapping = async (updatedMapping: mappingService.RequestMapping) => {
                                if (isNewRow && canSaveMapping()) {
                                  try {
                                    const created = await mappingService.createRequestMapping({
                                      ...updatedMapping,
                                      id: undefined,
                                    });
                                    setRequestMappings(prev => prev.map(m => m.id === mapping.id ? created : m));
                                    toaster.create({ title: t('common.success'), description: t('externalApiConfig.requestMappings.messages.created'), type: 'success' });
                                  } catch (error: any) {
                                    toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                  }
                                } else if (!isNewRow && mapping.id) {
                                  try {
                                    await mappingService.updateRequestMapping(mapping.id, updatedMapping);
                                    setRequestMappings(prev => prev.map(m => m.id === mapping.id ? updatedMapping : m));
                                  } catch (error: any) {
                                    toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                  }
                                }
                              };

                              return (
                                <Table.Row key={mapping.id || idx}>
                                {/* Source Type Selector */}
                                <Table.Cell>
                                  <NativeSelectRoot size="sm">
                                    <NativeSelectField
                                      value={mapping.sourceType || 'TEMPLATE_VARIABLE'}
                                      onChange={async (e) => {
                                        const updated = {
                                          ...mapping,
                                          sourceType: e.target.value,
                                          // Clear other source values when switching
                                          variableCode: e.target.value === 'TEMPLATE_VARIABLE' ? mapping.variableCode : '',
                                          constantValue: e.target.value === 'CONSTANT' ? mapping.constantValue : '',
                                          calculatedExpression: e.target.value === 'CALCULATED' ? mapping.calculatedExpression : '',
                                        };
                                        setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                        if (!isNewRow) {
                                          await saveMapping(updated);
                                        }
                                      }}
                                    >
                                      {sourceTypes.map(st => (
                                        <option key={st.value} value={st.value}>{t(`externalApiConfig.requestMappings.sourceTypes.${st.value}`, st.label)}</option>
                                      ))}
                                    </NativeSelectField>
                                  </NativeSelectRoot>
                                </Table.Cell>
                                {/* Value input based on source type */}
                                <Table.Cell>
                                  {mapping.sourceType === 'TEMPLATE_VARIABLE' || !mapping.sourceType ? (
                                    <NativeSelectRoot size="sm">
                                      <NativeSelectField
                                        value={mapping.variableCode || ''}
                                        onChange={async (e) => {
                                          const updated = { ...mapping, variableCode: e.target.value };
                                          setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                          if (updated.variableCode && updated.parameterName) {
                                            await saveMapping(updated);
                                          }
                                        }}
                                      >
                                        <option value="">{t('common.select', 'Select...')}</option>
                                        {templateVariables.map(v => (
                                          <option key={v.code} value={v.code}>{v.name || v.code}</option>
                                        ))}
                                      </NativeSelectField>
                                    </NativeSelectRoot>
                                  ) : mapping.sourceType === 'CONSTANT' ? (
                                    <Input
                                      size="sm"
                                      value={mapping.constantValue || ''}
                                      placeholder={t('externalApiConfig.requestMappings.placeholders.constantValue', 'USD')}
                                      onChange={(e) => {
                                        const updated = { ...mapping, constantValue: e.target.value };
                                        setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                      }}
                                      onBlur={async () => {
                                        if (mapping.constantValue && mapping.parameterName) {
                                          await saveMapping(mapping);
                                        }
                                      }}
                                    />
                                  ) : mapping.sourceType === 'CALCULATED' ? (
                                    <NativeSelectRoot size="sm">
                                      <NativeSelectField
                                        value={mapping.calculatedExpression || ''}
                                        onChange={async (e) => {
                                          const updated = { ...mapping, calculatedExpression: e.target.value };
                                          setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                          if (updated.calculatedExpression && updated.parameterName) {
                                            await saveMapping(updated);
                                          }
                                        }}
                                      >
                                        <option value="">{t('common.select', 'Select function...')}</option>
                                        {calculatedFunctions.map(fn => (
                                          <option key={fn.value} value={fn.value} title={fn.description}>{fn.label}</option>
                                        ))}
                                      </NativeSelectField>
                                    </NativeSelectRoot>
                                  ) : null}
                                </Table.Cell>
                                <Table.Cell>
                                  <Input
                                    size="sm"
                                    value={mapping.parameterName}
                                    placeholder="currency_code"
                                    onChange={(e) => {
                                      const updated = { ...mapping, parameterName: e.target.value };
                                      setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                    }}
                                    onBlur={async () => {
                                      if (canSaveMapping()) {
                                        await saveMapping(mapping);
                                      } else if (!isNewRow && mapping.id) {
                                        try {
                                          await mappingService.updateRequestMapping(mapping.id, mapping);
                                        } catch (error: any) {
                                          toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                        }
                                      }
                                    }}
                                  />
                                </Table.Cell>
                                <Table.Cell>
                                  <NativeSelectRoot size="sm">
                                    <NativeSelectField
                                      value={mapping.parameterLocation}
                                      onChange={async (e) => {
                                        const updated = { ...mapping, parameterLocation: e.target.value };
                                        const isNewRow = !mapping.id || mapping.id < 0;
                                        setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                        if (!isNewRow && mapping.id) {
                                          try {
                                            await mappingService.updateRequestMapping(mapping.id, updated);
                                          } catch (error: any) {
                                            toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                          }
                                        }
                                      }}
                                    >
                                      <option value="PATH">{t('externalApiConfig.requestMappings.locations.PATH', 'Path')}</option>
                                      <option value="QUERY">{t('externalApiConfig.requestMappings.locations.QUERY', 'Query')}</option>
                                      <option value="HEADER">{t('externalApiConfig.requestMappings.locations.HEADER', 'Header')}</option>
                                      <option value="BODY">{t('externalApiConfig.requestMappings.locations.BODY', 'Body')}</option>
                                      <option value="BODY_JSON_PATH">{t('externalApiConfig.requestMappings.locations.BODY_JSON_PATH', 'Body (JSON Path)')}</option>
                                    </NativeSelectField>
                                  </NativeSelectRoot>
                                </Table.Cell>
                                <Table.Cell>
                                  <Button
                                    size="xs"
                                    variant={mapping.required ? 'solid' : 'outline'}
                                    colorPalette={mapping.required ? 'red' : 'gray'}
                                    onClick={async () => {
                                      const updated = { ...mapping, required: !mapping.required };
                                      const isNewRow = !mapping.id || mapping.id < 0;
                                      setRequestMappings(requestMappings.map(m => m.id === mapping.id ? updated : m));
                                      if (!isNewRow && mapping.id) {
                                        try {
                                          await mappingService.updateRequestMapping(mapping.id, updated);
                                        } catch (error: any) {
                                          toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                        }
                                      }
                                    }}
                                  >
                                    {mapping.required ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                  </Button>
                                </Table.Cell>
                                <Table.Cell>
                                  <IconButton
                                    aria-label={t('common.delete', 'Delete')}
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={async () => {
                                      const isNewRow = !mapping.id || mapping.id < 0;
                                      if (isNewRow) {
                                        // Just remove from local state
                                        setRequestMappings(requestMappings.filter(m => m.id !== mapping.id));
                                      } else if (mapping.id) {
                                        try {
                                          await mappingService.deleteRequestMapping(mapping.id);
                                          setRequestMappings(requestMappings.filter(m => m.id !== mapping.id));
                                          toaster.create({ title: t('common.success'), description: t('externalApiConfig.requestMappings.messages.deleted'), type: 'success' });
                                        } catch (error: any) {
                                          toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                        }
                                      }
                                    }}
                                  >
                                    <FiTrash2 />
                                  </IconButton>
                                </Table.Cell>
                              </Table.Row>
                              );
                            })}
                          </Table.Body>
                        </Table.Root>
                      )}
                    </>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Response Mappings Tab */}
              <Tabs.Content value="responseMappings">
                <VStack gap={4} align="stretch">
                  {!selectedConfig ? (
                    <Card.Root bg="yellow.50" borderColor="yellow.200" borderWidth={1}>
                      <Card.Body py={3}>
                        <Text fontSize="sm" color="yellow.700">
                          {t('externalApiConfig.mappings.saveFirst', 'Save the API configuration first to add response mappings.')}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  ) : (
                    <>
                      <Card.Root bg="green.50" borderColor="green.200" borderWidth={1}>
                        <Card.Body py={3}>
                          <HStack>
                            <Icon as={FiArrowLeft} color="green.500" />
                            <Text fontSize="sm" color="green.700">
                              {t('externalApiConfig.mappings.responseInfo', 'Configure which fields to extract from the API response using JSONPath expressions.')}
                            </Text>
                          </HStack>
                        </Card.Body>
                      </Card.Root>

                      <HStack justify="space-between">
                        <Text fontWeight="medium">{t('externalApiConfig.mappings.responseMappings', 'Response Mappings')}</Text>
                        <Button
                          size="sm"
                          colorPalette="green"
                          onClick={() => {
                            // Add a local draft row (negative ID means not saved yet)
                            const newMapping: mappingService.ResponseMapping = {
                              id: -Date.now(),
                              apiConfigId: selectedConfig.id,
                              fieldName: '',
                              jsonPath: '$.data',
                              dataType: 'STRING',
                              required: false,
                              displayOrder: responseMappings.length,
                              active: true,
                            };
                            setResponseMappings([...responseMappings, newMapping]);
                          }}
                        >
                          <Icon as={FiPlus} mr={1} />
                          {t('externalApiConfig.responseMappings.addMapping', 'Add Mapping')}
                        </Button>
                      </HStack>

                      {loadingMappings ? (
                        <Spinner />
                      ) : responseMappings.length === 0 ? (
                        <Card.Root>
                          <Card.Body textAlign="center" py={6}>
                            <Icon as={FiDatabase} boxSize={8} color="gray.300" mb={2} />
                            <Text color="gray.500">{t('externalApiConfig.mappings.noResponseMappings', 'No response mappings configured')}</Text>
                          </Card.Body>
                        </Card.Root>
                      ) : (
                        <Table.Root size="sm">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>{t('externalApiConfig.mappings.fieldName', 'Field Name')}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('externalApiConfig.mappings.jsonPath', 'JSON Path')}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('externalApiConfig.mappings.dataType', 'Type')}</Table.ColumnHeader>
                              <Table.ColumnHeader></Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {responseMappings.map((mapping, idx) => (
                              <Table.Row key={mapping.id || idx}>
                                <Table.Cell>
                                  <Input
                                    size="sm"
                                    value={mapping.fieldName}
                                    placeholder="exchangeRate"
                                    onChange={(e) => {
                                      const updated = { ...mapping, fieldName: e.target.value };
                                      setResponseMappings(responseMappings.map(m => m.id === mapping.id ? updated : m));
                                    }}
                                    onBlur={async () => {
                                      const isNewRow = !mapping.id || mapping.id < 0;
                                      if (isNewRow) {
                                        // Save if both required fields are filled
                                        if (mapping.fieldName && mapping.jsonPath) {
                                          try {
                                            const created = await mappingService.createResponseMapping({
                                              ...mapping,
                                              id: undefined,
                                            });
                                            setResponseMappings(prev => prev.map(m => m.id === mapping.id ? created : m));
                                            toaster.create({ title: t('common.success'), description: t('externalApiConfig.responseMappings.messages.created'), type: 'success' });
                                          } catch (error: any) {
                                            toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                          }
                                        }
                                      } else if (mapping.id) {
                                        try {
                                          await mappingService.updateResponseMapping(mapping.id, mapping);
                                        } catch (error: any) {
                                          toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                        }
                                      }
                                    }}
                                  />
                                </Table.Cell>
                                <Table.Cell>
                                  <Input
                                    size="sm"
                                    value={mapping.jsonPath}
                                    placeholder="$.rates.USD"
                                    fontFamily="mono"
                                    onChange={(e) => {
                                      const updated = { ...mapping, jsonPath: e.target.value };
                                      setResponseMappings(responseMappings.map(m => m.id === mapping.id ? updated : m));
                                    }}
                                    onBlur={async () => {
                                      const isNewRow = !mapping.id || mapping.id < 0;
                                      if (isNewRow) {
                                        // Save if both required fields are filled
                                        if (mapping.fieldName && mapping.jsonPath) {
                                          try {
                                            const created = await mappingService.createResponseMapping({
                                              ...mapping,
                                              id: undefined,
                                            });
                                            setResponseMappings(prev => prev.map(m => m.id === mapping.id ? created : m));
                                            toaster.create({ title: t('common.success'), description: t('externalApiConfig.responseMappings.messages.created'), type: 'success' });
                                          } catch (error: any) {
                                            toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                          }
                                        }
                                      } else if (mapping.id) {
                                        try {
                                          await mappingService.updateResponseMapping(mapping.id, mapping);
                                        } catch (error: any) {
                                          toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                        }
                                      }
                                    }}
                                  />
                                </Table.Cell>
                                <Table.Cell>
                                  <NativeSelectRoot size="sm">
                                    <NativeSelectField
                                      value={mapping.dataType}
                                      onChange={async (e) => {
                                        const updated = { ...mapping, dataType: e.target.value };
                                        const isNewRow = !mapping.id || mapping.id < 0;
                                        setResponseMappings(responseMappings.map(m => m.id === mapping.id ? updated : m));
                                        if (!isNewRow && mapping.id) {
                                          try {
                                            await mappingService.updateResponseMapping(mapping.id, updated);
                                          } catch (error: any) {
                                            toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                          }
                                        }
                                      }}
                                    >
                                      <option value="STRING">{t('externalApiConfig.responseMappings.dataTypes.STRING', 'String')}</option>
                                      <option value="NUMBER">{t('externalApiConfig.responseMappings.dataTypes.NUMBER', 'Number')}</option>
                                      <option value="BOOLEAN">{t('externalApiConfig.responseMappings.dataTypes.BOOLEAN', 'Boolean')}</option>
                                      <option value="DATE">{t('externalApiConfig.responseMappings.dataTypes.DATE', 'Date')}</option>
                                      <option value="JSON_OBJECT">{t('externalApiConfig.responseMappings.dataTypes.JSON_OBJECT', 'JSON Object')}</option>
                                      <option value="JSON_ARRAY">{t('externalApiConfig.responseMappings.dataTypes.JSON_ARRAY', 'JSON Array')}</option>
                                    </NativeSelectField>
                                  </NativeSelectRoot>
                                </Table.Cell>
                                <Table.Cell>
                                  <IconButton
                                    aria-label={t('common.delete', 'Delete')}
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={async () => {
                                      const isNewRow = !mapping.id || mapping.id < 0;
                                      if (isNewRow) {
                                        setResponseMappings(responseMappings.filter(m => m.id !== mapping.id));
                                      } else if (mapping.id) {
                                        try {
                                          await mappingService.deleteResponseMapping(mapping.id);
                                          setResponseMappings(responseMappings.filter(m => m.id !== mapping.id));
                                          toaster.create({ title: t('common.success'), description: t('externalApiConfig.responseMappings.messages.deleted'), type: 'success' });
                                        } catch (error: any) {
                                          toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                        }
                                      }
                                    }}
                                  >
                                    <FiTrash2 />
                                  </IconButton>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      )}
                    </>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Listeners Tab */}
              <Tabs.Content value="listeners">
                <VStack gap={4} align="stretch">
                  {!selectedConfig ? (
                    <Card.Root bg="yellow.50" borderColor="yellow.200" borderWidth={1}>
                      <Card.Body py={3}>
                        <Text fontSize="sm" color="yellow.700">
                          {t('externalApiConfig.mappings.saveFirst', 'Save the API configuration first to add listeners.')}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  ) : (
                    <>
                      <Card.Root bg="purple.50" borderColor="purple.200" borderWidth={1}>
                        <Card.Body py={3}>
                          <HStack>
                            <Icon as={FiBell} color="purple.500" />
                            <Text fontSize="sm" color="purple.700">
                              {t('externalApiConfig.listeners.info', 'Configure actions to execute automatically when the API responds (e.g., update catalogs, send notifications).')}
                            </Text>
                          </HStack>
                        </Card.Body>
                      </Card.Root>

                      <HStack justify="space-between">
                        <Text fontWeight="medium">{t('externalApiConfig.listeners.title', 'Response Listeners')}</Text>
                        <Button
                          size="sm"
                          colorPalette="purple"
                          onClick={() => {
                            // Add a local draft row (negative ID means not saved yet)
                            const newListener: mappingService.ResponseListener = {
                              id: -Date.now(),
                              apiConfigId: selectedConfig.id,
                              name: '',
                              actionType: 'UPDATE_CATALOG',
                              actionConfigJson: '{}',
                              executeOnSuccess: true,
                              executeOnFailure: false,
                              executeAsync: true,
                              executionOrder: responseListeners.length,
                              retryCount: 0,
                              retryDelayMs: 1000,
                              active: true,
                            };
                            setResponseListeners([...responseListeners, newListener]);
                          }}
                        >
                          <Icon as={FiPlus} mr={1} />
                          {t('externalApiConfig.listeners.add', 'Add Listener')}
                        </Button>
                      </HStack>

                      {loadingMappings ? (
                        <Spinner />
                      ) : responseListeners.length === 0 ? (
                        <Card.Root>
                          <Card.Body textAlign="center" py={6}>
                            <Icon as={FiBell} boxSize={8} color="gray.300" mb={2} />
                            <Text color="gray.500">{t('externalApiConfig.listeners.noListeners', 'No listeners configured')}</Text>
                          </Card.Body>
                        </Card.Root>
                      ) : (
                        <VStack gap={3} align="stretch">
                          {responseListeners.map((listener, idx) => (
                            <Card.Root key={listener.id || idx} borderWidth={1}>
                              <Card.Body>
                                <VStack gap={3} align="stretch">
                                  <HStack justify="space-between">
                                    <HStack>
                                      <Badge colorPalette={listener.active ? 'green' : 'gray'}>
                                        {listener.active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                                      </Badge>
                                      <Badge colorPalette="purple">{t(`externalApiConfig.listeners.actionTypes.${listener.actionType}`, listener.actionType)}</Badge>
                                    </HStack>
                                    <HStack>
                                      <Button
                                        size="xs"
                                        variant={listener.active ? 'outline' : 'solid'}
                                        colorPalette={listener.active ? 'orange' : 'green'}
                                        onClick={async () => {
                                          const updated = { ...listener, active: !listener.active };
                                          const isNewRow = !listener.id || listener.id < 0;
                                          setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                          if (!isNewRow && listener.id) {
                                            try {
                                              await mappingService.updateResponseListener(listener.id, updated);
                                            } catch (error: any) {
                                              toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                            }
                                          }
                                        }}
                                      >
                                        {listener.active ? t('common.disable', 'Disable') : t('common.enable', 'Enable')}
                                      </Button>
                                      <IconButton
                                        aria-label={t('common.delete', 'Delete')}
                                        size="xs"
                                        variant="ghost"
                                        colorPalette="red"
                                        onClick={async () => {
                                          const isNewRow = !listener.id || listener.id < 0;
                                          if (isNewRow) {
                                            setResponseListeners(responseListeners.filter(l => l.id !== listener.id));
                                          } else if (listener.id) {
                                            try {
                                              await mappingService.deleteResponseListener(listener.id);
                                              setResponseListeners(responseListeners.filter(l => l.id !== listener.id));
                                              toaster.create({ title: t('common.success'), description: t('externalApiConfig.listeners.messages.deleted'), type: 'success' });
                                            } catch (error: any) {
                                              toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                            }
                                          }
                                        }}
                                      >
                                        <FiTrash2 />
                                      </IconButton>
                                    </HStack>
                                  </HStack>

                                  <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                                    <Field.Root>
                                      <Field.Label fontSize="xs">{t('externalApiConfig.listeners.fields.name', 'Name')}</Field.Label>
                                      <Input
                                        size="sm"
                                        value={listener.name}
                                        placeholder={t('externalApiConfig.listeners.fields.nameHelp', 'Descriptive name')}
                                        onChange={(e) => {
                                          const updated = { ...listener, name: e.target.value };
                                          setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                        }}
                                        onBlur={async () => {
                                          const isNewRow = !listener.id || listener.id < 0;
                                          if (isNewRow) {
                                            // Save if name is filled
                                            if (listener.name) {
                                              try {
                                                const created = await mappingService.createResponseListener({
                                                  ...listener,
                                                  id: undefined,
                                                });
                                                setResponseListeners(prev => prev.map(l => l.id === listener.id ? created : l));
                                                toaster.create({ title: t('common.success'), description: t('externalApiConfig.listeners.messages.created'), type: 'success' });
                                              } catch (error: any) {
                                                toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                              }
                                            }
                                          } else if (listener.id) {
                                            try {
                                              await mappingService.updateResponseListener(listener.id, listener);
                                            } catch (error: any) {
                                              toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                            }
                                          }
                                        }}
                                      />
                                    </Field.Root>
                                    <Field.Root>
                                      <Field.Label fontSize="xs">{t('externalApiConfig.listeners.fields.actionType', 'Action Type')}</Field.Label>
                                      <NativeSelectRoot size="sm">
                                        <NativeSelectField
                                          value={listener.actionType}
                                          onChange={async (e) => {
                                            const updated = { ...listener, actionType: e.target.value };
                                            const isNewRow = !listener.id || listener.id < 0;
                                            setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                            if (!isNewRow && listener.id) {
                                              try {
                                                await mappingService.updateResponseListener(listener.id, updated);
                                              } catch (error: any) {
                                                toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                              }
                                            }
                                          }}
                                        >
                                          {actionTypes.map(at => (
                                            <option key={at.value} value={at.value}>{t(`externalApiConfig.listeners.actionTypes.${at.value}`, at.label)}</option>
                                          ))}
                                        </NativeSelectField>
                                      </NativeSelectRoot>
                                    </Field.Root>
                                  </Grid>

                                  <Field.Root>
                                    <Field.Label fontSize="xs">{t('externalApiConfig.listeners.config', 'Action Configuration (JSON)')}</Field.Label>
                                    <Textarea
                                      size="sm"
                                      rows={3}
                                      fontFamily="mono"
                                      fontSize="xs"
                                      value={listener.actionConfigJson}
                                      placeholder='{"tableName": "currency_exchange_rate", "keyField": "currency_code"}'
                                      onChange={(e) => {
                                        const updated = { ...listener, actionConfigJson: e.target.value };
                                        setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                      }}
                                      onBlur={async () => {
                                        const isNewRow = !listener.id || listener.id < 0;
                                        if (!isNewRow && listener.id) {
                                          try {
                                            await mappingService.updateResponseListener(listener.id, listener);
                                          } catch (error: any) {
                                            toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                          }
                                        }
                                      }}
                                    />
                                  </Field.Root>

                                  <HStack gap={4}>
                                    <HStack>
                                      <Text fontSize="xs">{t('externalApiConfig.listeners.fields.executeOnSuccess', 'On Success')}:</Text>
                                      <Button
                                        size="xs"
                                        variant={listener.executeOnSuccess ? 'solid' : 'outline'}
                                        colorPalette={listener.executeOnSuccess ? 'green' : 'gray'}
                                        onClick={async () => {
                                          const updated = { ...listener, executeOnSuccess: !listener.executeOnSuccess };
                                          const isNewRow = !listener.id || listener.id < 0;
                                          setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                          if (!isNewRow && listener.id) {
                                            try {
                                              await mappingService.updateResponseListener(listener.id, updated);
                                            } catch (error: any) {
                                              toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                            }
                                          }
                                        }}
                                      >
                                        {listener.executeOnSuccess ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                      </Button>
                                    </HStack>
                                    <HStack>
                                      <Text fontSize="xs">{t('externalApiConfig.listeners.fields.executeOnFailure', 'On Failure')}:</Text>
                                      <Button
                                        size="xs"
                                        variant={listener.executeOnFailure ? 'solid' : 'outline'}
                                        colorPalette={listener.executeOnFailure ? 'red' : 'gray'}
                                        onClick={async () => {
                                          const updated = { ...listener, executeOnFailure: !listener.executeOnFailure };
                                          const isNewRow = !listener.id || listener.id < 0;
                                          setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                          if (!isNewRow && listener.id) {
                                            try {
                                              await mappingService.updateResponseListener(listener.id, updated);
                                            } catch (error: any) {
                                              toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                            }
                                          }
                                        }}
                                      >
                                        {listener.executeOnFailure ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                      </Button>
                                    </HStack>
                                    <HStack>
                                      <Text fontSize="xs">{t('externalApiConfig.listeners.fields.async', 'Async')}:</Text>
                                      <Button
                                        size="xs"
                                        variant={listener.executeAsync ? 'solid' : 'outline'}
                                        colorPalette={listener.executeAsync ? 'blue' : 'gray'}
                                        onClick={async () => {
                                          const updated = { ...listener, executeAsync: !listener.executeAsync };
                                          const isNewRow = !listener.id || listener.id < 0;
                                          setResponseListeners(responseListeners.map(l => l.id === listener.id ? updated : l));
                                          if (!isNewRow && listener.id) {
                                            try {
                                              await mappingService.updateResponseListener(listener.id, updated);
                                            } catch (error: any) {
                                              toaster.create({ title: t('common.error'), description: error.message, type: 'error' });
                                            }
                                          }
                                        }}
                                      >
                                        {listener.executeAsync ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                      </Button>
                                    </HStack>
                                  </HStack>
                                </VStack>
                              </Card.Body>
                            </Card.Root>
                          ))}
                        </VStack>
                      )}
                    </>
                  )}
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button colorPalette="blue" onClick={handleSave} loading={saving}>
              <Icon as={FiCheck} mr={2} />
              {selectedConfig ? t('common.saveChanges') : t('externalApiConfig.createApi')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Test Dialog */}
      <DialogRoot open={isTestDialogOpen} onOpenChange={(e) => setIsTestDialogOpen(e.open)} size="lg">
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto',
            maxWidth: '600px',
            width: '90%'
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('externalApiConfig.test.title')} - {selectedConfig?.name}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {showTestForm && !testing && !testResult ? (
              <VStack align="stretch" gap={4}>
                <Card.Root bg="blue.50" borderColor="blue.200" borderWidth={1}>
                  <Card.Body py={3}>
                    <HStack>
                      <Icon as={FiActivity} color="blue.500" />
                      <Text fontSize="sm" color="blue.700">
                        {t('externalApiConfig.test.payloadHint')}
                      </Text>
                    </HStack>
                  </Card.Body>
                </Card.Root>

                <Field.Root>
                  <Field.Label>{t('externalApiConfig.test.testPayload')}</Field.Label>
                  <Textarea
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={10}
                    fontFamily="mono"
                    fontSize="sm"
                  />
                </Field.Root>

                <HStack fontSize="xs" color="gray.500">
                  <Text fontWeight="medium">URL:</Text>
                  {selectedConfig?.mockEnabled ? (
                    <HStack>
                      <Badge colorPalette="orange" size="sm">MOCK</Badge>
                      <Text color="orange.600">
                        {selectedConfig?.mockProvider === 'HTTPBIN'
                          ? `https://httpbin.org/${selectedConfig?.httpMethod?.toLowerCase()}`
                          : selectedConfig?.mockCustomUrl || 'mock'}
                      </Text>
                    </HStack>
                  ) : (
                    <Text>{selectedConfig?.baseUrl}{selectedConfig?.path}</Text>
                  )}
                </HStack>
                <HStack fontSize="xs" color="gray.500">
                  <Text fontWeight="medium">{t('externalApiConfig.fields.httpMethod')}:</Text>
                  <Badge colorPalette="purple" size="sm">{selectedConfig?.httpMethod}</Badge>
                </HStack>
              </VStack>
            ) : testing ? (
              <VStack py={8}>
                <Spinner size="xl" />
                <Text>{t('externalApiConfig.test.testing')}</Text>
              </VStack>
            ) : testResult ? (
              <VStack align="stretch" gap={4}>
                <Card.Root bg={testResult.success ? 'green.50' : 'red.50'}>
                  <Card.Body>
                    <HStack>
                      <Icon
                        as={testResult.success ? FiCheck : FiX}
                        color={testResult.success ? 'green.500' : 'red.500'}
                        boxSize={6}
                      />
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" color={testResult.success ? 'green.700' : 'red.700'}>
                          {testResult.success ? t('externalApiConfig.test.success') : t('externalApiConfig.test.failed')}
                        </Text>
                        {testResult.executionTimeMs && (
                          <Text fontSize="sm" color="gray.600">
                            {t('externalApiConfig.test.responseTime')}: {testResult.executionTimeMs}ms
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>

                {testResult.responseStatusCode && (
                  <HStack>
                    <Text fontWeight="medium">{t('externalApiConfig.test.statusCode')}:</Text>
                    <Badge colorPalette={testResult.responseStatusCode < 300 ? 'green' : 'red'}>
                      {testResult.responseStatusCode}
                    </Badge>
                  </HStack>
                )}

                {testResult.errorMessage && (
                  <Card.Root bg="red.50">
                    <Card.Body>
                      <Text color="red.700" fontSize="sm">{testResult.errorMessage}</Text>
                    </Card.Body>
                  </Card.Root>
                )}

                {testResult.responseBody && (
                  <Field.Root>
                    <Field.Label>{t('externalApiConfig.test.response')}</Field.Label>
                    <Textarea
                      value={typeof testResult.responseBody === 'string' ? testResult.responseBody : JSON.stringify(testResult.responseBody, null, 2)}
                      readOnly
                      rows={6}
                      fontFamily="mono"
                      fontSize="xs"
                    />
                  </Field.Root>
                )}
              </VStack>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTestDialogOpen(false)}>{t('common.close')}</Button>
            {showTestForm && !testing && !testResult && (
              <Button colorPalette="green" onClick={handleTest}>
                <Icon as={FiPlay} mr={2} />
                {t('externalApiConfig.test.execute')}
              </Button>
            )}
            {testResult && (
              <Button colorPalette="blue" onClick={() => { setTestResult(null); setShowTestForm(true); }}>
                <Icon as={FiRefreshCw} mr={2} />
                {t('externalApiConfig.test.retry')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* OpenAPI Import Dialog */}
      <DialogRoot open={isImportDialogOpen} onOpenChange={(e) => setIsImportDialogOpen(e.open)} size="xl">
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto',
            maxWidth: '900px',
            width: '95%'
          }}
        >
          <DialogHeader>
            <DialogTitle>
              <HStack>
                <Icon as={FiCode} color="teal.500" />
                <Text>Importar desde OpenAPI / Swagger</Text>
              </HStack>
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              {/* Import Mode Selector */}
              <HStack gap={4}>
                <Button
                  flex={1}
                  variant={importMode === 'file' ? 'solid' : 'outline'}
                  colorPalette={importMode === 'file' ? 'teal' : 'gray'}
                  onClick={() => setImportMode('file')}
                >
                  <Icon as={FiUpload} mr={2} />
                  Subir Archivo
                </Button>
                <Button
                  flex={1}
                  variant={importMode === 'url' ? 'solid' : 'outline'}
                  colorPalette={importMode === 'url' ? 'teal' : 'gray'}
                  onClick={() => setImportMode('url')}
                >
                  <Icon as={FiLink} mr={2} />
                  Desde URL
                </Button>
              </HStack>

              {/* File Upload */}
              {importMode === 'file' && (
                <Card.Root borderStyle="dashed" borderWidth={2} borderColor="teal.300" bg="teal.50">
                  <Card.Body py={8} textAlign="center">
                    <VStack gap={3}>
                      <Icon as={FiUpload} boxSize={10} color="teal.500" />
                      <Text fontWeight="medium" color="teal.700">
                        Arrastre o seleccione un archivo OpenAPI
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Formatos soportados: .json, .yaml, .yml (OpenAPI 2.0, 3.0, 3.1)
                      </Text>
                      <Input
                        type="file"
                        accept=".json,.yaml,.yml"
                        onChange={handleFileUpload}
                        disabled={importLoading}
                        pt={1}
                        maxW="300px"
                      />
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* URL Input */}
              {importMode === 'url' && (
                <VStack gap={3} align="stretch">
                  <Field.Root>
                    <Field.Label>URL del archivo OpenAPI</Field.Label>
                    <HStack>
                      <Input
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://api.example.com/openapi.json"
                        flex={1}
                      />
                      <Button
                        colorPalette="teal"
                        onClick={handleUrlImport}
                        disabled={importLoading || !importUrl.trim()}
                      >
                        {importLoading ? <Spinner size="sm" /> : 'Cargar'}
                      </Button>
                    </HStack>
                  </Field.Root>
                  <Text fontSize="xs" color="gray.500">
                    Ejemplo: https://petstore.swagger.io/v2/swagger.json
                  </Text>
                </VStack>
              )}

              {/* Loading */}
              {importLoading && (
                <Box textAlign="center" py={6}>
                  <Spinner size="lg" color="teal.500" />
                  <Text mt={2} color="gray.500">Procesando especificacion...</Text>
                </Box>
              )}

              {/* Parsed Result */}
              {parsedOpenApi && !importLoading && (
                <VStack gap={4} align="stretch">
                  {/* API Info */}
                  <Card.Root bg="gray.50">
                    <Card.Body py={3}>
                      <HStack justify="space-between">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="bold" color="teal.700">
                            {parsedOpenApi.title || 'API sin titulo'}
                          </Text>
                          {parsedOpenApi.description && (
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {parsedOpenApi.description}
                            </Text>
                          )}
                        </VStack>
                        <VStack align="end" gap={0}>
                          <Badge colorPalette="teal">v{parsedOpenApi.version || '1.0'}</Badge>
                          <Text fontSize="xs" color="gray.500">{parsedOpenApi.baseUrl}</Text>
                        </VStack>
                      </HStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Security Schemes */}
                  {parsedOpenApi.securitySchemes && parsedOpenApi.securitySchemes.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={2} fontSize="sm" color="gray.600">
                        <Icon as={FiLock} mr={1} /> Esquemas de Autenticacion Detectados:
                      </Text>
                      <HStack flexWrap="wrap" gap={2}>
                        {parsedOpenApi.securitySchemes.map((scheme, idx) => (
                          <Badge key={idx} colorPalette="purple" variant="subtle">
                            {scheme.name}: {scheme.mappedAuthType}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  {/* Endpoints List */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="medium" fontSize="sm" color="gray.600">
                        Endpoints Disponibles ({parsedOpenApi.endpoints?.length || 0})
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Click en un endpoint para configurarlo
                      </Text>
                    </HStack>

                    <Box maxH="300px" overflowY="auto" borderWidth={1} borderRadius="md">
                      <Table.Root size="sm">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader width="80px">Metodo</Table.ColumnHeader>
                            <Table.ColumnHeader>Path</Table.ColumnHeader>
                            <Table.ColumnHeader>Descripcion</Table.ColumnHeader>
                            <Table.ColumnHeader width="100px">Accion</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {parsedOpenApi.endpoints?.map((endpoint, idx) => (
                            <Table.Row
                              key={idx}
                              _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.50' }}
                            >
                              <Table.Cell>
                                <Badge
                                  colorPalette={
                                    endpoint.httpMethod === 'GET' ? 'green' :
                                    endpoint.httpMethod === 'POST' ? 'blue' :
                                    endpoint.httpMethod === 'PUT' ? 'orange' :
                                    endpoint.httpMethod === 'DELETE' ? 'red' : 'gray'
                                  }
                                  fontFamily="mono"
                                  fontSize="xs"
                                >
                                  {endpoint.httpMethod}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell>
                                <Text fontFamily="mono" fontSize="sm" color="gray.700">
                                  {endpoint.path}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                  {endpoint.summary || endpoint.operationId || '-'}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                <Button
                                  size="xs"
                                  colorPalette="teal"
                                  onClick={() => handleImportEndpoint(endpoint)}
                                >
                                  <Icon as={FiPlus} mr={1} />
                                  Usar
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  </Box>

                  {/* Messages/Warnings */}
                  {parsedOpenApi.messages && parsedOpenApi.messages.length > 0 && (
                    <Card.Root bg="yellow.50" borderColor="yellow.200" borderWidth={1}>
                      <Card.Body py={2}>
                        <HStack align="start">
                          <Icon as={FiAlertTriangle} color="yellow.600" mt={0.5} />
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" fontWeight="medium" color="yellow.700">
                              Advertencias del Parser
                            </Text>
                            {parsedOpenApi.messages.map((msg, idx) => (
                              <Text key={idx} fontSize="xs" color="yellow.600">
                                {msg}
                              </Text>
                            ))}
                          </VStack>
                        </HStack>
                      </Card.Body>
                    </Card.Root>
                  )}
                </VStack>
              )}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
