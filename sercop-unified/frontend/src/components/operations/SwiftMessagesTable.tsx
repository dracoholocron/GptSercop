import { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  HStack,
  VStack,
  Text,
  Dialog,
  Code,
} from '@chakra-ui/react';
import { toaster } from '../ui/toaster';
import {
  FiEye,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { SwiftMessage, MessageStatus } from '../../types/operations';
import { swiftMessagesApi } from '../../services/operationsApi';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface SwiftMessagesTableProps {
  operationId?: string;
  showAll?: boolean;
  onViewContent?: (message: SwiftMessage) => void;
}

export const SwiftMessagesTable = ({
  operationId,
  showAll = false,
  onViewContent,
}: SwiftMessagesTableProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [messages, setMessages] = useState<SwiftMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SwiftMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [operationId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let data: SwiftMessage[];
      if (operationId) {
        data = await swiftMessagesApi.getByOperationId(operationId);
      } else {
        data = await swiftMessagesApi.getMessages();
      }
      setMessages(data);
    } catch (error) {
      toaster.create({
        title: t('common.error'),
        description: String(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MessageStatus): string => {
    const statusColors: Record<MessageStatus, string> = {
      DRAFT: 'gray',
      SENT: 'blue',
      DELIVERED: 'cyan',
      RECEIVED: 'green',
      PROCESSED: 'purple',
      FAILED: 'red',
    };
    return statusColors[status] || 'gray';
  };

  const formatDate = (date?: string): string => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handleViewContent = (message: SwiftMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
    onViewContent?.(message);
  };

  const columns: DataTableColumn<SwiftMessage>[] = [
    {
      key: 'direction',
      label: t('swiftMessages.direction'),
      filterType: 'select',
      filterOptions: [
        { value: 'OUTBOUND', label: t('swiftMessages.directions.OUTBOUND') },
        { value: 'INBOUND', label: t('swiftMessages.directions.INBOUND') },
      ],
      render: (row) => (
        <HStack>
          {row.direction === 'OUTBOUND' ? (
            <Badge colorPalette="blue" display="flex" alignItems="center">
              <FiArrowUp style={{ marginRight: 4 }} />
              {t('swiftMessages.directions.OUTBOUND')}
            </Badge>
          ) : (
            <Badge colorPalette="green" display="flex" alignItems="center">
              <FiArrowDown style={{ marginRight: 4 }} />
              {t('swiftMessages.directions.INBOUND')}
            </Badge>
          )}
        </HStack>
      ),
    },
    {
      key: 'messageType',
      label: t('swiftMessages.messageType'),
      render: (row) => <Badge colorPalette="purple">{row.messageType}</Badge>,
    },
    {
      key: 'createdAt',
      label: t('common.date'),
      hideOnMobile: true,
      render: (row) => (
        <Text color={colors.textColor} fontSize="sm">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </Text>
      ),
    },
    {
      key: 'field20Reference',
      label: t('swiftMessages.reference'),
      render: (row) => (
        <HStack>
          <Text color={colors.textColor} fontWeight="medium">
            {row.field20Reference || '-'}
          </Text>
          {row.expectsResponse && !row.responseReceived && (
            <Box color="orange.500" title={t('swiftMessages.pendingResponses')}>
              <FiClock />
            </Box>
          )}
          {row.responseDueDate &&
            new Date(row.responseDueDate) < new Date() &&
            !row.responseReceived && (
              <Box color="red.500" title={t('swiftMessages.overdueResponses')}>
                <FiAlertCircle />
              </Box>
            )}
        </HStack>
      ),
    },
    {
      key: 'senderBic',
      label: t('swiftMessages.senderBic'),
      hideOnMobile: true,
    },
    {
      key: 'receiverBic',
      label: t('swiftMessages.receiverBic'),
      hideOnMobile: true,
    },
    {
      key: 'amount',
      label: t('swiftMessages.amount'),
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <Text color={colors.textColor}>{formatAmount(row.amount, row.currency)}</Text>
      ),
    },
    {
      key: 'status',
      label: t('swiftMessages.status'),
      filterType: 'select',
      filterOptions: [
        { value: 'DRAFT', label: t('swiftMessages.messageStatuses.DRAFT') },
        { value: 'SENT', label: t('swiftMessages.messageStatuses.SENT') },
        { value: 'DELIVERED', label: t('swiftMessages.messageStatuses.DELIVERED') },
        { value: 'RECEIVED', label: t('swiftMessages.messageStatuses.RECEIVED') },
        { value: 'PROCESSED', label: t('swiftMessages.messageStatuses.PROCESSED') },
        { value: 'FAILED', label: t('swiftMessages.messageStatuses.FAILED') },
      ],
      render: (row) => (
        <Badge colorPalette={getStatusColor(row.status)}>
          {t(`swiftMessages.messageStatuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: 'ackReceived',
      label: t('swiftMessages.ackReceived'),
      hideOnMobile: true,
      sortable: false,
      filterable: false,
      render: (row) => (
        <>
          {row.direction === 'OUTBOUND' && (
            row.ackReceived ? (
              <Badge colorPalette="green" display="flex" alignItems="center">
                <FiCheck style={{ marginRight: 4 }} />
                {formatDate(row.ackReceivedAt)}
              </Badge>
            ) : (
              <Badge colorPalette="yellow">{t('swiftMessages.pendingAck')}</Badge>
            )
          )}
        </>
      ),
    },
  ];

  const actions: DataTableAction<SwiftMessage>[] = [
    {
      key: 'view',
      label: t('swiftMessages.viewContent'),
      icon: FiEye,
      onClick: (row) => handleViewContent(row),
    },
  ];

  return (
    <VStack gap={4} align="stretch">
      <DataTable<SwiftMessage>
        data={messages}
        columns={columns}
        rowKey={(row) => String(row.id)}
        actions={actions}
        isLoading={loading}
        emptyMessage={t('swiftMessages.noResults')}
        defaultPageSize={20}
        searchPlaceholder={t('swiftMessages.filter')}
      />

      <Dialog.Root open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg={colors.cardBg} maxW="800px">
            <Dialog.Header color={colors.textColor}>
              {selectedMessage?.messageType} - {selectedMessage?.field20Reference}
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body pb={6}>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between" flexWrap="wrap">
                  <HStack>
                    <Text fontWeight="medium" color={colors.textColor}>
                      {t('swiftMessages.direction')}:
                    </Text>
                    <Badge
                      colorPalette={
                        selectedMessage?.direction === 'OUTBOUND' ? 'blue' : 'green'
                      }
                    >
                      {selectedMessage &&
                        t(`swiftMessages.directions.${selectedMessage.direction}`)}
                    </Badge>
                  </HStack>
                  <HStack>
                    <Text fontWeight="medium" color={colors.textColor}>
                      {t('swiftMessages.status')}:
                    </Text>
                    <Badge colorPalette={getStatusColor(selectedMessage?.status || 'DRAFT')}>
                      {selectedMessage &&
                        t(`swiftMessages.messageStatuses.${selectedMessage.status}`)}
                    </Badge>
                  </HStack>
                </HStack>

                <HStack justify="space-between" flexWrap="wrap">
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {t('swiftMessages.senderBic')}
                    </Text>
                    <Text color={colors.textColor} fontWeight="medium">
                      {selectedMessage?.senderBic}
                    </Text>
                  </VStack>
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {t('swiftMessages.receiverBic')}
                    </Text>
                    <Text color={colors.textColor} fontWeight="medium">
                      {selectedMessage?.receiverBic}
                    </Text>
                  </VStack>
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {t('swiftMessages.amount')}
                    </Text>
                    <Text color={colors.textColor} fontWeight="medium">
                      {formatAmount(selectedMessage?.amount, selectedMessage?.currency)}
                    </Text>
                  </VStack>
                </HStack>

                <Box>
                  <Text fontWeight="medium" mb={2} color={colors.textColor}>
                    SWIFT Content
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre-wrap"
                    p={4}
                    borderRadius="md"
                    bg={colors.bgColor}
                    overflowX="auto"
                    fontSize="sm"
                  >
                    {selectedMessage?.swiftContent || 'No content available'}
                  </Code>
                </Box>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  );
};
