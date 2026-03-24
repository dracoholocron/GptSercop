/**
 * DynamicFormWizard Component
 * Renders a multi-step wizard form based on custom fields configuration
 * Uses the useCustomFields hook to fetch and manage configuration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Badge,
  Card,
  Heading,
  Icon,
  Flex,
} from '@chakra-ui/react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiSave,
  FiSend,
  FiCheck,
  FiInfo,
  FiUser,
  FiTruck,
  FiPackage,
  FiUpload,
  FiCheckCircle,
  FiFileText,
  FiDollarSign,
  FiList,
  FiShield,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomFields } from '../../hooks/useCustomFields';
import type {
  CustomFieldStepDTO,
  CustomFieldSectionDTO,
  CustomData,
  CustomDataRow,
  CustomDataValue,
} from '../../services/customFieldsService';
import { DynamicCustomField } from '../customfields/DynamicCustomField';
import { RepeatableSection } from '../customfields/RepeatableSection';
import clientPortalCatalogService from '../../services/clientPortalCatalogService';

// Icon mapping from string to component
const iconMap: Record<string, IconType> = {
  FiInfo,
  FiUser,
  FiTruck,
  FiPackage,
  FiUpload,
  FiCheckCircle,
  FiFileText,
  FiDollarSign,
  FiList,
  FiShield,
};

interface DynamicFormWizardProps {
  productType: string;
  tenantId?: string;
  initialData?: CustomData;
  onSubmit: (data: CustomData, asDraft: boolean) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  /** Request ID used as draftId for file uploads - links documents to this request */
  requestId?: string;
}

