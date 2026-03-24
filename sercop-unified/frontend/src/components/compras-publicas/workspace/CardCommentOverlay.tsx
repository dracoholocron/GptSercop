/**
 * CardCommentOverlay — Wraps a CardRenderer to add comment and proposal buttons.
 * Buttons are ALWAYS visible (subtle) at bottom-right of each card, not hover-dependent.
 * Style: small pill-shaped action bar, Google Docs-like.
 * Adapts to light/dark mode using Chakra semantic tokens.
 */
import { useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { FiMessageCircle, FiGitPullRequest } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { FieldCommentPopover } from './FieldCommentPopover';

interface CardCommentOverlayProps {
  workspaceId: number;
  departmentPlanId: number;
  fieldCode: string;
  phaseIdx: number;
  commentCount: number;
  proposalCount?: number;
  currentUserName?: string;
  currentUserRole?: string;
  isEditable?: boolean;
  currentValue?: string;
  onProposeChange?: (fieldCode: string, phaseIdx: number, currentValue: string) => void;
  children: React.ReactNode;
}

export function CardCommentOverlay({
  workspaceId,
  departmentPlanId,
  fieldCode,
  phaseIdx,
  commentCount,
  proposalCount,
  currentUserName,
  currentUserRole,
  isEditable,
  currentValue,
  onProposeChange,
  children,
}: CardCommentOverlayProps) {
  const { isDark } = useTheme();
  const [showComments, setShowComments] = useState(false);

  const pillBg = isDark ? 'rgba(45,55,72,0.92)' : 'rgba(255,255,255,0.92)';
  const pillShadow = isDark ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.15)';
  const dividerBg = isDark ? 'gray.500' : 'gray.300';

  const commentIconColor = commentCount > 0
    ? (isDark ? '#63B3ED' : '#3182CE')   // blue.300 / blue.500
    : (isDark ? '#718096' : '#A0AEC0');   // gray.500 / gray.400
  const commentTextColor = isDark ? 'blue.300' : 'blue.600';
  const commentHoverBg = isDark ? 'whiteAlpha.100' : 'blue.50';

  const proposalIconColor = proposalCount && proposalCount > 0
    ? (isDark ? '#4FD1C5' : '#319795')   // teal.300 / teal.500
    : (isDark ? '#718096' : '#A0AEC0');   // gray.500 / gray.400
  const proposalTextColor = isDark ? 'teal.300' : 'teal.600';
  const proposalHoverBg = isDark ? 'whiteAlpha.100' : 'teal.50';

  return (
    <Box position="relative">
      {children}

      {/* Always-visible action bar — bottom-right pill */}
      <HStack
        position="absolute"
        bottom={1.5}
        right={1.5}
        gap={0.5}
        bg={pillBg}
        borderRadius="full"
        px={1}
        py={0.5}
        boxShadow={pillShadow}
        border="1px solid"
        borderColor={isDark ? 'whiteAlpha.200' : 'blackAlpha.100'}
        zIndex={5}
        opacity={0.9}
        _hover={{ opacity: 1 }}
        transition="opacity 0.15s"
      >
        {/* Comment button */}
        <HStack
          gap={0}
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          px={1.5}
          py={0.5}
          borderRadius="full"
          _hover={{ bg: commentHoverBg }}
          transition="background 0.15s"
        >
          <FiMessageCircle size={13} color={commentIconColor} />
          {commentCount > 0 && (
            <Text fontSize="10px" fontWeight="bold" color={commentTextColor} ml={0.5}>
              {commentCount}
            </Text>
          )}
        </HStack>

        {/* Propose change button */}
        {onProposeChange && (
          <>
            <Box w="1px" h="14px" bg={dividerBg} />
            <HStack
              gap={0}
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onProposeChange(fieldCode, phaseIdx, currentValue || '');
              }}
              px={1.5}
              py={0.5}
              borderRadius="full"
              _hover={{ bg: proposalHoverBg }}
              transition="background 0.15s"
            >
              <FiGitPullRequest size={13} color={proposalIconColor} />
              {proposalCount !== undefined && proposalCount > 0 && (
                <Text fontSize="10px" fontWeight="bold" color={proposalTextColor} ml={0.5}>
                  {proposalCount}
                </Text>
              )}
            </HStack>
          </>
        )}
      </HStack>

      {/* Comment popover */}
      {showComments && (
        <FieldCommentPopover
          workspaceId={workspaceId}
          departmentPlanId={departmentPlanId}
          fieldCode={fieldCode}
          phaseIdx={phaseIdx}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          onClose={() => setShowComments(false)}
        />
      )}
    </Box>
  );
}
