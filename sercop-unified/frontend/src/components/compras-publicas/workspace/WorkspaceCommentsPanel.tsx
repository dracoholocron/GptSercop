/**
 * WorkspaceCommentsPanel - Lateral panel for workspace observations/chat
 */
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Icon,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { FiSend, FiX, FiMessageCircle } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  type CPPAAWorkspaceComment,
  addWorkspaceComment,
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

interface WorkspaceCommentsPanelProps {
  workspaceId: number;
  comments: CPPAAWorkspaceComment[];
  currentUserName: string;
  currentUserRole?: string;
  onCommentAdded?: () => void;
  onClose: () => void;
}

export const WorkspaceCommentsPanel: React.FC<WorkspaceCommentsPanelProps> = ({
  workspaceId,
  comments,
  currentUserName,
  currentUserRole = 'COORDINATOR',
  onCommentAdded,
  onClose,
}) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await addWorkspaceComment(workspaceId, {
        content: newComment.trim(),
        authorUserName: currentUserName,
        authorRole: currentUserRole,
      });
      setNewComment('');
      onCommentAdded?.();
    } catch (err) {
      console.error('Error sending comment:', err);
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

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      bottom={0}
      w={{ base: '100%', md: '380px' }}
      bg={isDark ? 'gray.800' : 'white'}
      borderLeft="1px solid"
      borderColor={isDark ? 'gray.600' : 'gray.200'}
      zIndex={1000}
      display="flex"
      flexDirection="column"
      boxShadow="xl"
    >
      {/* Header */}
      <HStack justify="space-between" p={3} borderBottom="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
        <HStack>
          <Icon as={FiMessageCircle} color="blue.500" />
          <Heading size="sm">Observaciones</Heading>
          <Badge colorPalette="blue" fontSize="xs">{comments.length}</Badge>
        </HStack>
        <Button size="xs" variant="ghost" onClick={onClose}>
          <Icon as={FiX} />
        </Button>
      </HStack>

      {/* Comments list */}
      <Box ref={scrollRef} flex={1} overflowY="auto" p={3}>
        <VStack gap={3} align="stretch">
          {comments.length === 0 && (
            <Text textAlign="center" color="gray.500" fontSize="sm" py={8}>
              No hay observaciones aun. Se el primero en escribir.
            </Text>
          )}
          {comments.map((comment, idx) => {
            const showDate = idx === 0 || formatDate(comment.createdAt) !== formatDate(comments[idx - 1].createdAt);
            return (
              <Box key={comment.id || idx}>
                {showDate && (
                  <Text textAlign="center" fontSize="xs" color="gray.500" my={2}>
                    {formatDate(comment.createdAt)}
                  </Text>
                )}
                <Box
                  p={2}
                  borderRadius="lg"
                  bg={isDark ? 'gray.700' : 'gray.50'}
                  borderLeft="3px solid"
                  borderColor={`${roleColors[comment.authorRole] || 'gray'}.400`}
                >
                  <HStack justify="space-between" mb={1}>
                    <HStack gap={1}>
                      <Text fontSize="xs" fontWeight="bold" color={colors.text}>
                        {comment.authorUserName}
                      </Text>
                      <Badge
                        colorPalette={roleColors[comment.authorRole] || 'gray'}
                        fontSize="9px"
                        px={1}
                      >
                        {roleLabels[comment.authorRole] || comment.authorRole}
                      </Badge>
                    </HStack>
                    <Text fontSize="10px" color="gray.500">
                      {formatTime(comment.createdAt)}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={colors.text}>
                    {comment.content}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </VStack>
      </Box>

      {/* Input */}
      <HStack p={3} borderTop="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
        <Input
          placeholder="Escribir observacion..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          size="sm"
          flex={1}
        />
        <Button
          size="sm"
          colorPalette="blue"
          onClick={handleSend}
          loading={sending}
          disabled={!newComment.trim()}
        >
          <Icon as={FiSend} />
        </Button>
      </HStack>
    </Box>
  );
};

export default WorkspaceCommentsPanel;
