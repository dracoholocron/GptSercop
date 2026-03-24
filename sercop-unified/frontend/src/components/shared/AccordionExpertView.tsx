import { useState, useEffect } from 'react';
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
  FiEdit3,
  FiMessageSquare,
  FiBell,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../DynamicSwiftSection';
import { EmbeddedCustomSection, CustomFieldsPanel } from '../customfields';
import { SwiftMessageViewer } from '../swift/SwiftMessageViewer';
import { useSectionFieldStats } from '../../hooks/useSectionFieldStats';
import type { SwiftSectionConfig } from '../../services/swiftSectionConfigService';
import type { CustomFieldStepDTO } from '../../services/customFieldsService';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { IconType } from 'react-icons';
import { AlertPreviewStep } from './AlertPreviewStep';

// Default section icons
const DEFAULT_SECTION_ICONS: Record<string, IconType> = {
  'BASICA': FiFileText,
  'INSTRUCCIONES': FiEdit3,
};

// Default section colors
const DEFAULT_SECTION_COLORS: Record<string, string> = {
  'BASICA': 'blue',
  'INSTRUCCIONES': 'gray',
};

export interface SharedAccordionExpertViewProps {
  // Core (required)
  messageType: string;
  dynamicSections: SwiftSectionConfig[];
  swiftFieldsData: Record<string, any>;
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  swiftFieldConfigs?: SwiftFieldConfig[];

  // Custom Fields (optional)
  productType?: string;
  customData?: Record<string, any>;
  onCustomDataChange?: (data: Record<string, any>) => void;
  customFieldSteps?: CustomFieldStepDTO[];
  customFieldsUserData?: Array<{ id: string; name: string }>;

  // Accounting (optional)
  showAccounting?: boolean;
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
  selectedEntities?: any;

  // Alert Preview (optional)
  showAlerts?: boolean;
  alertOperationType?: string;
  alertEventCode?: string;
  alertSelectedIds?: Set<number>;
  onAlertSelectedChange?: (ids: Set<number>) => void;

  // SWIFT Preview (optional)
  showSwiftPreview?: boolean;
  swiftConfigs?: any[];

  // Approval and comments
  approvalMode?: boolean;
  fieldComments?: Record<string, { comment: string; commentedAt: string; commentedBy: string }>;
  onSaveFieldComment?: (fieldCode: string, comment: string) => void;
  onRemoveFieldComment?: (fieldCode: string) => void;
  fieldCommentMode?: 'approver' | 'creator' | 'none';
  errorSections?: string[];

  // Visual customization
  headerColor?: string;
  sectionIcons?: Record<string, IconType>;
  sectionColors?: Record<string, string>;

  // Accounting component override (product-specific)
  AccountingSectionComponent?: React.ComponentType<any>;
  // SWIFT Preview component override (product-specific)
  SwiftPreviewSectionComponent?: React.ComponentType<any>;
}

