/**
 * CPPAAWorkspacePage - Coordinator view for collaborative PAA workspace
 * Shows department progress, consolidated summary, and real-time updates.
 * Includes presence bar, comments panel, department filter, and live pulse animations.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Badge,
  Button,
  Icon,
  Heading,
  SimpleGrid,
  Spinner,
  Input,
  NativeSelect,
  Separator,
  Field,
  Progress,
  Stat,
  Table,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiUsers,
  FiTarget,
  FiDollarSign,
  FiPackage,
  FiFileText,
  FiArrowLeft,
  FiMessageCircle,
  FiUserPlus,
  FiEye,
} from 'react-icons/fi';
import { toaster } from '../../components/ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';
import {
  type CPPAAWorkspace,
  type CPPAADepartmentPlan,
  type WorkspaceDashboard,
  getWorkspaceDashboard,
  createWorkspace,
  addDepartment,
  consolidateWorkspace,
  approveDepartmentPlan,
  rejectDepartmentPlan,
  listWorkspaces,
  getMyDepartmentPlans,
  addWorkspaceObserver,
  formatCurrency,
  getDeptStatusColor,
  getDeptStatusIcon,
  getWorkspaceStatusColor,
} from '../../services/cpWorkspaceService';
import {
  type CPPAAMethodology,
  getActiveMethodologies,
} from '../../services/cpMethodologyService';
import { useWorkspaceRealTime } from '../../hooks/useWorkspaceRealTime';
import { WorkspacePresenceBar } from '../../components/compras-publicas/workspace/WorkspacePresenceBar';
import { WorkspaceCommentsPanel } from '../../components/compras-publicas/workspace/WorkspaceCommentsPanel';
import { WorkspaceDeptFilter } from '../../components/compras-publicas/workspace/WorkspaceDeptFilter';
import { RealtimeChangeToastStack, formatLastModified } from '../../components/compras-publicas/workspace/RealtimeChangeToast';
import { ProposalPanel } from '../../components/compras-publicas/workspace/ProposalPanel';
import { FiGitPullRequest } from 'react-icons/fi';

const MotionBox = motion.create(Box as any);

// ============================================================================
// Sub-components
// ============================================================================

/** Get button label based on department status */
const getDeptActionLabel = (status: string): string => {
  switch (status) {
    case 'ENVIADO':
    case 'APROBADO':
    case 'CONSOLIDADO':
      return 'Ver Plan';
    case 'EN_PROGRESO':
      return 'Continuar';
    default:
      return 'Aplicar Metodologia';
  }
};

