import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Heading,
  Text,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepDescription,
  StepSeparator,
  StepIcon,
  StepNumber,
  useSteps,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  IconButton,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Separator,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiArrowLeft, FiArrowRight, FiSave } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import {
  CPProcessConfiguration,
  CPStepDTO,
  CPSectionDTO,
  getProcessConfiguration,
} from '../../../services/cpProcessConfigService';
import { createProcess, updateProcess } from '../../../services/cpProcessService';
import CPDynamicField from './CPDynamicField';

type FieldValue = string | number | boolean | null;
type FormData = Record<string, FieldValue | Record<string, FieldValue>[]>;

interface CPProcessWizardProps {
  countryCode?: string;
  processType: string;
  processId?: string;
  initialData?: FormData;
  onComplete?: (processId: string) => void;
  onCancel?: () => void;
}

const CPProcessWizard: React.FC<CPProcessWizardProps> = ({
  countryCode = 'EC',
  processType,
  processId,
  initialData,
  onComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [config, setConfig] = useState<CPProcessConfiguration | null>(null);
  const [formData, setFormData] = useState<FormData>(initialData || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const wizardSteps = config?.steps.filter((s) => s.showInWizard) || [];
  const { activeStep, setActiveStep } = useSteps({ index: 0, count: wizardSteps.length });

  useEffect(() => {
    loadConfig();
  }, [countryCode, processType]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getProcessConfiguration(countryCode, processType);
      setConfig(data);
    } catch (err) {
      toast({ title: 'Error loading configuration', status: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = useCallback((fieldCode: string, value: FieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldCode]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldCode];
      return next;
    });
  }, []);

  const handleRepeatableChange = useCallback(
    (sectionCode: string, rowIndex: number, fieldCode: string, value: FieldValue) => {
      setFormData((prev) => {
        const rows = (prev[sectionCode] as Record<string, FieldValue>[]) || [];
        const updatedRows = [...rows];
        if (!updatedRows[rowIndex]) updatedRows[rowIndex] = {};
        updatedRows[rowIndex] = { ...updatedRows[rowIndex], [fieldCode]: value };
        return { ...prev, [sectionCode]: updatedRows };
      });
    },
    []
  );

  const addRepeatableRow = useCallback((sectionCode: string) => {
    setFormData((prev) => {
      const rows = (prev[sectionCode] as Record<string, FieldValue>[]) || [];
      return { ...prev, [sectionCode]: [...rows, {}] };
    });
  }, []);

  const removeRepeatableRow = useCallback((sectionCode: string, index: number) => {
    setFormData((prev) => {
      const rows = (prev[sectionCode] as Record<string, FieldValue>[]) || [];
      return { ...prev, [sectionCode]: rows.filter((_, i) => i !== index) };
    });
  }, []);

  const validateStep = (step: CPStepDTO): boolean => {
    const newErrors: Record<string, string> = {};
    step.sections.forEach((section) => {
      if (section.sectionType === 'SINGLE') {
        section.fields.forEach((field) => {
          if (field.isRequired && !formData[field.fieldCode]) {
            newErrors[field.fieldCode] = t('common.fieldRequired', 'Campo requerido');
          }
        });
      } else {
        const rows = (formData[section.sectionCode] as Record<string, FieldValue>[]) || [];
        if (section.minRows > 0 && rows.length < section.minRows) {
          newErrors[section.sectionCode] = t('cp.validation.minRows', 'Se requieren al menos {{min}} filas', {
            min: section.minRows,
          });
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep < wizardSteps.length - 1) {
      if (validateStep(wizardSteps[activeStep])) {
        setActiveStep(activeStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (processId) {
        await updateProcess(processId, { formData: formData as Record<string, unknown> });
        toast({ title: 'Proceso actualizado', status: 'success', duration: 3000 });
      } else {
        const result = await createProcess({
          countryCode,
          processType,
          entityRuc: formData.RUC_ENTIDAD as string,
          entityName: formData.NOMBRE_ENTIDAD as string,
          formData: formData as Record<string, unknown>,
        });
        toast({ title: 'Proceso creado', status: 'success', duration: 3000 });
        onComplete?.(result.processId);
      }
    } catch (err) {
      toast({ title: 'Error guardando proceso', status: 'error', duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (section: CPSectionDTO) => {
    if (section.sectionType === 'REPEATABLE') {
      return renderRepeatableSection(section);
    }
    return (
      <Card key={section.id} size="sm" variant="outline" mb={3}>
        <CardHeader py={2} px={4}>
          <Heading size="xs">{t(section.sectionNameKey, section.sectionCode)}</Heading>
        </CardHeader>
        <CardBody pt={0} px={4} pb={3}>
          <SimpleGrid columns={section.columnsCount || 2} spacing={3}>
            {section.fields
              .filter((f) => f.showInWizard)
              .map((field) => (
                <CPDynamicField
                  key={field.id}
                  field={field}
                  value={formData[field.fieldCode] as FieldValue}
                  onChange={handleFieldChange}
                  error={errors[field.fieldCode]}
                />
              ))}
          </SimpleGrid>
        </CardBody>
      </Card>
    );
  };

  const renderRepeatableSection = (section: CPSectionDTO) => {
    const rows = (formData[section.sectionCode] as Record<string, FieldValue>[]) || [];

    return (
      <Card key={section.id} size="sm" variant="outline" mb={3}>
        <CardHeader py={2} px={4}>
          <HStack justify="space-between">
            <Heading size="xs">
              {t(section.sectionNameKey, section.sectionCode)}
              <Badge ml={2} colorScheme="blue" fontSize="2xs">
                {rows.length} / {section.maxRows}
              </Badge>
            </Heading>
            <IconButton
              aria-label="Add row"
              icon={<FiPlus />}
              size="xs"
              colorScheme="blue"
              onClick={() => addRepeatableRow(section.sectionCode)}
              isDisabled={rows.length >= section.maxRows}
            />
          </HStack>
        </CardHeader>
        <CardBody pt={0} px={4} pb={3}>
          {errors[section.sectionCode] && (
            <Alert status="error" size="sm" mb={2}>
              <AlertIcon />
              {errors[section.sectionCode]}
            </Alert>
          )}
          {rows.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              {t('cp.noItems', 'No hay items. Haga clic en + para agregar.')}
            </Text>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    {section.fields
                      .filter((f) => f.showInWizard)
                      .map((field) => (
                        <Th key={field.id} fontSize="xs">
                          {t(field.fieldNameKey, field.fieldCode)}
                          {field.isRequired && <Text as="span" color="red.500"> *</Text>}
                        </Th>
                      ))}
                    <Th w="40px" />
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row, idx) => (
                    <Tr key={idx}>
                      {section.fields
                        .filter((f) => f.showInWizard)
                        .map((field) => (
                          <Td key={field.id} p={1}>
                            <CPDynamicField
                              field={{ ...field, isRequired: false }}
                              value={row[field.fieldCode]}
                              onChange={(_, val) =>
                                handleRepeatableChange(section.sectionCode, idx, field.fieldCode, val)
                              }
                            />
                          </Td>
                        ))}
                      <Td p={1}>
                        <IconButton
                          aria-label="Remove"
                          icon={<FiTrash2 />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeRepeatableRow(section.sectionCode, idx)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>{t('common.loading', 'Cargando...')}</Text>
      </Box>
    );
  }

  if (!config || wizardSteps.length === 0) {
    return (
      <Alert status="warning">
        <AlertIcon />
        {t('cp.noConfig', 'No hay configuración disponible para este tipo de proceso.')}
      </Alert>
    );
  }

  const currentStep = wizardSteps[activeStep];
  const isLastStep = activeStep === wizardSteps.length - 1;

  return (
    <VStack spacing={4} align="stretch">
      {/* Stepper */}
      <Box overflowX="auto" pb={2}>
        <Stepper index={activeStep} size="sm" colorScheme="blue">
          {wizardSteps.map((step, index) => (
            <Step key={step.id} onClick={() => setActiveStep(index)} cursor="pointer">
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <Box flexShrink={0}>
                <StepTitle>{t(step.stepNameKey, step.stepCode)}</StepTitle>
                <StepDescription>
                  <Badge colorScheme={step.color || 'gray'} fontSize="2xs">
                    {step.phase}
                  </Badge>
                </StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>
      </Box>

      <Separator />

      {/* Step Content */}
      <Box>
        <Heading size="md" mb={3}>
          {t(currentStep.stepNameKey, currentStep.stepCode)}
        </Heading>
        {currentStep.stepDescriptionKey && (
          <Text fontSize="sm" color="gray.500" mb={4}>
            {t(currentStep.stepDescriptionKey)}
          </Text>
        )}

        {currentStep.sections
          .filter((s) => s.fields.length > 0)
          .map((section) => renderSection(section))}
      </Box>

      {/* Navigation */}
      <HStack justify="space-between" pt={4}>
        <HStack>
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              {t('common.cancel', 'Cancelar')}
            </Button>
          )}
          <Button
            size="sm"
            leftIcon={<FiArrowLeft />}
            onClick={handlePrevious}
            isDisabled={activeStep === 0}
          >
            {t('common.previous', 'Anterior')}
          </Button>
        </HStack>
        <HStack>
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<FiSave />}
            onClick={handleSave}
            isLoading={saving}
          >
            {t('common.save', 'Guardar')}
          </Button>
          {!isLastStep && (
            <Button size="sm" colorScheme="blue" rightIcon={<FiArrowRight />} onClick={handleNext}>
              {t('common.next', 'Siguiente')}
            </Button>
          )}
        </HStack>
      </HStack>
    </VStack>
  );
};

export default CPProcessWizard;
