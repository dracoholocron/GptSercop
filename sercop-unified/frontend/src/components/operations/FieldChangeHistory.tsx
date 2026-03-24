/**
 * FieldChangeHistory - Sliding panel showing the change history for a SWIFT field
 *
 * Features:
 * - Animated slide-in panel from the right
 * - Vertical timeline with visual connectors
 * - Each change shows: date, user, event type, previous/new values
 * - Color-coded by event type (amendment, original, etc.)
 */

import {
  Box,
  VStack,
  Text,
  HStack,
  IconButton,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { FiArrowLeft, FiClock, FiUser, FiFileText } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { SwiftFieldState, FieldChange } from '../../utils/swiftFieldComparator';

interface FieldChangeHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  fieldState: SwiftFieldState | null;
}

export const FieldChangeHistory = ({
  isOpen,
  onClose,
  fieldState,
}: FieldChangeHistoryProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  if (!fieldState) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getEventColor = (eventCode: string) => {
    if (eventCode.includes('AMENDMENT') || eventCode.includes('ENMIENDA')) {
      return 'orange';
    }
    if (eventCode.includes('ISSUE') || eventCode.includes('EMISION')) {
      return 'blue';
    }
    if (eventCode.includes('PAYMENT') || eventCode.includes('PAGO')) {
      return 'green';
    }
    return 'gray';
  };

  const getMessageTypeIcon = (msgType?: string) => {
    if (!msgType) return null;
    if (msgType.includes('707')) return 'MT707';
    if (msgType.includes('700')) return 'MT700';
    if (msgType.includes('767')) return 'MT767';
    if (msgType.includes('760')) return 'MT760';
    return msgType;
  };

  // Reverse changes to show most recent first
  const sortedChanges = [...fieldState.changes].reverse();

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      bottom={0}
      width={{ base: '100%', md: '450px' }}
      bg={colors.cardBg}
      borderLeft="1px"
      borderColor={colors.borderColor}
      transform={isOpen ? 'translateX(0)' : 'translateX(100%)'}
      transition="transform 0.3s ease-in-out"
      zIndex={1100}
      boxShadow="-4px 0 20px rgba(0, 0, 0, 0.15)"
      display="flex"
      flexDirection="column"
      overflowY="auto"
    >
      {/* Header */}
      <Box
        p={4}
        borderBottom="2px"
        borderColor="orange.400"
        bg="orange.50"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex align="center" gap={3}>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="orange"
            onClick={onClose}
            aria-label={t('common.back', 'Volver')}
          >
            <FiArrowLeft />
          </IconButton>
          <Box flex={1}>
            <HStack gap={2} mb={1}>
              <Badge
                colorPalette="orange"
                variant="solid"
                fontSize="sm"
                fontFamily="mono"
                px={2}
              >
                {fieldState.fieldCode}
              </Badge>
              <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                {fieldState.changeCount} {fieldState.changeCount === 1 ? 'cambio' : 'cambios'}
              </Badge>
            </HStack>
            <Text fontWeight="bold" color={colors.textColor} fontSize="lg">
              {fieldState.fieldName}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Current Value */}
      <Box p={4} bg="green.50" borderBottom="1px" borderColor={colors.borderColor}>
        <Text fontSize="xs" color="green.600" fontWeight="bold" mb={1}>
          VALOR ACTUAL
        </Text>
        <Box
          p={3}
          bg="white"
          borderRadius="md"
          border="2px solid"
          borderColor="green.400"
        >
          <Text
            fontFamily="mono"
            fontSize="md"
            color="green.800"
            fontWeight="semibold"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {fieldState.currentValue || '-'}
          </Text>
        </Box>
      </Box>

      {/* Timeline */}
      <Box p={4} flex={1}>
        <Text
          fontSize="sm"
          fontWeight="bold"
          color={colors.textColor}
          mb={4}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Historial de Cambios
        </Text>

        {sortedChanges.length === 0 ? (
          <Box
            p={6}
            textAlign="center"
            bg={colors.bgColor}
            borderRadius="md"
            border="1px dashed"
            borderColor={colors.borderColor}
          >
            <Text color={colors.textColorSecondary}>
              Sin cambios registrados
            </Text>
          </Box>
        ) : (
          <VStack gap={0} align="stretch" position="relative">
            {/* Timeline line */}
            <Box
              position="absolute"
              left="12px"
              top="24px"
              bottom="24px"
              width="2px"
              bg="orange.200"
              zIndex={0}
            />

            {sortedChanges.map((change, index) => {
              const eventColor = getEventColor(change.eventCode);
              const isLatest = index === 0;

              return (
                <Box key={`${change.eventId}-${index}`} position="relative" pl={10} pb={6}>
                  {/* Timeline dot */}
                  <Box
                    position="absolute"
                    left="6px"
                    top="8px"
                    width="14px"
                    height="14px"
                    borderRadius="full"
                    bg={isLatest ? `${eventColor}.500` : `${eventColor}.300`}
                    border="3px solid white"
                    boxShadow="sm"
                    zIndex={1}
                  />

                  {/* Change card */}
                  <Box
                    p={4}
                    bg={isLatest ? `${eventColor}.50` : colors.bgColor}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={isLatest ? `${eventColor}.300` : colors.borderColor}
                    boxShadow={isLatest ? 'md' : 'sm'}
                    transition="all 0.2s"
                    _hover={{ boxShadow: 'md', borderColor: `${eventColor}.400` }}
                  >
                    {/* Event header */}
                    <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                      <HStack gap={2}>
                        <Badge
                          colorPalette={eventColor}
                          variant={isLatest ? 'solid' : 'subtle'}
                          fontSize="xs"
                        >
                          {change.eventName}
                        </Badge>
                        {change.swiftMessageType && (
                          <Badge colorPalette="blue" variant="outline" fontSize="xs">
                            <FiFileText style={{ marginRight: 4 }} />
                            {getMessageTypeIcon(change.swiftMessageType)}
                          </Badge>
                        )}
                        {isLatest && (
                          <Badge colorPalette="green" variant="solid" fontSize="xs">
                            Actual
                          </Badge>
                        )}
                      </HStack>
                    </HStack>

                    {/* Date and user */}
                    <HStack gap={4} fontSize="xs" color={colors.textColorSecondary} mb={3}>
                      <HStack gap={1}>
                        <FiClock size={12} />
                        <Text>{formatDate(change.changedAt)}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <FiUser size={12} />
                        <Text>{change.changedBy}</Text>
                      </HStack>
                    </HStack>

                    {/* Values comparison */}
                    <VStack gap={2} align="stretch">
                      <Box
                        p={2}
                        bg="red.50"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="red.200"
                      >
                        <Text fontSize="xs" color="red.600" fontWeight="bold" mb={1}>
                          Valor Anterior
                        </Text>
                        <Text
                          fontFamily="mono"
                          fontSize="sm"
                          color="red.700"
                          whiteSpace="pre-wrap"
                          wordBreak="break-word"
                          textDecoration="line-through"
                          opacity={0.8}
                        >
                          {change.previousValue || '-'}
                        </Text>
                      </Box>
                      <Box
                        p={2}
                        bg="green.50"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="green.200"
                      >
                        <Text fontSize="xs" color="green.600" fontWeight="bold" mb={1}>
                          Nuevo Valor
                        </Text>
                        <Text
                          fontFamily="mono"
                          fontSize="sm"
                          color="green.700"
                          fontWeight="medium"
                          whiteSpace="pre-wrap"
                          wordBreak="break-word"
                        >
                          {change.newValue || '-'}
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                </Box>
              );
            })}

            {/* Original value at the end */}
            <Box position="relative" pl={10}>
              {/* Timeline dot - original */}
              <Box
                position="absolute"
                left="4px"
                top="8px"
                width="18px"
                height="18px"
                borderRadius="full"
                bg="blue.500"
                border="3px solid white"
                boxShadow="md"
                zIndex={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box width="6px" height="6px" borderRadius="full" bg="white" />
              </Box>

              {/* Original value card */}
              <Box
                p={4}
                bg="blue.50"
                borderRadius="lg"
                border="2px solid"
                borderColor="blue.400"
                boxShadow="md"
              >
                <HStack mb={2}>
                  <Badge colorPalette="blue" variant="solid" fontSize="xs">
                    Valor Original
                  </Badge>
                  <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                    Emisión
                  </Badge>
                </HStack>
                <Text
                  fontFamily="mono"
                  fontSize="md"
                  color="blue.800"
                  fontWeight="semibold"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {fieldState.originalValue || '-'}
                </Text>
              </Box>
            </Box>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default FieldChangeHistory;