/** Department progress card with pulse animation on live update */
const DeptCard: React.FC<{
  plan: CPPAADepartmentPlan;
  isDark: boolean;
  isUpdated: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onNavigate: (planId: number) => void;
}> = ({ plan, isDark, isUpdated, onApprove, onReject, onNavigate }) => {
  const progress = plan.totalPhases > 0 ? (plan.currentPhase / plan.totalPhases) * 100 : 0;
  const statusColor = getDeptStatusColor(plan.status);
  const statusIcon = getDeptStatusIcon(plan.status);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: isUpdated ? '0 0 0 3px rgba(66, 153, 225, 0.6)' : 'none',
      }}
      transition={{ duration: 0.3 }}
      p={3}
      borderRadius="lg"
      border="1px solid"
      borderColor={isUpdated ? 'blue.400' : isDark ? 'gray.600' : 'gray.200'}
      bg={isDark ? 'gray.800' : 'white'}
      _hover={{ borderColor: `${statusColor}.400`, shadow: 'sm' }}
      css={{
        transition: 'all 0.2s',
        cursor: 'pointer',
        ...(isUpdated && {
          animation: 'pulse-border 1.5s ease-in-out 2',
        }),
      }}
      onClick={() => onNavigate(plan.id)}
    >
      <HStack justify="space-between" mb={2}>
        <HStack>
          <Text fontSize="lg">{statusIcon}</Text>
          <VStack gap={0} align="start">
            <Text fontSize="sm" fontWeight="bold" truncate maxW="180px">
              {plan.departmentName}
            </Text>
            {plan.assignedUserName && (
              <Text fontSize="xs" color="gray.500">{plan.assignedUserName}</Text>
            )}
          </VStack>
        </HStack>
        <Badge colorPalette={statusColor} fontSize="10px">{plan.status}</Badge>
      </HStack>

      <HStack gap={1} mb={1}>
        <Text fontSize="xs" color="gray.500">Fase {plan.currentPhase}/{plan.totalPhases}</Text>
        <Progress.Root value={progress} size="xs" flex={1} borderRadius="full" colorPalette={statusColor}>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </HStack>

      {plan.itemsCount > 0 && (
        <HStack gap={3} mt={1}>
          <Text fontSize="xs" color="gray.500">
            <Icon as={FiPackage} mr={1} />{plan.itemsCount} items
          </Text>
          <Text fontSize="xs" color="green.500" fontWeight="bold">
            {formatCurrency(plan.itemsTotalBudget || 0)}
          </Text>
        </HStack>
      )}

      {/* Last modified indicator */}
      {(() => {
        const lastMod = formatLastModified(plan.lastModifiedByName, plan.updatedAt);
        return lastMod ? (
          <Text fontSize="10px" color="gray.500" mt={1} fontStyle="italic">{lastMod}</Text>
        ) : null;
      })()}

      <HStack mt={2} gap={2}>
        {plan.status === 'ENVIADO' && (
          <>
            <Button size="xs" colorPalette="green" onClick={(e) => { e.stopPropagation(); onApprove(plan.id); }}>
              Aprobar
            </Button>
            <Button size="xs" colorPalette="red" variant="outline" onClick={(e) => { e.stopPropagation(); onReject(plan.id); }}>
              Rechazar
            </Button>
          </>
        )}
        <Button
          size="xs"
          colorPalette="purple"
          variant={plan.status === 'ENVIADO' ? 'outline' : 'solid'}
          onClick={(e) => { e.stopPropagation(); onNavigate(plan.id); }}
        >
          <Icon as={FiTarget} mr={1} /> {getDeptActionLabel(plan.status)}
        </Button>
      </HStack>
    </MotionBox>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const CPPAAWorkspacePage: React.FC = () => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId?: string }>();
  const location = useLocation();
  const isMyPlansMode = location.pathname.includes('/cp/paa/my-plans');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddObserverOpen, setIsAddObserverOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isProposalsOpen, setIsProposalsOpen] = useState(false);
  const [myPlans, setMyPlans] = useState<CPPAADepartmentPlan[]>([]);

  const [workspaces, setWorkspaces] = useState<CPPAAWorkspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<CPPAAWorkspace | null>(null);
  const [dashboard, setDashboard] = useState<WorkspaceDashboard | null>(null);
  const [methodologies, setMethodologies] = useState<CPPAAMethodology[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Department filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create workspace form
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityRuc, setNewEntityRuc] = useState('');
  const [newFiscalYear, setNewFiscalYear] = useState(2026);
  const [newMethodologyId, setNewMethodologyId] = useState<number | undefined>();
  const [newTotalBudget, setNewTotalBudget] = useState('');

  // Add department form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptUser, setNewDeptUser] = useState('');
  const [newDeptBudget, setNewDeptBudget] = useState('');

  // Add observer form
  const [newObserverUserId, setNewObserverUserId] = useState('');
  const [newObserverUserName, setNewObserverUserName] = useState('');

  const bgColor = isDark ? 'gray.900' : 'gray.50';
  const cardBg = isDark ? 'gray.800' : 'white';

  const loadDashboard = useCallback(async () => {
    if (!selectedWorkspace) return;
    try {
      setRefreshing(true);
      const data = await getWorkspaceDashboard(selectedWorkspace.id);
      setDashboard(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedWorkspace]);

  // Real-time hook
  const {
    comments,
    participants,
    updatedDeptId,
    refreshComments,
    recentChanges,
    dismissChange,
  } = useWorkspaceRealTime({
    workspaceId: selectedWorkspace?.id || null,
    onDeptUpdate: loadDashboard,
    onDashboardRefresh: loadDashboard,
  });

  const loadData = useCallback(async () => {
    try {
      if (isMyPlansMode) {
        const plans = await getMyDepartmentPlans();
        setMyPlans(plans);
        setLoading(false);
        return;
      }
      const [ws, meths] = await Promise.all([
        listWorkspaces(2026),
        getActiveMethodologies(),
      ]);
      setWorkspaces(ws);
      setMethodologies(meths);
      if (ws.length > 0 && !selectedWorkspace) {
        const fromUrl = urlWorkspaceId ? ws.find(w => w.id === Number(urlWorkspaceId)) : null;
        setSelectedWorkspace(fromUrl || ws[0]);
      }
    } catch (err) {
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [isMyPlansMode, urlWorkspaceId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Filter departments
  const filteredDepartments = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.departments.filter(dept => {
      const matchesSearch = !searchTerm ||
        dept.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.assignedUserName && dept.assignedUserName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = !statusFilter || dept.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dashboard, searchTerm, statusFilter]);

  const handleCreateWorkspace = async () => {
    try {
      const ws = await createWorkspace({
        entityRuc: newEntityRuc,
        entityName: newEntityName,
        fiscalYear: newFiscalYear,
        methodologyId: newMethodologyId,
        totalBudget: newTotalBudget ? Number(newTotalBudget) : undefined,
      });
      setWorkspaces(prev => [ws, ...prev]);
      setSelectedWorkspace(ws);
      setIsCreateOpen(false);
      toaster.create({ title: 'Workspace creado', type: 'success', duration: 3000 });
    } catch (err) {
      toaster.create({ title: 'Error al crear workspace', type: 'error', duration: 3000 });
    }
  };

  const handleAddDepartment = async () => {
    if (!selectedWorkspace) return;
    try {
      await addDepartment(selectedWorkspace.id, {
        departmentName: newDeptName,
        departmentCode: newDeptCode || newDeptName.substring(0, 20).toUpperCase().replace(/\s/g, '_'),
        assignedUserName: newDeptUser || undefined,
        departmentBudget: newDeptBudget ? Number(newDeptBudget) : undefined,
      });
      await loadDashboard();
      setIsAddDeptOpen(false);
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptUser('');
      setNewDeptBudget('');
      toaster.create({ title: 'Departamento agregado', type: 'success', duration: 3000 });
    } catch (err) {
      toaster.create({ title: 'Error al agregar departamento', type: 'error', duration: 3000 });
    }
  };

  const handleAddObserver = async () => {
    if (!selectedWorkspace) return;
    try {
      await addWorkspaceObserver(selectedWorkspace.id, {
        userId: newObserverUserId,
        userName: newObserverUserName,
      });
      setIsAddObserverOpen(false);
      setNewObserverUserId('');
      setNewObserverUserName('');
      toaster.create({ title: 'Observador agregado', type: 'success', duration: 3000 });
    } catch (err) {
      toaster.create({ title: 'Error al agregar observador', type: 'error', duration: 3000 });
    }
  };

  const handleApprove = async (planId: number) => {
    try {
      await approveDepartmentPlan(planId);
      await loadDashboard();
      toaster.create({ title: 'Plan aprobado', type: 'success', duration: 3000 });
    } catch (err) {
      toaster.create({ title: 'Error al aprobar', type: 'error', duration: 3000 });
    }
  };

  const handleReject = async (planId: number) => {
    const reason = window.prompt('Razon del rechazo:');
    if (!reason) return;
    try {
      await rejectDepartmentPlan(planId, reason);
      await loadDashboard();
      toaster.create({ title: 'Plan rechazado', type: 'warning', duration: 3000 });
    } catch (err) {
      toaster.create({ title: 'Error al rechazar', type: 'error', duration: 3000 });
    }
  };

  const handleNavigateToDept = (planId: number) => {
    if (!selectedWorkspace) return;
    navigate(`/cp/paa/workspaces/${selectedWorkspace.id}/departments/${planId}`);
  };

  const handleConsolidate = async () => {
    if (!selectedWorkspace) return;
    try {
      await consolidateWorkspace(selectedWorkspace.id);
      await loadDashboard();
      toaster.create({ title: 'PAA consolidado exitosamente', type: 'success', duration: 5000 });
    } catch (err) {
      toaster.create({ title: 'Error al consolidar', description: String(err), type: 'error', duration: 5000 });
    }
  };

  // Get current user name from the workspace coordinator (simplified)
  const currentUserName = selectedWorkspace?.coordinatorUserName || 'Usuario';

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={4} bg={bgColor} minH="100vh">
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(66, 153, 225, 0); }
        }
      `}</style>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <VStack align="start" gap={0}>
          <Heading size="md" color={colors.text}>
            <Icon as={FiUsers} mr={2} />
            PAA Colaborativo - Workspaces
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Gestion colaborativa del Plan Anual de Adquisiciones por departamentos
          </Text>
        </VStack>
        <HStack>
          {/* Presence Bar */}
          {selectedWorkspace && participants.length > 0 && (
            <WorkspacePresenceBar participants={participants} />
          )}
          <Button size="sm" onClick={loadDashboard} loading={refreshing}>
            <FiRefreshCw /> Actualizar
          </Button>
          {selectedWorkspace && (
            <>
              <Button
                size="sm"
                variant="outline"
                colorPalette="teal"
                onClick={() => setIsProposalsOpen(!isProposalsOpen)}
              >
                <FiGitPullRequest /> Propuestas
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="blue"
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              >
                <FiMessageCircle /> Observaciones ({comments.length})
              </Button>
            </>
          )}
          <Button size="sm" colorPalette="blue" onClick={() => setIsCreateOpen(true)}>
            <FiPlus /> Nuevo Workspace
          </Button>
        </HStack>
      </Flex>

      {/* Workspace selector */}
      {workspaces.length > 0 && (
        <HStack mb={4} flexWrap="wrap" gap={2}>
          {workspaces.map(ws => (
            <Button
              key={ws.id}
              size="sm"
              variant={selectedWorkspace?.id === ws.id ? 'solid' : 'outline'}
              colorPalette={getWorkspaceStatusColor(ws.status)}
              onClick={() => setSelectedWorkspace(ws)}
            >
              {ws.entityName} ({ws.fiscalYear})
            </Button>
          ))}
        </HStack>
      )}

      {/* Dashboard */}
      {selectedWorkspace && dashboard && (
        <VStack gap={4} align="stretch">
          {/* Workspace info */}
          <Box bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <VStack align="start" gap={0}>
                <Heading size="sm">{selectedWorkspace.entityName}</Heading>
                <Text fontSize="xs" color="gray.500">
                  PAA {selectedWorkspace.fiscalYear} | RUC: {selectedWorkspace.entityRuc} | Codigo: {selectedWorkspace.workspaceCode}
                </Text>
              </VStack>
              <HStack>
                <Badge colorPalette={getWorkspaceStatusColor(selectedWorkspace.status)} fontSize="sm" px={3} py={1}>
                  {selectedWorkspace.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setIsAddObserverOpen(true)}>
                  <FiUserPlus /> Agregar Observador
                </Button>
                {selectedWorkspace.status === 'ABIERTO' && (
                  <Button size="sm" colorPalette="orange" onClick={handleConsolidate}>
                    Consolidar PAA
                  </Button>
                )}
              </HStack>
            </Flex>
          </Box>

          {/* Stats cards */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
              <Stat.Root>
                <Stat.Label fontSize="xs">Total Items</Stat.Label>
                <Stat.ValueText fontSize="2xl" color="blue.500">{dashboard.totalItems}</Stat.ValueText>
                <Stat.HelpText fontSize="xs">de todos los departamentos</Stat.HelpText>
              </Stat.Root>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
              <Stat.Root>
                <Stat.Label fontSize="xs">Presupuesto Total</Stat.Label>
                <Stat.ValueText fontSize="xl" color="green.500">{formatCurrency(dashboard.totalBudget)}</Stat.ValueText>
                <Stat.HelpText fontSize="xs">consolidado</Stat.HelpText>
              </Stat.Root>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
              <Stat.Root>
                <Stat.Label fontSize="xs">Departamentos</Stat.Label>
                <Stat.ValueText fontSize="2xl">{dashboard.departments.length}</Stat.ValueText>
                <Stat.HelpText fontSize="xs">
                  {dashboard.completedDepts} listos, {dashboard.inProgressDepts} en progreso
                </Stat.HelpText>
              </Stat.Root>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="lg" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
              <Stat.Root>
                <Stat.Label fontSize="xs">Progreso General</Stat.Label>
                <Stat.ValueText fontSize="2xl" color={dashboard.completedDepts === dashboard.departments.length ? 'green.500' : 'orange.500'}>
                  {dashboard.departments.length > 0 ? Math.round((dashboard.completedDepts / dashboard.departments.length) * 100) : 0}%
                </Stat.ValueText>
                <Stat.HelpText fontSize="xs">{dashboard.pendingDepts} pendientes</Stat.HelpText>
              </Stat.Root>
            </Box>
          </SimpleGrid>

          {/* Department cards + Add button + Filter */}
          <Box>
            <HStack justify="space-between" mb={3}>
              <Text fontWeight="bold" fontSize="sm" color={colors.text}>
                Progreso por Departamento
              </Text>
              <Button size="xs" onClick={() => setIsAddDeptOpen(true)}>
                <FiPlus /> Agregar Departamento
              </Button>
            </HStack>

            {/* Department filter */}
            {dashboard.departments.length > 3 && (
              <WorkspaceDeptFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            )}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
              <AnimatePresence>
                {filteredDepartments.map(plan => (
                  <DeptCard
                    key={plan.id}
                    plan={plan}
                    isDark={isDark}
                    isUpdated={updatedDeptId === plan.id}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onNavigate={handleNavigateToDept}
                  />
                ))}
              </AnimatePresence>
            </SimpleGrid>

            {filteredDepartments.length === 0 && dashboard.departments.length > 0 && (
              <Text textAlign="center" color="gray.500" py={4} fontSize="sm">
                No se encontraron departamentos con los filtros aplicados
              </Text>
            )}
          </Box>
        </VStack>
      )}

      {/* "Mis Planes" mode */}
      {isMyPlansMode && (
        <VStack gap={4} align="stretch">
          <Heading size="md" color={colors.text}>
            <Icon as={FiFileText} mr={2} />
            Mis Planes PAA
          </Heading>
          {myPlans.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No tienes planes de departamento asignados
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
              {myPlans.map(plan => (
                <DeptCard
                  key={plan.id}
                  plan={plan}
                  isDark={isDark}
                  isUpdated={false}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onNavigate={(planId) => {
                    const p = myPlans.find(mp => mp.id === planId);
                    const wsId = p?.workspaceId || 0;
                    navigate(`/cp/paa/workspaces/${wsId}/departments/${planId}`);
                  }}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      )}

      {/* Empty state */}
      {!isMyPlansMode && workspaces.length === 0 && (
        <Flex direction="column" align="center" justify="center" h="300px" gap={4}>
          <Icon as={FiUsers} boxSize={12} color="gray.400" />
          <Text color="gray.500">No hay workspaces creados para el anio fiscal actual</Text>
          <Button colorPalette="blue" onClick={() => setIsCreateOpen(true)}>
            <FiPlus /> Crear Primer Workspace
          </Button>
        </Flex>
      )}

      {/* Comments Panel (lateral) */}
      {isCommentsOpen && selectedWorkspace && (
        <WorkspaceCommentsPanel
          workspaceId={selectedWorkspace.id}
          comments={comments}
          currentUserName={currentUserName}
          onCommentAdded={refreshComments}
          onClose={() => setIsCommentsOpen(false)}
        />
      )}

      {/* Create workspace dialog */}
      <DialogRoot open={isCreateOpen} onOpenChange={(e) => setIsCreateOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent bg={cardBg} maxW="lg">
          <DialogHeader>
            <DialogTitle>Crear Workspace PAA Colaborativo</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={3}>
              <Field.Root required>
                <Field.Label fontSize="sm">Nombre de la Entidad</Field.Label>
                <Input value={newEntityName} onChange={e => setNewEntityName(e.target.value)} placeholder="Ministerio de Salud Publica" />
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">RUC</Field.Label>
                <Input value={newEntityRuc} onChange={e => setNewEntityRuc(e.target.value)} placeholder="1760013210001" />
              </Field.Root>
              <HStack w="full">
                <Field.Root>
                  <Field.Label fontSize="sm">Anio Fiscal</Field.Label>
                  <Input type="number" value={newFiscalYear} onChange={e => setNewFiscalYear(Number(e.target.value))} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">Presupuesto Total</Field.Label>
                  <Input value={newTotalBudget} onChange={e => setNewTotalBudget(e.target.value)} placeholder="200000000" />
                </Field.Root>
              </HStack>
              <Field.Root>
                <Field.Label fontSize="sm">Metodologia</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={newMethodologyId || ''}
                    onChange={e => setNewMethodologyId(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Seleccione metodologia...</option>
                    {methodologies.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.totalPhases} fases){m.isDefault ? ' - Por defecto' : ''}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost" mr={3}>Cancelar</Button>
            </DialogActionTrigger>
            <Button colorPalette="blue" onClick={handleCreateWorkspace} disabled={!newEntityName || !newEntityRuc}>
              Crear Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Add department dialog */}
      <DialogRoot open={isAddDeptOpen} onOpenChange={(e) => setIsAddDeptOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent bg={cardBg}>
          <DialogHeader>
            <DialogTitle>Agregar Departamento</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={3}>
              <Field.Root required>
                <Field.Label fontSize="sm">Nombre del Departamento</Field.Label>
                <Input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Direccion Administrativa" />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm">Codigo</Field.Label>
                <Input value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} placeholder="DIR_ADMIN" />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm">Responsable</Field.Label>
                <Input value={newDeptUser} onChange={e => setNewDeptUser(e.target.value)} placeholder="Nombre del responsable" />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm">Presupuesto Departamental</Field.Label>
                <Input value={newDeptBudget} onChange={e => setNewDeptBudget(e.target.value)} placeholder="50000000" />
              </Field.Root>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost" mr={3}>Cancelar</Button>
            </DialogActionTrigger>
            <Button colorPalette="blue" onClick={handleAddDepartment} disabled={!newDeptName}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Proposals Panel (lateral) */}
      {isProposalsOpen && selectedWorkspace && (
        <ProposalPanel
          workspaceId={selectedWorkspace.id}
          currentUserName={currentUserName}
          isCoordinator={true}
          onClose={() => setIsProposalsOpen(false)}
        />
      )}

      {/* Realtime change toasts */}
      <RealtimeChangeToastStack changes={recentChanges} onDismiss={dismissChange} />

      {/* Add observer dialog */}
      <DialogRoot open={isAddObserverOpen} onOpenChange={(e) => setIsAddObserverOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent bg={cardBg}>
          <DialogHeader>
            <DialogTitle>Agregar Observador Externo</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={3}>
              <Field.Root required>
                <Field.Label fontSize="sm">ID de Usuario</Field.Label>
                <Input value={newObserverUserId} onChange={e => setNewObserverUserId(e.target.value)} placeholder="usuario@entidad.gob.ec" />
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">Nombre</Field.Label>
                <Input value={newObserverUserName} onChange={e => setNewObserverUserName(e.target.value)} placeholder="Nombre del observador" />
              </Field.Root>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost" mr={3}>Cancelar</Button>
            </DialogActionTrigger>
            <Button colorPalette="blue" onClick={handleAddObserver} disabled={!newObserverUserId || !newObserverUserName}>
              <FiEye /> Agregar Observador
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default CPPAAWorkspacePage;
