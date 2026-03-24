/**
 * OperationSummaryPanel - Beautiful summary view for operations
 *
 * Displays a comprehensive and visually appealing summary of an operation
 * including amounts, dates, parties, and alerts in a card-based layout.
 */
import { useState } from 'react';
import { Box, Text, VStack, HStack, Badge, Grid, GridItem, Progress, Button, Spinner } from '@chakra-ui/react';
import {
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiFileText,
  FiArrowRight,
  FiInfo,
  FiAlertCircle,
  FiMail,
  FiCheck,
  FiPrinter,
  FiLock
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../ui/toaster';
import { operationCommands } from '../../services/operationsApi';
import { GuaranteeDocumentButton } from './GuaranteeDocumentButton';
import type { Operation, OperationAnalysisSummary } from '../../types/operations';

interface OperationSummaryPanelProps {
  operation: Operation;
  summary: OperationAnalysisSummary | null;
  loading?: boolean;
  onResponseMarked?: (operation: Operation) => void;
}

export const OperationSummaryPanel = ({ operation, summary, loading, onResponseMarked }: OperationSummaryPanelProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [markingResponse, setMarkingResponse] = useState(false);

  const handleMarkResponseReceived = async () => {
    if (!operation.awaitingMessageType) return;

    setMarkingResponse(true);
    try {
      await operationCommands.markResponseReceived(operation.operationId, operation.awaitingMessageType);
      toaster.create({
        title: t('operations.responseMarked'),
        description: t('operations.responseMarkedSuccess', { messageType: operation.awaitingMessageType }),
        type: 'success',
        duration: 5000,
      });
      // Update local state and notify parent
      const updatedOperation = {
        ...operation,
        awaitingResponse: false,
        awaitingMessageType: undefined,
        responseDueDate: undefined,
      };
      onResponseMarked?.(updatedOperation);
    } catch (error) {
      toaster.create({
        title: t('common.error'),
        description: String(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setMarkingResponse(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Box className="animate-pulse" w="100%">
          <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
            {[1, 2, 3, 4].map(i => (
              <GridItem key={i}>
                <Box h="100px" bg={isDark ? 'gray.700' : 'gray.100'} borderRadius="xl" />
              </GridItem>
            ))}
          </Grid>
          <Box h="150px" bg={isDark ? 'gray.700' : 'gray.100'} borderRadius="xl" />
        </Box>
      </Box>
    );
  }

  const formatCurrency = (amount: number | undefined | null, currency: string | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Theme-aware colors for better dark/light mode support
  const mutedTextColor = isDark ? 'gray.400' : 'gray.600';
  const cardBgColor = isDark ? 'gray.800' : 'white';
  const cardBorderColor = isDark ? 'gray.700' : 'gray.200';
  const innerCardBgColor = isDark ? 'gray.700' : 'gray.50';

  const utilizationPercentage = summary?.amounts?.utilizationPercentage || 0;
  const daysToExpiry = summary?.dates?.daysToExpiry;
  const isExpired = summary?.dates?.expired || false;
  const isExpiringSoon = daysToExpiry !== undefined && daysToExpiry <= 30 && daysToExpiry > 0;

  return (
    <VStack gap={6} align="stretch">
      {/* Hero Card - Main Operation Info */}
      <Box
        bg={isDark
          ? 'linear-gradient(to right, #1a365d, #44337a)'
          : 'linear-gradient(to right, #3182ce, #805ad5)'
        }
        borderRadius="2xl"
        p={6}
        color="white"
        position="relative"
        overflow="hidden"
      >
        {/* Background Pattern */}
        <Box
          position="absolute"
          top={0}
          right={0}
          w="200px"
          h="200px"
          bg="whiteAlpha.100"
          borderRadius="full"
          transform="translate(50%, -50%)"
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          w="150px"
          h="150px"
          bg="whiteAlpha.50"
          borderRadius="full"
          transform="translate(-50%, 50%)"
        />

        <HStack justify="space-between" position="relative" zIndex={1}>
          <VStack align="start" gap={1}>
            <HStack gap={2}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="whiteAlpha.900"
                bg="whiteAlpha.200"
                px={2}
                py={0.5}
                borderRadius="md"
              >
                {t(`operations.stages.${operation.stage}`)}
              </Text>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                color="whiteAlpha.800"
              >
                • {t(`operations.statuses.${operation.status}`)}
              </Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold" color="white">
              {operation.reference}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.900">
              {operation.messageType} - {t(`operations.productTypes.${operation.productType}`)}
            </Text>
          </VStack>

          <VStack align="end" gap={1}>
            <Text fontSize="sm" color="whiteAlpha.800">{t('operations.currentAmount')}</Text>
            <Text fontSize="4xl" fontWeight="bold" color="white">
              {formatCurrency(summary?.amounts?.currentAmount || operation.amount, summary?.amounts?.currency || operation.currency)}
            </Text>
            {summary?.amounts?.originalAmount && summary.amounts.originalAmount !== summary.amounts.currentAmount && (
              <Text fontSize="sm" color="whiteAlpha.700">
                {t('operations.originalAmount')}: {formatCurrency(summary.amounts.originalAmount, summary.amounts.currency)}
              </Text>
            )}
          </VStack>
        </HStack>
      </Box>

      {/* Closed Operation Banner - Shows when operation is closed (read-only) */}
      {operation.status === 'CLOSED' && (
        <Box
          bg={isDark ? 'gray.700' : 'gray.100'}
          border="2px solid"
          borderColor={isDark ? 'gray.600' : 'gray.300'}
          borderRadius="xl"
          p={4}
        >
          <HStack gap={3}>
            <Box
              bg={isDark ? 'gray.600' : 'gray.200'}
              p={3}
              borderRadius="full"
            >
              <FiLock size={24} color={isDark ? '#A0AEC0' : '#4A5568'} />
            </Box>
            <VStack align="start" gap={0} flex={1}>
              <Text fontWeight="bold" color={isDark ? 'gray.200' : 'gray.700'}>
                {t('operations.closedOperation')}
              </Text>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'}>
                {t('operations.closedOperationDescription')}
              </Text>
            </VStack>
            <Badge colorPalette="gray" size="lg" px={3} py={1}>
              <HStack gap={1}>
                <FiLock size={14} />
                <Text>{t('operations.readOnly')}</Text>
              </HStack>
            </Badge>
          </HStack>
        </Box>
      )}

      {/* Awaiting Response Card - Shows when operation is waiting for a SWIFT response */}
      {operation.awaitingResponse && operation.awaitingMessageType && (
        <Box
          bg={isDark
            ? 'linear-gradient(to right, #744210, #975a16)'
            : 'linear-gradient(to right, #ed8936, #dd6b20)'
          }
          borderRadius="xl"
          p={5}
          color="white"
          borderWidth="2px"
          borderColor={isDark ? 'orange.600' : 'orange.400'}
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack gap={4}>
              <Box p={3} bg="whiteAlpha.200" borderRadius="full">
                <FiMail size={24} />
              </Box>
              <VStack align="start" gap={0}>
                <HStack gap={2}>
                  <Text fontWeight="bold" fontSize="lg">
                    {t('operations.awaitingResponse')}
                  </Text>
                  <Badge colorPalette="yellow" variant="solid" size="lg">
                    {operation.awaitingMessageType}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.900">
                  {t('operations.awaitingResponseDescription', { messageType: operation.awaitingMessageType })}
                </Text>
                {operation.responseDueDate && (
                  <HStack gap={1} mt={1}>
                    <FiClock size={14} />
                    <Text fontSize="sm" color="whiteAlpha.800">
                      {t('operations.responseDueDate')}: {operation.responseDueDate}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </HStack>

            <Button
              colorPalette="green"
              size="lg"
              onClick={handleMarkResponseReceived}
              disabled={markingResponse}
            >
              {markingResponse ? (
                <HStack gap={2}>
                  <Spinner size="sm" />
                  <Text>{t('common.processing')}</Text>
                </HStack>
              ) : (
                <HStack gap={2}>
                  <FiCheck size={18} />
                  <Text>{t('operations.markResponseReceived')}</Text>
                </HStack>
              )}
            </Button>
          </HStack>
        </Box>
      )}

      {/* Metrics Cards */}
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        {/* Utilization Card */}
        <GridItem>
          <Box
            bg={cardBgColor}
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor={cardBorderColor}
            h="100%"
          >
            <HStack mb={3}>
              <Box p={2} bg={isDark ? 'blue.900' : 'blue.100'} borderRadius="lg">
                <FiTrendingUp color={isDark ? '#63B3ED' : '#3182CE'} size={20} />
              </Box>
              <Text fontSize="sm" color={mutedTextColor}>{t('operations.utilization')}</Text>
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {utilizationPercentage.toFixed(1)}%
            </Text>
            <Progress.Root value={utilizationPercentage} size="sm" mt={2} colorPalette="blue">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <HStack justify="space-between" mt={2} fontSize="xs" color={mutedTextColor}>
              <Text>{formatCurrency(summary?.amounts?.utilizedAmount, summary?.amounts?.currency)}</Text>
              <Text>{t('operations.of')} {formatCurrency(summary?.amounts?.currentAmount, summary?.amounts?.currency)}</Text>
            </HStack>
          </Box>
        </GridItem>

        {/* Expiry Card */}
        <GridItem>
          <Box
            bg={cardBgColor}
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor={isExpired ? 'red.300' : isExpiringSoon ? 'orange.300' : cardBorderColor}
            h="100%"
          >
            <HStack mb={3}>
              <Box p={2} bg={isExpired ? (isDark ? 'red.900' : 'red.100') : isExpiringSoon ? (isDark ? 'orange.900' : 'orange.100') : (isDark ? 'green.900' : 'green.100')} borderRadius="lg">
                <FiCalendar color={isExpired ? (isDark ? '#FC8181' : '#E53E3E') : isExpiringSoon ? (isDark ? '#F6AD55' : '#DD6B20') : (isDark ? '#68D391' : '#38A169')} size={20} />
              </Box>
              <Text fontSize="sm" color={mutedTextColor}>{t('operations.expiryDate')}</Text>
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={isExpired ? 'red.500' : isExpiringSoon ? 'orange.500' : colors.textColor}>
              {summary?.dates?.currentExpiryDate || '-'}
            </Text>
            {daysToExpiry !== undefined && (
              <HStack mt={2}>
                <FiClock size={14} color={isExpired ? (isDark ? '#FC8181' : '#E53E3E') : isExpiringSoon ? (isDark ? '#F6AD55' : '#DD6B20') : (isDark ? '#A0AEC0' : '#718096')} />
                <Text fontSize="sm" color={isExpired ? 'red.400' : isExpiringSoon ? 'orange.400' : mutedTextColor}>
                  {isExpired
                    ? t('operations.expiredDaysAgo', { days: Math.abs(daysToExpiry) })
                    : t('operations.daysRemaining', { days: daysToExpiry })
                  }
                </Text>
              </HStack>
            )}
          </Box>
        </GridItem>

        {/* Amendments Card */}
        <GridItem>
          <Box
            bg={cardBgColor}
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor={cardBorderColor}
            h="100%"
          >
            <HStack mb={3}>
              <Box p={2} bg={isDark ? 'purple.900' : 'purple.100'} borderRadius="lg">
                <FiFileText color={isDark ? '#B794F4' : '#805AD5'} size={20} />
              </Box>
              <Text fontSize="sm" color={mutedTextColor}>{t('operations.amendments')}</Text>
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {summary?.totalAmendments || 0}
            </Text>
            <Text fontSize="sm" color={mutedTextColor} mt={2}>
              {t('operations.totalMessages')}: {summary?.totalMessages || 0}
            </Text>
          </Box>
        </GridItem>

        {/* Alerts Card */}
        <GridItem>
          <Box
            bg={cardBgColor}
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor={summary?.alerts && summary.alerts.length > 0 ? 'orange.300' : cardBorderColor}
            h="100%"
          >
            <HStack mb={3}>
              <Box p={2} bg={summary?.alerts && summary.alerts.length > 0 ? (isDark ? 'orange.900' : 'orange.100') : (isDark ? 'green.900' : 'green.100')} borderRadius="lg">
                {summary?.alerts && summary.alerts.length > 0
                  ? <FiAlertTriangle color={isDark ? '#F6AD55' : '#DD6B20'} size={20} />
                  : <FiCheckCircle color={isDark ? '#68D391' : '#38A169'} size={20} />
                }
              </Box>
              <Text fontSize="sm" color={mutedTextColor}>{t('operations.alerts')}</Text>
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={summary?.alerts && summary.alerts.length > 0 ? 'orange.400' : 'green.400'}>
              {summary?.alerts?.length || 0}
            </Text>
            <Text fontSize="sm" color={mutedTextColor} mt={2}>
              {summary?.alerts && summary.alerts.length > 0
                ? t('operations.alertsRequireAttention')
                : t('operations.noAlertsAllClear')
              }
            </Text>
          </Box>
        </GridItem>
      </Grid>

      {/* Parties Section */}
      {summary?.parties && (
        <Box
          bg={cardBgColor}
          borderRadius="xl"
          p={5}
          borderWidth="1px"
          borderColor={cardBorderColor}
        >
          <HStack mb={4}>
            <Box p={2} bg={isDark ? 'cyan.900' : 'cyan.100'} borderRadius="lg">
              <FiUsers color={isDark ? '#76E4F7' : '#00B5D8'} size={20} />
            </Box>
            <Text fontWeight="bold" color={colors.textColor}>{t('operations.parties')}</Text>
          </HStack>

          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            {/* Applicant */}
            {(summary.parties.applicantName || operation.applicantName) && (
              <GridItem>
                <Box
                  p={4}
                  bg={innerCardBgColor}
                  borderRadius="lg"
                  borderLeftWidth="4px"
                  borderLeftColor="blue.400"
                >
                  <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase" fontWeight="semibold" mb={1}>
                    {t('operations.applicant')}
                  </Text>
                  <Text fontWeight="bold" color={colors.textColor}>
                    {summary.parties.applicantName || operation.applicantName}
                  </Text>
                  {summary.parties.applicantAddress && (
                    <Text fontSize="sm" color={mutedTextColor} mt={1}>
                      {summary.parties.applicantAddress}
                    </Text>
                  )}
                </Box>
              </GridItem>
            )}

            {/* Beneficiary */}
            {(summary.parties.beneficiaryName || operation.beneficiaryName) && (
              <GridItem>
                <Box
                  p={4}
                  bg={innerCardBgColor}
                  borderRadius="lg"
                  borderLeftWidth="4px"
                  borderLeftColor="green.400"
                >
                  <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase" fontWeight="semibold" mb={1}>
                    {t('operations.beneficiary')}
                  </Text>
                  <Text fontWeight="bold" color={colors.textColor}>
                    {summary.parties.beneficiaryName || operation.beneficiaryName}
                  </Text>
                  {summary.parties.beneficiaryAddress && (
                    <Text fontSize="sm" color={mutedTextColor} mt={1}>
                      {summary.parties.beneficiaryAddress}
                    </Text>
                  )}
                </Box>
              </GridItem>
            )}

            {/* Issuing Bank */}
            {(summary.parties.issuingBankBic || summary.parties.issuingBankName) && (
              <GridItem>
                <Box
                  p={4}
                  bg={innerCardBgColor}
                  borderRadius="lg"
                  borderLeftWidth="4px"
                  borderLeftColor="purple.400"
                >
                  <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase" fontWeight="semibold" mb={1}>
                    {t('operations.issuingBank')}
                  </Text>
                  <Text fontWeight="bold" color={colors.textColor}>
                    {summary.parties.issuingBankName || summary.parties.issuingBankBic}
                  </Text>
                  {summary.parties.issuingBankName && summary.parties.issuingBankBic && (
                    <Text fontSize="sm" color={mutedTextColor} mt={1}>
                      BIC: {summary.parties.issuingBankBic}
                    </Text>
                  )}
                </Box>
              </GridItem>
            )}

            {/* Advising Bank */}
            {(summary.parties.advisingBankBic || summary.parties.advisingBankName) && (
              <GridItem>
                <Box
                  p={4}
                  bg={innerCardBgColor}
                  borderRadius="lg"
                  borderLeftWidth="4px"
                  borderLeftColor="orange.400"
                >
                  <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase" fontWeight="semibold" mb={1}>
                    {t('operations.advisingBank')}
                  </Text>
                  <Text fontWeight="bold" color={colors.textColor}>
                    {summary.parties.advisingBankName || summary.parties.advisingBankBic}
                  </Text>
                  {summary.parties.advisingBankName && summary.parties.advisingBankBic && (
                    <Text fontSize="sm" color={mutedTextColor} mt={1}>
                      BIC: {summary.parties.advisingBankBic}
                    </Text>
                  )}
                </Box>
              </GridItem>
            )}
          </Grid>
        </Box>
      )}

      {/* Alerts Section - Only if there are alerts */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <Box
          bg={cardBgColor}
          borderRadius="xl"
          p={5}
          borderWidth="1px"
          borderColor={isDark ? 'orange.700' : 'orange.200'}
        >
          <HStack mb={4}>
            <Box p={2} bg={isDark ? 'orange.900' : 'orange.100'} borderRadius="lg">
              <FiAlertTriangle color={isDark ? '#F6AD55' : '#DD6B20'} size={20} />
            </Box>
            <Text fontWeight="bold" color={colors.textColor}>
              {t('operations.activeAlerts')} ({summary.alerts.length})
            </Text>
          </HStack>

          <VStack gap={3} align="stretch">
            {summary.alerts.map((alert, index) => (
              <HStack
                key={index}
                p={3}
                bg={
                  alert.type === 'DANGER' ? (isDark ? 'red.900' : 'red.50') :
                  alert.type === 'WARNING' ? (isDark ? 'orange.900' : 'orange.50') :
                  alert.type === 'INFO' ? (isDark ? 'blue.900' : 'blue.50') :
                  (isDark ? 'green.900' : 'green.50')
                }
                borderRadius="lg"
                borderLeftWidth="4px"
                borderLeftColor={
                  alert.type === 'DANGER' ? 'red.400' :
                  alert.type === 'WARNING' ? 'orange.400' :
                  alert.type === 'INFO' ? 'blue.400' : 'green.400'
                }
              >
                {alert.type === 'DANGER' && <FiAlertCircle color={isDark ? '#FC8181' : '#E53E3E'} size={20} />}
                {alert.type === 'WARNING' && <FiAlertTriangle color={isDark ? '#F6AD55' : '#DD6B20'} size={20} />}
                {alert.type === 'INFO' && <FiInfo color={isDark ? '#63B3ED' : '#3182CE'} size={20} />}
                {alert.type === 'SUCCESS' && <FiCheckCircle color={isDark ? '#68D391' : '#38A169'} size={20} />}
                <VStack align="start" gap={0} flex={1}>
                  <Text fontWeight="medium" color={colors.textColor}>
                    {t(`operations.alertCodes.${alert.code}`, alert.code)}
                  </Text>
                  <Text fontSize="sm" color={mutedTextColor}>
                    {t(`operations.alertMessages.${alert.code}`, { ...alert.params, defaultValue: alert.code })}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Key Dates Timeline - Visual Progress Bar */}
      {summary?.dates && (
        <Box
          bg={cardBgColor}
          borderRadius="xl"
          p={5}
          borderWidth="1px"
          borderColor={cardBorderColor}
        >
          <HStack mb={4}>
            <Box p={2} bg={isDark ? 'teal.900' : 'teal.100'} borderRadius="lg">
              <FiClock color={isDark ? '#4FD1C5' : '#319795'} size={20} />
            </Box>
            <Text fontWeight="bold" color={colors.textColor}>{t('operations.keyDates')}</Text>
          </HStack>

          {/* Visual Timeline Progress Bar */}
          {(() => {
            const issueDate = summary.dates.issueDate ? new Date(summary.dates.issueDate) : null;
            const expiryDate = summary.dates.currentExpiryDate ? new Date(summary.dates.currentExpiryDate) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (issueDate && expiryDate) {
              const totalDays = Math.ceil((expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
              const elapsedDays = Math.ceil((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
              const remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              // Calculate percentages for the bar
              const elapsedPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
              const exceededDays = remainingDays < 0 ? Math.abs(remainingDays) : 0;
              // For exceeded, show as additional bar (capped at 50% extra for visual)
              const exceededPercent = exceededDays > 0 ? Math.min(50, (exceededDays / totalDays) * 100) : 0;

              return (
                <VStack gap={4} align="stretch">
                  {/* Date Labels Row */}
                  <HStack justify="space-between">
                    <VStack align="start" gap={0}>
                      <Text fontSize="xs" color={mutedTextColor} fontWeight="medium">
                        {t('operations.issueDate')}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color="blue.500">
                        {summary.dates.issueDate}
                      </Text>
                    </VStack>
                    <VStack align="end" gap={0}>
                      <Text fontSize="xs" color={mutedTextColor} fontWeight="medium">
                        {t('operations.expiryDate')}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={isExpired ? 'red.500' : isExpiringSoon ? 'orange.500' : 'green.500'}
                      >
                        {summary.dates.currentExpiryDate}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Progress Bar Container */}
                  <Box position="relative" overflow="hidden" px={2}>
                    {/* Progress Bar */}
                    <Box
                      position="relative"
                      h="24px"
                      bg={isDark ? 'gray.700' : 'gray.200'}
                      borderRadius="full"
                      overflow="hidden"
                    >
                      {/* Elapsed Time (Blue/Green) */}
                      <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        w={`${Math.min(elapsedPercent, 100)}%`}
                        bg={isExpired
                          ? 'linear-gradient(90deg, #3182CE 0%, #E53E3E 100%)'
                          : isExpiringSoon
                            ? 'linear-gradient(90deg, #3182CE 0%, #DD6B20 100%)'
                            : 'linear-gradient(90deg, #3182CE 0%, #38A169 100%)'
                        }
                        borderRadius="full"
                        transition="width 0.5s ease-out"
                      />

                      {/* Exceeded Time Indicator (pulsing overlay on the full bar) */}
                      {isExpired && (
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          right={0}
                          bottom={0}
                          bg="linear-gradient(90deg, rgba(229, 62, 62, 0.3) 0%, rgba(197, 48, 48, 0.6) 100%)"
                          borderRadius="full"
                          animation="pulse 2s infinite"
                        />
                      )}

                      {/* Today Marker */}
                      {!isExpired && elapsedPercent > 0 && elapsedPercent < 100 && (
                        <Box
                          position="absolute"
                          left={`${elapsedPercent}%`}
                          top="-8px"
                          transform="translateX(-50%)"
                          zIndex={2}
                        >
                          <VStack gap={0}>
                            <Box
                              bg={isDark ? 'white' : 'gray.800'}
                              color={isDark ? 'gray.800' : 'white'}
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              fontSize="xs"
                              fontWeight="bold"
                              boxShadow="md"
                            >
                              {t('operations.today', 'HOY')}
                            </Box>
                            <Box
                              w={0}
                              h={0}
                              borderLeft="6px solid transparent"
                              borderRight="6px solid transparent"
                              borderTop={isDark ? '6px solid white' : '6px solid #1A202C'}
                            />
                          </VStack>
                        </Box>
                      )}

                      {/* Start marker */}
                      <Box
                        position="absolute"
                        left={0}
                        top="50%"
                        transform="translateY(-50%)"
                        w="16px"
                        h="16px"
                        bg="blue.500"
                        borderRadius="full"
                        borderWidth="3px"
                        borderColor={isDark ? 'gray.800' : 'white'}
                        boxShadow="sm"
                      />

                      {/* End marker */}
                      <Box
                        position="absolute"
                        right={0}
                        top="50%"
                        transform="translateY(-50%)"
                        w="16px"
                        h="16px"
                        bg={isExpired ? 'red.500' : isExpiringSoon ? 'orange.500' : 'green.500'}
                        borderRadius="full"
                        borderWidth="3px"
                        borderColor={isDark ? 'gray.800' : 'white'}
                        boxShadow={isExpired ? '0 0 8px rgba(229, 62, 62, 0.6)' : 'sm'}
                        animation={isExpired ? 'pulse 2s infinite' : undefined}
                      />
                    </Box>
                  </Box>

                  {/* Statistics Row */}
                  <Grid templateColumns="repeat(4, 1fr)" gap={3}>
                    <GridItem>
                      <Box
                        p={3}
                        bg={isDark ? 'blue.900' : 'blue.50'}
                        borderRadius="lg"
                        borderLeftWidth="3px"
                        borderLeftColor="blue.500"
                      >
                        <Text fontSize="xs" color={mutedTextColor}>{t('operations.totalDuration', 'Duración Total')}</Text>
                        <Text fontSize="lg" fontWeight="bold" color="blue.500">
                          {totalDays} {t('operations.days', 'días')}
                        </Text>
                      </Box>
                    </GridItem>
                    <GridItem>
                      <Box
                        p={3}
                        bg={isDark ? 'cyan.900' : 'cyan.50'}
                        borderRadius="lg"
                        borderLeftWidth="3px"
                        borderLeftColor="cyan.500"
                      >
                        <Text fontSize="xs" color={mutedTextColor}>{t('operations.elapsed', 'Transcurrido')}</Text>
                        <Text fontSize="lg" fontWeight="bold" color="cyan.500">
                          {Math.max(0, elapsedDays)} {t('operations.days', 'días')}
                        </Text>
                      </Box>
                    </GridItem>
                    <GridItem>
                      <Box
                        p={3}
                        bg={isExpired ? (isDark ? 'red.900' : 'red.50') : isExpiringSoon ? (isDark ? 'orange.900' : 'orange.50') : (isDark ? 'green.900' : 'green.50')}
                        borderRadius="lg"
                        borderLeftWidth="3px"
                        borderLeftColor={isExpired ? 'red.500' : isExpiringSoon ? 'orange.500' : 'green.500'}
                      >
                        <Text fontSize="xs" color={mutedTextColor}>
                          {isExpired ? t('operations.exceeded', 'Excedido') : t('operations.remaining', 'Restante')}
                        </Text>
                        <Text
                          fontSize="lg"
                          fontWeight="bold"
                          color={isExpired ? 'red.500' : isExpiringSoon ? 'orange.500' : 'green.500'}
                        >
                          {isExpired ? exceededDays : remainingDays} {t('operations.days', 'días')}
                        </Text>
                      </Box>
                    </GridItem>
                    <GridItem>
                      <Box
                        p={3}
                        bg={isDark ? 'purple.900' : 'purple.50'}
                        borderRadius="lg"
                        borderLeftWidth="3px"
                        borderLeftColor="purple.500"
                      >
                        <Text fontSize="xs" color={mutedTextColor}>{t('operations.progress', 'Progreso')}</Text>
                        <Text fontSize="lg" fontWeight="bold" color="purple.500">
                          {Math.min(100, Math.round(elapsedPercent))}%
                        </Text>
                      </Box>
                    </GridItem>
                  </Grid>

                  {/* Additional dates if available */}
                  {summary.dates.latestShipmentDate && (
                    <Box
                      p={3}
                      bg={innerCardBgColor}
                      borderRadius="lg"
                      borderLeftWidth="3px"
                      borderLeftColor="purple.400"
                    >
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          <FiCalendar color={isDark ? '#B794F4' : '#805AD5'} />
                          <Text fontSize="sm" color={mutedTextColor}>{t('operations.latestShipment')}</Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                          {summary.dates.latestShipmentDate}
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              );
            }

            // Fallback for missing dates
            return (
              <HStack gap={4} justify="space-between" flexWrap="wrap">
                {summary.dates.issueDate && (
                  <VStack align="center" gap={1}>
                    <Box w="12px" h="12px" bg="blue.400" borderRadius="full" />
                    <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                      {summary.dates.issueDate}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>{t('operations.issueDate')}</Text>
                  </VStack>
                )}
                <Box flex={1} h="2px" bg={isDark ? 'gray.600' : 'gray.300'} alignSelf="center" minW="40px" />
                <VStack align="center" gap={1}>
                  <Box
                    w="12px"
                    h="12px"
                    bg={isExpired ? 'red.400' : isExpiringSoon ? 'orange.400' : 'green.400'}
                    borderRadius="full"
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={isExpired ? 'red.400' : isExpiringSoon ? 'orange.400' : colors.textColor}
                  >
                    {summary.dates.currentExpiryDate}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor}>{t('operations.expiryDate')}</Text>
                </VStack>
              </HStack>
            );
          })()}
        </Box>
      )}

      {/* Generate Document Button - Only for Guarantees */}
      {operation.productType === 'GUARANTEE' && (
        <Box
          bg={cardBgColor}
          borderRadius="xl"
          p={5}
          borderWidth="1px"
          borderColor={cardBorderColor}
        >
          <HStack justify="space-between" align="center">
            <HStack>
              <Box p={2} bg={isDark ? 'blue.900' : 'blue.100'} borderRadius="lg">
                <FiPrinter color={isDark ? '#63B3ED' : '#3182CE'} size={20} />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontWeight="bold" color={colors.textColor}>
                  {t('guaranteeDocument.generateSection', 'Generar Documento de Garantia')}
                </Text>
                <Text fontSize="sm" color={mutedTextColor}>
                  {t('guaranteeDocument.generateDescription', 'Descarga el documento PDF de la garantia en espanol o ingles')}
                </Text>
              </VStack>
            </HStack>
            <GuaranteeDocumentButton
              guaranteeNumber={operation.reference}
              size="md"
              variant="solid"
            />
          </HStack>
        </Box>
      )}
    </VStack>
  );
};

export default OperationSummaryPanel;
