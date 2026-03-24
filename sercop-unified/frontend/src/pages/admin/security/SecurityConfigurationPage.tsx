import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  HStack,
  Icon,
  Badge,
  Button,
  Spinner,
  VStack,
  Alert,
} from '@chakra-ui/react';
import {
  LuShield,
  LuKey,
  LuUsers,
  LuActivity,
  LuFileText,
  LuSettings,
  LuRotateCcw,
  LuBrain,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import AuthenticationConfig from './AuthenticationConfig';
import AuthorizationConfig from './AuthorizationConfig';
import FourEyesConfig from './FourEyesConfig';
import AuditConfig from './AuditConfig';
import SecurityPresets from './SecurityPresets';
import RiskEngineConfig from './RiskEngineConfig';
import { securityConfigService } from '../../../services/securityConfigService';
import { notify } from '../../../components/ui/toaster';

export function SecurityConfigurationPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [fourEyesConfigs, setFourEyesConfigs] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const bgColor = 'white';
  const borderColor = 'gray.200';

  useEffect(() => {
    loadAllConfigurations();
  }, []);

  const loadAllConfigurations = async () => {
    setIsLoading(true);
    try {
      const [configsRes, presetsRes, fourEyesRes] = await Promise.all([
        securityConfigService.getAllConfigurations(),
        securityConfigService.getPresets(),
        securityConfigService.getFourEyesConfigs(),
      ]);
      setConfigurations(configsRes);
      setPresets(presetsRes);
      setFourEyesConfigs(fourEyesRes);
    } catch (error) {
      notify.error(t('common.error'), t('securityConfig.error.loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = async (presetCode: string) => {
    try {
      await securityConfigService.applyPreset(presetCode);
      notify.success(t('common.success'), t('securityConfig.presets.applied'));
      await loadAllConfigurations();
    } catch (error) {
      notify.error(t('common.error'), t('securityConfig.error.applyingPreset'));
    }
  };

  const handleSaveConfiguration = async (configType: string, configKey: string, configValue: any) => {
    setIsSaving(true);
    try {
      await securityConfigService.updateConfiguration({
        configType,
        configKey,
        configValue,
      });
      notify.success(t('common.success'), t('securityConfig.saved'));
      setHasChanges(false);
      await loadAllConfigurations();
    } catch (error) {
      notify.error(t('common.error'), t('securityConfig.error.saving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFourEyes = async (config: any) => {
    setIsSaving(true);
    try {
      await securityConfigService.updateFourEyesConfig(config);
      notify.success(t('common.success'), t('securityConfig.saved'));
      await loadAllConfigurations();
    } catch (error) {
      notify.error(t('common.error'), t('securityConfig.error.saving'));
    } finally {
      setIsSaving(false);
    }
  };

  const getConfigValue = (type: string, key: string) => {
    const config = configurations.find(c => c.configType === type && c.configKey === key);
    return config?.configValue || {};
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack gap={4}>
          <Spinner size="xl" />
          <Text>{t('common.loading')}</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <Box>
          <HStack gap={3} mb={2}>
            <Icon as={LuShield} boxSize={8} color="blue.500" />
            <Heading size="lg">{t('securityConfig.title')}</Heading>
          </HStack>
          <Text color="gray.500">{t('securityConfig.subtitle')}</Text>
        </Box>
        <HStack gap={3}>
          {hasChanges && (
            <Badge colorPalette="orange" fontSize="sm" px={3} py={1}>
              {t('securityConfig.unsavedChanges')}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={loadAllConfigurations}
          >
            <LuRotateCcw style={{ marginRight: '8px' }} />
            {t('common.refresh')}
          </Button>
        </HStack>
      </HStack>

      {/* Info Alert */}
      <Alert.Root status="info" mb={6} borderRadius="lg">
        <Alert.Indicator />
        <Text fontSize="sm">{t('securityConfig.infoMessage')}</Text>
      </Alert.Root>

      {/* Tabs */}
      <Box bg={bgColor} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden">
        <Tabs.Root defaultValue="presets" variant="enclosed" colorPalette="blue">
          <Tabs.List bg="gray.50" px={4} pt={4}>
            <Tabs.Trigger value="presets">
              <HStack gap={2}>
                <Icon as={LuSettings} />
                <Text>{t('securityConfig.tabs.presets')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="authentication">
              <HStack gap={2}>
                <Icon as={LuKey} />
                <Text>{t('securityConfig.tabs.authentication')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="authorization">
              <HStack gap={2}>
                <Icon as={LuUsers} />
                <Text>{t('securityConfig.tabs.authorization')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="fourEyes">
              <HStack gap={2}>
                <Icon as={LuActivity} />
                <Text>{t('securityConfig.tabs.fourEyes')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="audit">
              <HStack gap={2}>
                <Icon as={LuFileText} />
                <Text>{t('securityConfig.tabs.audit')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="riskEngine">
              <HStack gap={2}>
                <Icon as={LuBrain} />
                <Text>Motor de Riesgo</Text>
                <Badge colorPalette="cyan" fontSize="2xs">NEW</Badge>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="presets" p={6}>
            <SecurityPresets
              presets={presets}
              onApplyPreset={handleApplyPreset}
            />
          </Tabs.Content>

          <Tabs.Content value="authentication" p={6}>
            <AuthenticationConfig
              config={getConfigValue('AUTHENTICATION', 'authentication')}
              mfaConfig={getConfigValue('MFA', 'mfa')}
              onSave={(config) => handleSaveConfiguration('AUTHENTICATION', 'authentication', config)}
              onSaveMfa={(config) => handleSaveConfiguration('MFA', 'mfa', config)}
              onChange={() => setHasChanges(true)}
              isSaving={isSaving}
            />
          </Tabs.Content>

          <Tabs.Content value="authorization" p={6}>
            <AuthorizationConfig
              config={getConfigValue('AUTHORIZATION', 'authorization')}
              onSave={(config) => handleSaveConfiguration('AUTHORIZATION', 'authorization', config)}
              onChange={() => setHasChanges(true)}
              isSaving={isSaving}
            />
          </Tabs.Content>

          <Tabs.Content value="fourEyes" p={6}>
            <FourEyesConfig
              configs={fourEyesConfigs}
              onSave={handleSaveFourEyes}
              isSaving={isSaving}
            />
          </Tabs.Content>

          <Tabs.Content value="audit" p={6}>
            <AuditConfig
              config={getConfigValue('AUDIT', 'audit')}
              onSave={(config) => handleSaveConfiguration('AUDIT', 'audit', config)}
              onChange={() => setHasChanges(true)}
              isSaving={isSaving}
            />
          </Tabs.Content>

          <Tabs.Content value="riskEngine" p={6}>
            <RiskEngineConfig onRefresh={loadAllConfigurations} />
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Container>
  );
}
