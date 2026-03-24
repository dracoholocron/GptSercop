import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Mercancía y Documentos (Paso 5)
 * Renderiza campos SWIFT de las secciones: MERCANCIAS, DOCUMENTOS
 */
export const GoodsDocumentsSection: React.FC<SectionProps> = ({
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
            {t('common.stepHeader', { number: 5, name: t('lcImportWizard.steps.goodsAndDocuments') })}
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('common.describeGoodsAndDocs')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            5. {t('lcImportWizard.steps.goodsAndDocuments')}
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección MERCANCIAS */}
      <DynamicSwiftSection
        messageType="MT700"
        section="GOODS"
        sectionTitle={mode === 'wizard' ? t('common.goodsAndDocuments') : undefined}
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Campos dinámicos de la sección DOCUMENTOS */}
      <DynamicSwiftSection
        messageType="MT700"
        section="DOCUMENTS"
        sectionTitle={mode === 'wizard' ? 'Documentos Requeridos' : undefined}
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Ayuda contextual */}
      {showHelp && mode !== 'expert' && (
        <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
          <Card.Body p={4}>
            <Flex gap={3}>
              <FiInfo size={20} color={colors.activeColor} />
              <Box>
                <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
                  Documentos Típicos
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Los documentos más comunes incluyen: Factura Comercial, Conocimiento de Embarque (B/L),
                  Certificado de Origen, Lista de Empaque, Certificados de Inspección/Calidad, Póliza de Seguro.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default GoodsDocumentsSection;
