/**
 * FieldCommentIcon - Per-field comment icon for approval workflow
 *
 * Modes:
 * - approver: Can add/edit/remove comments on fields. Icon is gray (no comment) or blue (with comment).
 * - creator: Read-only view of comments. Icon is orange with pulse animation.
 */
import { useState } from 'react';
import {
  Box,
  Text,
  Textarea,
  Button,
  HStack,
  VStack,
  IconButton,
  Popover,
} from '@chakra-ui/react';
import { FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

export interface FieldCommentData {
  comment: string;
  commentedAt: string;
  commentedBy: string;
}

interface FieldCommentIconProps {
  fieldCode: string;
  fieldName: string;
  comment?: FieldCommentData;
  onSaveComment?: (fieldCode: string, comment: string) => void;
  onRemoveComment?: (fieldCode: string) => void;
  mode: 'approver' | 'creator';
}

export const FieldCommentIcon: React.FC<FieldCommentIconProps> = ({
  fieldCode,
  fieldName,
  comment,
  onSaveComment,
  onRemoveComment,
  mode,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [draft, setDraft] = useState(comment?.comment || '');
  const [isOpen, setIsOpen] = useState(false);

  const hasComment = !!comment?.comment;

  const handleSave = () => {
    if (draft.trim() && onSaveComment) {
      onSaveComment(fieldCode, draft.trim());
      setIsOpen(false);
    }
  };

  const handleRemove = () => {
    if (onRemoveComment) {
      onRemoveComment(fieldCode);
      setDraft('');
      setIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (mode === 'approver') {
      setDraft(comment?.comment || '');
    }
    setIsOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  // Approver mode: teal (no comment) or blue (with comment)
  const iconColor = mode === 'approver'
    ? (hasComment ? 'blue.500' : 'teal.500')
    : 'orange.500';

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      positioning={{ placement: 'bottom-end' }}
    >
      <Popover.Trigger asChild>
        <IconButton
          aria-label={t('fieldComments.addComment', 'Agregar comentario')}
          size="sm"
          variant="ghost"
          color={iconColor}
          onClick={handleOpen}
          position="relative"
        >
          <FiMessageSquare size={16} />
          {hasComment && mode === 'creator' && (
            <Box
              position="absolute"
              top="-2px"
              right="-2px"
              w="8px"
              h="8px"
              bg="orange.500"
              borderRadius="full"
              animation="pulse 2s infinite"
            />
          )}
          {hasComment && mode === 'approver' && (
            <Box
              position="absolute"
              top="-2px"
              right="-2px"
              w="8px"
              h="8px"
              bg="blue.500"
              borderRadius="full"
            />
          )}
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          w="320px"
          bg={colors.cardBg}
          borderColor={colors.borderColor}
          boxShadow="lg"
          zIndex={1600}
        >
          <Popover.Header
            fontSize="sm"
            fontWeight="bold"
            color={colors.textColor}
            borderBottomWidth="1px"
            borderColor={colors.borderColor}
          >
            <HStack justify="space-between">
              <Text>{fieldCode} - {fieldName}</Text>
            </HStack>
          </Popover.Header>
          <Popover.Body>
            {mode === 'approver' ? (
              <VStack gap={3} align="stretch">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('fieldComments.placeholder', 'Explique que necesita ser corregido...')}
                  rows={3}
                  fontSize="sm"
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                />
                <HStack justify="flex-end" gap={2}>
                  {hasComment && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={handleRemove}
                    >
                      {t('fieldComments.removeComment', 'Eliminar comentario')}
                    </Button>
                  )}
                  <Button
                    size="xs"
                    colorPalette="blue"
                    onClick={handleSave}
                    disabled={!draft.trim()}
                  >
                    {t('fieldComments.saveComment', 'Guardar')}
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack gap={2} align="stretch">
                <Box
                  p={3}
                  bg="orange.50"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderColor="orange.400"
                >
                  <Text fontSize="sm" color="orange.800">
                    {comment?.comment}
                  </Text>
                </Box>
                {comment?.commentedBy && (
                  <HStack fontSize="xs" color={colors.textColorSecondary} gap={2}>
                    <Text fontWeight="medium">
                      {t('fieldComments.commentBy', 'Comentado por')}: {comment.commentedBy}
                    </Text>
                    {comment.commentedAt && (
                      <Text>- {formatDate(comment.commentedAt)}</Text>
                    )}
                  </HStack>
                )}
              </VStack>
            )}
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default FieldCommentIcon;
