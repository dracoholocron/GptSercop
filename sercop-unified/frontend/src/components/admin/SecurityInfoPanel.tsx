import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Collapsible,
  Badge,
} from '@chakra-ui/react';
import { LuInfo, LuChevronDown, LuChevronRight, LuLightbulb, LuTarget, LuCheckCircle } from 'react-icons/lu';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SecurityInfoPanelProps {
  titleKey: string;
  descriptionKey: string;
  benefitsKey?: string;
  benefits?: { key: string; text: string }[];
  useCasesKey?: string;
  useCases?: { key: string; text: string }[];
  tips?: { key: string; text: string }[];
  defaultOpen?: boolean;
  variant?: 'info' | 'tip' | 'warning';
}

export function SecurityInfoPanel({
  titleKey,
  descriptionKey,
  benefitsKey,
  benefits = [],
  useCasesKey,
  useCases = [],
  tips = [],
  defaultOpen = false,
  variant = 'info',
}: SecurityInfoPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorScheme = {
    info: { bg: 'blue.50', border: 'blue.200', icon: 'blue.500', accent: 'blue' },
    tip: { bg: 'green.50', border: 'green.200', icon: 'green.500', accent: 'green' },
    warning: { bg: 'orange.50', border: 'orange.200', icon: 'orange.500', accent: 'orange' },
  }[variant];

  return (
    <Box
      bg={colorScheme.bg}
      border="1px solid"
      borderColor={colorScheme.border}
      borderRadius="lg"
      overflow="hidden"
    >
      <Box
        p={4}
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        _hover={{ bg: `${colorScheme.accent}.100` }}
        transition="background 0.2s"
      >
        <HStack justify="space-between">
          <HStack gap={3}>
            <Icon as={LuInfo} color={colorScheme.icon} boxSize={5} />
            <Box>
              <Text fontWeight="semibold" color={`${colorScheme.accent}.700`}>
                {t(titleKey)}
              </Text>
              <Text fontSize="sm" color={`${colorScheme.accent}.600`}>
                {t(descriptionKey)}
              </Text>
            </Box>
          </HStack>
          <Icon
            as={isOpen ? LuChevronDown : LuChevronRight}
            color={colorScheme.icon}
            boxSize={5}
          />
        </HStack>
      </Box>

      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          <Box px={4} pb={4}>
            <VStack align="stretch" gap={4}>
              {/* Benefits Section */}
              {benefits.length > 0 && (
                <Box>
                  <HStack mb={2}>
                    <Icon as={LuCheckCircle} color="green.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      {benefitsKey ? t(benefitsKey) : t('common.benefits')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1} pl={6}>
                    {benefits.map((benefit, idx) => (
                      <Text key={idx} fontSize="sm" color="gray.600">
                        • {t(benefit.text)}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Use Cases Section */}
              {useCases.length > 0 && (
                <Box>
                  <HStack mb={2}>
                    <Icon as={LuTarget} color="purple.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      {useCasesKey ? t(useCasesKey) : t('common.useCases')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1} pl={6}>
                    {useCases.map((useCase, idx) => (
                      <Text key={idx} fontSize="sm" color="gray.600">
                        • {t(useCase.text)}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Tips Section */}
              {tips.length > 0 && (
                <Box bg="yellow.50" p={3} borderRadius="md" border="1px solid" borderColor="yellow.200">
                  <HStack mb={2}>
                    <Icon as={LuLightbulb} color="yellow.600" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="yellow.700">
                      Tips
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1}>
                    {tips.map((tip, idx) => (
                      <Text key={idx} fontSize="sm" color="yellow.700">
                        💡 {t(tip.text)}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}

// Engine-specific info component for Authorization
interface EngineInfoCardProps {
  engineKey: string;
  translationPrefix: string;
}

export function EngineInfoCard({ engineKey, translationPrefix }: EngineInfoCardProps) {
  const { t } = useTranslation();
  const prefix = `${translationPrefix}.${engineKey}`;

  return (
    <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
      <VStack align="stretch" gap={2}>
        <Text fontWeight="semibold" color="gray.800">
          {t(`${prefix}.title`)}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {t(`${prefix}.description`)}
        </Text>
        <Box>
          <Badge colorPalette="green" mb={1}>Beneficios</Badge>
          <Text fontSize="xs" color="gray.600">{t(`${prefix}.benefits`)}</Text>
        </Box>
        <Box>
          <Badge colorPalette="blue" mb={1}>Casos de Uso</Badge>
          <Text fontSize="xs" color="gray.600">{t(`${prefix}.useCases`)}</Text>
        </Box>
        <Box bg="blue.50" p={2} borderRadius="sm">
          <Text fontSize="xs" color="blue.700" fontStyle="italic">
            {t(`${prefix}.example`)}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export default SecurityInfoPanel;
