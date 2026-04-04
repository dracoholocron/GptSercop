/**
 * OfferSubmitPage - Wizard de presentación de oferta (6 pasos)
 * Monto → Documentos S3 → Declaración → Firma stub → OTP → Folio
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiDollarSign,
  FiUpload,
  FiShield,
  FiKey,
  FiSend,
  FiAward,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post, patch } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface TenderSummary {
  id: string;
  title: string;
  bidsDeadlineAt: string | null;
  estimatedAmount: number | null;
  processType: string | null;
}

interface UploadedDoc { name: string; storageKey: string; mimeType: string }

const STEP_LABELS = [
  { label: 'Datos de Oferta', icon: FiDollarSign },
  { label: 'Documentos', icon: FiUpload },
  { label: 'Declaración', icon: FiShield },
  { label: 'Firma', icon: FiKey },
  { label: 'Código OTP', icon: FiSend },
  { label: 'Confirmación', icon: FiAward },
];

// ============================================================================
// Main Component
// ============================================================================

export const OfferSubmitPage: React.FC = () => {
  const { tenderId } = useParams<{ tenderId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [tender, setTender] = useState<TenderSummary | null>(null);
  const [loadingTender, setLoadingTender] = useState(true);

  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);

  // Step 0 – Offer data
  const [amount, setAmount] = useState('');
  const [baePercentage, setBaePercentage] = useState('');
  const [nationalParticipation, setNationalParticipation] = useState(false);

  // Step 1 – Documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Step 3 – Sign
  const [signSessionId, setSignSessionId] = useState<string | null>(null);

  // Step 4 – OTP
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('email');
  const [debugCode, setDebugCode] = useState<string | null>(null);

  // Step 5 – Folio
  const [receiptFolio, setReceiptFolio] = useState<string | null>(null);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const storedUser = localStorage.getItem('globalcmx_user');
  const providerId: string = (() => {
    try { return JSON.parse(storedUser || '{}').providerId || ''; } catch { return ''; }
  })();

  // Load tender
  useEffect(() => {
    if (!tenderId) return;
    get(`/v1/tenders/${tenderId}`).then(async r => {
      if (r.ok) setTender(await r.json());
    }).catch(() => {}).finally(() => setLoadingTender(false));
  }, [tenderId]);

  // Create draft on first load
  useEffect(() => {
    if (!tenderId || draftId) return;
    post('/v1/offers/drafts', {
      processId: tenderId,
      tenderId,
      providerId: providerId || 'DRAFT_PROVIDER',
      modality: 'LICITACION',
    }).then(async r => {
      if (r.ok) { const d = await r.json(); setDraftId(d.id); }
    }).catch(() => {});
  }, [tenderId, draftId, providerId]);

  const saveDraftStep = async (stepData: Record<string, unknown>) => {
    if (!draftId) return;
    await patch(`/v1/offers/drafts/${draftId}`, { stepData }).catch(() => {});
  };

  // FILE UPLOAD
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const presignRes = await post('/v1/documents/presign', {
          draftId,
          mimeType: file.type,
          fileName: file.name,
        });
        if (!presignRes.ok) { toaster.create({ title: `Error al pre-firmar ${file.name}`, type: 'error' }); continue; }
        const { uploadUrl, storageKey } = await presignRes.json();
        const putRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        if (!putRes.ok) { toaster.create({ title: `Error al subir ${file.name}`, type: 'error' }); continue; }
        await post('/v1/documents/commit', { draftId, storageKey, fileName: file.name, mimeType: file.type });
        setUploadedDocs(prev => [...prev, { name: file.name, storageKey, mimeType: file.type }]);
      }
      toaster.create({ title: `${files.length} archivo(s) subido(s)`, type: 'success' });
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!amount) { toaster.create({ title: 'El monto de la oferta es obligatorio', type: 'error' }); return; }
      await saveDraftStep({ amount, baePercentage, nationalParticipation });
    }
    if (step === 3) {
      // Sign stub
      setSaving(true);
      try {
        const validateRes = await post(`/v1/offers/${draftId}/validate`, {});
        if (!validateRes.ok) throw new Error('Validate failed');
        const signRes = await post(`/v1/offers/${draftId}/sign/start`, {});
        if (signRes.ok) {
          const d = await signRes.json();
          setSignSessionId(d.signSessionId);
          // Auto-complete sign stub
          await post(`/v1/offers/${draftId}/sign/complete`, { signSessionId: d.signSessionId });
        }
      } catch {
        toaster.create({ title: 'Error en proceso de firma', type: 'error' });
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    if (step === 4) {
      if (!otpCode.trim()) { toaster.create({ title: 'Ingrese el código OTP', type: 'error' }); return; }
      setSaving(true);
      try {
        if (!otpSessionId) throw new Error('No OTP session');
        const verifyRes = await post(`/v1/offers/${draftId}/otp/verify`, { otpSessionId, code: otpCode });
        if (!verifyRes.ok) throw new Error('OTP inválido');
        // Submit
        const submitRes = await post(`/v1/offers/${draftId}/submit`, {});
        if (!submitRes.ok) throw new Error('Submit failed');
        const submitData = await submitRes.json();
        setOfferId(draftId);
        setReceiptFolio(submitData?.receipt?.folio || `FOLIO-${Date.now()}`);
      } catch (err: any) {
        toaster.create({ title: err?.message || 'Error al verificar OTP', type: 'error' });
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setStep(s => Math.min(s + 1, 5));
  };

  // Send OTP when entering step 4
  useEffect(() => {
    if (step !== 4 || !draftId || otpSessionId) return;
    post(`/v1/offers/${draftId}/otp/send`, { channel: otpChannel, destination: 'user@correo.com' })
      .then(async r => {
        if (r.ok) {
          const d = await r.json();
          setOtpSessionId(d.otpSessionId);
          setDebugCode(d.debugCode || null);
          if (d.debugCode) toaster.create({ title: `Dev: código OTP = ${d.debugCode}`, type: 'info' });
        }
      }).catch(() => {});
  }, [step, draftId, otpSessionId, otpChannel]);

  if (loadingTender) return <Flex h="60vh" align="center" justify="center"><Spinner size="xl" /></Flex>;

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <Box maxW="680px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack gap={3}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/cp/processes/${tenderId}`)}>
            <Icon as={FiArrowLeft} mr={2} />
            {t('common.back', 'Volver al proceso')}
          </Button>
          <Separator orientation="vertical" h={5} />
          <VStack align="start" gap={0}>
            <Heading size="md">{t('cp.offer.title', 'Presentación de Oferta')}</Heading>
            {tender && (
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'} noOfLines={1}>{tender.title}</Text>
            )}
          </VStack>
        </HStack>

        {tender && (
          <HStack gap={4} flexWrap="wrap">
            <Badge colorPalette="blue" variant="subtle" fontSize="xs">{tender.processType || 'Proceso'}</Badge>
            <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
              Cierre: {formatDate(tender.bidsDeadlineAt)}
            </Text>
          </HStack>
        )}

        {/* Step indicator */}
        <Steps.Root step={step} count={6} colorPalette="blue" size="sm">
          <Steps.List>
            {STEP_LABELS.map((s, i) => (
              <Steps.Item key={i} index={i}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Status complete={<FiCheck />} incomplete={<Icon as={s.icon} boxSize={3} />} current={<Icon as={s.icon} boxSize={3} />} />
                  </Steps.Indicator>
                </Steps.Trigger>
                {i < 5 && <Steps.Separator />}
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>

        {/* Content */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={6}>

          {/* STEP 0 – Offer data */}
          {step === 0 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiDollarSign} mr={2} />Datos de la Oferta
              </Heading>
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" fontWeight="600">Monto de la oferta (USD) <Text as="span" color="red.400">*</Text></Text>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </VStack>
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" fontWeight="600">Componente Ecuatoriano BAE (%)</Text>
                <Input type="number" min={0} max={100} value={baePercentage} onChange={e => setBaePercentage(e.target.value)} placeholder="0" />
                <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>Porcentaje de bienes o servicios de origen ecuatoriano</Text>
              </VStack>
              <HStack justify="space-between" bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="md" p={3}>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="600">Participación Nacional</Text>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>¿La oferta incluye participación de trabajadores nacionales?</Text>
                </VStack>
                <input type="checkbox" checked={nationalParticipation} onChange={e => setNationalParticipation(e.target.checked)} style={{ width: 18, height: 18 }} />
              </HStack>
            </VStack>
          )}

          {/* STEP 1 – Documents */}
          {step === 1 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiUpload} mr={2} />Documentos de la Oferta
              </Heading>
              <Box
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={isDark ? 'gray.600' : 'gray.300'}
                borderRadius="xl"
                p={6}
                textAlign="center"
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
                _hover={{ borderColor: 'blue.400' }}
              >
                {uploading ? <Spinner size="md" mb={2} /> : <Icon as={FiUpload} boxSize={8} color="gray.400" mb={2} />}
                <Text fontSize="sm" fontWeight="600">{uploading ? 'Subiendo...' : 'Haga clic o arrastre archivos aquí'}</Text>
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>PDF, XLSX, DOCX, ZIP (máx. 50MB por archivo)</Text>
                <input ref={fileInputRef} type="file" hidden multiple accept=".pdf,.xlsx,.docx,.zip,.doc" onChange={handleFileSelect} />
              </Box>
              {uploadedDocs.length > 0 && (
                <VStack align="stretch" gap={2}>
                  {uploadedDocs.map((doc, i) => (
                    <HStack key={i} bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="md" p={3} justify="space-between">
                      <HStack gap={2}>
                        <Icon as={FiFileText} color="blue.400" boxSize={4} />
                        <Text fontSize="sm">{doc.name}</Text>
                      </HStack>
                      <Button size="xs" variant="ghost" colorPalette="red" onClick={() => setUploadedDocs(prev => prev.filter((_, j) => j !== i))}>
                        <Icon as={FiTrash2} />
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              )}
              {uploadedDocs.length === 0 && (
                <Text fontSize="xs" color={isDark ? 'orange.300' : 'orange.600'} textAlign="center">
                  Puede continuar sin documentos, pero se recomienda adjuntar la oferta técnica y económica.
                </Text>
              )}
            </VStack>
          )}

          {/* STEP 2 – Declaration */}
          {step === 2 && (
            <VStack gap={4} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiShield} mr={2} />Declaración de No Inhabilidad
              </Heading>
              <Box bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="lg" p={4} fontSize="sm" lineHeight="1.7">
                <Text fontWeight="600" mb={2}>El suscrito declara que:</Text>
                <VStack align="start" gap={1}>
                  {[
                    'No ha sido condenado por delitos contra la Administración Pública.',
                    'No está incurso en inhabilitaciones para contratar con el Estado.',
                    'No mantiene deudas tributarias o de seguridad social en estado de mora.',
                    'No tiene contratos en ejecución vencidos con el Estado.',
                    'La información y documentos presentados son verídicos y auténticos.',
                  ].map((item, i) => (
                    <HStack key={i} gap={2} align="flex-start">
                      <Icon as={FiCheckCircle} color="green.400" boxSize={4} mt="2px" flexShrink={0} />
                      <Text>{item}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              <Box bg={isDark ? 'blue.900' : 'blue.50'} borderRadius="md" p={3}>
                <Text fontSize="sm" color={isDark ? 'blue.300' : 'blue.700'} fontWeight="500">
                  Al hacer clic en "Siguiente", acepto y suscribo la declaración de no inhabilidad para el presente proceso de contratación.
                </Text>
              </Box>
            </VStack>
          )}

          {/* STEP 3 – Firma */}
          {step === 3 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiKey} mr={2} />Firma Electrónica
              </Heading>
              <Box bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="lg" p={4}>
                <VStack gap={3} align="start">
                  <HStack gap={2}>
                    <Icon as={FiShield} color="blue.400" boxSize={5} />
                    <Text fontWeight="600" fontSize="sm">Proceso de Firma PKCS#12</Text>
                  </HStack>
                  <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                    En el entorno de producción, aquí se integraría el módulo de firma electrónica con su token o archivo .p12.
                  </Text>
                  <Text fontSize="sm" color={isDark ? 'orange.300' : 'orange.600'} bg={isDark ? 'orange.900' : 'orange.50'} p={2} borderRadius="md" w="full">
                    Modo de prueba: La firma se procesará automáticamente al continuar.
                  </Text>
                </VStack>
              </Box>
              {signSessionId && (
                <HStack gap={2}>
                  <Icon as={FiCheckCircle} color="green.400" boxSize={5} />
                  <Text fontSize="sm" color={isDark ? 'green.300' : 'green.600'} fontWeight="500">
                    Firma procesada correctamente (sesión: {signSessionId.slice(0, 8)}...)
                  </Text>
                </HStack>
              )}
            </VStack>
          )}

          {/* STEP 4 – OTP */}
          {step === 4 && (
            <VStack gap={5} align="stretch">
              <Heading size="sm" color={isDark ? 'blue.300' : 'blue.500'}>
                <Icon as={FiSend} mr={2} />Verificación OTP
              </Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                Se ha enviado un código de verificación de 6 dígitos a su {otpChannel === 'email' ? 'correo electrónico' : 'teléfono registrado'}.
              </Text>
              {debugCode && (
                <HStack bg={isDark ? 'yellow.900' : 'yellow.50'} borderRadius="md" p={3} gap={2}>
                  <Icon as={FiKey} color="yellow.400" boxSize={4} />
                  <Text fontSize="sm" color={isDark ? 'yellow.300' : 'yellow.700'} fontWeight="600">
                    Código de prueba: <Text as="span" fontFamily="mono">{debugCode}</Text>
                  </Text>
                </HStack>
              )}
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" fontWeight="600">Código OTP <Text as="span" color="red.400">*</Text></Text>
                <Input
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Ej: 123456"
                  maxLength={6}
                  fontFamily="mono"
                  fontSize="lg"
                  letterSpacing="wider"
                  textAlign="center"
                />
              </VStack>
            </VStack>
          )}

          {/* STEP 5 – Confirmation */}
          {step === 5 && (
            <VStack gap={5} align="center" py={4}>
              <Box
                w={16} h={16} borderRadius="full"
                bg={isDark ? 'green.800' : 'green.100'}
                display="flex" alignItems="center" justifyContent="center"
              >
                <Icon as={FiCheckCircle} boxSize={8} color={isDark ? 'green.300' : 'green.500'} />
              </Box>
              <VStack gap={1} textAlign="center">
                <Heading size="md" color={isDark ? 'green.300' : 'green.600'}>
                  {t('cp.offer.submitted', '¡Oferta presentada exitosamente!')}
                </Heading>
                <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                  Su oferta ha sido registrada en el sistema de Compras Públicas.
                </Text>
              </VStack>
              <Box bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="xl" p={4} w="full" textAlign="center">
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} mb={1}>Número de folio de recepción</Text>
                <Text fontSize="xl" fontWeight="bold" fontFamily="mono" color={isDark ? 'blue.300' : 'blue.600'}>
                  {receiptFolio}
                </Text>
                <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'} mt={1}>
                  Guarde este número como comprobante de presentación.
                </Text>
              </Box>
              <HStack gap={3}>
                <Button colorPalette="blue" onClick={() => navigate(`/cp/processes/${tenderId}`)}>
                  Ver proceso
                </Button>
                <Button variant="outline" onClick={() => navigate('/cp/processes')}>
                  Ir a procesos
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>

        {/* Navigation */}
        {step < 5 && (
          <Flex justify="space-between">
            <Button
              variant="outline"
              onClick={() => step > 0 ? setStep(s => s - 1) : navigate(`/cp/processes/${tenderId}`)}
            >
              <Icon as={FiArrowLeft} mr={2} />
              {step > 0 ? 'Anterior' : 'Cancelar'}
            </Button>
            <Button colorPalette="blue" onClick={handleNext} loading={saving}>
              {step === 4 ? (
                <><Icon as={FiCheckCircle} mr={2} />Verificar y Enviar</>
              ) : step === 3 ? (
                <><Icon as={FiKey} mr={2} />Firmar y Continuar</>
              ) : (
                <>Siguiente<Icon as={FiArrowRight} ml={2} /></>
              )}
            </Button>
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default OfferSubmitPage;
