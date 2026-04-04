/**
 * ProviderRUPWizardPage - Registro de Proveedor en el RUP (8 pasos)
 * Persistencia por step, selector de actividades CPC
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
  Card,
  Separator,
  Steps,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiTag,
  FiClipboard,
  FiCheckCircle,
  FiSearch,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, patch } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface CpcSuggestion {
  code: string;
  description: string;
  level: number;
  isLeaf: boolean;
}

interface StepData {
  identifier: string;
  legalName: string;
  tradeName: string;
  province: string;
  canton: string;
  address: string;
  legalEstablishmentDate: string;
  patrimonyAmount: string;
  isCompliantSRI: boolean | null;
  isCompliantIESS: boolean | null;
  activityCodes: string[];
}

const PROVINCES = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas',
  'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago',
  'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo', 'Sucumbíos',
  'Tungurahua', 'Zamora Chinchipe',
];

// ============================================================================
// Step configs
// ============================================================================

const STEPS = [
  { label: 'Identificación', icon: FiUser },
  { label: 'Empresa', icon: FiClipboard },
  { label: 'Ubicación', icon: FiMapPin },
  { label: 'Establecimiento', icon: FiCalendar },
  { label: 'SRI', icon: FiShield },
  { label: 'IESS', icon: FiShield },
  { label: 'Actividades CPC', icon: FiTag },
  { label: 'Revisión', icon: FiCheckCircle },
];

// ============================================================================
// Field helper
// ============================================================================

interface FieldProps { label: string; required?: boolean; hint?: string; children: React.ReactNode; isDark: boolean }
const Field: React.FC<FieldProps> = ({ label, required, hint, children, isDark }) => (
  <VStack align="stretch" gap={1}>
    <Text fontSize="sm" fontWeight="600">
      {label}{required && <Text as="span" color="red.400" ml={1}>*</Text>}
    </Text>
    {children}
    {hint && <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>{hint}</Text>}
  </VStack>
);

// ============================================================================
// Main Component
// ============================================================================

export const ProviderRUPWizardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // CPC search state
  const [cpcQuery, setCpcQuery] = useState('');
  const [cpcResults, setCpcResults] = useState<CpcSuggestion[]>([]);
  const [cpcSearching, setCpcSearching] = useState(false);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const [form, setForm] = useState<StepData>({
    identifier: '',
    legalName: '',
    tradeName: '',
    province: '',
    canton: '',
    address: '',
    legalEstablishmentDate: '',
    patrimonyAmount: '',
    isCompliantSRI: null,
    isCompliantIESS: null,
    activityCodes: [],
  });

  const set = (key: keyof StepData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  // Load existing draft
  useEffect(() => {
    get('/v1/rup/registration').then(async r => {
      if (r.ok) {
        const d = await r.json();
        const draft = d?.data;
        if (draft?.registrationStep) setStep(Math.max(0, (draft.registrationStep || 1) - 1));
        if (draft?.registrationData && typeof draft.registrationData === 'object') {
          setForm(prev => ({ ...prev, ...(draft.registrationData as Partial<StepData>) }));
        }
      }
    }).catch(() => {}).finally(() => setLoadingDraft(false));
  }, []);

  // CPC search
  useEffect(() => {
    if (!cpcQuery.trim() || cpcQuery.length < 2) { setCpcResults([]); return; }
    const timeout = setTimeout(async () => {
      setCpcSearching(true);
      try {
        const res = await get(`/v1/cpc/suggestions?q=${encodeURIComponent(cpcQuery)}&limit=15`);
        if (res.ok) {
          const d = await res.json();
          setCpcResults(Array.isArray(d?.data) ? d.data : []);
        }
      } catch { /* silent */ } finally { setCpcSearching(false); }
    }, 350);
    return () => clearTimeout(timeout);
  }, [cpcQuery]);

  const persistStep = async (stepNum: number, data: Partial<StepData>) => {
    setSaving(true);
    try {
      const res = await patch('/v1/rup/registration', { step: stepNum + 1, data });
      if (!res.ok) throw new Error('Save failed');
    } catch {
      toaster.create({ title: t('common.error', 'Error al guardar. Intente de nuevo.'), type: 'error' });
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const validateCurrentStep = (): boolean => {
    if (step === 0 && !form.identifier.trim()) {
      toaster.create({ title: 'El RUC/Cédula es obligatorio', type: 'error' }); return false;
    }
    if (step === 1 && !form.legalName.trim()) {
      toaster.create({ title: 'La razón social es obligatoria', type: 'error' }); return false;
    }
    if (step === 2 && !form.province) {
      toaster.create({ title: 'La provincia es obligatoria', type: 'error' }); return false;
    }
    if (step === 6 && form.activityCodes.length === 0) {
      toaster.create({ title: 'Seleccione al menos una actividad CPC', type: 'error' }); return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    const ok = await persistStep(step, form);
    if (!ok) return;
    setStep(s => Math.min(s + 1, 7));
  };

  const handleSubmit = async () => {
    if (form.activityCodes.length === 0) {
      toaster.create({ title: 'Seleccione al menos una actividad CPC', type: 'error' }); return;
    }
    setSaving(true);
    try {
      const res = await patch('/v1/rup/registration', { step: 9, data: form });
      if (res.ok) {
        toaster.create({ title: t('cp.rup.completed', 'Registro RUP enviado exitosamente'), type: 'success' });
        navigate('/cp');
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || t('common.error', 'Error al enviar'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCpc = (code: string) => {
    setForm(prev => ({
      ...prev,
      activityCodes: prev.activityCodes.includes(code)
        ? prev.activityCodes.filter(c => c !== code)
        : [...prev.activityCodes, code],
    }));
  };

  if (loadingDraft) return <Flex h="60vh" align="center" justify="center"><Spinner size="xl" /></Flex>;

  return (
    <Box maxW="700px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack gap={3}>
          <Button size="sm" variant="ghost" onClick={() => navigate('/cp')}>
            <Icon as={FiArrowLeft} mr={2} />
            {t('common.back', 'Volver')}
          </Button>
          <Separator orientation="vertical" h={5} />
          <VStack align="start" gap={0}>
            <Heading size="md">{t('cp.rup.title', 'Registro de Proveedor – RUP')}</Heading>
            <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
              Paso {step + 1} de {STEPS.length}: {STEPS[step].label}
            </Text>
          </VStack>
        </HStack>

        {/* Progress */}
        <Steps.Root step={step} count={8} colorPalette="blue" size="sm">
          <Steps.List>
            {STEPS.map((s, i) => (
              <Steps.Item key={i} index={i}>
                <Steps.Trigger asChild>
                  <HStack gap={1} cursor={i < step ? 'pointer' : 'default'} onClick={() => i < step && setStep(i)}>
                    <Steps.Indicator>
                      <Steps.Status complete={<FiCheck />} incomplete={<Icon as={s.icon} boxSize={3} />} current={<Icon as={s.icon} boxSize={3} />} />
                    </Steps.Indicator>
                  </HStack>
                </Steps.Trigger>
                {i < 7 && <Steps.Separator />}
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>

        {/* Step content */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6}>

          {/* STEP 0 - Identificación */}
          {step === 0 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiUser} mr={2} />Identificación del Proveedor
              </Heading>
              <Field label="RUC / Cédula de Identidad" required isDark={isDark}
                hint="RUC de 13 dígitos para personas jurídicas, cédula de 10 dígitos para personas naturales">
                <Input
                  value={form.identifier}
                  onChange={set('identifier')}
                  placeholder="Ej: 1791234567001"
                  maxLength={13}
                />
              </Field>
            </VStack>
          )}

          {/* STEP 1 - Empresa */}
          {step === 1 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiClipboard} mr={2} />Datos de la Empresa
              </Heading>
              <Field label="Razón Social" required isDark={isDark}>
                <Input value={form.legalName} onChange={set('legalName')} placeholder="Razón social completa" />
              </Field>
              <Field label="Nombre Comercial" isDark={isDark}
                hint="Si difiere de la razón social">
                <Input value={form.tradeName} onChange={set('tradeName')} placeholder="Nombre comercial (opcional)" />
              </Field>
            </VStack>
          )}

          {/* STEP 2 - Ubicación */}
          {step === 2 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiMapPin} mr={2} />Ubicación
              </Heading>
              <Field label="Provincia" required isDark={isDark}>
                <NativeSelectRoot>
                  <NativeSelectField value={form.province} onChange={set('province')}>
                    <option value="">Seleccionar provincia...</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Field>
              <Field label="Cantón" isDark={isDark}>
                <Input value={form.canton} onChange={set('canton')} placeholder="Cantón" />
              </Field>
              <Field label="Dirección" isDark={isDark}>
                <Input value={form.address} onChange={set('address')} placeholder="Dirección domiciliaria" />
              </Field>
            </VStack>
          )}

          {/* STEP 3 - Establecimiento Legal */}
          {step === 3 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiCalendar} mr={2} />Establecimiento Legal
              </Heading>
              <Field label="Fecha de constitución legal" isDark={isDark}>
                <Input type="date" value={form.legalEstablishmentDate} onChange={set('legalEstablishmentDate')} />
              </Field>
              <Field label="Patrimonio (USD)" isDark={isDark}
                hint="Valor del patrimonio registrado en la última declaración">
                <Input type="number" value={form.patrimonyAmount} onChange={set('patrimonyAmount')} placeholder="0.00" />
              </Field>
            </VStack>
          )}

          {/* STEP 4 - SRI */}
          {step === 4 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiShield} mr={2} />Cumplimiento SRI
              </Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                ¿El proveedor se encuentra al día en obligaciones tributarias con el Servicio de Rentas Internas?
              </Text>
              <HStack gap={4}>
                {[{ value: true, label: 'Sí, estoy al día', color: 'green' }, { value: false, label: 'No, tengo pendientes', color: 'red' }].map(opt => (
                  <Button
                    key={String(opt.value)}
                    flex={1}
                    colorPalette={opt.color}
                    variant={form.isCompliantSRI === opt.value ? 'solid' : 'outline'}
                    onClick={() => setForm(prev => ({ ...prev, isCompliantSRI: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </HStack>
              {form.isCompliantSRI === false && (
                <Box bg={isDark ? 'orange.900' : 'orange.50'} borderRadius="md" p={3}>
                  <Text fontSize="sm" color={isDark ? 'orange.300' : 'orange.600'}>
                    Para ser proveedor del Estado debe regularizar sus obligaciones tributarias con el SRI antes de completar el registro.
                  </Text>
                </Box>
              )}
            </VStack>
          )}

          {/* STEP 5 - IESS */}
          {step === 5 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiShield} mr={2} />Cumplimiento IESS
              </Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                ¿El proveedor se encuentra al día en obligaciones patronales con el IESS?
              </Text>
              <HStack gap={4}>
                {[{ value: true, label: 'Sí, estoy al día', color: 'green' }, { value: false, label: 'No, tengo pendientes', color: 'red' }].map(opt => (
                  <Button
                    key={String(opt.value)}
                    flex={1}
                    colorPalette={opt.color}
                    variant={form.isCompliantIESS === opt.value ? 'solid' : 'outline'}
                    onClick={() => setForm(prev => ({ ...prev, isCompliantIESS: opt.value }))}
                  >
                    {opt.label}
                  </Button>
                ))}
              </HStack>
            </VStack>
          )}

          {/* STEP 6 - Actividades CPC */}
          {step === 6 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiTag} mr={2} />Actividades del Proveedor (CPC)
              </Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                Busque y seleccione los códigos CPC que corresponden a los bienes, obras o servicios que ofrece.
              </Text>

              <HStack bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} px={3} py={2}>
                <Icon as={FiSearch} color={isDark ? 'gray.400' : 'gray.500'} boxSize={4} />
                <Input
                  variant="unstyled"
                  placeholder="Buscar código CPC o descripción..."
                  value={cpcQuery}
                  onChange={e => setCpcQuery(e.target.value)}
                  fontSize="sm"
                />
                {cpcSearching && <Spinner size="xs" />}
              </HStack>

              {cpcResults.length > 0 && (
                <Box borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden" maxH="200px" overflowY="auto">
                  {cpcResults.map(r => {
                    const selected = form.activityCodes.includes(r.code);
                    return (
                      <HStack
                        key={r.code}
                        px={3}
                        py={2}
                        cursor="pointer"
                        bg={selected ? (isDark ? 'blue.900' : 'blue.50') : 'transparent'}
                        _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}
                        onClick={() => toggleCpc(r.code)}
                        borderBottomWidth="1px"
                        borderColor={borderColor}
                      >
                        <Icon as={selected ? FiCheckCircle : FiTag} color={selected ? 'blue.400' : 'gray.400'} boxSize={4} />
                        <VStack align="start" gap={0} flex={1}>
                          <Text fontSize="xs" fontFamily="mono" fontWeight="600">{r.code}</Text>
                          <Text fontSize="sm">{r.description}</Text>
                        </VStack>
                      </HStack>
                    );
                  })}
                </Box>
              )}

              {form.activityCodes.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="600" mb={2} color={isDark ? 'gray.400' : 'gray.500'}>
                    Actividades seleccionadas ({form.activityCodes.length}):
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {form.activityCodes.map(code => (
                      <Badge
                        key={code}
                        colorPalette="blue"
                        variant="solid"
                        fontSize="xs"
                        cursor="pointer"
                        onClick={() => toggleCpc(code)}
                      >
                        {code} ×
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}
            </VStack>
          )}

          {/* STEP 7 - Review */}
          {step === 7 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiCheckCircle} mr={2} />Revisión y Envío
              </Heading>
              <Box bg={isDark ? 'blue.900' : 'blue.50'} borderRadius="lg" p={4} borderWidth="1px" borderColor={isDark ? 'blue.700' : 'blue.200'}>
                <VStack align="stretch" gap={2} fontSize="sm">
                  {[
                    ['RUC / Cédula', form.identifier],
                    ['Razón Social', form.legalName],
                    ['Nombre Comercial', form.tradeName || '—'],
                    ['Provincia', form.province || '—'],
                    ['Cantón', form.canton || '—'],
                    ['Dirección', form.address || '—'],
                    ['Constitución', form.legalEstablishmentDate || '—'],
                    ['Patrimonio', form.patrimonyAmount ? `$${parseFloat(form.patrimonyAmount).toLocaleString('es-EC')}` : '—'],
                    ['SRI', form.isCompliantSRI === true ? '✅ Al día' : form.isCompliantSRI === false ? '❌ Pendiente' : '—'],
                    ['IESS', form.isCompliantIESS === true ? '✅ Al día' : form.isCompliantIESS === false ? '❌ Pendiente' : '—'],
                    ['Códigos CPC', form.activityCodes.length > 0 ? form.activityCodes.join(', ') : '—'],
                  ].map(([k, v]) => (
                    <HStack key={k} justify="space-between">
                      <Text color={isDark ? 'gray.400' : 'gray.600'}>{k}</Text>
                      <Text fontWeight="500" textAlign="right" maxW="60%">{v}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>
                Al enviar este formulario, declaro que la información proporcionada es verdadera y autorizo su verificación por parte de las entidades competentes.
              </Text>
            </VStack>
          )}
        </Box>

        {/* Navigation */}
        <Flex justify="space-between">
          <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/cp')}>
            <Icon as={FiArrowLeft} mr={2} />
            {step > 0 ? 'Anterior' : 'Cancelar'}
          </Button>
          {step < 7 ? (
            <Button colorPalette="blue" onClick={handleNext} loading={saving}>
              Siguiente
              <Icon as={FiArrowRight} ml={2} />
            </Button>
          ) : (
            <Button colorPalette="green" onClick={handleSubmit} loading={saving}>
              <Icon as={FiCheckCircle} mr={2} />
              Enviar Registro RUP
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default ProviderRUPWizardPage;
