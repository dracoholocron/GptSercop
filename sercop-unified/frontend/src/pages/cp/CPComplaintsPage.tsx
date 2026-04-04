/**
 * CPComplaintsPage - Denuncias y Reclamos
 * Formulario ciudadano + tabla admin + reclamos de proceso
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  FiAlertTriangle,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiRefreshCw,
  FiEye,
  FiSend,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post, patch } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface Complaint {
  id: string;
  complaintType: string;
  description: string;
  evidenceUrls: string[];
  status: string;
  tenderId: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  submitterName?: string;
  submitterIdentifier?: string;
}

interface ProcessClaim {
  id: string;
  tenderId: string;
  description: string;
  status: string;
  submittedAt: string;
  windowExpiresAt: string | null;
  response: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  submitted: 'blue',
  under_review: 'orange',
  resolved: 'green',
  dismissed: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Presentada',
  under_review: 'En Revisión',
  resolved: 'Resuelta',
  dismissed: 'Desestimada',
};

const COMPLAINT_TYPES = [
  { value: 'CORRUPTION', label: 'Corrupción o irregularidades' },
  { value: 'IRREGULARITY', label: 'Irregularidad en proceso' },
  { value: 'COLLUSION', label: 'Colusión entre oferentes' },
  { value: 'DISCRIMINATION', label: 'Discriminación de proveedores' },
  { value: 'OVERPRICING', label: 'Sobreprecios' },
  { value: 'OTHER', label: 'Otra' },
];

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ============================================================================
// Main Component
// ============================================================================

export const CPComplaintsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [processClaims, setProcessClaims] = useState<ProcessClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New complaint form
  const [showForm, setShowForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    complaintType: '',
    description: '',
    tenderId: '',
    submitterName: '',
    submitterIdentifier: '',
  });

  // Detail dialog
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const storedUser = localStorage.getItem('globalcmx_user');
  const isAdmin: boolean = (() => {
    try { const u = JSON.parse(storedUser || '{}'); return u.role === 'ROLE_ADMIN' || u.role === 'admin' || u.role === 'cp.admin'; } catch { return false; }
  })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, claimsRes] = await Promise.all([
        get('/v1/complaints?page=1&pageSize=50'),
        get('/v1/process-claims?page=1&pageSize=50'),
      ]);
      if (compRes.ok) { const d = await compRes.json(); setComplaints(Array.isArray(d?.data) ? d.data : []); }
      if (claimsRes.ok) { const d = await claimsRes.json(); setProcessClaims(Array.isArray(d?.data) ? d.data : []); }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const submitComplaint = async () => {
    if (!newComplaint.complaintType || !newComplaint.description.trim()) {
      toaster.create({ title: 'Tipo y descripción son obligatorios', type: 'error' }); return;
    }
    setActionLoading('submit');
    try {
      const res = await post('/v1/complaints', {
        complaintType: newComplaint.complaintType,
        description: newComplaint.description,
        tenderId: newComplaint.tenderId || undefined,
        submitterName: newComplaint.submitterName || undefined,
        submitterIdentifier: newComplaint.submitterIdentifier || undefined,
      });
      if (res.ok) {
        toaster.create({ title: 'Denuncia registrada. Se le notificará el avance.', type: 'success' });
        setShowForm(false);
        setNewComplaint({ complaintType: '', description: '', tenderId: '', submitterName: '', submitterIdentifier: '' });
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

  const resolveComplaint = async (id: string, disposition: 'resolved' | 'dismissed') => {
    if (!resolutionText.trim()) {
      toaster.create({ title: 'Ingrese la resolución o motivo', type: 'error' }); return;
    }
    setActionLoading(`resolve-${id}`);
    try {
      const res = await patch(`/v1/complaints/${id}`, { status: disposition, resolution: resolutionText });
      if (res.ok) {
        toaster.create({ title: `Denuncia ${disposition === 'resolved' ? 'resuelta' : 'desestimada'}`, type: 'success' });
        setSelectedComplaint(null);
        setResolutionText('');
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

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Icon as={FiAlertTriangle} boxSize={6} color={isDark ? 'orange.300' : 'orange.500'} />
            <VStack align="start" gap={0}>
              <Heading size="md">{t('cp.complaints.title', 'Denuncias y Reclamos')}</Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                Canal ciudadano de denuncias de Compras Públicas
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={load}>
              <Icon as={FiRefreshCw} mr={2} />
              {t('common.refresh', 'Actualizar')}
            </Button>
            <Button size="sm" colorPalette="orange" onClick={() => setShowForm(v => !v)}>
              <Icon as={FiPlus} mr={2} />
              {t('cp.complaints.new', 'Nueva Denuncia')}
            </Button>
          </HStack>
        </Flex>

        {/* New complaint form */}
        {showForm && (
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
            <Text fontWeight="700" fontSize="sm" mb={4}>
              <Icon as={FiMessageSquare} mr={2} />
              Registrar Nueva Denuncia
            </Text>
            <VStack gap={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={1}>Tipo de denuncia <Text as="span" color="red.400">*</Text></Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={newComplaint.complaintType}
                    onChange={e => setNewComplaint(p => ({ ...p, complaintType: e.target.value }))}
                  >
                    <option value="">Seleccionar tipo...</option>
                    {COMPLAINT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={1}>Descripción detallada <Text as="span" color="red.400">*</Text></Text>
                <Textarea
                  value={newComplaint.description}
                  onChange={e => setNewComplaint(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describa con detalle los hechos, fechas, entidades y personas involucradas..."
                  rows={4}
                />
              </Box>
              <HStack gap={4} flexWrap="wrap">
                <Box flex={1} minW="180px">
                  <Text fontSize="sm" fontWeight="600" mb={1}>N° de proceso (opcional)</Text>
                  <Input
                    value={newComplaint.tenderId}
                    onChange={e => setNewComplaint(p => ({ ...p, tenderId: e.target.value }))}
                    placeholder="ID del proceso afectado"
                  />
                </Box>
                <Box flex={1} minW="180px">
                  <Text fontSize="sm" fontWeight="600" mb={1}>Su nombre (opcional)</Text>
                  <Input
                    value={newComplaint.submitterName}
                    onChange={e => setNewComplaint(p => ({ ...p, submitterName: e.target.value }))}
                    placeholder="Nombre del denunciante"
                  />
                </Box>
                <Box flex={1} minW="180px">
                  <Text fontSize="sm" fontWeight="600" mb={1}>Cédula / RUC (opcional)</Text>
                  <Input
                    value={newComplaint.submitterIdentifier}
                    onChange={e => setNewComplaint(p => ({ ...p, submitterIdentifier: e.target.value }))}
                    placeholder="Identificación"
                  />
                </Box>
              </HStack>
              <Box bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="md" p={3}>
                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                  Su denuncia será tratada con total confidencialidad. Las denuncias anónimas también son aceptadas.
                </Text>
              </Box>
              <HStack justify="flex-end" gap={2}>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button size="sm" colorPalette="orange" onClick={submitComplaint} loading={actionLoading === 'submit'}>
                  <Icon as={FiSend} mr={2} />
                  Enviar Denuncia
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Tabs */}
        <Tabs.Root defaultValue="complaints" variant="enclosed">
          <Tabs.List mb={4}>
            <Tabs.Trigger value="complaints">
              <Icon as={FiAlertTriangle} mr={2} boxSize={4} />
              Denuncias
              {complaints.length > 0 && <Badge ml={2} colorPalette="orange" variant="subtle" fontSize="xs">{complaints.length}</Badge>}
            </Tabs.Trigger>
            <Tabs.Trigger value="claims">
              <Icon as={FiMessageSquare} mr={2} boxSize={4} />
              Reclamos de Proceso
              {processClaims.length > 0 && <Badge ml={2} colorPalette="blue" variant="subtle" fontSize="xs">{processClaims.length}</Badge>}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Complaints Tab */}
          <Tabs.Content value="complaints">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
              {loading ? (
                <Flex justify="center" py={12}><Spinner /></Flex>
              ) : complaints.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Icon as={FiAlertTriangle} boxSize={10} color="gray.400" mb={3} />
                  <Text color={isDark ? 'gray.400' : 'gray.500'}>No hay denuncias registradas</Text>
                </Box>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                      <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Estado</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Presentada</Table.ColumnHeader>
                      {isAdmin && <Table.ColumnHeader textAlign="center">Acción</Table.ColumnHeader>}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {complaints.map(c => (
                      <Table.Row key={c.id}>
                        <Table.Cell>
                          <Badge colorPalette="orange" variant="subtle" fontSize="xs">
                            {COMPLAINT_TYPES.find(t => t.value === c.complaintType)?.label || c.complaintType}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell maxW="300px">
                          <Text fontSize="sm" noOfLines={2}>{c.description}</Text>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Badge colorPalette={STATUS_COLORS[c.status] || 'gray'} variant="subtle" fontSize="xs">
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Text fontSize="xs">{formatDate(c.submittedAt)}</Text>
                        </Table.Cell>
                        {isAdmin && (
                          <Table.Cell textAlign="center">
                            {c.status === 'submitted' || c.status === 'under_review' ? (
                              <Button size="xs" colorPalette="blue" variant="outline" onClick={() => { setSelectedComplaint(c); setResolutionText(''); }}>
                                <Icon as={FiEye} mr={1} />
                                Revisar
                              </Button>
                            ) : (
                              <Icon as={FiCheckCircle} color="green.400" boxSize={4} />
                            )}
                          </Table.Cell>
                        )}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </Tabs.Content>

          {/* Process Claims Tab */}
          <Tabs.Content value="claims">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
              {loading ? (
                <Flex justify="center" py={12}><Spinner /></Flex>
              ) : processClaims.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Icon as={FiMessageSquare} boxSize={10} color="gray.400" mb={3} />
                  <Text color={isDark ? 'gray.400' : 'gray.500'}>No hay reclamos de proceso registrados</Text>
                </Box>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Proceso</Table.ColumnHeader>
                      <Table.ColumnHeader>Reclamo</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Estado</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Vence ventana</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Respuesta</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {processClaims.map(c => {
                      const windowExpired = c.windowExpiresAt && new Date(c.windowExpiresAt) < new Date();
                      return (
                        <Table.Row key={c.id}>
                          <Table.Cell>
                            <Text fontSize="xs" fontFamily="mono">{c.tenderId?.slice(0, 8)}...</Text>
                          </Table.Cell>
                          <Table.Cell maxW="300px">
                            <Text fontSize="sm" noOfLines={2}>{c.description}</Text>
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <Badge colorPalette={STATUS_COLORS[c.status] || 'gray'} variant="subtle" fontSize="xs">
                              {STATUS_LABELS[c.status] || c.status}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {c.windowExpiresAt ? (
                              <HStack justify="center" gap={1}>
                                <Icon as={windowExpired ? FiAlertTriangle : FiClock} boxSize={3} color={windowExpired ? 'red.400' : 'orange.400'} />
                                <Text fontSize="xs" color={windowExpired ? (isDark ? 'red.300' : 'red.600') : undefined}>
                                  {formatDate(c.windowExpiresAt)}
                                </Text>
                              </HStack>
                            ) : '—'}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {c.response ? (
                              <Text fontSize="xs" noOfLines={2}>{c.response}</Text>
                            ) : (
                              <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>Sin respuesta</Text>
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

      {/* Review dialog */}
      <DialogRoot open={!!selectedComplaint} onOpenChange={d => !d.open && setSelectedComplaint(null)}>
        <DialogContent>
          <DialogHeader>
            <Text fontWeight="700">Revisar Denuncia</Text>
          </DialogHeader>
          <DialogBody>
            {selectedComplaint && (
              <VStack gap={4} align="stretch">
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={isDark ? 'gray.400' : 'gray.500'} mb={1}>DESCRIPCIÓN</Text>
                  <Text fontSize="sm">{selectedComplaint.description}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={isDark ? 'gray.400' : 'gray.500'} mb={1}>TIPO</Text>
                  <Badge colorPalette="orange" variant="subtle">
                    {COMPLAINT_TYPES.find(t => t.value === selectedComplaint.complaintType)?.label || selectedComplaint.complaintType}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={1}>Resolución / Comentario</Text>
                  <Textarea
                    value={resolutionText}
                    onChange={e => setResolutionText(e.target.value)}
                    placeholder="Describa la resolución o motivo de desestimación..."
                    rows={3}
                  />
                </Box>
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <HStack gap={2}>
              <DialogCloseTrigger asChild>
                <Button variant="outline" size="sm">Cancelar</Button>
              </DialogCloseTrigger>
              <Button
                colorPalette="gray"
                size="sm"
                onClick={() => selectedComplaint && resolveComplaint(selectedComplaint.id, 'dismissed')}
                loading={actionLoading === `resolve-${selectedComplaint?.id}`}
              >
                Desestimar
              </Button>
              <Button
                colorPalette="green"
                size="sm"
                onClick={() => selectedComplaint && resolveComplaint(selectedComplaint.id, 'resolved')}
                loading={actionLoading === `resolve-${selectedComplaint?.id}`}
              >
                <Icon as={FiCheckCircle} mr={2} />
                Resolver
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default CPComplaintsPage;
