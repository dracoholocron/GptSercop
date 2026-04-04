/**
 * CPEvaluationPage - Matriz de evaluación de ofertas para un proceso de contratación
 * Columnas: Técnico | Financiero | BAE | Participación Nacional | Experiencia
 * Flujo: Verificación BAE/RUP → Puntajes → Convalidación → Adjudicación
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  Textarea,
  Table,
  Card,
  Separator,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiSave,
  FiBarChart2,
  FiFileText,
  FiAward,
  FiRefreshCw,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post, patch } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface Bid {
  id: string;
  amount: number | null;
  baePercentage: number | null;
  nationalParticipation: boolean | null;
  baeVerifiedAt: string | null;
  rupVerifiedAtOpening: string | null;
  rupVerifiedAtAward: string | null;
  convalidationStatus: string | null;
  status: string;
  provider: { id: string; name: string; identifier: string | null };
}

interface Evaluation {
  id: string;
  bidId: string;
  technicalScore: number | null;
  financialScore: number | null;
  baeScore: number | null;
  nationalPartScore: number | null;
  experienceGeneralScore: number | null;
  experienceSpecificScore: number | null;
  subcontractingScore: number | null;
  otherParamsScore: number | null;
  totalScore: number | null;
  status: string;
}

interface ScoreForm {
  technicalScore: string;
  financialScore: string;
  baeScore: string;
  nationalPartScore: string;
  experienceGeneralScore: string;
  experienceSpecificScore: string;
  subcontractingScore: string;
  otherParamsScore: string;
}

const EMPTY_SCORE: ScoreForm = {
  technicalScore: '', financialScore: '', baeScore: '',
  nationalPartScore: '', experienceGeneralScore: '',
  experienceSpecificScore: '', subcontractingScore: '', otherParamsScore: '',
};

// ============================================================================
// Helpers
// ============================================================================

const calcTotal = (s: ScoreForm): number => {
  const vals = Object.values(s).map(v => parseFloat(v) || 0);
  return vals.reduce((a, b) => a + b, 0);
};

const formatCurrency = (v: number | null | undefined) =>
  v == null ? '—' : `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

// ============================================================================
// Main Component
// ============================================================================

export const CPEvaluationPage: React.FC = () => {
  const { id: tenderId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [bids, setBids] = useState<Bid[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreForms, setScoreForms] = useState<Record<string, ScoreForm>>({});
  const [savingBid, setSavingBid] = useState<string | null>(null);
  const [actionBid, setActionBid] = useState<string | null>(null);

  // Convalidation dialog
  const [convalDialog, setConvalDialog] = useState<{ bidId: string; mode: 'request' | 'respond' } | null>(null);
  const [convalText, setConvalText] = useState('');

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const load = useCallback(async () => {
    if (!tenderId) return;
    setLoading(true);
    try {
      const [bidsRes, evalsRes] = await Promise.all([
        get(`/v1/tenders/${tenderId}/bids`),
        get(`/v1/tenders/${tenderId}/evaluations`),
      ]);
      const bidsData = bidsRes.ok ? (await bidsRes.json()).data ?? [] : [];
      const evalsData = evalsRes.ok ? (await evalsRes.json()).data ?? [] : [];
      setBids(bidsData);
      setEvaluations(evalsData);

      // Init score forms
      const forms: Record<string, ScoreForm> = {};
      for (const bid of bidsData) {
        const existing = evalsData.find((e: Evaluation) => e.bidId === bid.id);
        if (existing) {
          forms[bid.id] = {
            technicalScore: String(existing.technicalScore ?? ''),
            financialScore: String(existing.financialScore ?? ''),
            baeScore: String(existing.baeScore ?? ''),
            nationalPartScore: String(existing.nationalPartScore ?? ''),
            experienceGeneralScore: String(existing.experienceGeneralScore ?? ''),
            experienceSpecificScore: String(existing.experienceSpecificScore ?? ''),
            subcontractingScore: String(existing.subcontractingScore ?? ''),
            otherParamsScore: String(existing.otherParamsScore ?? ''),
          };
        } else {
          forms[bid.id] = { ...EMPTY_SCORE };
        }
      }
      setScoreForms(forms);
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tenderId, t]);

  useEffect(() => { load(); }, [load]);

  const saveScore = async (bidId: string) => {
    if (!tenderId) return;
    setSavingBid(bidId);
    try {
      const sf = scoreForms[bidId] || EMPTY_SCORE;
      const payload = {
        bidId,
        technicalScore: parseFloat(sf.technicalScore) || undefined,
        financialScore: parseFloat(sf.financialScore) || undefined,
        baeScore: parseFloat(sf.baeScore) || undefined,
        nationalPartScore: parseFloat(sf.nationalPartScore) || undefined,
        experienceGeneralScore: parseFloat(sf.experienceGeneralScore) || undefined,
        experienceSpecificScore: parseFloat(sf.experienceSpecificScore) || undefined,
        subcontractingScore: parseFloat(sf.subcontractingScore) || undefined,
        otherParamsScore: parseFloat(sf.otherParamsScore) || undefined,
        totalScore: calcTotal(sf),
        status: 'completed',
      };
      const res = await post(`/v1/tenders/${tenderId}/evaluations`, payload);
      if (res.ok) {
        toaster.create({ title: t('cp.evaluation.saved', 'Evaluación guardada'), type: 'success' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || t('common.error', 'Error'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setSavingBid(null);
    }
  };

  const verifyBAE = async (bidId: string) => {
    setActionBid(`bae-${bidId}`);
    try {
      const res = await post(`/v1/bids/${bidId}/verify-bae`, {});
      if (res.ok) { toaster.create({ title: 'BAE verificado', type: 'success' }); load(); }
    } catch { /* silent */ } finally { setActionBid(null); }
  };

  const verifyRUP = async (bidId: string, stage: 'opening' | 'award' | 'contract') => {
    setActionBid(`rup-${bidId}`);
    try {
      const res = await post(`/v1/bids/${bidId}/verify-rup`, { stage });
      if (res.ok) { toaster.create({ title: `RUP (${stage}) verificado`, type: 'success' }); load(); }
    } catch { /* silent */ } finally { setActionBid(null); }
  };

  const submitConvalidation = async () => {
    if (!convalDialog || !convalText.trim()) return;
    const { bidId, mode } = convalDialog;
    setActionBid(`conv-${bidId}`);
    try {
      let res;
      if (mode === 'request') {
        res = await post(`/v1/bids/${bidId}/request-convalidation`, { errorsDescription: convalText });
      } else {
        res = await patch(`/v1/bids/${bidId}/convalidation`, { status: 'accepted', response: convalText });
      }
      if (res?.ok) {
        toaster.create({ title: mode === 'request' ? 'Convalidación solicitada' : 'Convalidación respondida', type: 'success' });
        setConvalDialog(null);
        setConvalText('');
        load();
      }
    } catch { /* silent */ } finally { setActionBid(null); }
  };

  // Build sorted ranking
  const evalMap = Object.fromEntries(evaluations.map(e => [e.bidId, e]));
  const ranked = [...bids].sort((a, b) => {
    const ta = evalMap[a.id]?.totalScore ?? -1;
    const tb = evalMap[b.id]?.totalScore ?? -1;
    return tb - ta;
  });

  if (loading) return (
    <Flex h="60vh" align="center" justify="center"><Spinner size="xl" /></Flex>
  );

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/cp/processes/${tenderId}`)}>
              <Icon as={FiArrowLeft} mr={2} />
              {t('common.back', 'Volver al proceso')}
            </Button>
            <Separator orientation="vertical" h={5} />
            <HStack>
              <Icon as={FiBarChart2} boxSize={5} color={isDark ? 'purple.300' : 'purple.500'} />
              <Heading size="md">{t('cp.evaluation.title', 'Evaluación de Ofertas')}</Heading>
            </HStack>
          </HStack>
          <Button size="sm" variant="outline" onClick={load}>
            <Icon as={FiRefreshCw} mr={2} />
            {t('common.refresh', 'Actualizar')}
          </Button>
        </HStack>

        {/* Summary cards */}
        {bids.length > 0 && (
          <HStack gap={4} flexWrap="wrap">
            <Card.Root flex={1} minW="140px">
              <Card.Body p={4}>
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Total ofertas</Text>
                <Text fontSize="2xl" fontWeight="bold">{bids.length}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root flex={1} minW="140px">
              <Card.Body p={4}>
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Evaluadas</Text>
                <Text fontSize="2xl" fontWeight="bold">{evaluations.filter(e => e.status === 'completed').length}</Text>
              </Card.Body>
            </Card.Root>
            <Card.Root flex={1} minW="140px">
              <Card.Body p={4}>
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Puntaje máx</Text>
                <Text fontSize="2xl" fontWeight="bold" color={isDark ? 'green.300' : 'green.500'}>
                  {evaluations.length > 0 ? Math.max(...evaluations.map(e => e.totalScore ?? 0)).toFixed(1) : '—'}
                </Text>
              </Card.Body>
            </Card.Root>
          </HStack>
        )}

        {bids.length === 0 ? (
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} textAlign="center" py={16}>
            <Icon as={FiFileText} boxSize={10} color="gray.400" mb={3} />
            <Text color={isDark ? 'gray.400' : 'gray.500'}>
              {t('cp.evaluation.noBids', 'No hay ofertas presentadas para este proceso')}
            </Text>
          </Box>
        ) : (
          <VStack gap={4} align="stretch">
            {ranked.map((bid, rankIdx) => {
              const eval_ = evalMap[bid.id];
              const sf = scoreForms[bid.id] || EMPTY_SCORE;
              const total = calcTotal(sf);
              const isWinner = rankIdx === 0 && eval_?.status === 'completed';

              return (
                <Box
                  key={bid.id}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor={isWinner ? (isDark ? 'green.600' : 'green.300') : borderColor}
                  p={5}
                >
                  {/* Bid header */}
                  <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={3} mb={4}>
                    <HStack gap={3}>
                      {isWinner && (
                        <Badge colorPalette="green" variant="solid" fontSize="xs">
                          <Icon as={FiAward} mr={1} />#{rankIdx + 1} MEJOR PUNTAJE
                        </Badge>
                      )}
                      {!isWinner && eval_ && (
                        <Badge colorPalette="gray" variant="subtle" fontSize="xs">#{rankIdx + 1}</Badge>
                      )}
                      <VStack align="start" gap={0}>
                        <Text fontWeight="700">{bid.provider?.name || '—'}</Text>
                        <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                          RUC: {bid.provider?.identifier || '—'} | Monto: {formatCurrency(bid.amount)}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack gap={2} flexWrap="wrap">
                      {/* BAE verification */}
                      <Button
                        size="xs"
                        colorPalette={bid.baeVerifiedAt ? 'green' : 'orange'}
                        variant={bid.baeVerifiedAt ? 'solid' : 'outline'}
                        onClick={() => !bid.baeVerifiedAt && verifyBAE(bid.id)}
                        disabled={!!bid.baeVerifiedAt || actionBid === `bae-${bid.id}`}
                        loading={actionBid === `bae-${bid.id}`}
                      >
                        <Icon as={bid.baeVerifiedAt ? FiCheckCircle : FiAlertTriangle} mr={1} />
                        BAE
                      </Button>

                      {/* RUP opening */}
                      <Button
                        size="xs"
                        colorPalette={bid.rupVerifiedAtOpening ? 'green' : 'blue'}
                        variant={bid.rupVerifiedAtOpening ? 'solid' : 'outline'}
                        onClick={() => !bid.rupVerifiedAtOpening && verifyRUP(bid.id, 'opening')}
                        disabled={!!bid.rupVerifiedAtOpening || actionBid === `rup-${bid.id}`}
                        loading={actionBid === `rup-${bid.id}`}
                      >
                        RUP Apertura
                      </Button>

                      {/* Convalidation */}
                      {bid.convalidationStatus !== 'accepted' && (
                        <Button
                          size="xs"
                          colorPalette="purple"
                          variant="outline"
                          onClick={() => { setConvalDialog({ bidId: bid.id, mode: 'request' }); setConvalText(''); }}
                        >
                          Convalidar
                        </Button>
                      )}
                      {bid.convalidationStatus === 'pending' && (
                        <Button
                          size="xs"
                          colorPalette="teal"
                          variant="outline"
                          onClick={() => { setConvalDialog({ bidId: bid.id, mode: 'respond' }); setConvalText(''); }}
                        >
                          Responder Conval.
                        </Button>
                      )}
                    </HStack>
                  </Flex>

                  <Separator mb={4} />

                  {/* Score grid */}
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Criterio</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="center">Puntaje</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {[
                          { key: 'technicalScore', label: 'Técnico' },
                          { key: 'financialScore', label: 'Financiero' },
                          { key: 'baeScore', label: 'BAE (Componente Ecuatoriano)' },
                          { key: 'nationalPartScore', label: 'Participación Nacional' },
                          { key: 'experienceGeneralScore', label: 'Experiencia General' },
                          { key: 'experienceSpecificScore', label: 'Experiencia Específica' },
                          { key: 'subcontractingScore', label: 'Subcontratación' },
                          { key: 'otherParamsScore', label: 'Otros Parámetros' },
                        ].map(({ key, label }) => (
                          <Table.Row key={key}>
                            <Table.Cell fontSize="sm">{label}</Table.Cell>
                            <Table.Cell textAlign="center">
                              <Input
                                size="xs"
                                type="number"
                                min={0}
                                max={100}
                                value={sf[key as keyof ScoreForm]}
                                onChange={e => setScoreForms(prev => ({
                                  ...prev,
                                  [bid.id]: { ...prev[bid.id], [key]: e.target.value },
                                }))}
                                w="80px"
                                textAlign="center"
                              />
                            </Table.Cell>
                          </Table.Row>
                        ))}
                        <Table.Row bg={isDark ? 'gray.750' : 'gray.50'}>
                          <Table.Cell fontWeight="700" fontSize="sm">TOTAL</Table.Cell>
                          <Table.Cell textAlign="center">
                            <Badge
                              colorPalette={total >= 70 ? 'green' : total >= 50 ? 'orange' : 'red'}
                              variant="solid"
                              fontSize="sm"
                              px={3}
                            >
                              {total.toFixed(1)}
                            </Badge>
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                  </Box>

                  <Flex justify="flex-end" mt={3}>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={() => saveScore(bid.id)}
                      disabled={savingBid === bid.id}
                      loading={savingBid === bid.id}
                    >
                      <Icon as={FiSave} mr={2} />
                      {t('cp.evaluation.saveScore', 'Guardar Puntajes')}
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        )}
      </VStack>

      {/* Convalidation dialog */}
      <DialogRoot open={!!convalDialog} onOpenChange={d => { if (!d.open) setConvalDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <Text fontWeight="700">
              {convalDialog?.mode === 'request' ? 'Solicitar Convalidación' : 'Responder Convalidación'}
            </Text>
          </DialogHeader>
          <DialogBody>
            <VStack gap={3} align="stretch">
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                {convalDialog?.mode === 'request'
                  ? 'Describa los errores u omisiones que requieren convalidación del proveedor:'
                  : 'Escriba la respuesta a la solicitud de convalidación:'}
              </Text>
              <Textarea
                value={convalText}
                onChange={e => setConvalText(e.target.value)}
                rows={4}
                placeholder={convalDialog?.mode === 'request' ? 'Ej: Falta documento de RUC actualizado...' : 'Ej: Se adjunta el documento solicitado...'}
              />
            </VStack>
          </DialogBody>
          <DialogFooter>
            <HStack gap={2}>
              <DialogCloseTrigger asChild>
                <Button variant="outline" size="sm">Cancelar</Button>
              </DialogCloseTrigger>
              <Button
                colorPalette="purple"
                size="sm"
                onClick={submitConvalidation}
                disabled={!convalText.trim() || !!actionBid}
                loading={!!actionBid}
              >
                {convalDialog?.mode === 'request' ? 'Enviar solicitud' : 'Enviar respuesta'}
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default CPEvaluationPage;
