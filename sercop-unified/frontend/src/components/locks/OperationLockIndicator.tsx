/**
 * OperationLockIndicator Component
 * Compact, elegant indicator showing lock status for an operation
 */

import { HStack, Text, Icon, Tooltip } from '@chakra-ui/react';
import { FaLock, FaUserLock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { OperationLock } from '../../services/operationLockService';

interface OperationLockIndicatorProps {
  lock: OperationLock | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  showText?: boolean;
}

export const OperationLockIndicator: React.FC<OperationLockIndicatorProps> = ({
  lock,
  size = 'sm',
  showText = false,
}) => {
  const { t } = useTranslation();

  // Don't render if not locked
  if (!lock?.locked) {
    return null;
  }

  const isLockedByMe = lock.lockedByCurrentUser;

  const sizeStyles = {
    xs: { iconSize: 'xs', fontSize: 'xs', px: 1.5, py: 0.5, gap: 1 },
    sm: { iconSize: 'sm', fontSize: 'xs', px: 2, py: 0.5, gap: 1.5 },
    md: { iconSize: 'md', fontSize: 'sm', px: 2.5, py: 1, gap: 2 },
  };

  const styles = sizeStyles[size];

  // Format remaining time
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tooltipContent = isLockedByMe
    ? t('locks.youHaveLock', 'You have the lock') + ` (${formatTime(lock.remainingSeconds)})`
    : t('locks.lockedByUser', 'Locked by') + ` ${lock.lockedByFullName || lock.lockedBy}`;

  return (
    <Tooltip.Root positioning={{ placement: 'top' }} openDelay={200}>
      <Tooltip.Trigger asChild>
        <HStack
          gap={styles.gap}
          px={styles.px}
          py={styles.py}
          bg={isLockedByMe ? 'green.50' : 'red.50'}
          borderRadius="full"
          border="1px solid"
          borderColor={isLockedByMe ? 'green.200' : 'red.200'}
          cursor="default"
          _dark={{
            bg: isLockedByMe ? 'green.900' : 'red.900',
            borderColor: isLockedByMe ? 'green.700' : 'red.700',
          }}
        >
          <Icon
            color={isLockedByMe ? 'green.600' : 'red.500'}
            fontSize={styles.iconSize}
            _dark={{ color: isLockedByMe ? 'green.300' : 'red.300' }}
          >
            {isLockedByMe ? <FaLock /> : <FaUserLock />}
          </Icon>
          {showText && (
            <Text
              fontSize={styles.fontSize}
              fontWeight="medium"
              color={isLockedByMe ? 'green.700' : 'red.600'}
              _dark={{ color: isLockedByMe ? 'green.200' : 'red.200' }}
              whiteSpace="nowrap"
            >
              {isLockedByMe
                ? t('locks.mine', 'Mine')
                : lock.lockedByFullName?.split(' ')[0] || lock.lockedBy}
            </Text>
          )}
        </HStack>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          {tooltipContent}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};

export default OperationLockIndicator;
