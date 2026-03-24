import { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Progress,
  Collapsible,
  Badge,
} from '@chakra-ui/react';
import {
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiFileText,
  FiDollarSign,
  FiUsers,
  FiInfo,
  FiEdit3,
  FiBell,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BasicInfoSection,
  AmountsSection,
  PartiesSection,
  AdditionalInfoSection,
  AccountingSection,
  SwiftPreviewSection,
} from './sections';
import { AlertPreviewStep } from '../shared/AlertPreviewStep';

interface AccordionExpertViewProps {
  // Section props
  mode: string;
  formData: any;
  selectedEntities: any;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: any[];
  fieldErrors: Record<string, string>;
  onFormDataChange: () => void;
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  onEntitySelect: () => void;
  showHelp: boolean;
  showOptionalFields: boolean;
  messageType: string;
  // Accounting props
  accountingEntry?: any;
  loadingAccountingEntry?: boolean;
  accountingEntryError?: string | null;
  calculatedCommission?: number;
  diasVigencia?: number;
  isCommissionDeferred?: boolean;
  setIsCommissionDeferred?: (value: boolean) => void;
  paymentSchedule?: any[];
  setPaymentSchedule?: (schedule: any[]) => void;
  deferredPaymentsDialogOpen?: boolean;
  setDeferredPaymentsDialogOpen?: (open: boolean) => void;
  alertSelectedIds?: Set<number>;
  onAlertSelectedChange?: (ids: Set<number>) => void;
}

// Definicion de secciones estaticas para Collections
const SECTIONS = [
  { code: 'BASICA', name: 'Información Básica', description: 'Referencia y tipo de cobranza', icon: FiFileText, color: 'blue' },
  { code: 'MONTOS', name: 'Montos y Valores', description: 'Monto, moneda y condiciones de pago', icon: FiDollarSign, color: 'green' },
  { code: 'PARTES', name: 'Partes Involucradas', description: 'Ordenante, beneficiario y bancos', icon: FiUsers, color: 'orange' },
  { code: 'ADICIONAL', name: 'Información Adicional', description: 'Documentos e instrucciones', icon: FiInfo, color: 'purple' },
  { code: 'ACCOUNTING', name: 'Contabilidad y Comisiones', description: 'Asiento contable y cálculo de comisión', icon: FiDollarSign, color: 'teal' },
  { code: 'ALERTS', name: 'Seguimiento y Control', description: 'Planificación de alertas para gestión de riesgo', icon: FiBell, color: 'orange' },
  { code: 'PREVIEW', name: 'Vista Previa SWIFT', description: 'Mensaje MT4xx generado', icon: FiFileText, color: 'cyan' },
];

/**
 * Vista de acordeones para el modo experto - Cobranzas
 * Muestra todas las secciones en acordeones colapsables
 */
