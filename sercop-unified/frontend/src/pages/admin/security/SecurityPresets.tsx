import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  LuBuilding,
  LuCloud,
  LuShield,
  LuRocket,
  LuCheck,
  LuInfo,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

interface SecurityPresetsProps {
  presets: any[];
  onApplyPreset: (code: string) => void;
}

const iconMap: Record<string, any> = {
  FaBuilding: LuBuilding,
  FaCloud: LuCloud,
  FaShieldAlt: LuShield,
  FaRocket: LuRocket,
};

export default function SecurityPresets({ presets, onApplyPreset }: SecurityPresetsProps) {
  const { t } = useTranslation();
  const cardBg = 'gray.50';
  const cardBorder = 'gray.200';
  const highlightBg = 'blue.50';

  const getPresetFeatures = (config: any) => {
    const features = [];

    if (config.authentication?.primaryProvider) {
      features.push(`Auth: ${config.authentication.primaryProvider}`);
    }
    if (config.mfa?.policy) {
      features.push(`MFA: ${config.mfa.policy}`);
    }
    if (config.authorization?.engines) {
      const engines = Object.entries(config.authorization.engines)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name.toUpperCase());
      if (engines.length) features.push(`Engines: ${engines.join(', ')}`);
    }
    if (config.fourEyes?.enabled) {
      features.push('4-Eyes: Enabled');
    }
    if (config.riskEngine?.enabled) {
      features.push('Risk Engine: Enabled');
    }

    return features;
  };

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>{t('securityConfig.presets.title')}</Heading>
        <Text color="gray.500" fontSize="sm">
          {t('securityConfig.presets.description')}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {presets.map((preset) => {
          const IconComponent = iconMap[preset.icon] || LuShield;
          const features = getPresetFeatures(preset.configJson || {});

          return (
            <Box
              key={preset.code}
              p={5}
              bg={cardBg}
              borderRadius="xl"
              border="1px solid"
              borderColor={cardBorder}
              transition="all 0.2s"
              _hover={{
                borderColor: 'blue.400',
                shadow: 'md',
              }}
            >
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg="blue.100"
                    >
                      <Icon as={IconComponent} boxSize={6} color="blue.500" />
                    </Box>
                    <Box>
                      <HStack>
                        <Heading size="sm">{t(preset.nameKey)}</Heading>
                        {preset.isSystem && (
                          <Badge colorPalette="blue" fontSize="xs">
                            {t('securityConfig.presets.system')}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {preset.code}
                      </Text>
                    </Box>
                  </HStack>
                </HStack>

                <Text fontSize="sm" color="gray.600">
                  {t(preset.descriptionKey)}
                </Text>

                {/* Features Preview */}
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
                    {t('securityConfig.presets.includes')}:
                  </Text>
                  <VStack align="stretch" gap={1}>
                    {features.map((feature, idx) => (
                      <HStack key={idx} gap={2}>
                        <Icon as={LuCheck} boxSize={3} color="green.500" />
                        <Text fontSize="xs">{feature}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Button
                  colorPalette="blue"
                  size="sm"
                  onClick={() => onApplyPreset(preset.code)}
                >
                  <LuCheck style={{ marginRight: '8px' }} />
                  {t('securityConfig.presets.apply')}
                </Button>
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Help Section */}
      <Box p={4} bg={highlightBg} borderRadius="lg">
        <HStack gap={2}>
          <Icon as={LuInfo} color="blue.500" />
          <Text fontSize="sm" color="blue.700">
            {t('securityConfig.presets.helpText')}
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
}
