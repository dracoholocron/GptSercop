/**
 * ProposalPanel — Lateral panel showing proposals with voting.
 * Same pattern as WorkspaceCommentsPanel: fixed right side overlay.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Heading,
  Textarea,
  Separator,
  Progress,
  Icon,
} from '@chakra-ui/react';
import {
  FiX,
  FiGitPullRequest,
  FiThumbsUp,
  FiThumbsDown,
  FiZap,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  type CPPAAWorkspaceProposal,
  getProposals,
  getProposalDetail,
  voteOnProposal,
  applyProposal,
  withdrawProposal,
} from '../../../services/cpWorkspaceService';
import { toaster } from '../../ui/toaster';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  APPLIED: 'purple',
  WITHDRAWN: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  APPLIED: 'Aplicada',
  WITHDRAWN: 'Retirada',
};

interface ProposalPanelProps {
  workspaceId: number;
  currentUserName: string;
  isCoordinator: boolean;
  onClose: () => void;
}

export function ProposalPanel({
  workspaceId,
  currentUserName,
  isCoordinator,
  onClose,
}: ProposalPanelProps) {
  const { isDark } = useTheme();
  const [proposals, setProposals] = useState<CPPAAWorkspaceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [voteComment, setVoteComment] = useState('');

  const bg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.600' : 'gray.200';

  const loadProposals = useCallback(async () => {
    try {
      const data = await getProposals(workspaceId);
      setProposals(data);
    } catch (err) {
      console.error('Error loading proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleVote = async (proposalId: number, voteType: 'APPROVE' | 'REJECT') => {
    try {
      await voteOnProposal(workspaceId, proposalId, {
        voteType,
        comment: voteComment || undefined,
        voterName: currentUserName,
      });
      setVoteComment('');
      toaster.create({ title: `Voto registrado: ${voteType === 'APPROVE' ? 'A favor' : 'En contra'}`, type: 'success', duration: 3000 });
      await loadProposals();
    } catch (err: any) {
      toaster.create({ title: err?.message || 'Error al votar', type: 'error', duration: 3000 });
    }
  };

  const handleApply = async (proposalId: number) => {
    try {
      await applyProposal(workspaceId, proposalId);
      toaster.create({ title: 'Propuesta aplicada al plan', type: 'success', duration: 3000 });
      await loadProposals();
    } catch (err: any) {
      toaster.create({ title: err?.message || 'Error al aplicar', type: 'error', duration: 3000 });
    }
  };

  const handleWithdraw = async (proposalId: number) => {
    try {
      await withdrawProposal(workspaceId, proposalId);
      toaster.create({ title: 'Propuesta retirada', type: 'info', duration: 3000 });
      await loadProposals();
    } catch (err: any) {
      toaster.create({ title: err?.message || 'Error al retirar', type: 'error', duration: 3000 });
    }
  };

  const handleExpand = async (proposalId: number) => {
    if (expandedId === proposalId) {
      setExpandedId(null);
      return;
    }
    try {
      const detail = await getProposalDetail(workspaceId, proposalId);
      setProposals(prev => prev.map(p => p.id === proposalId ? detail : p));
      setExpandedId(proposalId);
    } catch (err) {
      console.error('Error loading proposal detail:', err);
    }
  };

  // Group: OPEN first, then rest
  const openProposals = proposals.filter(p => p.status === 'OPEN');
  const otherProposals = proposals.filter(p => p.status !== 'OPEN');

  return (
    <>
    {/* Backdrop */}
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.400"
      zIndex={1399}
      onClick={onClose}
    />
    <Box
      position="fixed"
      top={0}
      right={0}
      h="100vh"
      w={{ base: '100%', md: '400px' }}
      bg={bg}
      borderLeft="1px solid"
      borderColor={borderColor}
      zIndex={1400}
      display="flex"
      flexDirection="column"
      boxShadow="-4px 0 20px rgba(0,0,0,0.3)"
    >
      {/* Header */}
      <HStack p={3} borderBottom="1px solid" borderColor={borderColor} justify="space-between">
        <HStack>
          <Icon as={FiGitPullRequest} color="teal.400" />
          <Heading size="sm">Propuestas ({proposals.length})</Heading>
        </HStack>
        <IconButton aria-label="Cerrar" size="sm" variant="ghost" onClick={onClose}>
          <FiX />
        </IconButton>
      </HStack>

      {/* Proposals list */}
      <Box flex={1} overflowY="auto" p={3}>
        {loading ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>Cargando...</Text>
        ) : proposals.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
            No hay propuestas aún
          </Text>
        ) : (
          <VStack gap={3} align="stretch">
            {/* Open proposals */}
            {openProposals.length > 0 && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="blue.400">Abiertas ({openProposals.length})</Text>
                {openProposals.map(p => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    isExpanded={expandedId === p.id}
                    isDark={isDark}
                    isCoordinator={isCoordinator}
                    currentUserName={currentUserName}
                    voteComment={voteComment}
                    onToggleExpand={() => handleExpand(p.id)}
                    onVote={handleVote}
                    onApply={handleApply}
                    onWithdraw={handleWithdraw}
                    onVoteCommentChange={setVoteComment}
                  />
                ))}
              </>
            )}

            {/* Other proposals */}
            {otherProposals.length > 0 && (
              <>
                {openProposals.length > 0 && <Separator />}
                <Text fontSize="xs" fontWeight="bold" color="gray.500">Resueltas ({otherProposals.length})</Text>
                {otherProposals.map(p => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    isExpanded={expandedId === p.id}
                    isDark={isDark}
                    isCoordinator={isCoordinator}
                    currentUserName={currentUserName}
                    voteComment={voteComment}
                    onToggleExpand={() => handleExpand(p.id)}
                    onVote={handleVote}
                    onApply={handleApply}
                    onWithdraw={handleWithdraw}
                    onVoteCommentChange={setVoteComment}
                  />
                ))}
              </>
            )}
          </VStack>
        )}
      </Box>
    </Box>
    </>
  );
}

