/**
 * ChangeTrackingPanel - Visualización del mensaje SWIFT con control de cambios
 *
 * Features:
 * - Muestra TODOS los campos del mensaje SWIFT original (MT700)
 * - Detecta cambios comparando con mensajes posteriores (MT707, etc.)
 * - Campos modificados resaltados en naranja
 * - Click en campo modificado muestra historial de todos los cambios
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Flex,
  Separator,
} from '@chakra-ui/react';
import { FiBell, FiCheck, FiChevronRight, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { swiftFieldConfigService } from '../../services/swiftFieldConfigService';
import { swiftMessagesApi } from '../../services/operationsApi';
import { parseSwiftMessage } from '../../utils/swiftMessageParser';
import { FieldChangeHistory } from './FieldChangeHistory';
import type { Operation, SwiftMessage } from '../../types/operations';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { SwiftFieldState, FieldChange } from '../../utils/swiftFieldComparator';

interface ParsedField {
  fieldCode: string;
  fieldName: string;
  value: string;
  section: string;
  displayOrder: number;
}

interface FieldChangeInfo {
  messageType: string;
  messageId: string;
  direction: string;
  previousValue: string | null;
  newValue: string | null;
  changedAt: string;
  senderBic: string;
  receiverBic: string;
}

interface FieldWithChanges {
  fieldCode: string;
  fieldName: string;
  originalValue: string;
  currentValue: string;
  section: string;
  displayOrder: number;
  hasChanges: boolean;
  changes: FieldChangeInfo[];
}

interface ChangeTrackingPanelProps {
  operation: Operation;
}

export const ChangeTrackingPanel = ({ operation }: ChangeTrackingPanelProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<SwiftMessage[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<SwiftFieldConfig[]>([]);
  const [fieldsWithChanges, setFieldsWithChanges] = useState<FieldWithChanges[]>([]);
  const [selectedField, setSelectedField] = useState<SwiftFieldState | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [operation.operationId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all SWIFT messages for this operation
      const messagesData = await swiftMessagesApi.getByOperationId(operation.operationId);
      setMessages(messagesData);

      if (messagesData.length === 0) {
        setFieldsWithChanges([]);
        setLoading(false);
        return;
      }

      // Sort messages by creation date
      const sortedMessages = [...messagesData].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });

      // Get the original message (first one, usually MT700)
      const originalMessage = sortedMessages[0];

      // Load field configs for the original message type
      const configs = await swiftFieldConfigService.getAll(originalMessage.messageType, true);
      setFieldConfigs(configs);

      // Parse the original message
      const originalFields = parseSwiftMessage(originalMessage.swiftContent, configs);

      // Build a map of field code -> config for quick lookup
      const configMap = new Map<string, SwiftFieldConfig>();
      configs.forEach(c => configMap.set(c.fieldCode, c));

      // Initialize fields with original values
      const fieldsMap = new Map<string, FieldWithChanges>();

      // Add all fields from config (to show even empty ones)
      configs.forEach(config => {
        const value = originalFields[config.fieldCode];
        const stringValue = formatValue(value);

        fieldsMap.set(config.fieldCode, {
          fieldCode: config.fieldCode,
          fieldName: config.fieldName,
          originalValue: stringValue,
          currentValue: stringValue,
          section: config.section,
          displayOrder: config.displayOrder,
          hasChanges: false,
          changes: [],
        });
      });

      // Process subsequent messages to detect changes
      for (let i = 1; i < sortedMessages.length; i++) {
        const msg = sortedMessages[i];

        // Load configs for this message type if different
        let msgConfigs = configs;
        if (msg.messageType !== originalMessage.messageType) {
          msgConfigs = await swiftFieldConfigService.getAll(msg.messageType, true);
        }

        // Parse this message
        const msgFields = parseSwiftMessage(msg.swiftContent, msgConfigs);

        // Check each field for changes
        for (const [fieldCode, newValue] of Object.entries(msgFields)) {
          const stringNewValue = formatValue(newValue);
          const existingField = fieldsMap.get(fieldCode);

          if (existingField) {
            // Compare with current value
            if (existingField.currentValue !== stringNewValue && stringNewValue) {
              existingField.hasChanges = true;
              existingField.changes.push({
                messageType: msg.messageType,
                messageId: msg.messageId,
                direction: msg.direction,
                previousValue: existingField.currentValue,
                newValue: stringNewValue,
                changedAt: msg.createdAt || '',
                senderBic: msg.senderBic,
                receiverBic: msg.receiverBic,
              });
              existingField.currentValue = stringNewValue;
            }
          } else {
            // New field from amendment - add it
            const config = msgConfigs.find(c => c.fieldCode === fieldCode);
            fieldsMap.set(fieldCode, {
              fieldCode,
              fieldName: config?.fieldName || fieldCode,
              originalValue: '',
              currentValue: stringNewValue,
              section: config?.section || 'OTHER',
              displayOrder: config?.displayOrder || 999,
              hasChanges: true,
              changes: [{
                messageType: msg.messageType,
                messageId: msg.messageId,
                direction: msg.direction,
                previousValue: null,
                newValue: stringNewValue,
                changedAt: msg.createdAt || '',
                senderBic: msg.senderBic,
                receiverBic: msg.receiverBic,
              }],
            });
          }
        }
      }

      // Convert to array and sort
      const fieldsArray = Array.from(fieldsMap.values())
        .filter(f => f.originalValue || f.currentValue) // Only show fields with values
        .sort((a, b) => a.displayOrder - b.displayOrder);

      setFieldsWithChanges(fieldsArray);
    } catch (err) {
      console.error('Error loading change tracking data:', err);
      setError(t('common.errorLoading', 'Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      if (value.currency && value.amount) {
        return `${value.currency} ${value.amount}`;
      }
      if (value.text) return value.text;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  // Stats
  const stats = useMemo(() => {
    const modified = fieldsWithChanges.filter(f => f.hasChanges).length;
    const totalChanges = fieldsWithChanges.reduce((sum, f) => sum + f.changes.length, 0);
    return {
      total: fieldsWithChanges.length,
      modified,
      totalChanges,
      messageCount: messages.length,
    };
  }, [fieldsWithChanges, messages]);

  const handleFieldClick = (field: FieldWithChanges) => {
    if (field.hasChanges) {
      // Convert to SwiftFieldState format for the history panel
      const fieldState: SwiftFieldState = {
        fieldCode: field.fieldCode,
        fieldName: field.fieldName,
        draftFieldMapping: '',
        currentValue: field.currentValue,
        originalValue: field.originalValue,
        hasChanges: true,
        changeCount: field.changes.length,
        changes: field.changes.map((c, idx) => ({
          fieldCode: field.fieldCode,
          fieldName: field.fieldName,
          eventId: c.messageId,
          eventCode: c.messageType,
          eventName: `${c.messageType} - ${c.direction === 'OUTBOUND' ? 'Enviado' : 'Recibido'}`,
          swiftMessageType: c.messageType,
          previousValue: c.previousValue,
          newValue: c.newValue,
          changedAt: c.changedAt,
          changedBy: c.direction === 'OUTBOUND' ? c.senderBic : c.receiverBic,
          eventSequence: idx + 1,
        })),
        section: field.section,
        displayOrder: field.displayOrder,
      };
      setSelectedField(fieldState);
      setHistoryPanelOpen(true);
    }
  };

  const handleCloseHistory = () => {
    setHistoryPanelOpen(false);
    setTimeout(() => setSelectedField(null), 300);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color={colors.primaryColor} />
        <Text mt={4} color={colors.textColor}>
          {t('common.loading', 'Cargando mensajes SWIFT...')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200" textAlign="center">
        <Text color="red.600">{error}</Text>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box p={6} bg={colors.bgColor} borderRadius="md" borderWidth="1px" borderColor={colors.borderColor} textAlign="center">
        <FiMail size={40} style={{ margin: '0 auto', opacity: 0.5 }} />
        <Text mt={3} color={colors.textColorSecondary}>
          {t('operations.noSwiftMessages', 'Sin mensajes SWIFT registrados')}
        </Text>
      </Box>
    );
  }

  const originalMessage = messages.sort((a, b) =>
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  )[0];

  return (
    <Box>
      {/* Header with message info */}
      <Box mb={4} p={4} bg="blue.50" borderRadius="lg" borderWidth="2px" borderColor="blue.200">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Badge colorPalette="blue" variant="solid" fontSize="lg" px={3} py={1} fontFamily="mono">
              {originalMessage.messageType}
            </Badge>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" color="blue.700" fontSize="md">
                Mensaje SWIFT Original
              </Text>
              <Text fontSize="xs" color="blue.600">
                {originalMessage.field20Reference || operation.reference}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={4} flexWrap="wrap">
            <HStack gap={1}>
              <Badge colorPalette="gray" variant="subtle" fontSize="sm">{stats.total}</Badge>
              <Text fontSize="sm" color={colors.textColorSecondary}>campos</Text>
            </HStack>
            <HStack gap={1}>
              <Badge colorPalette="purple" variant="subtle" fontSize="sm">{stats.messageCount}</Badge>
              <Text fontSize="sm" color={colors.textColorSecondary}>mensajes</Text>
            </HStack>
            {stats.modified > 0 && (
              <HStack gap={1}>
                <Badge colorPalette="orange" variant="solid" fontSize="sm">{stats.modified}</Badge>
                <Text fontSize="sm" color="orange.600" fontWeight="medium">modificados</Text>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Fields list */}
      <Box borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor} overflow="hidden">
        <VStack gap={0} align="stretch" separator={<Separator borderColor={colors.borderColor} />}>
          {fieldsWithChanges.map((field) => (
            <SwiftFieldRow
              key={field.fieldCode}
              field={field}
              onClick={() => handleFieldClick(field)}
              colors={colors}
            />
          ))}
        </VStack>
      </Box>

      {/* Change history panel */}
      <FieldChangeHistory
        isOpen={historyPanelOpen}
        onClose={handleCloseHistory}
        fieldState={selectedField}
      />

      {/* Backdrop */}
      {historyPanelOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.500"
          zIndex={1050}
          onClick={handleCloseHistory}
        />
      )}
    </Box>
  );
};

