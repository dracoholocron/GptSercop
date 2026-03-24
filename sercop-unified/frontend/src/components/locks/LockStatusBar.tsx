/**
 * LockStatusBar Component
 * Full-width status bar showing lock information in operation detail
 */

import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Icon,
  Avatar,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaLock, FaLockOpen, FaPlus, FaUnlock, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { OperationLock } from '../../services/operationLockService';
import { LockTimer } from './LockTimer';
import { LockDurationModal } from './LockDurationModal';

interface LockStatusBarProps {
  lock: OperationLock | null;
  remainingSeconds: number;
  isLoading?: boolean;
  onAcquireLock: (durationSeconds: number) => void;
  onReleaseLock: () => void;
  onExtendLock: (additionalSeconds: number) => void;
  operationReference?: string;
  productType?: string;
}

// Color constants (light mode)
const COLORS = {
  bgNotLocked: 'gray.50',
  bgLockedByMe: 'green.50',
  bgLockedByOther: 'red.50',
  borderNotLocked: 'gray.200',
  borderLockedByMe: 'green.200',
  borderLockedByOther: 'red.200',
};

export const LockStatusBar: React.FC<LockStatusBarProps> = ({
  lock,
  remainingSeconds,
  isLoading = false,
  onAcquireLock,
  onReleaseLock,
  onExtendLock,
  operationReference,
}) => {
  const { t } = useTranslation();

  const [isAcquireModalOpen, setIsAcquireModalOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const isLocked = lock?.locked ?? false;
  const isLockedByMe = lock?.lockedByCurrentUser ?? false;
  const isExpiringSoon = lock?.expiringSoon || (remainingSeconds > 0 && remainingSeconds <= 60);

  const getBarStyles = () => {
    if (!isLocked) {
      return { bg: COLORS.bgNotLocked, border: COLORS.borderNotLocked, color: 'gray.600' };
    }
    if (isLockedByMe) {
      return { bg: COLORS.bgLockedByMe, border: COLORS.borderLockedByMe, color: 'green.700' };
    }
    return { bg: COLORS.bgLockedByOther, border: COLORS.borderLockedByOther, color: 'red.700' };
  };

  const styles = getBarStyles();

  const handleAcquire = (durationSeconds: number) => {
    onAcquireLock(durationSeconds);
    setIsAcquireModalOpen(false);
  };

  const handleRelease = () => {
    onReleaseLock();
    setIsReleaseDialogOpen(false);
  };

  const handleExtend = (additionalSeconds: number) => {
    onExtendLock(additionalSeconds);
    setIsExtendModalOpen(false);
  };

  // Not locked state
  if (!isLocked) {
    return (
      <>
        <Box
          p={4}
          bg={styles.bg}
          borderRadius="lg"
          border="1px solid"
          borderColor={styles.border}
        >
          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <Box p={2} borderRadius="md" bg="gray.100">
                <Icon color="gray.500" fontSize="xl">
                  <FaLockOpen />
                </Icon>
              </Box>
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" color={styles.color}>
                  {t('locks.operationNotLocked', 'Operation Not Locked')}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {t('locks.acquireToEdit', 'Acquire lock to execute actions')}
                </Text>
              </VStack>
            </HStack>

            <Button
              colorPalette="blue"
              onClick={() => setIsAcquireModalOpen(true)}
              loading={isLoading}
              size="md"
            >
              <Icon mr={2}>
                <FaLock />
              </Icon>
              {t('locks.takeOperation', 'Take Operation')}
            </Button>
          </HStack>
        </Box>

        <LockDurationModal
          isOpen={isAcquireModalOpen}
          onClose={() => setIsAcquireModalOpen(false)}
          onConfirm={handleAcquire}
          isLoading={isLoading}
          operationReference={operationReference}
        />
      </>
    );
  }

  // Locked by me
  if (isLockedByMe) {
    return (
      <>
        <Box
          p={4}
          bg={styles.bg}
          borderRadius="lg"
          border="1px solid"
          borderColor={isExpiringSoon ? 'orange.300' : styles.border}
          animation={isExpiringSoon ? 'pulse 1.5s ease-in-out infinite' : undefined}
        >
          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <Box p={2} borderRadius="md" bg="green.100">
                <Icon color="green.600" fontSize="xl">
                  <FaLock />
                </Icon>
              </Box>
              <VStack align="start" gap={0}>
                <HStack gap={2}>
                  <Text fontWeight="semibold" color={styles.color}>
                    {t('locks.youHaveLock', 'You have the lock')}
                  </Text>
                  <LockTimer
                    remainingSeconds={remainingSeconds}
                    isExpiringSoon={isExpiringSoon}
                    size="sm"
                  />
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {t('locks.canExecuteActions', 'You can execute actions on this operation')}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2}>
              <Button
                variant="outline"
                colorPalette="green"
                onClick={() => setIsExtendModalOpen(true)}
                loading={isLoading}
                size="md"
                title={t('locks.extendTime', 'Extend Time')}
              >
                <Icon mr={2}>
                  <FaPlus />
                </Icon>
                {t('locks.extend', 'Extend')}
              </Button>
              <Button
                variant="ghost"
                colorPalette="gray"
                onClick={() => setIsReleaseDialogOpen(true)}
                loading={isLoading}
                size="md"
                title={t('locks.releaseLock', 'Release Lock')}
              >
                <Icon mr={2}>
                  <FaUnlock />
                </Icon>
                {t('locks.release', 'Release')}
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Extend Modal */}
        <LockDurationModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onConfirm={handleExtend}
          isLoading={isLoading}
          operationReference={operationReference}
          defaultDuration={900}
        />

        {/* Release Confirmation Dialog */}
        <DialogRoot
          open={isReleaseDialogOpen}
          onOpenChange={(e) => !e.open && setIsReleaseDialogOpen(false)}
          placement="center"
        >
          <DialogContent bg="white" borderRadius="lg">
            <DialogHeader>
              <DialogTitle fontSize="lg" fontWeight="bold">
                {t('locks.releaseLock', 'Release Lock')}
              </DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <Text>
                {t('locks.releaseConfirmation', 'Are you sure you want to release the lock? Other users will be able to take the operation.')}
              </Text>
            </DialogBody>
            <DialogFooter gap={3}>
              <Button variant="ghost" onClick={() => setIsReleaseDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button colorPalette="red" onClick={handleRelease}>
                {t('locks.release', 'Release')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </>
    );
  }

  // Locked by another user
  return (
    <Box
      p={4}
      bg={styles.bg}
      borderRadius="lg"
      border="1px solid"
      borderColor={styles.border}
    >
      <HStack justify="space-between" align="center">
        <HStack gap={3}>
          <Box p={2} borderRadius="md" bg="red.100">
            <Icon color="red.600" fontSize="xl">
              <FaLock />
            </Icon>
          </Box>
          <VStack align="start" gap={0}>
            <HStack gap={2}>
              <Text fontWeight="semibold" color={styles.color}>
                {t('locks.lockedByUser', 'Locked by')}
              </Text>
              <HStack gap={2}>
                <Avatar.Root size="xs">
                  <Avatar.Fallback name={lock.lockedByFullName || lock.lockedBy} />
                </Avatar.Root>
                <Text fontWeight="bold" color={styles.color}>
                  {lock.lockedByFullName || lock.lockedBy}
                </Text>
              </HStack>
            </HStack>
            <HStack gap={2}>
              <Icon color="gray.500" fontSize="xs">
                <FaClock />
              </Icon>
              <Text fontSize="sm" color="gray.500">
                {t('locks.availableIn', 'Available in')} {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        <Box
          px={4}
          py={2}
          bg="red.100"
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
        >
          <Text fontSize="sm" fontWeight="medium" color="red.700">
            {t('locks.actionsDisabled', 'Actions Disabled')}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
};

export default LockStatusBar;
