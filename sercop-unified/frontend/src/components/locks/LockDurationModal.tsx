/**
 * LockDurationModal Component
 * Modal for selecting lock duration when acquiring a lock
 */

import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Icon,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Input,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaLock, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface LockDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (durationSeconds: number) => void;
  isLoading?: boolean;
  operationReference?: string;
  defaultDuration?: number; // in seconds
}

const DURATION_OPTIONS = [
  { value: 300, label: '5 min' },
  { value: 900, label: '15 min' },
  { value: 1800, label: '30 min' },
  { value: 3600, label: '60 min' },
];

export const LockDurationModal: React.FC<LockDurationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  operationReference,
  defaultDuration = 900,
}) => {
  const { t } = useTranslation();

  const [selectedDuration, setSelectedDuration] = useState(defaultDuration);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(15);

  const handleDurationSelect = (seconds: number) => {
    setSelectedDuration(seconds);
    setIsCustom(false);
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setSelectedDuration(customMinutes * 60);
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 15;
    const clampedValue = Math.min(Math.max(value, 1), 60);
    setCustomMinutes(clampedValue);
    if (isCustom) {
      setSelectedDuration(clampedValue * 60);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDuration);
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="md"
      placement="center"
    >
      <DialogContent bg="white" borderRadius="xl" shadow="xl">
        <DialogHeader pb={2}>
          <HStack gap={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg="blue.50"
              color="blue.600"
            >
              <Icon fontSize="xl">
                <FaLock />
              </Icon>
            </Box>
            <VStack align="start" gap={0}>
              <DialogTitle fontSize="lg" fontWeight="bold">
                {t('locks.acquireLock', 'Take Operation')}
              </DialogTitle>
              {operationReference && (
                <Text fontSize="sm" color="gray.500" fontFamily="mono">
                  {operationReference}
                </Text>
              )}
            </VStack>
          </HStack>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody py={4}>
          <VStack gap={4} align="stretch">
            <Box>
              <HStack gap={2} mb={3}>
                <Icon color="gray.600">
                  <FaClock />
                </Icon>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  {t('locks.lockDuration', 'Lock Duration')}
                </Text>
              </HStack>

              <VStack gap={2} align="stretch">
                {DURATION_OPTIONS.map((option) => (
                  <Box
                    key={option.value}
                    p={3}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={!isCustom && selectedDuration === option.value ? 'blue.500' : 'gray.200'}
                    bg={!isCustom && selectedDuration === option.value ? 'blue.50' : 'transparent'}
                    cursor="pointer"
                    transition="all 0.2s ease"
                    _hover={{ borderColor: 'blue.500' }}
                    onClick={() => handleDurationSelect(option.value)}
                  >
                    <HStack justify="space-between">
                      <Text fontWeight={!isCustom && selectedDuration === option.value ? 'semibold' : 'normal'}>
                        {option.label}
                        {option.value === 900 && (
                          <Text as="span" ml={2} fontSize="xs" color="blue.500">
                            ({t('locks.recommended', 'Recommended')})
                          </Text>
                        )}
                      </Text>
                    </HStack>
                  </Box>
                ))}

                {/* Custom option */}
                <Box
                  p={3}
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={isCustom ? 'blue.500' : 'gray.200'}
                  bg={isCustom ? 'blue.50' : 'transparent'}
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{ borderColor: 'blue.500' }}
                  onClick={handleCustomSelect}
                >
                  <HStack justify="space-between">
                    <Text fontWeight={isCustom ? 'semibold' : 'normal'}>
                      {t('locks.customDuration', 'Custom')}
                    </Text>
                    {isCustom && (
                      <HStack>
                        <Input
                          type="number"
                          value={customMinutes}
                          onChange={handleCustomMinutesChange}
                          min={1}
                          max={60}
                          width="70px"
                          size="sm"
                          fontFamily="mono"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Text fontSize="sm" color="gray.500">min</Text>
                      </HStack>
                    )}
                  </HStack>
                </Box>
              </VStack>
            </Box>

            <Box
              p={3}
              borderRadius="lg"
              bg="gray.50"
            >
              <Text fontSize="sm" color="gray.500">
                {t('locks.lockInfo', 'While you hold the lock, other users will not be able to execute actions on this operation. You can extend the time or release the lock at any time.')}
              </Text>
            </Box>
          </VStack>
        </DialogBody>

        <DialogFooter gap={3} pt={2}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            colorPalette="blue"
            onClick={handleConfirm}
            loading={isLoading}
            loadingText={t('locks.acquiring', 'Acquiring...')}
          >
            <Icon mr={2}>
              <FaLock />
            </Icon>
            {t('locks.confirm', 'Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default LockDurationModal;
