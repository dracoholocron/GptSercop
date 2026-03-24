import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Heading,
  Text,
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import {
  CPProcessConfiguration,
  CPSectionDTO,
  getProcessConfiguration,
} from '../../../services/cpProcessConfigService';
import { createProcess, updateProcess } from '../../../services/cpProcessService';
import CPDynamicField from './CPDynamicField';

type FieldValue = string | number | boolean | null;
type FormData = Record<string, FieldValue | Record<string, FieldValue>[]>;

interface CPProcessExpertProps {
  countryCode?: string;
  processType: string;
  processId?: string;
  initialData?: FormData;
  onComplete?: (processId: string) => void;
  onCancel?: () => void;
}

const CPProcessExpert: React.FC<CPProcessExpertProps> = ({
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

  useEffect(() => {
    loadConfig();
  }, [countryCode, processType]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getProcessConfiguration(countryCode, processType);
      setConfig(data);
    } catch {
      toast({ title: 'Error loading configuration', status: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = useCallback((fieldCode: string, value: FieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldCode]: value }));
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
    } catch {
      toast({ title: 'Error guardando proceso', status: 'error', duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion
  const calculateCompletion = (): number => {
    if (!config) return 0;
    let required = 0;
    let filled = 0;
    config.steps
      .filter((s) => s.showInExpert)
      .forEach((step) => {
        step.sections.forEach((section) => {
          section.fields
            .filter((f) => f.isRequired && f.showInExpert)
            .forEach((field) => {
              required++;
              if (formData[field.fieldCode]) filled++;
            });
        });
      });
    return required === 0 ? 100 : Math.round((filled / required) * 100);
  };

  const renderRepeatableSection = (section: CPSectionDTO) => {
    const rows = (formData[section.sectionCode] as Record<string, FieldValue>[]) || [];
    const expertFields = section.fields.filter((f) => f.showInExpert);

    return (
      <Box mb={3}>
        <HStack justify="space-between" mb={2}>
          <Heading size="xs">{t(section.sectionNameKey, section.sectionCode)}</Heading>
          <HStack>
            <Badge colorScheme="blue" fontSize="2xs">
              {rows.length} filas
            </Badge>
            <IconButton
              aria-label="Add"
              icon={<FiPlus />}
              size="xs"
              colorScheme="blue"
              onClick={() => addRepeatableRow(section.sectionCode)}
              isDisabled={rows.length >= section.maxRows}
            />
          </HStack>
        </HStack>
        {rows.length > 0 && (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th w="30px">#</Th>
                  {expertFields.map((f) => (
                    <Th key={f.id} fontSize="xs">
                      {t(f.fieldNameKey, f.fieldCode)}
                    </Th>
                  ))}
                  <Th w="40px" />
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row, idx) => (
                  <Tr key={idx}>
                    <Td>{idx + 1}</Td>
                    {expertFields.map((f) => (
                      <Td key={f.id} p={1}>
                        <CPDynamicField
                          field={{ ...f, isRequired: false }}
                          value={row[f.fieldCode]}
                          onChange={(_, val) =>
                            handleRepeatableChange(section.sectionCode, idx, f.fieldCode, val)
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
      </Box>
    );
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!config) {
    return (
      <Alert status="warning">
        <AlertIcon />
        {t('cp.noConfig', 'No hay configuración disponible.')}
      </Alert>
    );
  }

  const completion = calculateCompletion();
  const expertSteps = config.steps.filter((s) => s.showInExpert);

  return (
    <VStack spacing={4} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Box>
          <Heading size="md">{t('cp.expertMode', 'Vista Experto')}</Heading>
          <Text fontSize="sm" color="gray.500">
            {config.country.countryName} - {processType}
          </Text>
        </Box>
        <HStack>
          <Box textAlign="right" minW="200px">
            <Text fontSize="xs" color="gray.500">
              {t('cp.completion', 'Completado')}: {completion}%
            </Text>
            <Progress
              value={completion}
              size="sm"
              colorScheme={completion < 50 ? 'red' : completion < 80 ? 'yellow' : 'green'}
              borderRadius="full"
            />
          </Box>
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<FiSave />}
            onClick={handleSave}
            isLoading={saving}
          >
            {t('common.save', 'Guardar')}
          </Button>
        </HStack>
      </HStack>

      {/* Steps as Accordion */}
      <Accordion defaultIndex={[0]} allowMultiple>
        {expertSteps.map((step) => (
          <AccordionItem key={step.id} border="1px" borderColor="gray.200" borderRadius="md" mb={2}>
            <AccordionButton py={3}>
              <HStack flex="1" spacing={3}>
                <Badge colorScheme={step.color || 'gray'}>{step.phase}</Badge>
                <Heading size="sm">{t(step.stepNameKey, step.stepCode)}</Heading>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {step.sections
                .filter((s) => s.fields.length > 0)
                .map((section) => {
                  if (section.sectionType === 'REPEATABLE') {
                    return <React.Fragment key={section.id}>{renderRepeatableSection(section)}</React.Fragment>;
                  }
                  return (
                    <Box key={section.id} mb={4}>
                      <Heading size="xs" mb={2}>
                        {t(section.sectionNameKey, section.sectionCode)}
                      </Heading>
                      <SimpleGrid columns={section.columnsCount || 2} spacing={3}>
                        {section.fields
                          .filter((f) => f.showInExpert)
                          .map((field) => (
                            <CPDynamicField
                              key={field.id}
                              field={field}
                              value={formData[field.fieldCode] as FieldValue}
                              onChange={handleFieldChange}
                            />
                          ))}
                      </SimpleGrid>
                    </Box>
                  );
                })}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </VStack>
  );
};

export default CPProcessExpert;
