/**
 * CPProcessFormPage - Wizard de 3 pasos para crear y publicar un proceso de contratación
 * Paso 1: Datos básicos | Paso 2: Cronograma | Paso 3: Configuración
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Input,
  Textarea,
  Card,
  Separator,
  Steps,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiFileText,
  FiCalendar,
  FiSettings,
  FiSend,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface PACOption { id: string; year: number; entity?: { name: string } | null }

interface FormData {
  // Step 1 – basic
  title: string;
  description: string;
  processType: string;
  procurementMethod: string;
  regime: string;
  territoryPreference: string;
  estimatedAmount: string;
  referenceBudgetAmount: string;
  procurementPlanId: string;
  // Step 2 – schedule
  questionsDeadlineAt: string;
  clarificationResponseDeadlineAt: string;
  bidsDeadlineAt: string;
  scoringDeadlineAt: string;
  awardResolutionDeadlineAt: string;
  // Step 3 – config
  isRestrictedVisibility: boolean;
  electronicSignatureRequired: boolean;
  minimumQuotes: string;
  claimWindowDays: string;
}

const PROCESS_TYPES = [
  { value: 'LICITACION', label: 'Licitación' },
  { value: 'MENOR_CUANTIA', label: 'Menor Cuantía' },
  { value: 'COTIZACION', label: 'Cotización' },
  { value: 'INFIMA_CUANTIA', label: 'Ínfima Cuantía' },
  { value: 'SUBASTA_INVERSA', label: 'Subasta Inversa Electrónica' },
  { value: 'CONTRATACION_DIRECTA', label: 'Contratación Directa' },
  { value: 'CATALOGO_ELECTRONICO', label: 'Catálogo Electrónico' },
];

const REGIMES = [
  { value: 'COMUN', label: 'Régimen Común' },
  { value: 'ESPECIAL', label: 'Régimen Especial' },
];

const METHODS = [
  { value: 'PUBLICA', label: 'Pública' },
  { value: 'INVITACION', label: 'Por Invitación' },
  { value: 'DIRECTA', label: 'Directa' },
];

const TERRITORIES = [
  { value: '', label: 'Sin preferencia' },
  { value: 'local', label: 'Local' },
  { value: 'provincial', label: 'Provincial' },
  { value: 'regional', label: 'Regional' },
  { value: 'nacional', label: 'Nacional' },
];

const STEP_LABELS = [
  { label: 'Datos Básicos', icon: FiFileText },
  { label: 'Cronograma', icon: FiCalendar },
  { label: 'Configuración', icon: FiSettings },
];

// ============================================================================
// Field helpers
// ============================================================================

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  isDark: boolean;
}
const Field: React.FC<FieldProps> = ({ label, required, hint, children, isDark }) => (
  <VStack align="stretch" gap={1}>
    <Text fontSize="sm" fontWeight="600">
      {label}
      {required && <Text as="span" color="red.400" ml={1}>*</Text>}
    </Text>
    {children}
    {hint && <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>{hint}</Text>}
  </VStack>
);

// ============================================================================
// Main Component
// ============================================================================

export const CPProcessFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pacOptions, setPacOptions] = useState<PACOption[]>([]);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    processType: '',
    procurementMethod: '',
    regime: '',
    territoryPreference: '',
    estimatedAmount: '',
    referenceBudgetAmount: '',
    procurementPlanId: '',
    questionsDeadlineAt: '',
    clarificationResponseDeadlineAt: '',
    bidsDeadlineAt: '',
    scoringDeadlineAt: '',
    awardResolutionDeadlineAt: '',
    isRestrictedVisibility: false,
    electronicSignatureRequired: false,
    minimumQuotes: '3',
    claimWindowDays: '3',
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setCheck = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.checked }));

  // Load PAC options
  useEffect(() => {
    get('/v1/pac').then(async r => {
      if (r.ok) {
        const d = await r.json();
        setPacOptions(Array.isArray(d?.data) ? d.data : []);
      }
    }).catch(() => {});
  }, []);

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.title.trim()) { toaster.create({ title: 'El título es obligatorio', type: 'error' }); return false; }
      if (!form.processType) { toaster.create({ title: 'Seleccione el tipo de proceso', type: 'error' }); return false; }
      if (!form.procurementPlanId) { toaster.create({ title: 'Seleccione el PAC vinculado', type: 'error' }); return false; }
    }
    if (step === 1) {
      if (!form.bidsDeadlineAt) { toaster.create({ title: 'La fecha de cierre de ofertas es obligatoria', type: 'error' }); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, 2));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const payload = {
        procurementPlanId: form.procurementPlanId,
        title: form.title,
        description: form.description || undefined,
        processType: form.processType || undefined,
        procurementMethod: form.procurementMethod || undefined,
        regime: form.regime || undefined,
        territoryPreference: form.territoryPreference || undefined,
        estimatedAmount: form.estimatedAmount ? parseFloat(form.estimatedAmount) : undefined,
        referenceBudgetAmount: form.referenceBudgetAmount ? parseFloat(form.referenceBudgetAmount) : undefined,
        questionsDeadlineAt: form.questionsDeadlineAt || undefined,
        clarificationResponseDeadlineAt: form.clarificationResponseDeadlineAt || undefined,
        bidsDeadlineAt: form.bidsDeadlineAt || undefined,
        scoringDeadlineAt: form.scoringDeadlineAt || undefined,
        awardResolutionDeadlineAt: form.awardResolutionDeadlineAt || undefined,
        isRestrictedVisibility: form.isRestrictedVisibility,
        electronicSignatureRequired: form.electronicSignatureRequired,
        minimumQuotes: parseInt(form.minimumQuotes) || 3,
        claimWindowDays: parseInt(form.claimWindowDays) || 3,
      };
      const res = await post('/v1/tenders', payload);
      if (res.ok) {
        const created = await res.json();
        toaster.create({ title: t('cp.process.created', 'Proceso creado exitosamente'), type: 'success' });
        navigate(`/cp/processes/${created.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || t('common.error', 'Error al crear proceso'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={6} align="stretch">
        {/* Page header */}
        <HStack gap={3}>
          <Button size="sm" variant="ghost" onClick={() => navigate('/cp/processes')}>
            <Icon as={FiArrowLeft} mr={2} />
            {t('common.back', 'Volver')}
          </Button>
          <Separator orientation="vertical" h={5} />
          <VStack align="start" gap={0}>
            <Heading size="md">{t('cp.process.newTitle', 'Nuevo Proceso de Contratación')}</Heading>
            <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
              {t('cp.process.newSubtitle', 'Complete los datos del proceso en 3 pasos')}
            </Text>
          </VStack>
        </HStack>

        {/* Step indicator */}
        <Steps.Root step={step} count={3} colorPalette="blue">
          <Steps.List>
            {STEP_LABELS.map((s, i) => (
              <Steps.Item key={i} index={i}>
                <Steps.Trigger asChild>
                  <HStack gap={2} cursor={i < step ? 'pointer' : 'default'} onClick={() => i < step && setStep(i)}>
                    <Steps.Indicator>
                      <Steps.Status complete={<FiCheck />} incomplete={<Icon as={s.icon} />} current={<Icon as={s.icon} />} />
                    </Steps.Indicator>
                    <Steps.Title fontSize="sm">{s.label}</Steps.Title>
                  </HStack>
                </Steps.Trigger>
                {i < 2 && <Steps.Separator />}
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>

        {/* Step content */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6}>

          {/* STEP 0 – Basic data */}
          {step === 0 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiFileText} mr={2} />
                {t('cp.process.form.step1', 'Datos Básicos del Proceso')}
              </Heading>

              <Field label={t('cp.process.form.title', 'Título del proceso')} required isDark={isDark}>
                <Input
                  value={form.title}
                  onChange={set('title')}
                  placeholder={t('cp.process.form.titlePlaceholder', 'Ej: Adquisición de equipos informáticos')}
                />
              </Field>

              <Field label={t('cp.process.form.description', 'Descripción')} isDark={isDark}>
                <Textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder={t('cp.process.form.descriptionPlaceholder', 'Descripción detallada del objeto contractual...')}
                  rows={3}
                />
              </Field>

              <HStack gap={4} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.processType', 'Tipo de proceso')} required isDark={isDark}>
                    <NativeSelectRoot>
                      <NativeSelectField value={form.processType} onChange={set('processType')}>
                        <option value="">{t('cp.process.form.select', 'Seleccionar...')}</option>
                        {PROCESS_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field>
                </Box>
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.method', 'Modalidad')} isDark={isDark}>
                    <NativeSelectRoot>
                      <NativeSelectField value={form.procurementMethod} onChange={set('procurementMethod')}>
                        <option value="">{t('cp.process.form.select', 'Seleccionar...')}</option>
                        {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field>
                </Box>
              </HStack>

              <HStack gap={4} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.regime', 'Régimen')} isDark={isDark}>
                    <NativeSelectRoot>
                      <NativeSelectField value={form.regime} onChange={set('regime')}>
                        <option value="">{t('cp.process.form.select', 'Seleccionar...')}</option>
                        {REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field>
                </Box>
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.territory', 'Preferencia territorial')} isDark={isDark}>
                    <NativeSelectRoot>
                      <NativeSelectField value={form.territoryPreference} onChange={set('territoryPreference')}>
                        {TERRITORIES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Field>
                </Box>
              </HStack>

              <HStack gap={4} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.estimatedAmount', 'Monto estimado (USD)')} isDark={isDark}>
                    <Input
                      type="number"
                      value={form.estimatedAmount}
                      onChange={set('estimatedAmount')}
                      placeholder="0.00"
                    />
                  </Field>
                </Box>
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.referenceBudget', 'Presupuesto referencial (USD)')} isDark={isDark}>
                    <Input
                      type="number"
                      value={form.referenceBudgetAmount}
                      onChange={set('referenceBudgetAmount')}
                      placeholder="0.00"
                    />
                  </Field>
                </Box>
              </HStack>

              <Field label={t('cp.process.form.pac', 'PAC vinculado')} required isDark={isDark}
                hint={t('cp.process.form.pacHint', 'El proceso debe estar vinculado a un Plan Anual de Contratación')}>
                <NativeSelectRoot>
                  <NativeSelectField value={form.procurementPlanId} onChange={set('procurementPlanId')}>
                    <option value="">{t('cp.process.form.selectPAC', 'Seleccionar PAC...')}</option>
                    {pacOptions.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.entity?.name || 'Sin entidad'} – {p.year}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Field>
            </VStack>
          )}

          {/* STEP 1 – Schedule */}
          {step === 1 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiCalendar} mr={2} />
                {t('cp.process.form.step2', 'Cronograma del Proceso')}
              </Heading>

              <Text fontSize="xs" color={isDark ? 'orange.300' : 'orange.600'} bg={isDark ? 'orange.900' : 'orange.50'} p={3} borderRadius="md">
                {t('cp.process.form.scheduleNote', 'Las fechas deben cumplir los plazos mínimos normativos establecidos en la LOSNCP y su Reglamento.')}
              </Text>

              <SimpleGridFields>
                <Field label={t('cp.process.form.questionsDeadline', 'Fecha límite de preguntas')} isDark={isDark}>
                  <Input type="datetime-local" value={form.questionsDeadlineAt} onChange={set('questionsDeadlineAt')} />
                </Field>
                <Field label={t('cp.process.form.clarificationResponse', 'Respuesta de aclaraciones')} isDark={isDark}>
                  <Input type="datetime-local" value={form.clarificationResponseDeadlineAt} onChange={set('clarificationResponseDeadlineAt')} />
                </Field>
                <Field label={t('cp.process.form.bidsDeadline', 'Cierre de ofertas')} required isDark={isDark}>
                  <Input type="datetime-local" value={form.bidsDeadlineAt} onChange={set('bidsDeadlineAt')} />
                </Field>
                <Field label={t('cp.process.form.scoringDeadline', 'Fecha de calificación')} isDark={isDark}>
                  <Input type="datetime-local" value={form.scoringDeadlineAt} onChange={set('scoringDeadlineAt')} />
                </Field>
                <Field label={t('cp.process.form.awardDeadline', 'Fecha resolución adjudicación')} isDark={isDark}>
                  <Input type="datetime-local" value={form.awardResolutionDeadlineAt} onChange={set('awardResolutionDeadlineAt')} />
                </Field>
              </SimpleGridFields>
            </VStack>
          )}

          {/* STEP 2 – Configuration */}
          {step === 2 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiSettings} mr={2} />
                {t('cp.process.form.step3', 'Configuración Adicional')}
              </Heading>

              <HStack gap={4} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.minimumQuotes', 'Proformas mínimas')} isDark={isDark}
                    hint={t('cp.process.form.minimumQuotesHint', 'Número mínimo de proformas o cotizaciones requeridas')}>
                    <Input type="number" min={1} value={form.minimumQuotes} onChange={set('minimumQuotes')} />
                  </Field>
                </Box>
                <Box flex={1} minW="200px">
                  <Field label={t('cp.process.form.claimWindowDays', 'Días ventana reclamos')} isDark={isDark}
                    hint={t('cp.process.form.claimWindowDaysHint', 'Días hábiles para presentar reclamos (mín. 3)')}>
                    <Input type="number" min={3} value={form.claimWindowDays} onChange={set('claimWindowDays')} />
                  </Field>
                </Box>
              </HStack>

              <Box bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="lg" p={4}>
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between">
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="600">{t('cp.process.form.restrictedVisibility', 'Visibilidad restringida')}</Text>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                        {t('cp.process.form.restrictedVisibilityHint', 'Solo proveedores invitados verán el proceso')}
                      </Text>
                    </VStack>
                    <input
                      type="checkbox"
                      checked={form.isRestrictedVisibility}
                      onChange={setCheck('isRestrictedVisibility')}
                      style={{ width: 18, height: 18 }}
                    />
                  </HStack>
                  <Separator />
                  <HStack justify="space-between">
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="600">{t('cp.process.form.electronicSignature', 'Firma electrónica requerida')}</Text>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                        {t('cp.process.form.electronicSignatureHint', 'Las ofertas deben incluir firma electrónica PKCS#12')}
                      </Text>
                    </VStack>
                    <input
                      type="checkbox"
                      checked={form.electronicSignatureRequired}
                      onChange={setCheck('electronicSignatureRequired')}
                      style={{ width: 18, height: 18 }}
                    />
                  </HStack>
                </VStack>
              </Box>

              {/* Summary */}
              <Box bg={isDark ? 'blue.900' : 'blue.50'} borderRadius="lg" p={4} borderWidth="1px" borderColor={isDark ? 'blue.700' : 'blue.200'}>
                <Text fontWeight="600" fontSize="sm" mb={3} color={isDark ? 'blue.300' : 'blue.600'}>
                  {t('cp.process.form.summary', 'Resumen del proceso')}
                </Text>
                <VStack align="stretch" gap={1} fontSize="sm">
                  <HStack justify="space-between">
                    <Text color={isDark ? 'gray.400' : 'gray.500'}>{t('cp.process.form.title', 'Título')}</Text>
                    <Text fontWeight="500">{form.title || '—'}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={isDark ? 'gray.400' : 'gray.500'}>{t('cp.process.form.processType', 'Tipo')}</Text>
                    <Text fontWeight="500">{form.processType || '—'}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={isDark ? 'gray.400' : 'gray.500'}>{t('cp.process.form.estimatedAmount', 'Monto')}</Text>
                    <Text fontWeight="500">{form.estimatedAmount ? `$${parseFloat(form.estimatedAmount).toLocaleString('es-EC')}` : '—'}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={isDark ? 'gray.400' : 'gray.500'}>{t('cp.process.form.bidsDeadline', 'Cierre ofertas')}</Text>
                    <Text fontWeight="500">{form.bidsDeadlineAt ? new Date(form.bidsDeadlineAt).toLocaleDateString('es-EC') : '—'}</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          )}
        </Box>

        {/* Navigation */}
        <Flex justify="space-between">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/cp/processes')}
          >
            <Icon as={FiArrowLeft} mr={2} />
            {step > 0 ? t('common.back', 'Volver') : t('common.cancel', 'Cancelar')}
          </Button>

          {step < 2 ? (
            <Button colorPalette="blue" onClick={handleNext}>
              {t('common.next', 'Siguiente')}
              <Icon as={FiArrowRight} ml={2} />
            </Button>
          ) : (
            <Button
              colorPalette="green"
              onClick={handleSubmit}
              disabled={saving}
              loading={saving}
            >
              <Icon as={FiSend} mr={2} />
              {t('cp.process.form.create', 'Crear Proceso')}
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

// Helper component for 2-column grid of fields
const SimpleGridFields: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    display="grid"
    gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
    gap={4}
  >
    {children}
  </Box>
);

export default CPProcessFormPage;