export const SharedAccordionExpertView: React.FC<SharedAccordionExpertViewProps> = ({
  messageType,
  dynamicSections,
  swiftFieldsData,
  onSwiftFieldChange,
  swiftFieldConfigs = [],
  productType,
  customData,
  onCustomDataChange,
  customFieldSteps,
  customFieldsUserData,
  showAccounting = false,
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
  selectedEntities,
  showAlerts = false,
  alertOperationType,
  alertEventCode,
  alertSelectedIds,
  onAlertSelectedChange,
  showSwiftPreview = true,
  swiftConfigs,
  approvalMode = false,
  fieldComments,
  onSaveFieldComment,
  onRemoveFieldComment,
  fieldCommentMode = 'none',
  errorSections = [],
  headerColor = 'blue',
  sectionIcons = DEFAULT_SECTION_ICONS,
  sectionColors = DEFAULT_SECTION_COLORS,
  AccountingSectionComponent,
  SwiftPreviewSectionComponent,
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Count extra sections for progress calculation
  const extraSectionsCount = (showAccounting ? 1 : 0) + (showAlerts ? 1 : 0) + (showSwiftPreview ? 1 : 0);

  // Use shared stats hook
  const {
    sectionStats,
    completedSections,
    sectionsWithComments,
    progress,
    globalStats,
  } = useSectionFieldStats({
    swiftFieldConfigs,
    swiftFieldsData,
    dynamicSections,
    fieldComments,
    extraSectionsCount,
  });

  // Open sections state (first section open by default)
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (dynamicSections.length > 0) {
      initial.add(dynamicSections[0].sectionCode);
    }
    return initial;
  });

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

  // Listen for programmatic section open requests (from QuickFieldAssistant navigate)
  useEffect(() => {
    const handler = (e: Event) => {
      const sectionCode = (e as CustomEvent).detail?.sectionCode;
      if (sectionCode) {
        setOpenSections(prev => {
          if (prev.has(sectionCode)) return prev;
          const newSet = new Set(prev);
          newSet.add(sectionCode);
          return newSet;
        });
      }
    };
    window.addEventListener('openAccordionSection', handler);
    return () => window.removeEventListener('openAccordionSection', handler);
  }, []);

  const totalSectionsCount = dynamicSections.length + extraSectionsCount;

  return (
    <VStack align="stretch" gap={0}>
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="lg"
        border="1px solid"
        borderColor={colors.borderColor}
      >
        {/* Progress Summary Header */}
        <HStack
          px={5}
          py={4}
          bg={isDark ? `${headerColor}.900` : `${headerColor}.600`}
          color="white"
          justify="space-between"
          flexWrap="wrap"
          gap={3}
        >
          <HStack gap={3}>
            <Icon as={FiCheckCircle} boxSize={5} />
            <VStack align="start" gap={0}>
              <Text fontWeight="600" fontSize="sm">
                {completedSections.size} de {totalSectionsCount} secciones completas
              </Text>
              {globalStats.total > 0 && (
                <Text fontSize="xs" opacity={0.9}>
                  {globalStats.filled}/{globalStats.total} campos • {globalStats.requiredFilled}/{globalStats.required} obligatorios
                </Text>
              )}
            </VStack>
          </HStack>
          <HStack gap={3}>
            {sectionsWithComments.size > 0 && (
              <Badge
                bg="orange.500"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                <HStack gap={1}>
                  <FiMessageSquare size={10} />
                  <Text>{t('fieldComments.sectionsCount', { count: sectionsWithComments.size })}</Text>
                </HStack>
              </Badge>
            )}
            {globalStats.total > 0 && (
              <Badge
                bg="whiteAlpha.200"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                {globalStats.percentage}%
              </Badge>
            )}
            <Box w="100px">
              <Progress.Root value={globalStats.percentage || progress} size="sm">
                <Progress.Track bg="whiteAlpha.300" borderRadius="full">
                  <Progress.Range bg="whiteAlpha.700" />
                </Progress.Track>
              </Progress.Root>
            </Box>
          </HStack>
        </HStack>

        {/* Accordion Sections */}
        <VStack align="stretch" gap={0} divideY="1px" divideColor={colors.borderColor}>
          {/* Dynamic SWIFT Sections */}
          {dynamicSections.map((section) => {
            const isOpen = openSections.has(section.sectionCode);
            const isCompleted = completedSections.has(section.sectionCode);
            const hasError = errorSections.includes(section.sectionCode);
            const commentCount = sectionsWithComments.get(section.sectionCode) || 0;
            const hasComments = commentCount > 0;
            const SectionIcon = sectionIcons[section.sectionCode] || FiFileText;
            const sectionColor = sectionColors[section.sectionCode] || 'gray';
            const stats = sectionStats[section.sectionCode];

            return (
              <Box key={section.sectionCode}>
                {/* Accordion Header */}
                <Box
                  as="button"
                  w="100%"
                  px={5}
                  py={4}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  data-section-code={section.sectionCode}
                  bg={isOpen
                    ? (isDark ? `${sectionColor}.900` : `${sectionColor}.600`)
                    : 'transparent'
                  }
                  color={isOpen ? 'white' : undefined}
                  _hover={{
                    bg: isOpen
                      ? (isDark ? `${sectionColor}.800` : `${sectionColor}.500`)
                      : (isDark ? 'gray.700' : 'gray.100'),
                  }}
                  cursor="pointer"
                  transition="all 0.2s"
                  onClick={() => toggleSection(section.sectionCode)}
                  borderLeft={isCompleted ? '4px solid' : hasError ? '4px solid' : hasComments ? '4px solid' : 'none'}
                  borderLeftColor={hasError ? 'red.500' : hasComments ? 'orange.500' : 'green.500'}
                >
                  <HStack gap={4}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg={isOpen
                        ? 'whiteAlpha.200'
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
                          ? 'white'
                          : colors.textColorSecondary
                        }
                      />
                    </Box>
                    <Box textAlign="left">
                      <HStack gap={2}>
                        <Text
                          fontWeight="600"
                          fontSize="sm"
                          color={isOpen ? 'white' : (hasError ? 'red.500' : colors.textColor)}
                        >
                          {t(section.labelKey, section.labelKey)}
                        </Text>
                        {isCompleted && !hasError && !hasComments && (
                          <Icon as={FiCheckCircle} color={isOpen ? 'whiteAlpha.800' : 'green.500'} boxSize={4} />
                        )}
                        {hasError && (
                          <Badge colorPalette="red" size="sm">Error</Badge>
                        )}
                        {hasComments && (
                          <Badge colorPalette="orange" size="sm" variant="solid">
                            <HStack gap={1}>
                              <FiMessageSquare size={10} />
                              <Text>{t('fieldComments.observationCount', { count: commentCount })}</Text>
                            </HStack>
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color={isOpen ? 'whiteAlpha.700' : colors.textColorSecondary}>
                        {section.descriptionKey
                          ? t(section.descriptionKey, `Campos SWIFT - ${section.sectionCode}`)
                          : `Campos SWIFT - ${section.sectionCode}`
                        }
                      </Text>
                    </Box>
                  </HStack>

                  {/* Stats & Arrow */}
                  <HStack gap={3}>
                    {stats && (
                      <HStack gap={2}>
                        <HStack gap={0.5}>
                          {Array.from({ length: Math.min(stats.total, 5) }).map((_, i) => (
                            <Box
                              key={i}
                              w="6px"
                              h="6px"
                              borderRadius="full"
                              bg={i < Math.ceil((stats.filled / stats.total) * Math.min(stats.total, 5))
                                ? (isCompleted ? 'green.500' : `${sectionColor}.500`)
                                : (isDark ? 'gray.600' : 'gray.300')
                              }
                            />
                          ))}
                        </HStack>
                        <Badge
                          colorPalette={isCompleted ? 'green' : stats.filled > 0 ? sectionColor : 'gray'}
                          size="sm"
                          variant={isCompleted ? 'solid' : 'subtle'}
                        >
                          {stats.filled}/{stats.total}
                        </Badge>
                        {stats.required > 0 && stats.requiredFilled < stats.required && (
                          <Badge colorPalette="orange" size="sm" variant="subtle">
                            {stats.requiredFilled}/{stats.required} req
                          </Badge>
                        )}
                      </HStack>
                    )}
                    <Icon
                      as={isOpen ? FiChevronUp : FiChevronDown}
                      boxSize={5}
                      color={isOpen ? 'whiteAlpha.700' : colors.textColorSecondary}
                      transition="transform 0.2s"
                    />
                  </HStack>
                </Box>

                {/* Accordion Content */}
                <Collapsible.Root open={isOpen}>
                  <Collapsible.Content>
                    <Box
                      px={5}
                      py={5}
                      bg={isDark ? 'gray.750' : 'white'}
                      borderLeft="3px solid"
                      borderRight="3px solid"
                      borderBottom="3px solid"
                      borderColor={isDark ? `${sectionColor}.700` : `${sectionColor}.300`}
                      borderBottomRadius="lg"
                    >
                      <DynamicSwiftSection
                        messageType={messageType}
                        section={section.sectionCode}
                        formData={swiftFieldsData}
                        onChange={onSwiftFieldChange}
                        columns={2}
                        variant="clean"
                        readOnly={approvalMode}
                        hasError={hasError}
                        fieldComments={fieldComments}
                        onSaveFieldComment={onSaveFieldComment}
                        onRemoveFieldComment={onRemoveFieldComment}
                        fieldCommentMode={fieldCommentMode}
                      />

                      {/* Embedded Custom Fields (only if productType provided) */}
                      {productType && customData && onCustomDataChange && (
                        <EmbeddedCustomSection
                          embedAfterCode={section.sectionCode}
                          embedType="SECTION"
                          productType={productType}
                          customData={customData}
                          onChange={onCustomDataChange}
                          disabled={approvalMode}
                          readOnly={approvalMode}
                          variant="clean"
                        />
                      )}
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            );
          })}

          {/* Custom Field Steps as Accordions */}
          {customFieldSteps && customFieldSteps.length > 0 && customData && onCustomDataChange && customFieldSteps.map((step) => {
            const isOpen = openSections.has(`custom_${step.stepCode}`);

            return (
              <Box key={step.stepCode}>
                <Box
                  as="button"
                  w="100%"
                  px={5}
                  py={4}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  bg={isOpen
                    ? (isDark ? 'purple.900' : 'purple.600')
                    : 'transparent'
                  }
                  color={isOpen ? 'white' : undefined}
                  _hover={{
                    bg: isOpen
                      ? (isDark ? 'purple.800' : 'purple.500')
                      : (isDark ? 'gray.700' : 'gray.100'),
                  }}
                  cursor="pointer"
                  transition="all 0.2s"
                  onClick={() => toggleSection(`custom_${step.stepCode}`)}
                >
                  <HStack gap={4}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg={isOpen ? 'whiteAlpha.200' : (isDark ? 'gray.700' : 'gray.100')}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={FiEdit3}
                        boxSize={5}
                        color={isOpen ? 'white' : colors.textColorSecondary}
                      />
                    </Box>
                    <Box textAlign="left">
                      <Text fontWeight="600" fontSize="sm" color={isOpen ? 'white' : colors.textColor}>
                        {step.stepName || step.stepCode || 'Campos Adicionales'}
                      </Text>
                      <Text fontSize="xs" color={isOpen ? 'whiteAlpha.700' : colors.textColorSecondary}>
                        {step.stepDescription || 'Información adicional personalizada'}
                      </Text>
                    </Box>
                  </HStack>
                  <Icon
                    as={isOpen ? FiChevronUp : FiChevronDown}
                    boxSize={5}
                    color={isOpen ? 'whiteAlpha.700' : colors.textColorSecondary}
                  />
                </Box>
                <Collapsible.Root open={isOpen}>
                  <Collapsible.Content>
                    <Box
                      px={5}
                      py={5}
                      bg={isDark ? 'gray.750' : 'white'}
                      borderLeft="3px solid"
                      borderRight="3px solid"
                      borderBottom="3px solid"
                      borderColor={isDark ? 'purple.700' : 'purple.300'}
                      borderBottomRadius="lg"
                    >
                      <CustomFieldsPanel
                        step={step}
                        customData={customData}
                        onChange={onCustomDataChange}
                        disabled={approvalMode}
                        readOnly={approvalMode}
                        userData={customFieldsUserData}
                      />
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            );
          })}

          {/* Accounting Section Accordion */}
          {showAccounting && AccountingSectionComponent && (
            <Box>
              <Box
                as="button"
                w="100%"
                px={5}
                py={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bg={openSections.has('ACCOUNTING')
                  ? (isDark ? 'green.900' : 'green.600')
                  : 'transparent'
                }
                color={openSections.has('ACCOUNTING') ? 'white' : undefined}
                _hover={{
                  bg: openSections.has('ACCOUNTING')
                    ? (isDark ? 'green.800' : 'green.500')
                    : (isDark ? 'gray.700' : 'gray.100'),
                }}
                cursor="pointer"
                transition="all 0.2s"
                onClick={() => toggleSection('ACCOUNTING')}
              >
                <HStack gap={4}>
                  <Box
                    w="40px"
                    h="40px"
                    borderRadius="lg"
                    bg={openSections.has('ACCOUNTING') ? 'whiteAlpha.200' : (isDark ? 'gray.700' : 'gray.100')}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={FiDollarSign}
                      boxSize={5}
                      color={openSections.has('ACCOUNTING') ? 'white' : colors.textColorSecondary}
                    />
                  </Box>
                  <Box textAlign="left">
                    <Text fontWeight="600" fontSize="sm" color={openSections.has('ACCOUNTING') ? 'white' : colors.textColor}>
                      Contabilidad y Comisiones
                    </Text>
                    <Text fontSize="xs" color={openSections.has('ACCOUNTING') ? 'whiteAlpha.700' : colors.textColorSecondary}>
                      Asiento contable y calculo de comision
                    </Text>
                  </Box>
                </HStack>
                <Icon
                  as={openSections.has('ACCOUNTING') ? FiChevronUp : FiChevronDown}
                  boxSize={5}
                  color={openSections.has('ACCOUNTING') ? 'whiteAlpha.700' : colors.textColorSecondary}
                />
              </Box>
              <Collapsible.Root open={openSections.has('ACCOUNTING')}>
                <Collapsible.Content>
                  <Box
                    px={5}
                    py={5}
                    bg={isDark ? 'gray.750' : 'white'}
                    borderLeft="3px solid"
                    borderRight="3px solid"
                    borderBottom="3px solid"
                    borderColor={isDark ? 'green.700' : 'green.300'}
                    borderBottomRadius="lg"
                  >
                    <AccountingSectionComponent
                      mode="expert"
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
                  </Box>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>
          )}

          {/* Alert Preview Accordion */}
          {showAlerts && alertOperationType && (
            <Box>
              <Box
                as="button"
                w="100%"
                px={5}
                py={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bg={openSections.has('ALERTS')
                  ? (isDark ? 'orange.900' : 'orange.600')
                  : 'transparent'
                }
                color={openSections.has('ALERTS') ? 'white' : undefined}
                _hover={{
                  bg: openSections.has('ALERTS')
                    ? (isDark ? 'orange.800' : 'orange.500')
                    : (isDark ? 'gray.700' : 'gray.100'),
                }}
                cursor="pointer"
                transition="all 0.2s"
                onClick={() => toggleSection('ALERTS')}
              >
                <HStack gap={4}>
                  <Box
                    w="40px"
                    h="40px"
                    borderRadius="lg"
                    bg={openSections.has('ALERTS') ? 'whiteAlpha.200' : (isDark ? 'gray.700' : 'gray.100')}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={FiBell}
                      boxSize={5}
                      color={openSections.has('ALERTS') ? 'white' : colors.textColorSecondary}
                    />
                  </Box>
                  <Box textAlign="left">
                    <Text fontWeight="600" fontSize="sm" color={openSections.has('ALERTS') ? 'white' : colors.textColor}>
                      {t('alertPreview.accordionTitle', 'Plan de Seguimiento y Control')}
                    </Text>
                    <Text fontSize="xs" color={openSections.has('ALERTS') ? 'whiteAlpha.700' : colors.textColorSecondary}>
                      {t('alertPreview.accordionSubtitle', 'Gestión proactiva de riesgo operativo')}
                    </Text>
                  </Box>
                </HStack>
                <Icon
                  as={openSections.has('ALERTS') ? FiChevronUp : FiChevronDown}
                  boxSize={5}
                  color={openSections.has('ALERTS') ? 'whiteAlpha.700' : colors.textColorSecondary}
                />
              </Box>
              <Collapsible.Root open={openSections.has('ALERTS')}>
                <Collapsible.Content>
                  <Box
                    px={5}
                    py={5}
                    bg={isDark ? 'gray.750' : 'white'}
                    borderLeft="3px solid"
                    borderRight="3px solid"
                    borderBottom="3px solid"
                    borderColor={isDark ? 'orange.700' : 'orange.300'}
                    borderBottomRadius="lg"
                  >
                    <AlertPreviewStep
                      variant="compact"
                      operationType={alertOperationType}
                      eventCode={alertEventCode}
                      swiftFieldsData={swiftFieldsData}
                      swiftConfigs={swiftConfigs}
                      selectedAlertIds={alertSelectedIds}
                      onSelectedAlertsChange={onAlertSelectedChange}
                    />
                  </Box>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>
          )}

          {/* SWIFT Preview Accordion */}
          {showSwiftPreview && (
            <Box>
              <Box
                as="button"
                w="100%"
                px={5}
                py={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bg={openSections.has('PREVIEW')
                  ? (isDark ? 'cyan.900' : 'cyan.600')
                  : 'transparent'
                }
                color={openSections.has('PREVIEW') ? 'white' : undefined}
                _hover={{
                  bg: openSections.has('PREVIEW')
                    ? (isDark ? 'cyan.800' : 'cyan.500')
                    : (isDark ? 'gray.700' : 'gray.100'),
                }}
                cursor="pointer"
                transition="all 0.2s"
                onClick={() => toggleSection('PREVIEW')}
              >
                <HStack gap={4}>
                  <Box
                    w="40px"
                    h="40px"
                    borderRadius="lg"
                    bg={openSections.has('PREVIEW') ? 'whiteAlpha.200' : (isDark ? 'gray.700' : 'gray.100')}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={FiFileText}
                      boxSize={5}
                      color={openSections.has('PREVIEW') ? 'white' : colors.textColorSecondary}
                    />
                  </Box>
                  <Box textAlign="left">
                    <Text fontWeight="600" fontSize="sm" color={openSections.has('PREVIEW') ? 'white' : colors.textColor}>
                      Vista Previa SWIFT
                    </Text>
                    <Text fontSize="xs" color={openSections.has('PREVIEW') ? 'whiteAlpha.700' : colors.textColorSecondary}>
                      Mensaje {messageType} generado
                    </Text>
                  </Box>
                </HStack>
                <Icon
                  as={openSections.has('PREVIEW') ? FiChevronUp : FiChevronDown}
                  boxSize={5}
                  color={openSections.has('PREVIEW') ? 'whiteAlpha.700' : colors.textColorSecondary}
                />
              </Box>
              <Collapsible.Root open={openSections.has('PREVIEW')}>
                <Collapsible.Content>
                  <Box
                    px={5}
                    py={5}
                    bg={isDark ? 'gray.750' : 'white'}
                    borderLeft="3px solid"
                    borderRight="3px solid"
                    borderBottom="3px solid"
                    borderColor={isDark ? 'cyan.700' : 'cyan.300'}
                    borderBottomRadius="lg"
                  >
                    {SwiftPreviewSectionComponent ? (
                      <SwiftPreviewSectionComponent
                        mode="expert"
                        swiftFieldsData={swiftFieldsData}
                        selectedEntities={selectedEntities}
                        fieldConfigs={swiftConfigs}
                      />
                    ) : (
                      <SwiftMessageViewer
                        messageType={messageType}
                        fields={swiftFieldsData}
                        fieldConfigs={swiftConfigs}
                        showBadges
                        allowCopy
                        allowDownload
                      />
                    )}
                  </Box>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default SharedAccordionExpertView;
