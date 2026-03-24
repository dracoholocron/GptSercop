import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Separator,
  Icon,
  Badge,
  Stack,
  Collapsible,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { NumberInputRoot, NumberInputInput } from '@chakra-ui/react/number-input';
import { CheckboxRoot, CheckboxControl, CheckboxLabel } from '@chakra-ui/react/checkbox';
import { Switch } from '@chakra-ui/react/switch';
import {
  LuKey,
  LuShield,
  LuSmartphone,
  LuMail,
  LuFingerprint,
  LuSave,
  LuInfo,
  LuChevronDown,
  LuChevronRight,
  LuCircleCheck,
  LuTarget,
  LuLightbulb,
  LuExternalLink,
  LuTriangleAlert,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

interface AuthenticationConfigProps {
  config: any;
  mfaConfig: any;
  onSave: (config: any) => void;
  onSaveMfa: (config: any) => void;
  onChange: () => void;
  isSaving: boolean;
}

const AUTH_PROVIDERS = [
  { value: 'traditional', labelKey: 'securityConfig.auth.providers.traditional' },
  { value: 'auth0', labelKey: 'securityConfig.auth.providers.auth0' },
  { value: 'okta', labelKey: 'securityConfig.auth.providers.okta' },
  { value: 'azure-ad', labelKey: 'securityConfig.auth.providers.azureAd' },
  { value: 'google', labelKey: 'securityConfig.auth.providers.google' },
  { value: 'aws-cognito', labelKey: 'securityConfig.auth.providers.cognito' },
];

// URLs for SSO provider dashboards
const SSO_PROVIDER_URLS: Record<string, { name: string; mfaUrl: string; dashboardUrl: string }> = {
  'auth0': {
    name: 'Auth0',
    mfaUrl: 'https://manage.auth0.com/#/security/mfa',
    dashboardUrl: 'https://manage.auth0.com',
  },
  'okta': {
    name: 'Okta',
    mfaUrl: 'https://admin.okta.com/admin/access/multifactor',
    dashboardUrl: 'https://admin.okta.com',
  },
  'azure-ad': {
    name: 'Azure AD / Entra ID',
    mfaUrl: 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/AuthenticationMethodsMenuBlade/~/AdminAuthMethods',
    dashboardUrl: 'https://entra.microsoft.com',
  },
  'google': {
    name: 'Google Cloud Identity',
    mfaUrl: 'https://admin.google.com/ac/security/2sv',
    dashboardUrl: 'https://admin.google.com',
  },
  'aws-cognito': {
    name: 'AWS Cognito',
    mfaUrl: 'https://console.aws.amazon.com/cognito/v2/idp/user-pools',
    dashboardUrl: 'https://console.aws.amazon.com/cognito',
  },
};

const MFA_POLICIES = [
  { value: 'disabled', labelKey: 'securityConfig.mfa.policies.disabled' },
  { value: 'optional', labelKey: 'securityConfig.mfa.policies.optional' },
  { value: 'required', labelKey: 'securityConfig.mfa.policies.required' },
  { value: 'risk-based', labelKey: 'securityConfig.mfa.policies.riskBased' },
];

const MFA_METHODS = [
  { value: 'authenticator', labelKey: 'securityConfig.mfa.methods.authenticator', icon: LuSmartphone },
  { value: 'sms', labelKey: 'securityConfig.mfa.methods.sms', icon: LuSmartphone },
  { value: 'email', labelKey: 'securityConfig.mfa.methods.email', icon: LuMail },
  { value: 'webauthn', labelKey: 'securityConfig.mfa.methods.webauthn', icon: LuFingerprint },
  { value: 'push', labelKey: 'securityConfig.mfa.methods.push', icon: LuSmartphone },
];

export default function AuthenticationConfig({
  config,
  mfaConfig,
  onSave,
  onSaveMfa,
  onChange,
  isSaving,
}: AuthenticationConfigProps) {
  const { t } = useTranslation();
  const [authConfig, setAuthConfig] = useState({
    primaryProvider: 'traditional',
    sessionTimeout: 480,
    maxConcurrentSessions: 5,
    passwordless: false,
    ...config,
  });
  const [mfa, setMfa] = useState({
    policy: 'optional',
    methods: ['authenticator'],
    rememberDevice: true,
    rememberDays: 30,
    ...mfaConfig,
  });

  const cardBg = 'gray.50';

  const handleAuthChange = (field: string, value: any) => {
    setAuthConfig((prev: any) => ({ ...prev, [field]: value }));
    onChange();
  };

  const handleMfaChange = (field: string, value: any) => {
    setMfa((prev: any) => ({ ...prev, [field]: value }));
    onChange();
  };

  const handleMethodToggle = (method: string) => {
    const methods = mfa.methods.includes(method)
      ? mfa.methods.filter((m: string) => m !== method)
      : [...mfa.methods, method];
    handleMfaChange('methods', methods);
  };

  const [showAuthInfo, setShowAuthInfo] = useState(false);
  const [showMfaInfo, setShowMfaInfo] = useState(false);

  return (
    <VStack gap={6} align="stretch">
      {/* Authentication Providers */}
      <Box>
        <HStack mb={4}>
          <Icon as={LuKey} boxSize={5} color="blue.500" />
          <Heading size="md">{t('securityConfig.auth.title')}</Heading>
        </HStack>

        {/* Authentication Info Panel */}
        <Box
          bg="blue.50"
          border="1px solid"
          borderColor="blue.200"
          borderRadius="lg"
          mb={4}
          overflow="hidden"
        >
          <Box
            p={4}
            cursor="pointer"
            onClick={() => setShowAuthInfo(!showAuthInfo)}
            _hover={{ bg: 'blue.100' }}
            transition="background 0.2s"
          >
            <HStack justify="space-between">
              <HStack gap={3}>
                <Icon as={LuInfo} color="blue.500" boxSize={5} />
                <Box>
                  <Text fontWeight="semibold" color="blue.700">
                    {t('securityConfig.auth.tooltip.title')}
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    {t('securityConfig.auth.tooltip.description')}
                  </Text>
                </Box>
              </HStack>
              <Icon as={showAuthInfo ? LuChevronDown : LuChevronRight} color="blue.500" boxSize={5} />
            </HStack>
          </Box>
          <Collapsible.Root open={showAuthInfo}>
            <Collapsible.Content>
              <Box px={4} pb={4}>
                <VStack align="stretch" gap={4}>
                  {/* Benefits */}
                  <Box>
                    <HStack mb={2}>
                      <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                        {t('securityConfig.auth.tooltip.benefits.title')}
                      </Text>
                    </HStack>
                    <VStack align="stretch" gap={1} pl={6}>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.benefits.sso')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.benefits.enterprise')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.benefits.compliance')}</Text>
                    </VStack>
                  </Box>
                  {/* Use Cases */}
                  <Box>
                    <HStack mb={2}>
                      <Icon as={LuTarget} color="purple.500" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                        {t('securityConfig.auth.tooltip.useCases.title')}
                      </Text>
                    </HStack>
                    <VStack align="stretch" gap={1} pl={6}>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.useCases.traditional')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.useCases.azureAd')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.useCases.okta')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.auth.tooltip.useCases.auth0')}</Text>
                    </VStack>
                  </Box>
                  {/* Tips */}
                  <Box bg="yellow.50" p={3} borderRadius="md" border="1px solid" borderColor="yellow.200">
                    <HStack mb={2}>
                      <Icon as={LuLightbulb} color="yellow.600" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="yellow.700">Tips</Text>
                    </HStack>
                    <VStack align="stretch" gap={1}>
                      <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.auth.tooltip.sessionTip')}</Text>
                      <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.auth.tooltip.maxSessionsTip')}</Text>
                    </VStack>
                  </Box>
                </VStack>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        <Box p={5} bg={cardBg} borderRadius="lg">
          <VStack gap={5} align="stretch">
            <Field.Root>
              <Field.Label>{t('securityConfig.auth.primaryProvider')}</Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  value={authConfig.primaryProvider}
                  onChange={(e) => handleAuthChange('primaryProvider', e.target.value)}
                >
                  {AUTH_PROVIDERS.map(provider => (
                    <option key={provider.value} value={provider.value}>
                      {t(provider.labelKey)}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t('securityConfig.auth.primaryProviderHelp')}
              </Text>
            </Field.Root>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Field.Root>
                <Field.Label>{t('securityConfig.auth.sessionTimeout')}</Field.Label>
                <NumberInputRoot
                  value={String(authConfig.sessionTimeout)}
                  onValueChange={(e) => handleAuthChange('sessionTimeout', Number(e.value))}
                  min={15}
                  max={1440}
                >
                  <NumberInputInput />
                </NumberInputRoot>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {t('securityConfig.auth.sessionTimeoutHelp')}
                </Text>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t('securityConfig.auth.maxSessions')}</Field.Label>
                <NumberInputRoot
                  value={String(authConfig.maxConcurrentSessions)}
                  onValueChange={(e) => handleAuthChange('maxConcurrentSessions', Number(e.value))}
                  min={1}
                  max={10}
                >
                  <NumberInputInput />
                </NumberInputRoot>
              </Field.Root>
            </SimpleGrid>

            <HStack justify="space-between">
              <Text>{t('securityConfig.auth.passwordless')}</Text>
              <Switch.Root
                checked={authConfig.passwordless}
                onCheckedChange={(e) => handleAuthChange('passwordless', e.checked)}
                colorPalette="blue"
              >
                <Switch.HiddenInput />
                <Switch.Control />
              </Switch.Root>
            </HStack>

            <Button
              colorPalette="blue"
              onClick={() => onSave(authConfig)}
              loading={isSaving}
              alignSelf="flex-end"
            >
              <LuSave style={{ marginRight: '8px' }} />
              {t('common.save')}
            </Button>
          </VStack>
        </Box>
      </Box>

      <Separator />

      {/* MFA Configuration */}
      <Box>
        <HStack mb={4} justify="space-between">
          <HStack>
            <Icon as={LuShield} boxSize={5} color="green.500" />
            <Heading size="md">{t('securityConfig.mfa.title')}</Heading>
          </HStack>
          {authConfig.primaryProvider !== 'traditional' && (
            <Badge colorPalette="orange" fontSize="xs" px={2} py={1}>
              Solo Informativo
            </Badge>
          )}
        </HStack>

        {/* SSO Provider Notice */}
        {authConfig.primaryProvider !== 'traditional' && SSO_PROVIDER_URLS[authConfig.primaryProvider] && (
          <Box
            bg="orange.50"
            border="1px solid"
            borderColor="orange.300"
            borderRadius="lg"
            mb={4}
            p={4}
          >
            <HStack gap={3} mb={3}>
              <Icon as={LuTriangleAlert} color="orange.500" boxSize={5} />
              <Box flex={1}>
                <Text fontWeight="semibold" color="orange.700">
                  Configuración gestionada por {SSO_PROVIDER_URLS[authConfig.primaryProvider].name}
                </Text>
                <Text fontSize="sm" color="orange.600" mt={1}>
                  Cuando usas un proveedor de identidad externo, la configuración de MFA se administra
                  directamente en el dashboard de ese proveedor. Los valores mostrados abajo son solo
                  informativos y no afectan la configuración real de MFA.
                </Text>
              </Box>
            </HStack>
            <HStack gap={3} flexWrap="wrap">
              <Button
                as="a"
                href={SSO_PROVIDER_URLS[authConfig.primaryProvider].mfaUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                colorPalette="orange"
                variant="solid"
              >
                <LuExternalLink style={{ marginRight: '8px' }} />
                Configurar MFA en {SSO_PROVIDER_URLS[authConfig.primaryProvider].name}
              </Button>
              <Button
                as="a"
                href={SSO_PROVIDER_URLS[authConfig.primaryProvider].dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="outline"
                colorPalette="orange"
              >
                <LuExternalLink style={{ marginRight: '8px' }} />
                Abrir Dashboard
              </Button>
            </HStack>
          </Box>
        )}

        {/* MFA Info Panel */}
        <Box
          bg="green.50"
          border="1px solid"
          borderColor="green.200"
          borderRadius="lg"
          mb={4}
          overflow="hidden"
        >
          <Box
            p={4}
            cursor="pointer"
            onClick={() => setShowMfaInfo(!showMfaInfo)}
            _hover={{ bg: 'green.100' }}
            transition="background 0.2s"
          >
            <HStack justify="space-between">
              <HStack gap={3}>
                <Icon as={LuInfo} color="green.500" boxSize={5} />
                <Box>
                  <Text fontWeight="semibold" color="green.700">
                    {t('securityConfig.mfa.tooltip.title')}
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    {t('securityConfig.mfa.tooltip.description')}
                  </Text>
                </Box>
              </HStack>
              <Icon as={showMfaInfo ? LuChevronDown : LuChevronRight} color="green.500" boxSize={5} />
            </HStack>
          </Box>
          <Collapsible.Root open={showMfaInfo}>
            <Collapsible.Content>
              <Box px={4} pb={4}>
                <VStack align="stretch" gap={4}>
                  {/* Benefits */}
                  <Box>
                    <HStack mb={2}>
                      <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                        {t('securityConfig.mfa.tooltip.benefits.title')}
                      </Text>
                    </HStack>
                    <VStack align="stretch" gap={1} pl={6}>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.benefits.security')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.benefits.compliance')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.benefits.insurance')}</Text>
                    </VStack>
                  </Box>
                  {/* Method Comparison */}
                  <Box>
                    <HStack mb={2}>
                      <Icon as={LuTarget} color="purple.500" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                        {t('securityConfig.mfa.tooltip.methodComparison.title')}
                      </Text>
                    </HStack>
                    <VStack align="stretch" gap={1} pl={6}>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.methodComparison.authenticator')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.methodComparison.webauthn')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.methodComparison.push')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.methodComparison.sms')}</Text>
                      <Text fontSize="sm" color="gray.600">• {t('securityConfig.mfa.tooltip.methodComparison.email')}</Text>
                    </VStack>
                  </Box>
                  {/* Tips */}
                  <Box bg="yellow.50" p={3} borderRadius="md" border="1px solid" borderColor="yellow.200">
                    <HStack mb={2}>
                      <Icon as={LuLightbulb} color="yellow.600" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color="yellow.700">Tips</Text>
                    </HStack>
                    <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.mfa.tooltip.policyTip')}</Text>
                  </Box>
                </VStack>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        <Box p={5} bg={cardBg} borderRadius="lg">
          <VStack gap={5} align="stretch">
            <Field.Root>
              <Field.Label>{t('securityConfig.mfa.policy')}</Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  value={mfa.policy}
                  onChange={(e) => handleMfaChange('policy', e.target.value)}
                >
                  {MFA_POLICIES.map(policy => (
                    <option key={policy.value} value={policy.value}>
                      {t(policy.labelKey)}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              {mfa.policy === 'risk-based' && (
                <HStack mt={2} p={2} bg="blue.50" borderRadius="md">
                  <Icon as={LuInfo} color="blue.500" />
                  <Text fontSize="xs" color="blue.700">
                    {t('securityConfig.mfa.riskBasedHelp')}
                  </Text>
                </HStack>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('securityConfig.mfa.allowedMethods')}</Field.Label>
              <Stack gap={3}>
                {MFA_METHODS.map(method => (
                  <CheckboxRoot
                    key={method.value}
                    checked={mfa.methods.includes(method.value)}
                    onCheckedChange={() => handleMethodToggle(method.value)}
                  >
                    <CheckboxControl />
                    <CheckboxLabel>
                      <HStack gap={2}>
                        <Icon as={method.icon} />
                        <Text>{t(method.labelKey)}</Text>
                      </HStack>
                    </CheckboxLabel>
                  </CheckboxRoot>
                ))}
              </Stack>
            </Field.Root>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <HStack justify="space-between">
                <Text>{t('securityConfig.mfa.rememberDevice')}</Text>
                <Switch.Root
                  checked={mfa.rememberDevice}
                  onCheckedChange={(e) => handleMfaChange('rememberDevice', e.checked)}
                  colorPalette="blue"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </HStack>

              {mfa.rememberDevice && (
                <Field.Root>
                  <Field.Label>{t('securityConfig.mfa.rememberDays')}</Field.Label>
                  <NumberInputRoot
                    value={String(mfa.rememberDays)}
                    onValueChange={(e) => handleMfaChange('rememberDays', Number(e.value))}
                    min={1}
                    max={90}
                  >
                    <NumberInputInput />
                  </NumberInputRoot>
                </Field.Root>
              )}
            </SimpleGrid>

            {authConfig.primaryProvider === 'traditional' ? (
              <Button
                colorPalette="blue"
                onClick={() => onSaveMfa(mfa)}
                loading={isSaving}
                alignSelf="flex-end"
              >
                <LuSave style={{ marginRight: '8px' }} />
                {t('common.save')}
              </Button>
            ) : (
              <Text fontSize="sm" color="gray.500" alignSelf="flex-end" fontStyle="italic">
                Los cambios en MFA deben realizarse en el dashboard de {SSO_PROVIDER_URLS[authConfig.primaryProvider]?.name || 'tu proveedor SSO'}
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
}
