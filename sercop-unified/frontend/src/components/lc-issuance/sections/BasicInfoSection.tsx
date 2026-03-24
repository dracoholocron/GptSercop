import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Información Básica (Paso 1)
 * Renderiza campos SWIFT de las secciones: BASICA, PARTES, TERMINOS
 */
export const BasicInfoSection: React.FC<SectionProps> = ({
  mode,
  swiftFieldsData,
  onSwiftFieldChange,
  showHelp = true,
  showOptionalFields = true,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <VStack gap={6} align="stretch">
      {mode === 'wizard' && (
        <Box>
          <Heading size="lg" color={colors.textColor} mb={2}>
            Paso 1: Información Básica
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('lcImportWizard.basicInfo.subtitle')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            1. Información Básica
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección BASICA */}
      <DynamicSwiftSection
        messageType="MT700"
        section="BASIC"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Campos dinámicos de la sección PARTES */}
      <DynamicSwiftSection
        messageType="MT700"
        section="PARTIES"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Campos dinámicos de la sección TERMINOS */}
      <DynamicSwiftSection
        messageType="MT700"
        section="TERMS"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Ayuda contextual - solo en modo wizard o client */}
      {showHelp && mode !== 'expert' && (
        <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
          <Card.Body p={4}>
            <Flex gap={3}>
              <FiInfo size={20} color={colors.activeColor} />
              <Box>
                <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
                  {t('common.whatIsLcImport')}
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  {t('common.lcImportDescription')}
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default BasicInfoSection;