interface SwiftFieldRowProps {
  field: FieldWithChanges;
  onClick: () => void;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
}

const SwiftFieldRow = ({ field, onClick, colors }: SwiftFieldRowProps) => {
  const hasChanges = field.hasChanges;
  const hasValue = field.currentValue !== '';

  return (
    <Box
      px={4}
      py={3}
      bg={hasChanges ? 'orange.50' : 'white'}
      cursor={hasChanges ? 'pointer' : 'default'}
      transition="all 0.2s"
      _hover={hasChanges ? { bg: 'orange.100' } : { bg: colors.bgColor }}
      onClick={onClick}
      borderLeft="4px solid"
      borderLeftColor={hasChanges ? 'orange.400' : 'transparent'}
    >
      <Flex align="center" gap={4}>
        {/* Field code */}
        <Badge
          colorPalette={hasChanges ? 'orange' : 'gray'}
          variant={hasChanges ? 'solid' : 'subtle'}
          fontSize="xs"
          fontFamily="mono"
          minW="60px"
          textAlign="center"
        >
          {field.fieldCode}
        </Badge>

        {/* Field name */}
        <Text
          fontSize="sm"
          fontWeight="medium"
          color={hasChanges ? 'orange.700' : colors.textColor}
          minW={{ base: '100px', md: '180px' }}
          flexShrink={0}
        >
          {field.fieldName}
        </Text>

        {/* Field value */}
        <Text
          flex={1}
          fontSize="sm"
          fontFamily="mono"
          color={hasValue ? (hasChanges ? 'orange.800' : colors.textColor) : colors.textColorSecondary}
          noOfLines={1}
          fontStyle={hasValue ? 'normal' : 'italic'}
        >
          {hasValue ? field.currentValue : '(sin valor)'}
        </Text>

        {/* Status indicator */}
        <HStack gap={2} flexShrink={0}>
          {hasChanges ? (
            <>
              <Badge colorPalette="orange" variant="solid" fontSize="xs" display="flex" alignItems="center" gap={1}>
                <FiBell size={10} />
                {field.changes.length}
              </Badge>
              <Box color="orange.500">
                <FiChevronRight size={16} />
              </Box>
            </>
          ) : (
            <Box color="green.500" opacity={0.6}>
              <FiCheck size={16} />
            </Box>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default ChangeTrackingPanel;
