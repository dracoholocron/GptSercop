/**
 * LockTimer Component
 * Displays a countdown timer for lock expiration with professional styling
 */

import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { FaClock } from 'react-icons/fa';

interface LockTimerProps {
  remainingSeconds: number;
  isExpiringSoon?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '00:00';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const LockTimer: React.FC<LockTimerProps> = ({
  remainingSeconds,
  isExpiringSoon = false,
  showIcon = true,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: { fontSize: 'xs', iconSize: 'sm', px: 2, py: 0.5 },
    md: { fontSize: 'sm', iconSize: 'md', px: 3, py: 1 },
    lg: { fontSize: 'md', iconSize: 'lg', px: 4, py: 1.5 },
  };

  const styles = sizeStyles[size];

  const getColorScheme = () => {
    if (remainingSeconds <= 0) return { bg: 'gray.100', color: 'gray.500', borderColor: 'gray.200' };
    if (isExpiringSoon) return { bg: 'orange.50', color: 'orange.600', borderColor: 'orange.200' };
    return { bg: 'green.50', color: 'green.600', borderColor: 'green.200' };
  };

  const colors = getColorScheme();

  return (
    <HStack
      gap={1.5}
      px={styles.px}
      py={styles.py}
      bg={colors.bg}
      borderRadius="full"
      border="1px solid"
      borderColor={colors.borderColor}
      transition="all 0.2s ease"
      animation={isExpiringSoon ? 'pulse 1s ease-in-out infinite' : undefined}
    >
      {showIcon && (
        <Icon color={colors.color} fontSize={styles.iconSize}>
          <FaClock />
        </Icon>
      )}
      <Text
        fontSize={styles.fontSize}
        fontWeight="semibold"
        fontFamily="mono"
        color={colors.color}
      >
        {formatTime(remainingSeconds)}
      </Text>
    </HStack>
  );
};

export default LockTimer;