export const DynamicFormWizard = ({
  productType,
  tenantId,
  initialData = {},
  onSubmit,
  onCancel,
  loading: externalLoading = false,
  requestId,
}: DynamicFormWizardProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Use the custom fields hook
  const {
    configuration: config,
    isLoading: configLoading,
    error: configError,
    customData,
    setCustomData,
    updateFieldValue,
    updateSectionRows,
  } = useCustomFields({
    productType,
    mode: 'WIZARD',
    tenantId,
    autoLoad: true,
  });

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Catalog data cache
  const [catalogCache, setCatalogCache] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  // Financial institutions data
  const [financialInstitutions, setFinancialInstitutions] = useState<Array<{ value: string; label: string }>>([]);

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setCustomData(initialData);
    }
  }, [initialData, setCustomData]);

  // Load catalog data for fields that need it
  // Uses the client portal catalog service which has endpoints allowed for CLIENT users
  useEffect(() => {
    const loadCatalogs = async () => {
      if (!config) return;

      const catalogCodes = new Set<string>();
      let needsFinancialInstitutions = false;

      // Collect all unique catalog codes and check for financial institution fields
      config.steps.forEach((step) => {
        step.sections.forEach((section) => {
          section.fields.forEach((field) => {
            if (field.dataSourceType === 'CATALOG' && field.dataSourceCode) {
              catalogCodes.add(field.dataSourceCode);
            }
            // Check if any field needs financial institutions
            if (field.dataSourceType === 'FINANCIAL_INSTITUTION' ||
                field.componentType === 'BANK_SELECTOR' ||
                field.componentType === 'SWIFT_SELECTOR') {
              needsFinancialInstitutions = true;
            }
          });
        });
      });

      // Load each catalog using the client portal catalog service
      const newCache: Record<string, Array<{ value: string; label: string }>> = {};

      for (const code of Array.from(catalogCodes)) {
        try {
          if (code === 'CURRENCIES') {
            // Load currencies from client portal endpoint
            newCache[code] = await clientPortalCatalogService.getCurrencyOptions();
          } else {
            // Load custom catalog options from client portal endpoint
            newCache[code] = await clientPortalCatalogService.getCatalogOptionsByCode(code);
          }
        } catch (error) {
          console.error(`Error loading catalog ${code}:`, error);
        }
      }

      setCatalogCache(newCache);

      // Load financial institutions if needed
      if (needsFinancialInstitutions) {
        try {
          const bankOptions = await clientPortalCatalogService.getFinancialInstitutionOptions();
          setFinancialInstitutions(bankOptions);
        } catch (error) {
          console.error('Error loading financial institutions:', error);
        }
      }
    };

    loadCatalogs();
  }, [config]);

  // Filter steps to only show those with show_in_wizard = true (excluding review step for now)
  const wizardSteps = useMemo(() => {
    if (!config) return [];
    return config.steps
      .filter((step) => !step.stepCode.includes('REVIEW'))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [config]);

  // Check if there's a review step
  const hasReviewStep = useMemo(() => {
    if (!config) return false;
    return config.steps.some((step) => step.stepCode.includes('REVIEW'));
  }, [config]);

  // Total steps including review
  const totalSteps = wizardSteps.length + (hasReviewStep ? 1 : 0);

  // Current step data
  const currentStepData = wizardSteps[currentStep];
  const isReviewStep = currentStep === wizardSteps.length;

  // Update field value - accepts any type including complex objects
  const handleFieldChange = useCallback((fieldCode: string, value: unknown) => {
    updateFieldValue(fieldCode, value as CustomDataValue);
    // Clear error when field is modified
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldCode];
      return newErrors;
    });
  }, [updateFieldValue]);

  // Update repeatable section data
  const handleRepeatableSectionChange = useCallback((sectionCode: string, rows: CustomDataRow[]) => {
    updateSectionRows(sectionCode, rows);
  }, [updateSectionRows]);

  // Validate current step
  const validateStep = useCallback((step: CustomFieldStepDTO): boolean => {
    const newErrors: Record<string, string> = {};

    step.sections.forEach((section) => {
      if (section.sectionType === 'REPEATABLE') {
        const rows = customData[section.sectionCode] as CustomDataRow[] | undefined;
        if (section.minRows && (!rows || rows.length < section.minRows)) {
          newErrors[section.sectionCode] = t('validation.minRows', 'Minimum {{min}} rows required', {
            min: section.minRows,
          });
        }
      } else {
        section.fields.forEach((field) => {
          if (field.isRequired) {
            const value = customData[field.fieldCode];
            if (value === null || value === undefined || value === '') {
              newErrors[field.fieldCode] = t('validation.required', 'This field is required');
            }
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customData, t]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (currentStepData && !validateStep(currentStepData)) {
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, currentStepData, totalSteps, validateStep]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Handle submit
  const handleSubmit = useCallback(async (asDraft: boolean) => {
    if (!asDraft && currentStepData && !validateStep(currentStepData)) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(customData, asDraft);
    } finally {
      setSubmitting(false);
    }
  }, [currentStepData, customData, onSubmit, validateStep]);

  // Render loading state
  if (configLoading) {
    return (
      <Center p={8}>
        <VStack>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text color={colors.textColor}>{t('common.loading', 'Loading...')}</Text>
        </VStack>
      </Center>
    );
  }

  // Render error state
  if (configError) {
    return (
      <Center p={8}>
        <VStack>
          <Text color="red.500">{configError}</Text>
          <Button onClick={onCancel}>{t('common.goBack', 'Go Back')}</Button>
        </VStack>
      </Center>
    );
  }

  // Render section
  const renderSection = (section: CustomFieldSectionDTO) => {
    const sectionName = t(section.sectionNameKey, section.sectionCode);

    if (section.sectionType === 'REPEATABLE') {
      const rows = (customData[section.sectionCode] as CustomDataRow[]) || [];
      return (
        <Box key={section.id}>
          <Text fontWeight="semibold" mb={3} color={colors.textColor}>
            {sectionName}
          </Text>
          <RepeatableSection
            section={section}
            rows={rows}
            onChange={(newRows) => handleRepeatableSectionChange(section.sectionCode, newRows)}
            catalogData={catalogCache}
            financialInstitutions={financialInstitutions}
            draftId={requestId}
          />
          {errors[section.sectionCode] && (
            <Text color="red.500" fontSize="sm" mt={2}>
              {errors[section.sectionCode]}
            </Text>
          )}
        </Box>
      );
    }

    return (
      <Box key={section.id}>
        {section.sectionNameKey && (
          <Text fontWeight="semibold" mb={3} color={colors.textColor}>
            {sectionName}
          </Text>
        )}
        <SimpleGrid columns={section.columns || 2} gap={4}>
          {section.fields.map((field) => (
            <Box
              key={field.id}
              gridColumn={field.spanColumns === 2 ? 'span 2' : 'auto'}
            >
              <DynamicCustomField
                field={field}
                value={customData[field.fieldCode] as string | number | boolean | null}
                onChange={(value) => handleFieldChange(field.fieldCode, value)}
                error={errors[field.fieldCode]}
                catalogData={field.dataSourceCode ? catalogCache[field.dataSourceCode] : undefined}
                financialInstitutions={financialInstitutions}
                draftId={requestId}
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  // Render step content
  const renderStepContent = () => {
    if (isReviewStep) {
      return renderReviewStep();
    }

    if (!currentStepData) return null;

    const stepDescription = currentStepData.stepDescriptionKey
      ? t(currentStepData.stepDescriptionKey, '')
      : '';

    return (
      <VStack align="stretch" gap={6}>
        {stepDescription && (
          <Text color={colors.textColor} opacity={0.7}>
            {stepDescription}
          </Text>
        )}
        {currentStepData.sections
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((section) => renderSection(section))}
      </VStack>
    );
  };

  // Helper function to format display value for review step
  const formatReviewValue = (value: unknown, fieldType?: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const stringValue = String(value);

    // Check if this is a FILE_UPLOAD value (JSON with file info)
    if (fieldType === 'FILE_UPLOAD' ||
        (stringValue.startsWith('{') && (stringValue.includes('"name":') || stringValue.includes('"documentId":')))) {
      try {
        const fileInfo = JSON.parse(stringValue);
        if (fileInfo.name) {
          return `📎 ${fileInfo.name}`;
        }
        if (fileInfo.documentId) {
          return `📎 Documento #${fileInfo.documentId}`;
        }
      } catch {
        // Not valid JSON, return as-is
      }
    }

    return stringValue;
  };

  // Render review step
  const renderReviewStep = () => {
    return (
      <VStack align="stretch" gap={6}>
        <Text color={colors.textColor} opacity={0.7}>
          {t('clientPortal.review.description', 'Please review your information before submitting')}
        </Text>

        {wizardSteps.map((step) => {
          const stepName = t(step.stepNameKey, step.stepCode);
          const IconComponent = step.icon && iconMap[step.icon] ? iconMap[step.icon] : FiFileText;

          return (
            <Card.Root key={step.id} variant="outline">
              <Card.Header>
                <HStack>
                  <Icon as={IconComponent} color={colors.primaryColor} />
                  <Heading size="sm">{stepName}</Heading>
                </HStack>
              </Card.Header>
              <Card.Body>
                {step.sections.map((section) => {
                  if (section.sectionType === 'REPEATABLE') {
                    const rows = (customData[section.sectionCode] as CustomDataRow[]) || [];
                    return (
                      <Box key={section.id} mb={4}>
                        <Text fontWeight="medium" mb={2} color={colors.textColor}>
                          {t(section.sectionNameKey, section.sectionCode)}
                        </Text>
                        {rows.length === 0 ? (
                          <Text color={colors.textColor} opacity={0.5} fontSize="sm">
                            {t('common.noData', 'No data')}
                          </Text>
                        ) : (
                          <VStack align="stretch" gap={2}>
                            {rows.map((row, idx) => (
                              <Box
                                key={idx}
                                p={2}
                                bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                                borderRadius="md"
                              >
                                <SimpleGrid columns={2} gap={2}>
                                  {section.fields.slice(0, 4).map((field) => (
                                    <Box key={field.fieldCode}>
                                      <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                                        {t(field.fieldNameKey, field.fieldCode)}
                                      </Text>
                                      <Text fontSize="sm" color={colors.textColor}>
                                        {formatReviewValue(row[field.fieldCode], field.componentType)}
                                      </Text>
                                    </Box>
                                  ))}
                                </SimpleGrid>
                              </Box>
                            ))}
                          </VStack>
                        )}
                      </Box>
                    );
                  }

                  return (
                    <SimpleGrid key={section.id} columns={2} gap={4} mb={4}>
                      {section.fields.map((field) => {
                        const value = customData[field.fieldCode];
                        const displayValue = formatReviewValue(value, field.componentType);
                        return (
                          <Box key={field.fieldCode}>
                            <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                              {t(field.fieldNameKey, field.fieldCode)}
                            </Text>
                            <Text fontSize="sm" color={colors.textColor}>
                              {displayValue}
                            </Text>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  );
                })}
              </Card.Body>
            </Card.Root>
          );
        })}
      </VStack>
    );
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    const allSteps = [
      ...wizardSteps.map((step) => ({
        code: step.stepCode,
        name: t(step.stepNameKey, step.stepCode),
        icon: step.icon && iconMap[step.icon] ? iconMap[step.icon] : FiFileText,
      })),
      ...(hasReviewStep
        ? [
            {
              code: 'REVIEW',
              name: t('clientPortal.review.title', 'Review'),
              icon: FiCheckCircle,
            },
          ]
        : []),
    ];

    return (
      <Box
        overflowX="auto"
        py={4}
        px={2}
        bg={isDark ? 'whiteAlpha.50' : 'white'}
        borderRadius="lg"
        mb={6}
      >
        <Flex justify="space-between" align="center" minW="fit-content">
          {allSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const IconComponent = step.icon;

            return (
              <Flex key={step.code} align="center" flex={1}>
                <VStack gap={1}>
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    bg={
                      isActive
                        ? colors.primaryColor
                        : isCompleted
                        ? 'green.500'
                        : isDark
                        ? 'whiteAlpha.200'
                        : 'gray.200'
                    }
                    color={isActive || isCompleted ? 'white' : colors.textColor}
                    transition="all 0.2s"
                  >
                    {isCompleted ? <FiCheck /> : <Icon as={IconComponent} />}
                  </Flex>
                  <Text
                    fontSize="xs"
                    fontWeight={isActive ? 'semibold' : 'normal'}
                    color={isActive ? colors.primaryColor : colors.textColor}
                    textAlign="center"
                    maxW="80px"
                  >
                    {step.name}
                  </Text>
                </VStack>

                {index < allSteps.length - 1 && (
                  <Box
                    flex={1}
                    h="2px"
                    mx={2}
                    bg={isCompleted ? 'green.500' : isDark ? 'whiteAlpha.200' : 'gray.200'}
                    transition="background 0.2s"
                  />
                )}
              </Flex>
            );
          })}
        </Flex>
      </Box>
    );
  };

  return (
    <Box>
      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Step Title */}
      <Box mb={6}>
        <Heading size="lg" color={colors.textColor}>
          {isReviewStep
            ? t('clientPortal.review.title', 'Review')
            : t(currentStepData?.stepNameKey || '', currentStepData?.stepCode || '')}
        </Heading>
      </Box>

      {/* Step Content */}
      <Card.Root mb={6}>
        <Card.Body>{renderStepContent()}</Card.Body>
      </Card.Root>

      {/* Navigation Buttons */}
      <HStack justify="space-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          disabled={submitting || externalLoading}
        >
          <FiChevronLeft style={{ marginRight: 8 }} />
          {currentStep === 0 ? t('common.cancel', 'Cancel') : t('common.previous', 'Previous')}
        </Button>

        <HStack>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={submitting || externalLoading}
          >
            {submitting ? <Spinner size="sm" mr={2} /> : <FiSave style={{ marginRight: 8 }} />}
            {t('clientPortal.requestForm.saveDraft', 'Save as Draft')}
          </Button>

          {isReviewStep ? (
            <Button
              colorPalette="green"
              onClick={() => handleSubmit(false)}
              disabled={submitting || externalLoading}
            >
              {submitting ? <Spinner size="sm" mr={2} /> : <FiSend style={{ marginRight: 8 }} />}
              {t('clientPortal.requestForm.submit', 'Submit Request')}
            </Button>
          ) : (
            <Button
              colorPalette="blue"
              onClick={handleNext}
              disabled={submitting || externalLoading}
            >
              {t('common.next', 'Next')}
              <FiChevronRight style={{ marginLeft: 8 }} />
            </Button>
          )}
        </HStack>
      </HStack>
    </Box>
  );
};

export default DynamicFormWizard;