export const AccordionExpertView: React.FC<AccordionExpertViewProps> = ({
  mode,
  formData,
  selectedEntities,
  swiftFieldsData,
  swiftConfigs,
  fieldErrors,
  onFormDataChange,
  onSwiftFieldChange,
  onEntitySelect,
  showHelp,
  showOptionalFields,
  messageType,
  accountingEntry,
  loadingAccountingEntry,
  accountingEntryError,
  calculatedCommission,
  diasVigencia,
  isCommissionDeferred,
  setIsCommissionDeferred,
  paymentSchedule,
  setPaymentSchedule,
  deferredPaymentsDialogOpen,
  setDeferredPaymentsDialogOpen,
  alertSelectedIds,
  onAlertSelectedChange,
}) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Estado de secciones abiertas (por defecto la primera esta abierta)
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    return new Set(['BASICA']);
  });

  // Estado de secciones completadas
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Calcular progreso
  const progress = useMemo(() => {
    const totalSections = SECTIONS.length;
    const completed = completedSections.size;
    return Math.round((completed / totalSections) * 100);
  }, [completedSections.size]);

  // Toggle seccion
  const toggleSection = (sectionCode: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionCode)) {
        newSet.delete(sectionCode);
      } else {
        newSet.add(sectionCode);
      }
      return newSet;
    });
  };

  // Props comunes para las secciones
  const sectionProps = {
    mode,
    formData,
    selectedEntities,
    swiftFieldsData,
    swiftConfigs,
    fieldErrors,
    onFormDataChange,
    onSwiftFieldChange,
    onEntitySelect,
    showHelp,
    showOptionalFields,
    messageType,
  };

  // Renderizar contenido de seccion
  const renderSectionContent = (sectionCode: string) => {
    switch (sectionCode) {
      case 'BASICA':
        return <BasicInfoSection {...sectionProps} />;
      case 'MONTOS':
        return <AmountsSection {...sectionProps} />;
      case 'PARTES':
        return <PartiesSection {...sectionProps} />;
      case 'ADICIONAL':
        return <AdditionalInfoSection {...sectionProps} />;
      case 'ACCOUNTING':
        return (
          <AccountingSection
            mode={mode}
            swiftFieldsData={swiftFieldsData}
            selectedEntities={selectedEntities}
            accountingEntry={accountingEntry}
            loadingAccountingEntry={loadingAccountingEntry}
            accountingEntryError={accountingEntryError}
            calculatedCommission={calculatedCommission}
            diasVigencia={diasVigencia}
            isCommissionDeferred={isCommissionDeferred}
            setIsCommissionDeferred={setIsCommissionDeferred}
            paymentSchedule={paymentSchedule}
            setPaymentSchedule={setPaymentSchedule}
            deferredPaymentsDialogOpen={deferredPaymentsDialogOpen}
            setDeferredPaymentsDialogOpen={setDeferredPaymentsDialogOpen}
            showHelp={false}
          />
        );
      case 'ALERTS':
        return (
          <AlertPreviewStep
            variant="compact"
            operationType="COLLECTION"
            swiftFieldsData={swiftFieldsData}
            swiftConfigs={swiftConfigs}
            selectedAlertIds={alertSelectedIds}
            onSelectedAlertsChange={onAlertSelectedChange}
          />
        );
      case 'PREVIEW':
        return (
          <SwiftPreviewSection
            mode={mode}
            swiftFieldsData={swiftFieldsData}
            selectedEntities={selectedEntities}
            messageType={messageType}
          />
        );
      default:
        return null;
    }
  };

  return (
    <VStack align="stretch" gap={0}>
      {/* Progress Header */}
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="lg"
        border="1px solid"
        borderColor={colors.borderColor}
      >
        {/* Progress Summary */}
        <HStack
          px={5}
          py={4}
          bg={isDark ? 'purple.900' : 'purple.600'}
          color="white"
          justify="space-between"
        >
          <HStack gap={3}>
            <Icon as={FiCheckCircle} boxSize={5} />
            <Text fontWeight="600" fontSize="sm">
              {completedSections.size} de {SECTIONS.length} secciones completas
            </Text>
          </HStack>
          <Box w="120px">
            <Progress.Root value={progress} size="sm">
              <Progress.Track bg="whiteAlpha.300" borderRadius="full">
                <Progress.Range bg="whiteAlpha.700" />
              </Progress.Track>
            </Progress.Root>
          </Box>
        </HStack>

        {/* Accordion Sections */}
        <VStack align="stretch" gap={0} divideY="1px" divideColor={colors.borderColor}>
          {SECTIONS.map((section, index) => {
            const isOpen = openSections.has(section.code);
            const isCompleted = completedSections.has(section.code);
            const SectionIcon = section.icon;
            const sectionColor = section.color;

            return (
              <Box key={section.code}>
                {/* Accordion Header */}
                <Box
                  as="button"
                  w="100%"
                  px={5}
                  py={4}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bg={isOpen
                    ? (isDark ? `${sectionColor}.900` : `${sectionColor}.50`)
                    : 'transparent'
                  }
                  _hover={{
                    bg: isDark ? 'gray.700' : 'gray.50',
                  }}
                  cursor="pointer"
                  transition="all 0.2s"
                  onClick={() => toggleSection(section.code)}
                  borderLeft={isCompleted ? '4px solid' : 'none'}
                  borderLeftColor="green.500"
                >
                  <HStack gap={4}>
                    {/* Icon */}
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg={isOpen
                        ? (isDark ? `${sectionColor}.800` : `${sectionColor}.100`)
                        : (isDark ? 'gray.700' : 'gray.100')
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={SectionIcon}
                        boxSize={5}
                        color={isOpen
                          ? (isDark ? `${sectionColor}.200` : `${sectionColor}.600`)
                          : colors.textColorSecondary
                        }
                      />
                    </Box>

                    {/* Title & Meta */}
                    <Box textAlign="left">
                      <HStack gap={2}>
                        <Text
                          fontWeight="600"
                          fontSize="sm"
                          color={colors.textColor}
                        >
                          {section.name}
                        </Text>
                        {isCompleted && (
                          <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                        )}
                      </HStack>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {section.description}
                      </Text>
                    </Box>
                  </HStack>

                  {/* Arrow */}
                  <Icon
                    as={isOpen ? FiChevronUp : FiChevronDown}
                    boxSize={5}
                    color={colors.textColorSecondary}
                    transition="transform 0.2s"
                  />
                </Box>

                {/* Accordion Content */}
                <Collapsible.Root open={isOpen}>
                  <Collapsible.Content>
                    <Box
                      px={5}
                      py={5}
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      borderTop="1px solid"
                      borderColor={colors.borderColor}
                    >
                      {renderSectionContent(section.code)}
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </VStack>
  );
};

export default AccordionExpertView;
