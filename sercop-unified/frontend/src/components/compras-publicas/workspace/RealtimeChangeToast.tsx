/**
 * RealtimeChangeToast — Glassmorphism toast stack for "who changed what" in workspace.
 * Shows bottom-right fixed stack with auto-dismiss (6s), progress bar, pause on hover.
 * Uses Emotion keyframes (no framer-motion) for consistency with AlertNotificationToast.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, HStack, VStack, Text, Icon, IconButton } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiEdit,
  FiPackage,
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiMessageCircle,
  FiX,
  FiGitPullRequest,
  FiThumbsUp,
  FiZap,
} from 'react-icons/fi';
import type { RealtimeChange, RealtimeChangeType } from '../../../hooks/useWorkspaceRealTime';

// ============================================================================
// Config by change type
// ============================================================================

interface ChangeTypeConfig {
  color: string;
  icon: React.ElementType;
  label: string;
}

const CHANGE_TYPE_CONFIG: Record<RealtimeChangeType, ChangeTypeConfig> = {
  phase_edit: { color: 'blue.400', icon: FiEdit, label: 'Editó datos de fase' },
  items_edit: { color: 'purple.400', icon: FiPackage, label: 'Editó items' },
  submitted: { color: 'yellow.500', icon: FiSend, label: 'Envió plan para revisión' },
  approved: { color: 'green.400', icon: FiCheckCircle, label: 'Aprobó el plan' },
  rejected: { color: 'red.400', icon: FiXCircle, label: 'Rechazó el plan' },
  status_change: { color: 'orange.400', icon: FiRefreshCw, label: 'Cambió estado' },
  comment: { color: 'cyan.400', icon: FiMessageCircle, label: 'Añadió un comentario' },
  proposal_created: { color: 'teal.400', icon: FiGitPullRequest, label: 'Creó una propuesta' },
  proposal_voted: { color: 'blue.300', icon: FiThumbsUp, label: 'Votó en propuesta' },
  proposal_applied: { color: 'green.300', icon: FiZap, label: 'Aplicó propuesta' },
};

// ============================================================================
// Keyframes
// ============================================================================

const slideInFromRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
`;

const shrinkProgress = keyframes`
  from { width: 100%; }
  to   { width: 0%; }
`;

// ============================================================================
// Avatar helper — colored circle with initials
// ============================================================================

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#4299E1', '#48BB78', '#ED8936', '#E53E3E',
    '#9F7AEA', '#38B2AC', '#DD6B20', '#D53F8C',
    '#3182CE', '#2F855A',
  ];
  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// Single toast
// ============================================================================

const DISMISS_MS = 6000;

interface SingleToastProps {
  change: RealtimeChange;
  onDismiss: (id: string) => void;
}

function SingleToast({ change, onDismiss }: SingleToastProps) {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startRef = useRef(Date.now());
  const remainRef = useRef(DISMISS_MS);

  const startTimer = useCallback(() => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => onDismiss(change.id), remainRef.current);
  }, [change.id, onDismiss]);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [startTimer]);

  const handleMouseEnter = () => {
    setPaused(true);
    clearTimeout(timerRef.current);
    remainRef.current -= Date.now() - startRef.current;
    if (remainRef.current < 500) remainRef.current = 500;
  };

  const handleMouseLeave = () => {
    setPaused(false);
    startTimer();
  };

  const cfg = CHANGE_TYPE_CONFIG[change.changeType] || CHANGE_TYPE_CONFIG.phase_edit;
  const initials = getInitials(change.modifiedByName);
  const avatarBg = hashColor(change.modifiedByName);

  const timeAgo = getRelativeTime(change.timestamp);

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      css={{
        animation: `${slideInFromRight} 0.35s ease-out`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      bg="rgba(26, 32, 44, 0.85)"
      borderRadius="lg"
      borderLeft="4px solid"
      borderLeftColor={cfg.color}
      boxShadow="0 8px 32px rgba(0,0,0,0.3)"
      overflow="hidden"
      maxW="340px"
      minW="280px"
      position="relative"
    >
      <HStack p={3} gap={3} align="start">
        {/* Avatar */}
        <Box
          w="36px"
          h="36px"
          borderRadius="full"
          bg={avatarBg}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text fontSize="xs" fontWeight="bold" color="white">{initials}</Text>
        </Box>

        {/* Content */}
        <VStack gap={0} align="start" flex={1} minW={0}>
          <HStack gap={1}>
            <Icon as={cfg.icon} color={cfg.color} boxSize="14px" />
            <Text fontSize="sm" fontWeight="bold" color="white" truncate maxW="200px">
              {change.modifiedByName || 'Usuario'}
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.300">{cfg.label}</Text>
          {change.departmentName && (
            <Text fontSize="xs" color="gray.400" truncate maxW="220px">
              {change.departmentName}
            </Text>
          )}
          <Text fontSize="10px" color="gray.500" mt={0.5}>{timeAgo}</Text>
        </VStack>

        {/* Close */}
        <IconButton
          aria-label="Cerrar"
          variant="ghost"
          size="xs"
          color="gray.400"
          _hover={{ color: 'white' }}
          onClick={() => onDismiss(change.id)}
          position="absolute"
          top={1}
          right={1}
        >
          <FiX />
        </IconButton>
      </HStack>

      {/* Progress bar */}
      <Box
        h="2px"
        bg={cfg.color}
        css={{
          animation: paused ? 'none' : `${shrinkProgress} ${DISMISS_MS}ms linear forwards`,
        }}
      />
    </Box>
  );
}

// ============================================================================
// Toast stack container
// ============================================================================

const MAX_VISIBLE = 3;

interface RealtimeChangeToastStackProps {
  changes: RealtimeChange[];
  onDismiss: (id: string) => void;
}

export function RealtimeChangeToastStack({ changes, onDismiss }: RealtimeChangeToastStackProps) {
  const visible = changes.slice(0, MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <VStack
      position="fixed"
      bottom={6}
      right={6}
      zIndex={1500}
      gap={2}
      align="flex-end"
    >
      {visible.map((change, idx) => (
        <Box key={change.id} style={{ opacity: 1 - idx * 0.1 }}>
          <SingleToast change={change} onDismiss={onDismiss} />
        </Box>
      ))}
    </VStack>
  );
}

// ============================================================================
// Helper
// ============================================================================

function getRelativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return 'Ahora';
  if (diff < 60) return `hace ${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs}h`;
}

/**
 * Format "last modified" info for dept cards: "María L. · hace 2 min"
 */
export function formatLastModified(name: string | null | undefined, updatedAt: string | null | undefined): string | null {
  if (!name || !updatedAt) return null;
  const diff = Date.now() - new Date(updatedAt).getTime();
  if (diff > 24 * 60 * 60 * 1000) return null; // > 24h
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `${name} · ahora`;
  if (mins < 60) return `${name} · hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${name} · hace ${hrs}h`;
}
