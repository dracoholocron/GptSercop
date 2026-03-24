/**
 * FieldCommentPopover — Inline comments popover for a specific field in the mural.
 * Positioned as a floating card below the field, shows comment thread with replies.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { FiSend, FiX } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  type CPPAAWorkspaceComment,
  getFieldComments,
  addFieldComment,
} from '../../../services/cpWorkspaceService';

const roleColors: Record<string, string> = {
  COORDINATOR: 'blue',
  DEPARTMENT: 'green',
  OBSERVER: 'purple',
};

const roleLabels: Record<string, string> = {
  COORDINATOR: 'Coordinador',
  DEPARTMENT: 'Departamento',
  OBSERVER: 'Observador',
};

interface FieldCommentPopoverProps {
  workspaceId: number;
  departmentPlanId: number;
  fieldCode: string;
  phaseIdx: number;
  currentUserName?: string;
  currentUserRole?: string;
  onClose: () => void;
}

export function FieldCommentPopover({
  workspaceId,
  departmentPlanId,
  fieldCode,
  phaseIdx,
  currentUserName,
  currentUserRole,
  onClose,
}: FieldCommentPopoverProps) {
  const { isDark } = useTheme();
  const [comments, setComments] = useState<CPPAAWorkspaceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    try {
      const data = await getFieldComments(workspaceId, departmentPlanId, fieldCode, phaseIdx);
      setComments(data);
    } catch (err) {
      console.error('Error loading field comments:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, departmentPlanId, fieldCode, phaseIdx]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      await addFieldComment(workspaceId, {
        departmentPlanId,
        anchorField: fieldCode,
        anchorPhaseIndex: phaseIdx,
        content: newComment.trim(),
        authorUserName: currentUserName,
        authorRole: currentUserRole,
      });
      setNewComment('');
      await loadComments();
    } catch (err) {
      console.error('Error sending field comment:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const bg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.600' : 'gray.200';

  return (
    <Box
      position="absolute"
      top="100%"
      right={0}
      mt={1}
      zIndex={20}
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      boxShadow="xl"
      w="320px"
      maxH="360px"
      display="flex"
      flexDirection="column"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <HStack p={2} justify="space-between" borderBottom="1px solid" borderColor={borderColor}>
        <Text fontSize="xs" fontWeight="bold">
          Comentarios — {fieldCode}
        </Text>
        <IconButton
          aria-label="Cerrar"
          size="xs"
          variant="ghost"
          onClick={onClose}
        >
          <FiX />
        </IconButton>
      </HStack>

      {/* Comments list */}
      <Box ref={scrollRef} flex={1} overflowY="auto" p={2} maxH="240px">
        {loading ? (
          <Spinner size="sm" mx="auto" display="block" mt={4} />
        ) : comments.length === 0 ? (
          <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>
            Sin comentarios aún
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {comments.map(c => {
              const isReply = !!c.parentCommentId;
              return (
                <Box
                  key={c.id}
                  p={2}
                  borderRadius="md"
                  bg={isDark ? 'gray.700' : 'gray.50'}
                  ml={isReply ? 4 : 0}
                  borderLeft={isReply ? '2px solid' : undefined}
                  borderLeftColor={isReply ? 'blue.300' : undefined}
                >
                  <HStack gap={1} mb={0.5}>
                    <Text fontSize="xs" fontWeight="bold">{c.authorUserName}</Text>
                    <Badge
                      colorPalette={roleColors[c.authorRole] || 'gray'}
                      fontSize="8px"
                      px={1}
                    >
                      {roleLabels[c.authorRole] || c.authorRole}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" whiteSpace="pre-wrap">{c.content}</Text>
                  <Text fontSize="9px" color="gray.500" mt={0.5}>
                    {new Date(c.createdAt).toLocaleString('es-EC', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </Text>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Input */}
      <HStack p={2} borderTop="1px solid" borderColor={borderColor}>
        <Input
          size="xs"
          placeholder="Escribir comentario..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          flex={1}
        />
        <IconButton
          aria-label="Enviar"
          size="xs"
          colorPalette="blue"
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          loading={sending}
        >
          <FiSend />
        </IconButton>
      </HStack>
    </Box>
  );
}