// ============================================================================
// ProposalCard sub-component
// ============================================================================

interface ProposalCardProps {
  proposal: CPPAAWorkspaceProposal;
  isExpanded: boolean;
  isDark: boolean;
  isCoordinator: boolean;
  currentUserName: string;
  voteComment: string;
  onToggleExpand: () => void;
  onVote: (id: number, type: 'APPROVE' | 'REJECT') => void;
  onApply: (id: number) => void;
  onWithdraw: (id: number) => void;
  onVoteCommentChange: (v: string) => void;
}

function ProposalCard({
  proposal,
  isExpanded,
  isDark,
  isCoordinator,
  currentUserName,
  voteComment,
  onToggleExpand,
  onVote,
  onApply,
  onWithdraw,
  onVoteCommentChange,
}: ProposalCardProps) {
  const p = proposal;
  const totalVotes = p.votesApprove + p.votesReject;
  const approvePercent = p.votesRequired > 0 ? (p.votesApprove / p.votesRequired) * 100 : 0;
  const isProposer = p.proposerName === currentUserName;

  return (
    <Box
      p={3}
      borderRadius="md"
      border="1px solid"
      borderColor={isDark ? 'gray.600' : 'gray.200'}
      bg={isDark ? 'gray.800' : 'gray.50'}
    >
      {/* Header */}
      <HStack justify="space-between" mb={1}>
        <VStack gap={0} align="start">
          <HStack>
            <Text fontSize="xs" fontWeight="bold">{p.proposerName}</Text>
            <Badge colorPalette={STATUS_COLORS[p.status] || 'gray'} fontSize="9px">
              {STATUS_LABELS[p.status] || p.status}
            </Badge>
          </HStack>
          <Text fontSize="10px" color="gray.500">
            Campo: {p.anchorField} (Fase {p.anchorPhaseIndex + 1})
          </Text>
        </VStack>
        <IconButton
          aria-label="Expandir"
          size="xs"
          variant="ghost"
          onClick={onToggleExpand}
        >
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </IconButton>
      </HStack>

      {/* Vote progress bar */}
      <HStack gap={2} mt={1}>
        <Text fontSize="10px" color="green.400">{p.votesApprove}</Text>
        <Progress.Root value={Math.min(approvePercent, 100)} size="xs" flex={1} borderRadius="full" colorPalette="green">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        <Text fontSize="10px" color="gray.500">{p.votesRequired} req</Text>
        <Text fontSize="10px" color="red.400">{p.votesReject}</Text>
      </HStack>

      {/* Expanded section */}
      {isExpanded && (
        <VStack mt={3} gap={2} align="stretch">
          {/* Current vs Proposed */}
          <HStack gap={2} align="start">
            <VStack flex={1} align="stretch" gap={0}>
              <Text fontSize="9px" fontWeight="bold" color="gray.500">ACTUAL</Text>
              <Box p={2} borderRadius="sm" bg={isDark ? 'gray.700' : 'white'} border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.300'}>
                <Text fontSize="xs" whiteSpace="pre-wrap">{p.currentValue || '(vacío)'}</Text>
              </Box>
            </VStack>
            <VStack flex={1} align="stretch" gap={0}>
              <Text fontSize="9px" fontWeight="bold" color="teal.400">PROPUESTO</Text>
              <Box p={2} borderRadius="sm" bg={isDark ? 'gray.700' : 'white'} border="1px solid" borderColor="teal.300">
                <Text fontSize="xs" whiteSpace="pre-wrap">{p.proposedValue}</Text>
              </Box>
            </VStack>
          </HStack>

          {p.justification && (
            <Box>
              <Text fontSize="9px" fontWeight="bold" color="gray.500">JUSTIFICACIÓN</Text>
              <Text fontSize="xs" color="gray.400">{p.justification}</Text>
            </Box>
          )}

          {/* Votes detail */}
          {p.votes && p.votes.length > 0 && (
            <Box>
              <Text fontSize="9px" fontWeight="bold" color="gray.500" mb={1}>VOTOS ({p.votes.length})</Text>
              {p.votes.map(v => (
                <HStack key={v.id} gap={1} mb={0.5}>
                  <Badge
                    colorPalette={v.voteType === 'APPROVE' ? 'green' : 'red'}
                    fontSize="8px"
                  >
                    {v.voteType === 'APPROVE' ? '✓' : '✗'}
                  </Badge>
                  <Text fontSize="10px">{v.voterName}</Text>
                  {v.comment && <Text fontSize="10px" color="gray.500">— {v.comment}</Text>}
                </HStack>
              ))}
            </Box>
          )}

          {/* Actions */}
          {p.status === 'OPEN' && (
            <VStack gap={2} align="stretch">
              <Textarea
                size="xs"
                placeholder="Comentario de voto (opcional)..."
                value={voteComment}
                onChange={e => onVoteCommentChange(e.target.value)}
                rows={1}
                fontSize="xs"
              />
              <HStack gap={2}>
                <Button size="xs" colorPalette="green" flex={1} onClick={() => onVote(p.id, 'APPROVE')}>
                  <FiThumbsUp /> A favor
                </Button>
                <Button size="xs" colorPalette="red" variant="outline" flex={1} onClick={() => onVote(p.id, 'REJECT')}>
                  <FiThumbsDown /> En contra
                </Button>
              </HStack>
              {isProposer && (
                <Button size="xs" variant="ghost" colorPalette="gray" onClick={() => onWithdraw(p.id)}>
                  Retirar propuesta
                </Button>
              )}
            </VStack>
          )}

          {p.status === 'APPROVED' && isCoordinator && (
            <Button size="xs" colorPalette="purple" onClick={() => onApply(p.id)}>
              <FiZap /> Aplicar cambio al plan
            </Button>
          )}
        </VStack>
      )}
    </Box>
  );
}
