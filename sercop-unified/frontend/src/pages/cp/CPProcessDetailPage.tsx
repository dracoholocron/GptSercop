/**
 * CPProcessDetailPage - Vista completa de un proceso de contratación
 * Tabs: Información General | Ofertas | Aclaraciones | Documentos | Historial
 * Acciones de ciclo de vida por estado del proceso
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
  SimpleGrid,
  Card,
  Table,
  Separator,
  Tabs,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiUnlock,
  FiRefreshCw,
  FiEdit,
  FiBarChart2,
  FiMessageCircle,
  FiClipboard,
  FiClock,
  FiSend,
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post } from '../../utils/apiClient';
import CPDraftGeneratorPanel from '../../components/compras-publicas/ai/CPDraftGeneratorPanel';
import CPClarificationsPanel from '../../components/compras-publicas/CPClarificationsPanel';

// ============================================================================
// Types
// ============================================================================

interface TenderDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  processType: string | null;
  procurementMethod: string | null;
  regime: string | null;
  estimatedAmount: number | null;
  referenceBudgetAmount: number | null;
  publishedAt: string | null;
  questionsDeadlineAt: string | null;
  bidsDeadlineAt: string | null;
  clarificationResponseDeadlineAt: string | null;
  scoringDeadlineAt: string | null;
  awardResolutionDeadlineAt: string | null;
  bidsOpenedAt: string | null;
  liberationRequestedAt: string | null;
  liberationApprovedAt: string | null;
  isRestrictedVisibility: boolean;
  electronicSignatureRequired: boolean;
  procurementPlan?: { entity?: { id: string; name: string; code: string | null } | null } | null;
  bids?: Array<{ id: string; amount: number | null; provider: { name: string } }>;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  pending_liberation: 'orange',
  liberation_requested: 'yellow',
  published: 'green',
  bids_open: 'blue',
  evaluation: 'purple',
  awarded: 'teal',
  contracted: 'cyan',
  cancelled: 'red',
  deserted: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_liberation: 'Pendiente Liberación',
  liberation_requested: 'Liberación Solicitada',
  published: 'Publicado',
  bids_open: 'Ofertas Abiertas',
  evaluation: 'Evaluación',
  awarded: 'Adjudicado',
  contracted: 'Contratado',
  cancelled: 'Cancelado',
  deserted: 'Desierto',
};

const formatCurrency = (v: number | null | undefined) =>
  v == null ? '—' : `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ============================================================================
// Sub-components
// ============================================================================

interface InfoRowProps { label: string; value: React.ReactNode }
const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  const { isDark } = useTheme();
  return (
    <HStack justify="space-between" py={2} borderBottomWidth="1px" borderColor={isDark ? 'gray.700' : 'gray.100'}>
      <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'} minW="160px">{label}</Text>
      <Text fontSize="sm" fontWeight="500" textAlign="right">{value}</Text>
    </HStack>
  );
};

interface DateRowProps { label: string; date: string | null | undefined; highlight?: boolean }
const DateRow: React.FC<DateRowProps> = ({ label, date, highlight }) => {
  const { isDark } = useTheme();
  const isPast = date ? new Date(date) < new Date() : false;
  return (
    <HStack justify="space-between" py={2} borderBottomWidth="1px" borderColor={isDark ? 'gray.700' : 'gray.100'}>
      <HStack gap={2}>
        <Icon as={FiCalendar} boxSize={3} color={isDark ? 'gray.500' : 'gray.400'} />
        <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>{label}</Text>
      </HStack>
      <Badge
        colorPalette={date ? (isPast && highlight ? 'red' : 'blue') : 'gray'}
        variant="subtle"
        fontSize="xs"
      >
        {formatDate(date)}
      </Badge>
    </HStack>
  );
};

// ============================================================================
// Main Page
// ============================================================================

export const CPProcessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  // Resolve user role from localStorage
  const storedUser = localStorage.getItem('globalcmx_user');
  const userRole: string = (() => {
    try { return JSON.parse(storedUser || '{}').role || ''; } catch { return ''; }
  })();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await get(`/v1/tenders/${id}`);
      if (res.ok) {
        setTender(await res.json());
      } else {
        toaster.create({ title: t('common.notFound', 'No encontrado'), type: 'error' });
        navigate('/cp/processes');
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => { load(); }, [load]);

  const performAction = useCallback(async (action: string, path: string) => {
    setActionLoading(action);
    try {
      const res = await post(path, {});
      if (res.ok) {
        toaster.create({ title: t('common.success', 'Acción completada'), type: 'success' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || t('common.error', 'Error'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }, [load, t]);

  if (loading) {
    return (
      <Flex h="60vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!tender) return null;

  const status = tender.status;
  const canRequestLiberation = status === 'draft' && (userRole === 'entity' || userRole === 'admin' || userRole === 'cp.analista');
  const canApproveLiberation = status === 'liberation_requested' && (userRole === 'admin' || userRole === 'cp.admin');
  const canOpenBids = status === 'published' && (userRole === 'entity' || userRole === 'admin');
  const canEvaluate = (status === 'bids_open' || status === 'evaluation') && (userRole === 'entity' || userRole === 'admin');
  const canViewContract = status === 'awarded' || status === 'contracted';

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Button size="sm" variant="ghost" onClick={() => navigate('/cp/processes')}>
              <Icon as={FiArrowLeft} mr={2} />
              {t('common.back', 'Volver')}
            </Button>
            <Separator orientation="vertical" h={5} />
            <VStack align="start" gap={0}>
              <HStack gap={2}>
                <Icon as={FiFileText} boxSize={5} color={isDark ? 'blue.300' : 'blue.500'} />
                <Heading size="md" noOfLines={2}>{tender.title}</Heading>
              </HStack>
              <HStack gap={2} mt={1}>
                <Badge colorPalette={STATUS_COLORS[status] || 'gray'} variant="solid" fontSize="xs">
                  {STATUS_LABELS[status] || status}
                </Badge>
                {tender.processType && (
                  <Badge colorPalette="purple" variant="subtle" fontSize="xs">{tender.processType}</Badge>
                )}
                {tender.regime && (
                  <Badge colorPalette="teal" variant="subtle" fontSize="xs">{tender.regime}</Badge>
                )}
              </HStack>
            </VStack>
          </HStack>

          {/* Action buttons */}
          <HStack gap={2} flexWrap="wrap">
            {canRequestLiberation && (
              <Button
                size="sm"
                colorPalette="orange"
                onClick={() => performAction('liberation', `/v1/tenders/${id}/request-liberation`)}
                loading={actionLoading === 'liberation'}
              >
                <Icon as={FiSend} mr={2} />
                {t('cp.process.requestLiberation', 'Solicitar Liberación')}
              </Button>
            )}
            {canApproveLiberation && (
              <Button
                size="sm"
                colorPalette="green"
                onClick={() => performAction('approve', `/v1/tenders/${id}/approve-liberation`)}
                loading={actionLoading === 'approve'}
              >
                <Icon as={FiCheckCircle} mr={2} />
                {t('cp.process.approveLiberation', 'Aprobar Liberación')}
              </Button>
            )}
            {canOpenBids && (
              <Button
                size="sm"
                colorPalette="blue"
                onClick={() => performAction('openBids', `/v1/tenders/${id}/bids/open`)}
                loading={actionLoading === 'openBids'}
              >
                <Icon as={FiUnlock} mr={2} />
                {t('cp.process.openBids', 'Abrir Ofertas')}
              </Button>
            )}
            {canEvaluate && (
              <Button
                size="sm"
                colorPalette="purple"
                onClick={() => navigate(`/cp/processes/${id}/evaluations`)}
              >
                <Icon as={FiBarChart2} mr={2} />
                {t('cp.process.evaluations', 'Evaluaciones')}
              </Button>
            )}
            {canViewContract && (
              <Button
                size="sm"
                colorPalette="teal"
                onClick={() => navigate(`/cp/contracts?tenderId=${id}`)}
              >
                <Icon as={FiClipboard} mr={2} />
                {t('cp.process.contract', 'Ver Contrato')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAI(v => !v)}
            >
              <Icon as={LuSparkles} mr={2} />
              {showAI ? t('cp.process.hideAI', 'Ocultar IA') : t('cp.process.showAI', 'Asistente IA')}
            </Button>
          </HStack>
        </Flex>

        {/* Summary cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Card.Root>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">
                    {t('cp.process.estimatedAmount', 'Monto Estimado')}
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">{formatCurrency(tender.estimatedAmount)}</Text>
                </VStack>
                <Icon as={FiDollarSign} boxSize={6} color={isDark ? 'green.300' : 'green.500'} />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">
                    {t('cp.process.entity', 'Entidad')}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" noOfLines={2}>
                    {tender.procurementPlan?.entity?.name || '—'}
                  </Text>
                </VStack>
                <Icon as={FiUsers} boxSize={6} color={isDark ? 'blue.300' : 'blue.500'} />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">
                    {t('cp.process.bidsDeadline', 'Cierre Ofertas')}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">{formatDate(tender.bidsDeadlineAt)}</Text>
                </VStack>
                <Icon as={FiCalendar} boxSize={6} color={isDark ? 'orange.300' : 'orange.500'} />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">
                    {t('cp.process.offersReceived', 'Ofertas Recibidas')}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">{tender.bids?.length ?? 0}</Text>
                </VStack>
                <Icon as={FiFileText} boxSize={6} color={isDark ? 'purple.300' : 'purple.500'} />
              </HStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Main content + optional AI panel */}
        <Flex gap={5} align="flex-start" flexWrap={{ base: 'wrap', xl: 'nowrap' }}>
          {/* Tabs */}
          <Box flex={1} minW={0}>
            <Tabs.Root defaultValue="info" variant="enclosed">
              <Tabs.List mb={4}>
                <Tabs.Trigger value="info">
                  <Icon as={FiFileText} mr={2} boxSize={4} />
                  {t('cp.process.tabs.info', 'Información')}
                </Tabs.Trigger>
                <Tabs.Trigger value="bids">
                  <Icon as={FiUsers} mr={2} boxSize={4} />
                  {t('cp.process.tabs.bids', 'Ofertas')}
                  {(tender.bids?.length ?? 0) > 0 && (
                    <Badge ml={2} colorPalette="blue" variant="subtle" fontSize="xs">
                      {tender.bids?.length}
                    </Badge>
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger value="clarifications">
                  <Icon as={FiMessageCircle} mr={2} boxSize={4} />
                  {t('cp.process.tabs.clarifications', 'Aclaraciones')}
                </Tabs.Trigger>
                <Tabs.Trigger value="schedule">
                  <Icon as={FiCalendar} mr={2} boxSize={4} />
                  {t('cp.process.tabs.schedule', 'Cronograma')}
                </Tabs.Trigger>
              </Tabs.List>

              {/* Info Tab */}
              <Tabs.Content value="info">
                <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
                  <VStack align="stretch" gap={0}>
                    <InfoRow label={t('cp.process.processType', 'Tipo de proceso')} value={tender.processType || '—'} />
                    <InfoRow label={t('cp.process.method', 'Modalidad')} value={tender.procurementMethod || '—'} />
                    <InfoRow label={t('cp.process.regime', 'Régimen')} value={tender.regime || '—'} />
                    <InfoRow label={t('cp.process.estimatedAmount', 'Monto estimado')} value={formatCurrency(tender.estimatedAmount)} />
                    <InfoRow label={t('cp.process.referenceBudget', 'Presupuesto referencial')} value={formatCurrency(tender.referenceBudgetAmount)} />
                    <InfoRow
                      label={t('cp.process.entity', 'Entidad contratante')}
                      value={tender.procurementPlan?.entity
                        ? `${tender.procurementPlan.entity.name}${tender.procurementPlan.entity.code ? ` (${tender.procurementPlan.entity.code})` : ''}`
                        : '—'
                      }
                    />
                    <InfoRow
                      label={t('cp.process.restrictedVisibility', 'Visibilidad restringida')}
                      value={
                        <Badge colorPalette={tender.isRestrictedVisibility ? 'orange' : 'green'} variant="subtle" fontSize="xs">
                          {tender.isRestrictedVisibility ? t('common.yes', 'Sí') : t('common.no', 'No')}
                        </Badge>
                      }
                    />
                    <InfoRow
                      label={t('cp.process.electronicSignature', 'Firma electrónica requerida')}
                      value={
                        <Badge colorPalette={tender.electronicSignatureRequired ? 'blue' : 'gray'} variant="subtle" fontSize="xs">
                          {tender.electronicSignatureRequired ? t('common.yes', 'Sí') : t('common.no', 'No')}
                        </Badge>
                      }
                    />
                  </VStack>
                  {tender.description && (
                    <Box mt={4}>
                      <Text fontSize="sm" fontWeight="600" mb={1}>{t('cp.process.description', 'Descripción')}</Text>
                      <Text fontSize="sm" color={isDark ? 'gray.300' : 'gray.600'} whiteSpace="pre-wrap">{tender.description}</Text>
                    </Box>
                  )}
                </Box>
              </Tabs.Content>

              {/* Bids Tab */}
              <Tabs.Content value="bids">
                <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
                  {!tender.bids || tender.bids.length === 0 ? (
                    <Box textAlign="center" py={10}>
                      <Icon as={FiFileText} boxSize={8} color="gray.400" mb={2} />
                      <Text color={isDark ? 'gray.400' : 'gray.500'} fontSize="sm">
                        {t('cp.process.noBids', 'No hay ofertas recibidas aún')}
                      </Text>
                      {status === 'published' && userRole === 'supplier' && (
                        <Button
                          mt={4}
                          size="sm"
                          colorPalette="blue"
                          onClick={() => navigate(`/offers/submit/${id}`)}
                        >
                          <Icon as={FiSend} mr={2} />
                          {t('cp.process.submitOffer', 'Presentar Oferta')}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>{t('cp.process.provider', 'Proveedor')}</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">{t('cp.process.amount', 'Monto')}</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="center">{t('cp.process.actions', 'Acciones')}</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {tender.bids.map(bid => (
                          <Table.Row key={bid.id}>
                            <Table.Cell fontSize="sm">{bid.provider?.name || '—'}</Table.Cell>
                            <Table.Cell fontSize="sm" textAlign="right">{formatCurrency(bid.amount)}</Table.Cell>
                            <Table.Cell textAlign="center">
                              {canEvaluate && (
                                <Button size="xs" colorPalette="purple" variant="outline" onClick={() => navigate(`/cp/processes/${id}/evaluations`)}>
                                  {t('cp.process.evaluate', 'Evaluar')}
                                </Button>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </Box>
              </Tabs.Content>

              {/* Clarifications Tab */}
              <Tabs.Content value="clarifications">
                <CPClarificationsPanel
                  tenderId={id!}
                  userRole={userRole}
                  tenderStatus={tender.status}
                />
              </Tabs.Content>

              {/* Schedule Tab */}
              <Tabs.Content value="schedule">
                <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
                  <VStack align="stretch" gap={0}>
                    <DateRow label={t('cp.process.publishedAt', 'Fecha publicación')} date={tender.publishedAt} />
                    <DateRow label={t('cp.process.questionsDeadline', 'Cierre preguntas')} date={tender.questionsDeadlineAt} highlight />
                    <DateRow label={t('cp.process.clarificationResponse', 'Respuesta aclaraciones')} date={tender.clarificationResponseDeadlineAt} highlight />
                    <DateRow label={t('cp.process.bidsDeadline', 'Cierre de ofertas')} date={tender.bidsDeadlineAt} highlight />
                    <DateRow label={t('cp.process.bidsOpened', 'Apertura de ofertas')} date={tender.bidsOpenedAt} />
                    <DateRow label={t('cp.process.scoringDeadline', 'Fecha evaluación')} date={tender.scoringDeadlineAt} highlight />
                    <DateRow label={t('cp.process.awardDeadline', 'Fecha adjudicación')} date={tender.awardResolutionDeadlineAt} highlight />
                  </VStack>
                </Box>
              </Tabs.Content>
            </Tabs.Root>
          </Box>

          {/* AI Panel (collapsible) */}
          {showAI && (
            <Box
              w={{ base: 'full', xl: '360px' }}
              flexShrink={0}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
            >
              <HStack mb={3}>
                <Icon as={LuSparkles} color={isDark ? 'purple.300' : 'purple.500'} />
                <Text fontWeight="600" fontSize="sm">{t('cp.process.aiAssistant', 'Asistente IA GPTsercop')}</Text>
              </HStack>
              <CPDraftGeneratorPanel />
            </Box>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default CPProcessDetailPage;
