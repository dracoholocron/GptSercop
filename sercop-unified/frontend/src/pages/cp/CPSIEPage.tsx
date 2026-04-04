/**
 * CPSIEPage - Sala de Subasta Inversa Electrónica (SIE)
 * Polling de estado, historial de pujas, cuenta regresiva, formulario de pujas
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Table,
  Separator,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiTrendingDown,
  FiClock,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiSend,
  FiBarChart2,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface SIEStatus {
  tenderId: string;
  phase: 'waiting' | 'initial' | 'bids' | 'negotiation' | 'final' | 'closed';
  phaseEndsAt: string | null;
  bestBid: number | null;
  initialPrice: number | null;
  roundNumber: number | null;
  bids: SIEBid[];
}

interface SIEBid {
  id: string;
  amount: number;
  bidderName: string;
  submittedAt: string;
  isCurrentBest: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  waiting: 'Sala de Espera',
  initial: 'Ronda Inicial',
  bids: 'Ronda de Pujas',
  negotiation: 'Negociación',
  final: 'Ronda Final',
  closed: 'Subasta Cerrada',
};

const PHASE_COLORS: Record<string, string> = {
  waiting: 'gray',
  initial: 'blue',
  bids: 'orange',
  negotiation: 'purple',
  final: 'red',
  closed: 'green',
};

const formatCurrency = (v: number | null | undefined) =>
  v == null ? '—' : `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

// ============================================================================
// Countdown
// ============================================================================

const useCountdown = (endsAt: string | null) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!endsAt) { setRemaining(''); return; }
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('00:00'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  return remaining;
};

// ============================================================================
// Main Component
// ============================================================================

export const CPSIEPage: React.FC = () => {
  const { id: tenderId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SIEStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const countdown = useCountdown(status?.phaseEndsAt || null);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const loadStatus = useCallback(async () => {
    if (!tenderId) return;
    try {
      const res = await get(`/v1/sie/${tenderId}/status`);
      if (res.ok) {
        const d = await res.json();
        setStatus(d?.data || d);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [tenderId]);

  // Poll every 5 seconds
  useEffect(() => {
    loadStatus();
    pollingRef.current = setInterval(loadStatus, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadStatus]);

  const submitBid = async () => {
    if (!tenderId || !bidAmount) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toaster.create({ title: 'Ingrese un monto válido', type: 'error' }); return;
    }
    if (status?.bestBid && amount >= status.bestBid) {
      toaster.create({ title: `Su puja debe ser menor a ${formatCurrency(status.bestBid)}`, type: 'error' }); return;
    }
    setSubmitting(true);
    try {
      const phase = status?.phase || 'bids';
      const endpoint = phase === 'initial' ? 'initial' : phase === 'final' ? 'final' : 'bids';
      const res = await post(`/v1/sie/${tenderId}/${endpoint}`, { amount });
      if (res.ok) {
        toaster.create({ title: `Puja de ${formatCurrency(amount)} registrada`, type: 'success' });
        setBidAmount('');
        loadStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || 'Error al enviar puja', type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Flex h="60vh" align="center" justify="center"><Spinner size="xl" /></Flex>;

  const isClosed = status?.phase === 'closed';
  const canBid = status?.phase === 'initial' || status?.phase === 'bids' || status?.phase === 'final';

  return (
    <Box maxW="1000px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/cp/processes/${tenderId}`)}>
              <Icon as={FiArrowLeft} mr={2} />
              {t('common.back', 'Volver al proceso')}
            </Button>
            <Separator orientation="vertical" h={5} />
            <HStack>
              <Icon as={FiTrendingDown} boxSize={5} color={isDark ? 'orange.300' : 'orange.500'} />
              <Heading size="md">{t('cp.sie.title', 'Subasta Inversa Electrónica')}</Heading>
            </HStack>
          </HStack>
          <Button size="sm" variant="outline" onClick={loadStatus}>
            <Icon as={FiRefreshCw} mr={2} />
            {t('common.refresh', 'Actualizar')}
          </Button>
        </Flex>

        {/* Status banner */}
        {status && (
          <Box
            bg={isDark ? `${PHASE_COLORS[status.phase]}.900` : `${PHASE_COLORS[status.phase]}.50`}
            borderRadius="xl"
            borderWidth="2px"
            borderColor={isDark ? `${PHASE_COLORS[status.phase]}.600` : `${PHASE_COLORS[status.phase]}.200`}
            p={4}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack gap={3}>
                <Badge
                  colorPalette={PHASE_COLORS[status.phase]}
                  variant="solid"
                  fontSize="sm"
                  px={3} py={1}
                >
                  {PHASE_LABELS[status.phase] || status.phase}
                </Badge>
                {status.roundNumber !== null && (
                  <Text fontSize="sm" color={isDark ? 'gray.300' : 'gray.600'}>
                    Ronda {status.roundNumber}
                  </Text>
                )}
              </HStack>
              {countdown && (
                <HStack gap={2} bg={isDark ? 'gray.800' : 'white'} borderRadius="lg" px={4} py={2}>
                  <Icon as={FiClock} color={isDark ? 'orange.300' : 'orange.500'} boxSize={4} />
                  <Text fontFamily="mono" fontSize="xl" fontWeight="bold">{countdown}</Text>
                </HStack>
              )}
            </Flex>
          </Box>
        )}

        {/* Price cards */}
        <HStack gap={4} flexWrap="wrap">
          <Card.Root flex={1} minW="140px">
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Precio Inicial</Text>
                  <Text fontSize="lg" fontWeight="bold">{formatCurrency(status?.initialPrice)}</Text>
                </VStack>
                <Icon as={FiDollarSign} boxSize={6} color={isDark ? 'gray.400' : 'gray.400'} />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root flex={1} minW="140px" borderColor={isDark ? 'green.600' : 'green.300'} borderWidth="2px">
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={isDark ? 'green.400' : 'green.600'} textTransform="uppercase" fontWeight="600">Mejor Puja</Text>
                  <Text fontSize="xl" fontWeight="bold" color={isDark ? 'green.300' : 'green.600'}>{formatCurrency(status?.bestBid)}</Text>
                </VStack>
                <Icon as={FiTrendingDown} boxSize={6} color={isDark ? 'green.400' : 'green.500'} />
              </HStack>
            </Card.Body>
          </Card.Root>
          {status?.initialPrice && status?.bestBid && (
            <Card.Root flex={1} minW="140px">
              <Card.Body p={4}>
                <HStack justify="space-between">
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Ahorro</Text>
                    <Text fontSize="lg" fontWeight="bold" color={isDark ? 'blue.300' : 'blue.600'}>
                      {((1 - status.bestBid / status.initialPrice) * 100).toFixed(1)}%
                    </Text>
                  </VStack>
                  <Icon as={FiBarChart2} boxSize={6} color={isDark ? 'blue.400' : 'blue.500'} />
                </HStack>
              </Card.Body>
            </Card.Root>
          )}
        </HStack>

        {/* Bid form */}
        {canBid && (
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
            <Text fontWeight="600" fontSize="sm" mb={3}>
              <Icon as={FiSend} mr={2} />
              Enviar Puja
            </Text>
            <HStack gap={3}>
              <VStack align="start" gap={1} flex={1}>
                <Input
                  type="number"
                  placeholder={status?.bestBid ? `Menor a ${formatCurrency(status.bestBid)}` : 'Monto de puja (USD)'}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  size="lg"
                />
                {status?.bestBid && (
                  <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                    Su puja debe ser menor a {formatCurrency(status.bestBid)}
                  </Text>
                )}
              </VStack>
              <Button
                colorPalette="orange"
                size="lg"
                onClick={submitBid}
                disabled={submitting || !bidAmount}
                loading={submitting}
                px={8}
              >
                <Icon as={FiTrendingDown} mr={2} />
                Pujar
              </Button>
            </HStack>
          </Box>
        )}

        {isClosed && (
          <Box bg={isDark ? 'green.900' : 'green.50'} borderRadius="xl" p={5} textAlign="center" borderWidth="2px" borderColor={isDark ? 'green.600' : 'green.200'}>
            <Icon as={FiCheckCircle} boxSize={10} color={isDark ? 'green.400' : 'green.500'} mb={2} />
            <Heading size="md" color={isDark ? 'green.300' : 'green.600'}>Subasta Finalizada</Heading>
            <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'} mt={1}>
              Mejor precio final: <Text as="strong">{formatCurrency(status?.bestBid)}</Text>
            </Text>
          </Box>
        )}

        {/* Bid history */}
        {(status?.bids?.length ?? 0) > 0 && (
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <HStack px={4} py={3} borderBottomWidth="1px" borderColor={borderColor}>
              <Icon as={FiBarChart2} color={isDark ? 'blue.300' : 'blue.500'} boxSize={4} />
              <Text fontWeight="600" fontSize="sm">Historial de Pujas ({status!.bids.length})</Text>
            </HStack>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Postor</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Hora</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Estado</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {status!.bids.sort((a, b) => a.amount - b.amount).map(bid => (
                  <Table.Row key={bid.id} bg={bid.isCurrentBest ? (isDark ? 'green.900' : 'green.50') : undefined}>
                    <Table.Cell fontSize="sm">{bid.bidderName}</Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="500" fontSize="sm">{formatCurrency(bid.amount)}</Table.Cell>
                    <Table.Cell textAlign="center" fontSize="xs">
                      {new Date(bid.submittedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      {bid.isCurrentBest ? (
                        <Badge colorPalette="green" variant="solid" fontSize="xs">
                          <Icon as={FiTrendingDown} mr={1} />Mejor
                        </Badge>
                      ) : (
                        <Badge colorPalette="gray" variant="subtle" fontSize="xs">Superada</Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {status?.phase === 'waiting' && (
          <Box textAlign="center" py={10}>
            <Icon as={FiClock} boxSize={10} color="gray.400" mb={3} />
            <Heading size="sm" color={isDark ? 'gray.400' : 'gray.500'}>Sala de espera</Heading>
            <Text fontSize="sm" color={isDark ? 'gray.500' : 'gray.400'} mt={1}>
              La subasta comenzará en breve. Esta pantalla se actualizará automáticamente.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default CPSIEPage;
