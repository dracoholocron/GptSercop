/**
 * LockBadge Component
 * Displays lock status with icon and user information
 */

import {
  Badge,
  HStack,
  Icon,
  Avatar,
  Text,
  Box,
} from '@chakra-ui/react';
import { FaLock, FaLockOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { OperationLock } from '../../services/operationLockService';
import { LockTimer } from './LockTimer';

interface LockBadgeProps {
  lock: OperationLock | null;
  remainingSeconds?: number;
  showTimer?: boolean;
  showUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'pill' | 'minimal';
}

export const LockBadge: React.FC<LockBadgeProps> = ({
  lock,
  remainingSeconds = 0,
  showTimer = true,
  showUser = true,
  size = 'md',
  variant = 'badge',
}) => {
  const { t } = useTranslation();

  if (!lock || !lock.locked) {
    return null;
  }

  const isLockedByMe = lock.lockedByCurrentUser;
  const isExpiringSoon = lock.expiringSoon || (remainingSeconds > 0 && remainingSeconds <= 60);

  const sizeStyles = {
    sm: { fontSize: 'xs', iconSize: 'sm', avatarSize: 'xs', gap: 1.5, px: 2, py: 0.5 },
    md: { fontSize: 'sm', iconSize: 'md', avatarSize: 'sm', gap: 2, px: 3, py: 1 },
    lg: { fontSize: 'md', iconSize: 'lg', avatarSize: 'md', gap: 2.5, px: 4, py: 1.5 },
  };

  const styles = sizeStyles[size];

  const getColorScheme = () => {
    if (isLockedByMe) {
      return {
        bg: 'green.50',
        color: 'green.700',
        borderColor: 'green.200',
        IconComponent: FaLockOpen,
        label: t('locks.lockedByYou', 'Locked by you'),
      };
    }
    return {
      bg: 'red.50',
      color: 'red.700',
      borderColor: 'red.200',
      IconComponent: FaLock,
      label: t('locks.lockedByOther', 'Locked by {{user}}', { user: lock.lockedByFullName || lock.lockedBy }),
    };
  };

  const colors = getColorScheme();

  if (variant === 'minimal') {
    return (
      <Box
        display="inline-flex"
        p={1}
        borderRadius="full"
        bg={colors.bg}
        color={colors.color}
        cursor="pointer"
        title={colors.label}
        animation={!isLockedByMe ? 'pulse 2s infinite' : undefined}
      >
        <Icon fontSize={styles.iconSize}>
          <colors.IconComponent />
        </Icon>
      </Box>
    );
  }

  if (variant === 'pill') {
    return (
      <HStack
        gap={styles.gap}
        px={styles.px}
        py={styles.py}
        bg={colors.bg}
        color={colors.color}
        borderRadius="full"
        border="1px solid"
        borderColor={colors.borderColor}
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{ transform: 'scale(1.02)' }}
        title={colors.label}
        animation={!isLockedByMe ? 'pulse 2s infinite' : undefined}
      >
        <Icon fontSize={styles.iconSize}>
          <colors.IconComponent />
        </Icon>
        {showUser && (
          <Text fontSize={styles.fontSize} fontWeight="medium" truncate maxW="150px">
            {isLockedByMe ? t('locks.you', 'You') : (lock.lockedByFullName || lock.lockedBy)}
          </Text>
        )}
        {showTimer && remainingSeconds > 0 && (
          <LockTimer
            remainingSeconds={remainingSeconds}
            isExpiringSoon={isExpiringSoon}
            showIcon={false}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        )}
      </HStack>
    );
  }

  // Default badge variant
  return (
    <Badge
      display="flex"
      alignItems="center"
      gap={styles.gap}
      px={styles.px}
      py={styles.py}
      borderRadius="md"
      bg={colors.bg}
      color={colors.color}
      border="1px solid"
      borderColor={colors.borderColor}
      cursor="pointer"
      fontWeight="medium"
      textTransform="none"
      title={colors.label}
      animation={!isLockedByMe ? 'pulse 2s infinite' : undefined}
    >
      <Icon fontSize={styles.iconSize}>
        <colors.IconComponent />
      </Icon>
      {showUser && (
        <Text fontSize={styles.fontSize} truncate maxW="120px">
          {isLockedByMe ? t('locks.you', 'You') : (lock.lockedByFullName || lock.lockedBy)}
        </Text>
      )}
      {showTimer && remainingSeconds > 0 && (
        <Text fontSize={styles.fontSize} fontFamily="mono">
          {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
        </Text>
      )}
    </Badge>
  );
};

export default LockBadge;
