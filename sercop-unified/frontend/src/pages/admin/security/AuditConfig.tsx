import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Icon,
  Alert,
  Input,
  Separator,
  Badge,
  Collapsible,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { NumberInputRoot, NumberInputInput } from '@chakra-ui/react/number-input';
import { Switch } from '@chakra-ui/react/switch';
import {
  LuFileText,
  LuDatabase,
  LuLink,
  LuCloud,
  LuSave,
  LuInfo,
  LuChevronDown,
  LuChevronRight,
  LuCircleCheck,
  LuTarget,
  LuLightbulb,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

interface AuditConfigProps {
  config: any;
  onSave: (config: any) => void;
  onChange: () => void;
  isSaving: boolean;
}

const SIEM_TYPES = [
  { value: 'splunk', label: 'Splunk' },
  { value: 'elastic', label: 'Elastic SIEM' },
  { value: 'sentinel', label: 'Azure Sentinel' },
  { value: 'datadog', label: 'Datadog' },
];

const BLOCKCHAIN_NETWORKS = [
  { value: 'polygon', label: 'Polygon' },
  { value: 'hyperledger', label: 'Hyperledger Fabric' },
  { value: 'private-eth', label: 'Private Ethereum' },
];

// Implementation status for advanced features
const FEATURE_STATUS = {
  database: { implemented: true, status: 'production' },
  blockchain: { implemented: false, status: 'roadmap' },
  siem: { implemented: false, status: 'roadmap' },
};

export default function AuditConfig({
  config,
  onSave,
  onChange,
  isSaving,
}: AuditConfigProps) {
  const { t } = useTranslation();
  const [showAuditInfo, setShowAuditInfo] = useState(false);
  const [auditConfig, setAuditConfig] = useState({
    database: {
      enabled: true,
      retentionDays: 365,
      detailedLogging: true,
    },
    blockchain: {
      enabled: false,
      network: 'polygon',
      contractAddress: '',
    },
    siem: {
      enabled: false,
      type: 'splunk',
      endpoint: '',
      apiKey: '',
    },
    sensitiveFields: ['password', 'token', 'secret', 'apiKey'],
    ...config,
  });

  const cardBg = 'gray.50';

  const handleChange = (section: string, field: string, value: any) => {
    setAuditConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    onChange();
  };

  const destinations = [
    {
      key: 'database',
      icon: LuDatabase,
      nameKey: 'securityConfig.audit.destinations.database',
      descKey: 'securityConfig.audit.destinations.databaseDesc',
      color: 'blue',
      alwaysOn: true,
      implemented: true,
      statusLabel: 'Implementado',
    },
    {
      key: 'blockchain',
      icon: LuLink,
      nameKey: 'securityConfig.audit.destinations.blockchain',
      descKey: 'securityConfig.audit.destinations.blockchainDesc',
      color: 'purple',
      alwaysOn: false,
      implemented: false,
      statusLabel: 'Roadmap Q3 2026',
    },
    {
      key: 'siem',
      icon: LuCloud,
      nameKey: 'securityConfig.audit.destinations.siem',
      descKey: 'securityConfig.audit.destinations.siemDesc',
      color: 'green',
      alwaysOn: false,
      implemented: false,
      statusLabel: 'Roadmap Q2 2026',
    },
  ];

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <HStack mb={2}>
          <Icon as={LuFileText} boxSize={5} color="blue.500" />
          <Heading size="md">{t('securityConfig.audit.title')}</Heading>
        </HStack>
        <Text color="gray.500" fontSize="sm">
          {t('securityConfig.audit.description')}
        </Text>
      </Box>

      {/* Audit Info Panel */}
      <Box
        bg="green.50"
        border="1px solid"
        borderColor="green.200"
        borderRadius="lg"
        overflow="hidden"
      >
        <Box
          p={4}
          cursor="pointer"
          onClick={() => setShowAuditInfo(!showAuditInfo)}
          _hover={{ bg: 'green.100' }}
          transition="background 0.2s"
        >
          <HStack justify="space-between">
            <HStack gap={3}>
              <Icon as={LuInfo} color="green.500" boxSize={5} />
              <Box>
                <Text fontWeight="semibold" color="green.700">
                  {t('securityConfig.audit.tooltip.title')}
                </Text>
                <Text fontSize="sm" color="green.600">
                  {t('securityConfig.audit.tooltip.description')}
                </Text>
              </Box>
            </HStack>
            <Icon as={showAuditInfo ? LuChevronDown : LuChevronRight} color="green.500" boxSize={5} />
          </HStack>
        </Box>
        <Collapsible.Root open={showAuditInfo}>
          <Collapsible.Content>
            <Box px={4} pb={4}>
              <VStack align="stretch" gap={4}>
                {/* Benefits */}
                <Box>
                  <HStack mb={2}>
                    <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      {t('securityConfig.audit.tooltip.benefits.title')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1} pl={6}>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.audit.tooltip.benefits.compliance')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.audit.tooltip.benefits.forensics')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.audit.tooltip.benefits.accountability')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.audit.tooltip.benefits.detection')}</Text>
                  </VStack>
                </Box>

                {/* Destinations Info */}
                <Box>
                  <HStack mb={2}>
                    <Icon as={LuTarget} color="purple.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      {t('securityConfig.audit.tooltip.destinations.title')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1} pl={6}>
                    <Text fontSize="sm" color="gray.600">• <Text as="span" fontWeight="semibold">Database:</Text> {t('securityConfig.audit.tooltip.destinations.database')}</Text>
                    <Text fontSize="sm" color="gray.600">• <Text as="span" fontWeight="semibold">Blockchain:</Text> {t('securityConfig.audit.tooltip.destinations.blockchain')}</Text>
                    <Text fontSize="sm" color="gray.600">• <Text as="span" fontWeight="semibold">SIEM:</Text> {t('securityConfig.audit.tooltip.destinations.siem')}</Text>
                  </VStack>
                </Box>

                {/* Tips */}
                <Box bg="yellow.50" p={3} borderRadius="md" border="1px solid" borderColor="yellow.200">
                  <HStack mb={1}>
                    <Icon as={LuLightbulb} color="yellow.600" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="yellow.700">Tips</Text>
                  </HStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.audit.tooltip.retentionTip')}</Text>
                    <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.audit.tooltip.blockchainTip')}</Text>
                  </VStack>
                </Box>

                {/* Compliance Evidence Section */}
                <Separator my={2} />
                <Box bg="purple.50" p={3} borderRadius="md" border="1px solid" borderColor="purple.200">
                  <HStack mb={2}>
                    <Icon as={LuCircleCheck} color="purple.600" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="purple.700">
                      {t('securityConfig.audit.tooltip.compliance.title', 'Dónde encontrar evidencia de cumplimiento')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={3}>
                    {/* SOX, PCI-DSS, GDPR, Basel III */}
                    <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="purple.100">
                      <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                        📜 Cumplimiento Regulatorio (SOX, PCI-DSS, GDPR, Basilea III)
                      </Text>
                      <VStack align="stretch" gap={1} pl={3}>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Exportar CSV/JSON</Text> - Genera reportes de auditoría para auditores externos
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Usuarios</Text> - Control de acceso basado en roles (RBAC) requerido por PCI-DSS
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Esta página → Regla de 4 Ojos</Text> - Segregación de funciones requerida por SOX y Basilea III
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Esta página → Retención de Logs (365+ días)</Text> - Cumple requisitos de retención de PCI-DSS y GDPR
                        </Text>
                      </VStack>
                    </Box>

                    {/* Incident Response */}
                    <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="purple.100">
                      <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                        🚨 Respuesta a Incidentes (Línea de tiempo completa)
                      </Text>
                      <VStack align="stretch" gap={1} pl={3}>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Pestaña "Eventos Críticos"</Text> - Timeline de eventos de alto riesgo en las últimas 24h
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Filtrar por fecha y usuario</Text> - Reconstruir secuencia completa de acciones
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Ver detalle de evento</Text> - IP, User Agent, recurso afectado, resultado
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Bandeja de Trabajo → Historial de Eventos</Text> - Versiones y cambios en LCs, Garantías, Cobranzas
                        </Text>
                      </VStack>
                    </Box>

                    {/* Accountability */}
                    <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="purple.100">
                      <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                        👤 Responsabilidad (Quién hizo qué y cuándo)
                      </Text>
                      <VStack align="stretch" gap={1} pl={3}>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Logs de Auditoría</Text> - Cada acción registra: usuario, timestamp, IP, acción, resultado
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Bandeja de Trabajo → Por Aprobar</Text> - Historial de quién aprobó/rechazó cada operación
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Auditoría → Filtrar por tipo "PERMISSION_CHANGE"</Text> - Cambios en permisos y roles
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Auditoría → Filtrar por tipo "PASSWORD_CHANGE"</Text> - Cambios de contraseñas
                        </Text>
                      </VStack>
                    </Box>

                    {/* Threat Detection */}
                    <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="purple.100">
                      <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={1}>
                        🔍 Detección de Amenazas (Patrones sospechosos)
                      </Text>
                      <VStack align="stretch" gap={1} pl={3}>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Pestaña "Alertas"</Text> - Alertas automáticas por múltiples fallos de login
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Filtrar por "Nivel de Amenaza"</Text> - Ver eventos CRITICAL, HIGH, MEDIUM
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Menú → Auditoría de Seguridad → Estadísticas</Text> - Métricas de logins exitosos vs fallidos
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • <Text as="span" fontWeight="semibold">Esta página → Motor de Riesgo</Text> - Reglas automáticas para detectar comportamiento anómalo
                        </Text>
                      </VStack>
                    </Box>
                  </VStack>
                </Box>

                {/* Menu Options for Verification */}
                <Separator my={2} />
                <Box bg="blue.50" p={3} borderRadius="md" border="1px solid" borderColor="blue.200">
                  <HStack mb={2}>
                    <Icon as={LuTarget} color="blue.600" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="blue.700">
                      {t('securityConfig.audit.tooltip.menuOptions.title', 'Cómo verificar el funcionamiento')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={2}>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                        📋 {t('securityConfig.audit.tooltip.menuOptions.auditLogs', 'Menú → Auditoría de Seguridad')}
                      </Text>
                      <Text fontSize="xs" color="blue.600" pl={5}>
                        {t('securityConfig.audit.tooltip.menuOptions.auditLogsDesc', 'Visualiza todos los eventos de seguridad registrados: logins, cambios de permisos, accesos bloqueados y más.')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                        🚨 {t('securityConfig.audit.tooltip.menuOptions.alerts', 'Auditoría de Seguridad → Pestaña "Alertas"')}
                      </Text>
                      <Text fontSize="xs" color="blue.600" pl={5}>
                        {t('securityConfig.audit.tooltip.menuOptions.alertsDesc', 'Revisa alertas de seguridad no reconocidas como intentos de acceso sospechosos o múltiples fallos de login.')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                        ⚠️ {t('securityConfig.audit.tooltip.menuOptions.critical', 'Auditoría de Seguridad → Pestaña "Eventos Críticos"')}
                      </Text>
                      <Text fontSize="xs" color="blue.600" pl={5}>
                        {t('securityConfig.audit.tooltip.menuOptions.criticalDesc', 'Monitorea eventos críticos de las últimas 24 horas que requieren atención inmediata.')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                        📊 {t('securityConfig.audit.tooltip.menuOptions.export', 'Auditoría de Seguridad → Exportar Logs (CSV/JSON)')}
                      </Text>
                      <Text fontSize="xs" color="blue.600" pl={5}>
                        {t('securityConfig.audit.tooltip.menuOptions.exportDesc', 'Descarga los registros de auditoría para análisis externo, reportes de cumplimiento o integración con herramientas SIEM.')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                        🔍 {t('securityConfig.audit.tooltip.menuOptions.filter', 'Auditoría de Seguridad → Filtros Avanzados')}
                      </Text>
                      <Text fontSize="xs" color="blue.600" pl={5}>
                        {t('securityConfig.audit.tooltip.menuOptions.filterDesc', 'Filtra por usuario, tipo de evento (LOGIN, LOGOUT, PASSWORD_CHANGE), resultado (SUCCESS, FAILURE, BLOCKED) y nivel de amenaza.')}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>

      {/* Destination Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        {destinations.map(dest => (
          <Box
            key={dest.key}
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={(auditConfig as any)[dest.key]?.enabled ? `${dest.color}.300` : 'gray.200'}
            opacity={dest.implemented ? 1 : 0.75}
          >
            <HStack justify="space-between" mb={3}>
              <HStack gap={3}>
                <Box p={2} borderRadius="md" bg={`${dest.color}.100`}>
                  <Icon as={dest.icon} color={`${dest.color}.500`} boxSize={5} />
                </Box>
                <Box>
                  <HStack flexWrap="wrap" gap={1}>
                    <Text fontWeight="semibold">{t(dest.nameKey)}</Text>
                    {dest.alwaysOn && (
                      <Badge colorPalette="blue" fontSize="xs">
                        {t('securityConfig.audit.alwaysOn')}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {t(dest.descKey)}
                  </Text>
                  {/* Implementation Status Badge */}
                  <Badge
                    colorPalette={dest.implemented ? 'green' : 'orange'}
                    fontSize="xs"
                    mt={1}
                    variant={dest.implemented ? 'solid' : 'outline'}
                  >
                    {dest.implemented ? '✓ ' : '🗓 '}{dest.statusLabel}
                  </Badge>
                </Box>
              </HStack>
              <Switch.Root
                checked={(auditConfig as any)[dest.key]?.enabled}
                onCheckedChange={(e) => handleChange(dest.key, 'enabled', e.checked)}
                colorPalette={dest.color}
                disabled={dest.alwaysOn || !dest.implemented}
              >
                <Switch.HiddenInput />
                <Switch.Control />
              </Switch.Root>
            </HStack>
            {/* Not Implemented Warning */}
            {!dest.implemented && (
              <Alert.Root status="info" size="sm" borderRadius="md" mt={2}>
                <Alert.Indicator />
                <Alert.Description fontSize="xs">
                  {t('securityConfig.audit.notImplementedYet', 'Esta funcionalidad está planificada para futuras versiones. La configuración se guardará para cuando esté disponible.')}
                </Alert.Description>
              </Alert.Root>
            )}
          </Box>
        ))}
      </SimpleGrid>

      {/* Database Configuration */}
      <Box p={5} bg={cardBg} borderRadius="lg">
        <HStack mb={4}>
          <Icon as={LuDatabase} boxSize={5} color="blue.500" />
          <Heading size="sm">{t('securityConfig.audit.databaseConfig')}</Heading>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Field.Root>
            <Field.Label>{t('securityConfig.audit.retentionDays')}</Field.Label>
            <NumberInputRoot
              value={String(auditConfig.database.retentionDays)}
              onValueChange={(e) => handleChange('database', 'retentionDays', Number(e.value))}
              min={30}
              max={3650}
            >
              <NumberInputInput />
            </NumberInputRoot>
          </Field.Root>

          <HStack justify="space-between">
            <Text>{t('securityConfig.audit.detailedLogging')}</Text>
            <Switch.Root
              checked={auditConfig.database.detailedLogging}
              onCheckedChange={(e) => handleChange('database', 'detailedLogging', e.checked)}
              colorPalette="blue"
            >
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          </HStack>
        </SimpleGrid>
      </Box>

      {/* Blockchain Configuration */}
      {auditConfig.blockchain.enabled && (
        <Box p={5} bg={cardBg} borderRadius="lg">
          <HStack mb={4}>
            <Icon as={LuLink} boxSize={5} color="purple.500" />
            <Heading size="sm">{t('securityConfig.audit.blockchainConfig')}</Heading>
          </HStack>

          <VStack gap={4} align="stretch">
            <Field.Root>
              <Field.Label>{t('securityConfig.audit.blockchainNetwork')}</Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  value={auditConfig.blockchain.network}
                  onChange={(e) => handleChange('blockchain', 'network', e.target.value)}
                >
                  {BLOCKCHAIN_NETWORKS.map(network => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('securityConfig.audit.contractAddress')}</Field.Label>
              <Input
                value={auditConfig.blockchain.contractAddress}
                onChange={(e) => handleChange('blockchain', 'contractAddress', e.target.value)}
                placeholder="0x..."
              />
            </Field.Root>

            <Alert.Root status="info" borderRadius="md">
              <Alert.Indicator />
              <Alert.Description>
                <Text fontSize="sm">{t('securityConfig.audit.blockchainInfo')}</Text>
              </Alert.Description>
            </Alert.Root>
          </VStack>
        </Box>
      )}

      {/* SIEM Configuration */}
      {auditConfig.siem.enabled && (
        <Box p={5} bg={cardBg} borderRadius="lg">
          <HStack mb={4}>
            <Icon as={LuCloud} boxSize={5} color="green.500" />
            <Heading size="sm">{t('securityConfig.audit.siemConfig')}</Heading>
          </HStack>

          <VStack gap={4} align="stretch">
            <Field.Root>
              <Field.Label>{t('securityConfig.audit.siemType')}</Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  value={auditConfig.siem.type}
                  onChange={(e) => handleChange('siem', 'type', e.target.value)}
                >
                  {SIEM_TYPES.map(siem => (
                    <option key={siem.value} value={siem.value}>
                      {siem.label}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('securityConfig.audit.siemEndpoint')}</Field.Label>
              <Input
                value={auditConfig.siem.endpoint}
                onChange={(e) => handleChange('siem', 'endpoint', e.target.value)}
                placeholder="https://..."
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('securityConfig.audit.siemApiKey')}</Field.Label>
              <Input
                type="password"
                value={auditConfig.siem.apiKey}
                onChange={(e) => handleChange('siem', 'apiKey', e.target.value)}
                placeholder="API Key"
              />
            </Field.Root>
          </VStack>
        </Box>
      )}

      <Button
        colorPalette="blue"
        onClick={() => onSave(auditConfig)}
        loading={isSaving}
        alignSelf="flex-end"
        size="lg"
      >
        <LuSave style={{ marginRight: '8px' }} />
        {t('common.saveChanges')}
      </Button>
    </VStack>
  );
}
