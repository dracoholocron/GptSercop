/**
 * CPContractDetailPage - Detalle y gestión de un contrato
 * Administrador, cronograma de pagos, plazo normativo art.112, adjudicatario fallido
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
  Card,
  Table,
  Separator,
  Tabs,
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
  FiAlertTriangle,
  FiPlus,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiFileText,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post, patch, put } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface Contract {
  id: string;
  tenderId: string;
  status: string;
  amount: number | null;
  contractNo: string | null;
  signedAt: string | null;
  administratorName: string | null;
  administratorEmail: string | null;
  administratorDesignatedAt: string | null;
  administratorObjectionAt: string | null;
  administratorObjectionReason: string | null;
  awardResolutionIssuedAt: string | null;
  awardPublishedAt: string | null;
  disputeDeadlineDays: number | null;
  provider?: { id: string; name: string; identifier: string | null } | null;
  tender?: { id: string; title: string } | null;
}

interface Payment {
  id: string;
  sequenceNo: number;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (v: number | null | undefined) =>
  v == null ? '—' : `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  planned: 'gray',
  approved: 'blue',
  paid: 'green',
  overdue: 'red',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  planned: 'Planificado',
  approved: 'Aprobado',
  paid: 'Pagado',
  overdue: 'Vencido',
};

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: 'gray', active: 'green', signed: 'blue',
  suspended: 'orange', terminated: 'red', completed: 'teal',
};

// ============================================================================
// Main Component
// ============================================================================

export const CPContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Admin designation
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({ sequenceNo: '', amount: '', dueDate: '' });

  // Failed awardee dialog
  const [showFailedDialog, setShowFailedDialog] = useState(false);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [contRes, payRes] = await Promise.all([
        get(`/v1/contracts?page=1&pageSize=200`), // fallback: would ideally be GET /contracts/:id
        get(`/v1/contracts/${id}/payments`),
      ]);
      // Use direct id fetch - try first approach
      const directRes = await get(`/v1/contracts/${id}/payments`);
      if (directRes.ok) {
        const payData = await directRes.json();
        setPayments(Array.isArray(payData?.data) ? payData.data : []);
      }
      // Get contract from list
      if (contRes.ok) {
        const contData = await contRes.json();
        const found = contData?.data?.find((c: Contract) => c.id === id);
        if (found) {
          setContract(found);
          setAdminName(found.administratorName || '');
          setAdminEmail(found.administratorEmail || '');
        }
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const saveAdmin = async () => {
    if (!id || !adminName.trim()) {
      toaster.create({ title: 'El nombre del administrador es obligatorio', type: 'error' }); return;
    }
    setActionLoading('admin');
    try {
      const res = await put(`/v1/contracts/${id}`, {
        administratorName: adminName,
        administratorEmail: adminEmail,
      });
      if (res.ok) {
        toaster.create({ title: t('cp.contracts.adminSaved', 'Administrador designado'), type: 'success' });
        setShowAdminForm(false);
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
  };

  const addPayment = async () => {
    if (!id || !newPayment.sequenceNo || !newPayment.amount) {
      toaster.create({ title: 'Secuencia y monto son obligatorios', type: 'error' }); return;
    }
    setActionLoading('payment');
    try {
      const res = await post(`/v1/contracts/${id}/payments`, {
        sequenceNo: parseInt(newPayment.sequenceNo),
        amount: parseFloat(newPayment.amount),
        dueDate: newPayment.dueDate || undefined,
        status: 'planned',
      });
      if (res.ok) {
        toaster.create({ title: t('cp.contracts.paymentAdded', 'Pago registrado'), type: 'success' });
        setShowPaymentForm(false);
        setNewPayment({ sequenceNo: '', amount: '', dueDate: '' });
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
  };

  const markPaymentPaid = async (paymentId: string) => {
    setActionLoading(`pay-${paymentId}`);
    try {
      const res = await patch(`/v1/contract-payments/${paymentId}`, { status: 'paid', paidAt: new Date().toISOString() });
      if (res.ok) { toaster.create({ title: 'Pago marcado como ejecutado', type: 'success' }); load(); }
    } catch { /* silent */ } finally { setActionLoading(null); }
  };

  const declareFailedAwardee = async () => {
    if (!id) return;
    setActionLoading('failed');
    try {
      const res = await post(`/v1/contracts/${id}/declare-failed-awardee`, {});
      if (res.ok) {
        toaster.create({ title: t('cp.contracts.failedDeclared', 'Adjudicatario declarado fallido. Sanción de 3 años aplicada.'), type: 'warning' });
        setShowFailedDialog(false);
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
  };

  // Check art.112 normative deadline (award published must be max 1 day after resolution)
  const art112Alert = contract?.awardResolutionIssuedAt && contract?.awardPublishedAt
    ? new Date(contract.awardPublishedAt).getTime() - new Date(contract.awardResolutionIssuedAt).getTime() > 24 * 60 * 60 * 1000
    : false;

  if (loading) return <Flex h="60vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  if (!contract) return <Box textAlign="center" py={16}><Text>Contrato no encontrado</Text></Box>;

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const totalPlanned = payments.reduce((a, p) => a + p.amount, 0);
  const pctPaid = totalPlanned > 0 ? (totalPaid / totalPlanned * 100).toFixed(0) : '0';

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Button size="sm" variant="ghost" onClick={() => navigate('/cp/contracts')}>
              <Icon as={FiArrowLeft} mr={2} />
              {t('common.back', 'Volver')}
            </Button>
            <Separator orientation="vertical" h={5} />
            <VStack align="start" gap={0}>
              <HStack gap={2}>
                <Icon as={FiFileText} boxSize={5} color={isDark ? 'teal.300' : 'teal.500'} />
                <Heading size="md">{t('cp.contracts.detailTitle', 'Contrato')} {contract.contractNo || `#${contract.id.slice(-8)}`}</Heading>
              </HStack>
              <HStack gap={2} mt={1}>
                <Badge colorPalette={CONTRACT_STATUS_COLORS[contract.status] || 'gray'} variant="solid" fontSize="xs">
                  {contract.status}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={load}>
              <Icon as={FiRefreshCw} mr={2} />
              {t('common.refresh', 'Actualizar')}
            </Button>
            <Button size="sm" colorPalette="red" variant="outline" onClick={() => setShowFailedDialog(true)}>
              <Icon as={FiXCircle} mr={2} />
              {t('cp.contracts.declareFailedAwardee', 'Adjudicatario Fallido')}
            </Button>
          </HStack>
        </Flex>

        {/* Art. 112 alert */}
        {art112Alert && (
          <HStack bg={isDark ? 'red.900' : 'red.50'} borderRadius="lg" p={3} borderWidth="1px" borderColor={isDark ? 'red.700' : 'red.200'}>
            <Icon as={FiAlertTriangle} color="red.400" boxSize={5} />
            <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'} fontWeight="500">
              {t('cp.contracts.art112Alert', 'Art. 112 LOSNCP: La resolución de adjudicación fue publicada más de 24 horas después de su emisión.')}
            </Text>
          </HStack>
        )}

        {/* Summary cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Card.Root>
            <Card.Body p={4}>
              <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Monto</Text>
              <Text fontSize="lg" fontWeight="bold">{formatCurrency(contract.amount)}</Text>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body p={4}>
              <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Proveedor</Text>
              <Text fontSize="sm" fontWeight="bold" noOfLines={2}>{contract.provider?.name || '—'}</Text>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body p={4}>
              <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Pagos</Text>
              <Text fontSize="lg" fontWeight="bold">{pctPaid}%</Text>
              <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>{formatCurrency(totalPaid)} / {formatCurrency(totalPlanned)}</Text>
            </Card.Body>
          </Card.Root>
          <Card.Root>
            <Card.Body p={4}>
              <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase" fontWeight="600">Firmado</Text>
              <Text fontSize="sm" fontWeight="bold">{formatDate(contract.signedAt)}</Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Tabs.Root defaultValue="info" variant="enclosed">
          <Tabs.List mb={4}>
            <Tabs.Trigger value="info"><Icon as={FiFileText} mr={2} boxSize={4} />Información</Tabs.Trigger>
            <Tabs.Trigger value="admin"><Icon as={FiUser} mr={2} boxSize={4} />Administrador</Tabs.Trigger>
            <Tabs.Trigger value="payments">
              <Icon as={FiDollarSign} mr={2} boxSize={4} />Pagos
              {payments.length > 0 && <Badge ml={2} colorPalette="blue" variant="subtle" fontSize="xs">{payments.length}</Badge>}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Info Tab */}
          <Tabs.Content value="info">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
              <VStack align="stretch" gap={0}>
                {[
                  ['Proceso', contract.tender?.title || '—'],
                  ['Proveedor', `${contract.provider?.name || '—'} (${contract.provider?.identifier || '—'})`],
                  ['N° Contrato', contract.contractNo || '—'],
                  ['Monto', formatCurrency(contract.amount)],
                  ['Fecha firma', formatDate(contract.signedAt)],
                  ['Resolución adjudicación', formatDate(contract.awardResolutionIssuedAt)],
                  ['Publicación adjudicación', formatDate(contract.awardPublishedAt)],
                  ['Días ventana reclamos', String(contract.disputeDeadlineDays ?? 3)],
                ].map(([label, value]) => (
                  <HStack key={label} justify="space-between" py={2} borderBottomWidth="1px" borderColor={isDark ? 'gray.700' : 'gray.100'}>
                    <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'} minW="180px">{label}</Text>
                    <Text fontSize="sm" fontWeight="500" textAlign="right">{value}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </Tabs.Content>

          {/* Administrator Tab */}
          <Tabs.Content value="admin">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
              {contract.administratorName ? (
                <VStack align="stretch" gap={4}>
                  <HStack gap={3}>
                    <Icon as={FiCheckCircle} color="green.400" boxSize={5} />
                    <Text fontWeight="600">{t('cp.contracts.adminDesignated', 'Administrador designado')}</Text>
                    <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                      {formatDate(contract.administratorDesignatedAt)}
                    </Text>
                  </HStack>
                  <HStack gap={6}>
                    <VStack align="start" gap={0}>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('common.name', 'Nombre')}</Text>
                      <Text fontWeight="500">{contract.administratorName}</Text>
                    </VStack>
                    <VStack align="start" gap={0}>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('common.email', 'Email')}</Text>
                      <Text fontWeight="500">{contract.administratorEmail || '—'}</Text>
                    </VStack>
                  </HStack>
                  {contract.administratorObjectionAt && (
                    <Box bg={isDark ? 'orange.900' : 'orange.50'} borderRadius="md" p={3}>
                      <HStack gap={2} mb={1}>
                        <Icon as={FiAlertTriangle} color="orange.400" boxSize={4} />
                        <Text fontSize="sm" fontWeight="600" color={isDark ? 'orange.300' : 'orange.600'}>
                          Objeción presentada ({formatDate(contract.administratorObjectionAt)})
                        </Text>
                      </HStack>
                      <Text fontSize="sm">{contract.administratorObjectionReason}</Text>
                    </Box>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowAdminForm(true)}>
                    {t('cp.contracts.changeAdmin', 'Cambiar administrador')}
                  </Button>
                </VStack>
              ) : (
                <VStack gap={4} align="stretch">
                  <HStack gap={2}>
                    <Icon as={FiAlertTriangle} color="orange.400" boxSize={5} />
                    <Text color={isDark ? 'orange.300' : 'orange.600'} fontWeight="500">
                      {t('cp.contracts.noAdmin', 'No hay administrador designado')}
                    </Text>
                  </HStack>
                  {!showAdminForm && (
                    <Button size="sm" colorPalette="blue" onClick={() => setShowAdminForm(true)}>
                      <Icon as={FiUser} mr={2} />
                      {t('cp.contracts.designateAdmin', 'Designar Administrador')}
                    </Button>
                  )}
                </VStack>
              )}

              {showAdminForm && (
                <Box mt={4} p={4} bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="lg">
                  <Text fontWeight="600" mb={3} fontSize="sm">
                    {t('cp.contracts.adminForm', 'Datos del administrador')}
                  </Text>
                  <VStack gap={3} align="stretch">
                    <Input placeholder="Nombre completo" value={adminName} onChange={e => setAdminName(e.target.value)} />
                    <Input placeholder="Email institucional" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                    <HStack gap={2} justify="flex-end">
                      <Button size="sm" variant="outline" onClick={() => setShowAdminForm(false)}>Cancelar</Button>
                      <Button size="sm" colorPalette="blue" onClick={saveAdmin} loading={actionLoading === 'admin'}>Guardar</Button>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </Box>
          </Tabs.Content>

          {/* Payments Tab */}
          <Tabs.Content value="payments">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
              <Flex justify="space-between" align="center" px={4} py={3} borderBottomWidth="1px" borderColor={borderColor}>
                <HStack gap={2}>
                  <Icon as={FiDollarSign} color={isDark ? 'green.300' : 'green.500'} boxSize={4} />
                  <Text fontWeight="600" fontSize="sm">Cronograma de Pagos</Text>
                </HStack>
                <Button size="xs" colorPalette="green" onClick={() => setShowPaymentForm(v => !v)}>
                  <Icon as={FiPlus} mr={1} />
                  Agregar pago
                </Button>
              </Flex>

              {showPaymentForm && (
                <Box px={4} py={3} borderBottomWidth="1px" borderColor={borderColor} bg={isDark ? 'gray.750' : 'gray.50'}>
                  <HStack gap={3} flexWrap="wrap">
                    <Input size="sm" type="number" placeholder="N° secuencia" value={newPayment.sequenceNo} onChange={e => setNewPayment(p => ({ ...p, sequenceNo: e.target.value }))} w="120px" />
                    <Input size="sm" type="number" placeholder="Monto (USD)" value={newPayment.amount} onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))} w="140px" />
                    <Input size="sm" type="date" value={newPayment.dueDate} onChange={e => setNewPayment(p => ({ ...p, dueDate: e.target.value }))} w="140px" />
                    <Button size="sm" colorPalette="green" onClick={addPayment} loading={actionLoading === 'payment'}>Guardar</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(false)}>Cancelar</Button>
                  </HStack>
                </Box>
              )}

              {payments.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Icon as={FiDollarSign} boxSize={8} color="gray.400" mb={2} />
                  <Text color={isDark ? 'gray.400' : 'gray.500'} fontSize="sm">No hay pagos registrados</Text>
                </Box>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader textAlign="center">Seq.</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Estado</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Vencimiento</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Pagado</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Acción</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {payments.sort((a, b) => a.sequenceNo - b.sequenceNo).map(p => {
                      const isOverdue = p.status === 'planned' && p.dueDate && new Date(p.dueDate) < new Date();
                      return (
                        <Table.Row key={p.id}>
                          <Table.Cell textAlign="center">
                            <Badge colorPalette="gray" variant="subtle">{p.sequenceNo}</Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="right" fontWeight="500">{formatCurrency(p.amount)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            <Badge colorPalette={isOverdue ? 'red' : PAYMENT_STATUS_COLORS[p.status] || 'gray'} variant="subtle" fontSize="xs">
                              {isOverdue ? 'Vencido' : PAYMENT_STATUS_LABELS[p.status] || p.status}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="center">{formatDate(p.dueDate)}</Table.Cell>
                          <Table.Cell textAlign="center">{formatDate(p.paidAt)}</Table.Cell>
                          <Table.Cell textAlign="center">
                            {p.status !== 'paid' && (
                              <Button
                                size="xs"
                                colorPalette="green"
                                variant="outline"
                                onClick={() => markPaymentPaid(p.id)}
                                loading={actionLoading === `pay-${p.id}`}
                              >
                                <Icon as={FiCheckCircle} mr={1} />
                                Pagar
                              </Button>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>

      {/* Failed Awardee Dialog */}
      <DialogRoot open={showFailedDialog} onOpenChange={d => !d.open && setShowFailedDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <Text fontWeight="700" color="red.500">
              <Icon as={FiXCircle} mr={2} />
              Declarar Adjudicatario Fallido
            </Text>
          </DialogHeader>
          <DialogBody>
            <VStack gap={3} align="stretch">
              <Box bg={isDark ? 'red.900' : 'red.50'} borderRadius="md" p={3}>
                <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'} fontWeight="500">
                  ¿Está seguro de declarar como adjudicatario fallido al proveedor <strong>{contract.provider?.name}</strong>?
                </Text>
              </Box>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'}>
                Esta acción aplicará una sanción de inhabilitación de <strong>3 años</strong> al proveedor, conforme a la normativa de contratación pública.
              </Text>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <HStack gap={2}>
              <DialogCloseTrigger asChild>
                <Button variant="outline" size="sm">Cancelar</Button>
              </DialogCloseTrigger>
              <Button colorPalette="red" size="sm" onClick={declareFailedAwardee} loading={actionLoading === 'failed'}>
                Confirmar declaración
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

// Local SimpleGrid helper to avoid Chakra import conflicts
const SimpleGrid: React.FC<{ columns: Record<string, number>; gap: number; children: React.ReactNode }> = ({ columns, gap, children }) => (
  <Box
    display="grid"
    gridTemplateColumns={`repeat(${columns.base ?? 2}, 1fr)`}
    gap={gap}
    sx={{
      '@media (min-width: 768px)': {
        gridTemplateColumns: `repeat(${columns.md ?? columns.base ?? 2}, 1fr)`,
      },
    }}
  >
    {children}
  </Box>
);

export default CPContractDetailPage;
