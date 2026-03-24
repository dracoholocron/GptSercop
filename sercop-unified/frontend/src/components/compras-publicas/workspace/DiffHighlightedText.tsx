/**
 * DiffHighlightedText — Renders text with word-level diff highlighting.
 * Changed/added words appear in a distinct color. Hovering shows who made the change and when.
 * Uses a simple word-level diff algorithm (no external deps).
 */
import { useMemo, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useTheme } from '../../../contexts/ThemeContext';

interface DiffHighlightedTextProps {
  currentText: string;
  previousText: string | null;
  changedByName: string;
  changedAt: string; // ISO datetime string
}

type DiffSegment = {
  text: string;
  type: 'unchanged' | 'added' | 'removed';
};

/**
 * Simple word-level diff using LCS (Longest Common Subsequence).
 * Returns segments indicating which words were added, removed, or unchanged.
 */
function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  const oldWords = oldText.split(/(\s+)/); // preserve whitespace
  const newWords = newText.split(/(\s+)/);

  // Build LCS table
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const segments: DiffSegment[] = [];
  let i = m, j = n;

  const stack: DiffSegment[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      stack.push({ text: newWords[j - 1], type: 'unchanged' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ text: newWords[j - 1], type: 'added' });
      j--;
    } else {
      stack.push({ text: oldWords[i - 1], type: 'removed' });
      i--;
    }
  }

  // Reverse (we built from end)
  stack.reverse();

  // Merge consecutive segments of same type
  for (const seg of stack) {
    if (segments.length > 0 && segments[segments.length - 1].type === seg.type) {
      segments[segments.length - 1].text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function DiffHighlightedText({
  currentText,
  previousText,
  changedByName,
  changedAt,
}: DiffHighlightedTextProps) {
  const { isDark } = useTheme();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const segments = useMemo(() => {
    if (!previousText || previousText === currentText) return null;
    return computeWordDiff(previousText, currentText);
  }, [previousText, currentText]);

  // No diff — render plain text
  if (!segments) {
    return <Text fontSize="sm" whiteSpace="pre-wrap">{currentText}</Text>;
  }

  const addedBg = isDark ? 'rgba(56, 178, 172, 0.25)' : 'rgba(56, 178, 172, 0.15)';
  const addedColor = isDark ? 'teal.200' : 'teal.700';
  const removedBg = isDark ? 'rgba(245, 101, 101, 0.2)' : 'rgba(245, 101, 101, 0.1)';
  const removedColor = isDark ? 'red.300' : 'red.500';

  return (
    <Box as="span" fontSize="sm" whiteSpace="pre-wrap" position="relative" display="block" lineHeight="tall">
      {segments.map((seg, idx) => {
        if (seg.type === 'unchanged') {
          return <span key={idx}>{seg.text}</span>;
        }

        if (seg.type === 'removed') {
          return (
            <span
              key={idx}
              style={{
                background: removedBg,
                color: isDark ? '#FC8181' : '#E53E3E',
                textDecoration: 'line-through',
                borderRadius: '2px',
                padding: '0 1px',
                opacity: 0.7,
              }}
            >
              {seg.text}
            </span>
          );
        }

        // 'added' type
        return (
          <Box
            as="span"
            key={idx}
            position="relative"
            display="inline"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              style={{
                background: addedBg,
                color: isDark ? '#81E6D9' : '#2C7A7B',
                borderRadius: '2px',
                padding: '0 2px',
                borderBottom: `2px solid ${isDark ? '#38B2AC' : '#319795'}`,
                cursor: 'default',
              }}
            >
              {seg.text}
            </span>

            {/* Tooltip on hover */}
            {hoveredIdx === idx && (
              <Box
                position="absolute"
                bottom="calc(100% + 4px)"
                left="50%"
                transform="translateX(-50%)"
                bg={isDark ? 'gray.700' : 'gray.800'}
                color="white"
                px={2.5}
                py={1.5}
                borderRadius="md"
                fontSize="11px"
                whiteSpace="nowrap"
                zIndex={100}
                boxShadow="lg"
                pointerEvents="none"
              >
                <Box as="span" display="block" fontWeight="bold" fontSize="11px">{changedByName}</Box>
                <Box as="span" display="block" fontSize="10px" color="gray.300">{formatTimeAgo(changedAt)}</Box>
                <Box
                  position="absolute"
                  bottom="-4px"
                  left="50%"
                  transform="translateX(-50%)"
                  w={0}
                  h={0}
                  borderLeft="5px solid transparent"
                  borderRight="5px solid transparent"
                  borderTop={`5px solid ${isDark ? '#2D3748' : '#1A202C'}`}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
