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
  Badge,
  Alert,
  Separator,
  Collapsible,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { Switch } from '@chakra-ui/react/switch';
import { Tooltip } from '@chakra-ui/react/tooltip';
import {
  LuUsers,
  LuBrain,
  LuShieldCheck,
  LuSave,
  LuInfo,
  LuChevronDown,
  LuChevronRight,
  LuLightbulb,
  LuCircleCheck,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

interface AuthorizationConfigProps {
  config: any;
  onSave: (config: any) => void;
  onChange: () => void;
  isSaving: boolean;
}

const COMBINATION_STRATEGIES = [
  { value: 'any-allows', labelKey: 'securityConfig.authz.combinations.anyAllows' },
  { value: 'all-must-allow', labelKey: 'securityConfig.authz.combinations.allMustAllow' },
  { value: 'weighted', labelKey: 'securityConfig.authz.combinations.weighted' },
  { value: 'first-applicable', labelKey: 'securityConfig.authz.combinations.firstApplicable' },
];

export default function AuthorizationConfig({
  config,
  onSave,
  onChange,
  isSaving,
}: AuthorizationConfigProps) {
  const { t } = useTranslation();
  const [authzConfig, setAuthzConfig] = useState({
    primaryEngine: 'rbac',
    combinationStrategy: 'any-allows',
    engines: {
      rbac: true,
      riskEngine: false,
    },
    riskEngineConfig: {
      enabled: false,
      thresholds: {
        low: 30,
        medium: 60,
        high: 80,
      },
      autoBlock: false,
    },
    ...config,
  });

  const cardBg = 'gray.50';
  const engineCardBg = 'white';

  const handleChange = (field: string, value: any) => {
    setAuthzConfig((prev: any) => ({ ...prev, [field]: value }));
    onChange();
  };

  const handleEngineToggle = (engine: string, enabled: boolean) => {
    setAuthzConfig((prev: any) => ({
      ...prev,
      engines: { ...prev.engines, [engine]: enabled },
    }));
    onChange();
  };

  const handleRiskConfigChange = (field: string, value: any) => {
    setAuthzConfig((prev: any) => ({
      ...prev,
      riskEngineConfig: { ...prev.riskEngineConfig, [field]: value },
    }));
    onChange();
  };

  // Only show implemented engines
  const engines = [
    {
      key: 'rbac',
      icon: LuUsers,
      name: 'RBAC (Control de Acceso basado en Roles)',
      description: 'Permisos basados en roles de usuario (Admin, Manager, Operator, User)',
      color: 'blue',
      alwaysOn: true,
      implemented: true,
    },
    {
      key: 'riskEngine',
      icon: LuBrain,
      name: 'Motor de Riesgo',
      description: 'Evalúa riesgo basado en IP, horario, dispositivo, montos y comportamiento',
      color: 'orange',
      alwaysOn: false,
      implemented: true,
    },
  ];

  const [showAuthzInfo, setShowAuthzInfo] = useState(false);

  return (
    <VStack gap={6} align="stretch">
      {/* Engines Section */}
      <Box>
        <HStack mb={4}>
          <Icon as={LuShieldCheck} boxSize={5} color="blue.500" />
          <Heading size="md">Motores de Autorización</Heading>
        </HStack>

        <Text color="gray.500" fontSize="sm" mb={4}>
          Configura los motores de autorización activos. Estos determinan cómo se evalúan los permisos de acceso.
        </Text>

        {/* Authorization Info Panel */}
        <Box
          bg="purple.50"
          border="1px solid"
          borderColor="purple.200"
          borderRadius="lg"
          mb={4}
          overflow="hidden"
        >
          <Box
            p={4}
            cursor="pointer"
            onClick={() => setShowAuthzInfo(!showAuthzInfo)}
            _hover={{ bg: 'purple.100' }}
            transition="background 0.2s"
          >
            <HStack justify="space-between">
              <HStack gap={3}>
                <Icon as={LuInfo} color="purple.500" boxSize={5} />
                <Box>
                  <Text fontWeight="semibold" color="purple.700">
                    ¿Cómo funcionan los motores de autorización?
                  </Text>
                  <Text fontSize="sm" color="purple.600">
                    Haz clic para ver detalles de cada motor
                  </Text>
                </Box>
              </HStack>
              <Icon as={showAuthzInfo ? LuChevronDown : LuChevronRight} color="purple.500" boxSize={5} />
            </HStack>
          </Box>
          <Collapsible.Root open={showAuthzInfo}>
            <Collapsible.Content>
              <Box px={4} pb={4}>
                <VStack align="stretch" gap={4}>
                  {/* RBAC Info */}
                  <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="blue.200">
                    <HStack mb={2}>
                      <Icon as={LuUsers} color="blue.500" boxSize={5} />
                      <Text fontWeight="bold" color="blue.700">RBAC - Control de Acceso basado en Roles</Text>
                      <Badge colorPalette="green">Implementado</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      Asigna permisos a roles y roles a usuarios. Es el modelo más común y siempre está activo.
                    </Text>
                    <VStack align="stretch" gap={1}>
                      <HStack>
                        <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Roles: ADMIN, MANAGER, OPERATOR, USER</Text>
                      </HStack>
                      <HStack>
                        <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Permisos granulares por funcionalidad</Text>
                      </HStack>
                      <HStack>
                        <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Jerarquía de roles (Admin hereda todos los permisos)</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Risk Engine Info */}
                  <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="orange.200">
                    <HStack mb={2}>
                      <Icon as={LuBrain} color="orange.500" boxSize={5} />
                      <Text fontWeight="bold" color="orange.700">Motor de Riesgo</Text>
                      <Badge colorPalette="green">Implementado</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      Evalúa el riesgo de cada operación basado en múltiples factores y puede requerir verificación adicional.
                    </Text>
                    <VStack align="stretch" gap={1}>
                      <HStack>
                        <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                        <Text fontSize="sm">11 reglas de riesgo configurables</Text>
                      </HStack>
                      <HStack>
                        <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Evalúa: IP, dispositivo, horario, ubicación, montos</Text>
                      </HStack>
                      <HStack>
                        <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Acciones: Permitir, Requerir MFA, Bloquear</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Security Flow Explanation */}
                  <Box bg="teal.50" p={4} borderRadius="md" border="1px solid" borderColor="teal.200">
                    <HStack mb={3}>
                      <Icon as={LuShieldCheck} color="teal.600" boxSize={5} />
                      <Text fontWeight="bold" color="teal.700">Flujo de Seguridad</Text>
                    </HStack>
                    <VStack align="stretch" gap={2}>
                      <HStack align="start">
                        <Badge colorPalette="blue" fontSize="xs" minW="20px">1</Badge>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="teal.700">Autenticación (Auth0/SSO)</Text>
                          <Text fontSize="xs" color="gray.600">
                            El usuario se autentica con el proveedor SSO (incluyendo MFA si está configurado)
                          </Text>
                        </Box>
                      </HStack>
                      <HStack align="start">
                        <Badge colorPalette="blue" fontSize="xs" minW="20px">2</Badge>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="teal.700">Evaluación de Riesgo (Local)</Text>
                          <Text fontSize="xs" color="gray.600">
                            Cada operación crítica es evaluada por el Motor de Riesgo local
                          </Text>
                        </Box>
                      </HStack>
                      <HStack align="start">
                        <Badge colorPalette="blue" fontSize="xs" minW="20px">3</Badge>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="teal.700">Decisión de Autorización</Text>
                          <Text fontSize="xs" color="gray.600">
                            Según el riesgo: permitir, requerir verificación adicional, o bloquear
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                    <Box mt={3} pt={3} borderTop="1px dashed" borderColor="teal.200">
                      <Text fontSize="xs" color="teal.600">
                        <strong>Nota:</strong> El MFA del proveedor SSO verifica la identidad. El Motor de Riesgo local
                        evalúa el contexto de cada operación (IP, horario, monto, dispositivo) y puede solicitar
                        verificación adicional independiente del MFA inicial.
                      </Text>
                    </Box>
                  </Box>

                  {/* Tips */}
                  <Box bg="yellow.50" p={3} borderRadius="md" border="1px solid" borderColor="yellow.200">
                    <HStack mb={1}>
                      <Icon as={LuLightbulb} color="yellow.600" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="yellow.700">Recomendación</Text>
                    </HStack>
                    <Text fontSize="sm" color="yellow.700">
                      Activa el Motor de Riesgo para operaciones financieras críticas. Combínalo con RBAC para máxima seguridad.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {engines.map(engine => (
            <Box
              key={engine.key}
              p={4}
              bg={engineCardBg}
              borderRadius="lg"
              border="1px solid"
              borderColor={authzConfig.engines[engine.key as keyof typeof authzConfig.engines] ? `${engine.color}.300` : 'gray.200'}
              transition="all 0.2s"
            >
              <HStack justify="space-between" mb={3}>
                <HStack gap={3}>
                  <Box
                    p={2}
                    borderRadius="md"
                    bg={`${engine.color}.100`}
                  >
                    <Icon as={engine.icon} color={`${engine.color}.500`} boxSize={5} />
                  </Box>
                  <Box>
                    <HStack>
                      <Text fontWeight="semibold">{engine.name}</Text>
                      {engine.alwaysOn && (
                        <Badge colorPalette="blue" fontSize="xs">
                          Siempre Activo
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {engine.description}
                    </Text>
                  </Box>
                </HStack>
                <Switch.Root
                  checked={authzConfig.engines[engine.key as keyof typeof authzConfig.engines]}
                  onCheckedChange={(e) => handleEngineToggle(engine.key, e.checked)}
                  colorPalette={engine.color}
                  disabled={engine.alwaysOn}
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Separator />

      {/* Combination Strategy */}
      <Box p={5} bg={cardBg} borderRadius="lg">
        <Field.Root>
          <Field.Label>
            <HStack>
              <Text>Estrategia de Combinación</Text>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Box cursor="pointer">
                    <Icon as={LuInfo} color="gray.400" />
                  </Box>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>
                    Define cómo se combinan las decisiones de múltiples motores de autorización
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            </HStack>
          </Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              value={authzConfig.combinationStrategy}
              onChange={(e) => handleChange('combinationStrategy', e.target.value)}
            >
              {COMBINATION_STRATEGIES.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {t(strategy.labelKey)}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
          <Text fontSize="xs" color="gray.500" mt={2}>
            • <strong>any-allows:</strong> Basta que un motor permita (recomendado)<br/>
            • <strong>all-must-allow:</strong> Todos los motores deben permitir<br/>
            • <strong>weighted:</strong> Decisión basada en pesos de cada motor<br/>
            • <strong>first-applicable:</strong> Primera decisión definitiva gana
          </Text>
        </Field.Root>
      </Box>

      {/* Risk Engine Configuration */}
      {authzConfig.engines.riskEngine && (
        <Box p={5} bg={cardBg} borderRadius="lg">
          <HStack mb={4}>
            <Icon as={LuBrain} boxSize={5} color="orange.500" />
            <Heading size="sm">Configuración del Motor de Riesgo</Heading>
          </HStack>

          <VStack gap={4} align="stretch">
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Bloqueo Automático</Text>
                <Text fontSize="xs" color="gray.500">Bloquear automáticamente operaciones de alto riesgo (score &gt; 85)</Text>
              </Box>
              <Switch.Root
                checked={authzConfig.riskEngineConfig.autoBlock}
                onCheckedChange={(e) => handleRiskConfigChange('autoBlock', e.checked)}
                colorPalette="red"
              >
                <Switch.HiddenInput />
                <Switch.Control />
              </Switch.Root>
            </HStack>

            <Alert.Root status="info" borderRadius="md">
              <Alert.Indicator />
              <Alert.Description>
                <Text fontSize="sm">
                  El Motor de Riesgo evalúa cada operación y asigna un puntaje. Según el puntaje:
                  <br/>• 0-50: Permitir
                  <br/>• 51-70: Requerir MFA
                  <br/>• 71-85: Autenticación adicional
                  <br/>• 86+: Bloquear (si está habilitado)
                </Text>
              </Alert.Description>
            </Alert.Root>

            <Text fontSize="sm" color="gray.500">
              Para configurar reglas detalladas, ve a la pestaña <strong>Motor de Riesgo</strong>.
            </Text>
          </VStack>
        </Box>
      )}

      <Button
        colorPalette="blue"
        onClick={() => onSave(authzConfig)}
        loading={isSaving}
        alignSelf="flex-end"
        size="lg"
      >
        <LuSave style={{ marginRight: '8px' }} />
        Guardar Cambios
      </Button>
    </VStack>
  );
}
