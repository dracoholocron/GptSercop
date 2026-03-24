/**
 * OperationCard - Shared reusable operation card component
 *
 * Used in: MobileHomeDashboard, RadialActionMenu search results
 * Responsive: stacked on mobile, horizontal grid on desktop (md+)
 * Shows: urgency badge, reference, parties, amount, stage/status, action buttons
 */

import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import {
  FiChevronRight,
  FiUser,
  FiFileText,
  FiEye,
  FiMessageSquare,
  FiActivity,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { Operation } from '../../types/operations';

// === Helpers ===

const productTypeLabels: Record<string, string> = {
  LC_IMPORT: 'LC Import',
  LC_EXPORT: 'LC Export',
  GUARANTEE: 'Guarantee',
  COLLECTION: 'Collection',
  STANDBY_LC: 'Standby LC',
  COLLECTION_IMPORT: 'Coll. Import',
  COLLECTION_EXPORT: 'Coll. Export',
  GUARANTEE_MANDATARIA: 'Gar. Mandataria',
  TRADE_FINANCING: 'Trade Finance',
  AVAL_DESCUENTO: 'Aval/Desc.',
};

const productTypeColors: Record<string, { bg: string; text: string }> = {
  LC_IMPORT: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  LC_EXPORT: { bg: 'rgba(6,182,212,0.12)', text: '#06B6D4' },
  GUARANTEE: { bg: 'rgba(139,92,246,0.12)', text: '#8B5CF6' },
  COLLECTION: { bg: 'rgba(249,115,22,0.12)', text: '#F97316' },
  STANDBY_LC: { bg: 'rgba(20,184,166,0.12)', text: '#14B8A6' },
  GUARANTEE_MANDATARIA: { bg: 'rgba(139,92,246,0.10)', text: '#7C3AED' },
  TRADE_FINANCING: { bg: 'rgba(234,179,8,0.12)', text: '#CA8A04' },
  AVAL_DESCUENTO: { bg: 'rgba(236,72,153,0.12)', text: '#EC4899' },
  COLLECTION_IMPORT: { bg: 'rgba(249,115,22,0.10)', text: '#EA580C' },
  COLLECTION_EXPORT: { bg: 'rgba(249,115,22,0.10)', text: '#EA580C' },
};

function getStatusAccent(op: Operation): string {
  if (op.hasAlerts) return '#EF4444';
  if (op.awaitingResponse) return '#F59E0B';
  if (op.status === 'ACTIVE') return '#3B82F6';
  return '#9CA3AF';
}

function formatAmountValue(op: Operation): string {
  if (!op.amount) return '';
  const formatted = op.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${op.currency || 'USD'} ${formatted}`;
}

function getDaysUntilExpiry(expiryDate?: string): number {
  if (!expiryDate) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = expiryDate.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyStyle(days: number) {
  if (days < 0) return { color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', pulse: true };
  if (days === 0) return { color: '#DC2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)', pulse: true };
  if (days <= 3) return { color: '#EA580C', bg: 'rgba(234,88,12,0.1)', border: 'rgba(234,88,12,0.3)', pulse: true };
  if (days <= 7) return { color: '#CA8A04', bg: 'rgba(202,138,4,0.1)', border: 'rgba(202,138,4,0.3)', pulse: false };
  if (days <= 15) return { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', pulse: false };
  if (days <= 30) return { color: '#0891B2', bg: 'rgba(8,145,178,0.1)', border: 'rgba(8,145,178,0.2)', pulse: false };
  return { color: '#16A34A', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.2)', pulse: false };
}

// === Component ===

export interface OperationCardProps {
  op: Operation;
  darkMode: boolean;
  cardBg: string;
  cardBorder: string;
  colors: {
    textColor: string;
    textColorSecondary: string;
    [key: string]: string;
  };
  /** Optional generic click (used when no action buttons) */
  onClick?: () => void;
  /** Action: View form/wizard */
  onViewForm?: (op: Operation) => void;
  /** Action: View details/summary */
  onViewDetails?: (op: Operation) => void;
  /** Action: View SWIFT messages */
  onViewMessages?: (op: Operation) => void;
  /** Action: Execute event on this operation */
  onExecuteEvent?: (op: Operation) => void;
  /** CSS animation stagger delay index (1-based) */
  delay?: number;
  /** Accent color override (e.g. from selected event) */
  accentColor?: string;
  /** Show product badge (default true) */
  showProductBadge?: boolean;
  /** Compact mode - less padding, smaller text */
  compact?: boolean;
}

export const OperationCard: React.FC<OperationCardProps> = ({
  op,
  darkMode,
  cardBg,
  cardBorder,
  colors,
  onClick,
  onViewForm,
  onViewDetails,
  onViewMessages,
  onExecuteEvent,
  delay = 1,
  accentColor,
  showProductBadge = true,
  compact = false,
}) => {
  const { t, i18n } = useTranslation();
  const statusAccent = accentColor || getStatusAccent(op);
  const days = getDaysUntilExpiry(op.expiryDate);
  const urgency = getUrgencyStyle(days);
  const hasActions = !!(onViewForm || onViewDetails || onViewMessages || onExecuteEvent);

  const formatDate = (date?: string): string => {
    if (!date) return '';
    try {
      const [y, m, d] = date.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(
        i18n.language === 'es' ? 'es-ES' : 'en-US',
        { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch { return date; }
  };

  const formatCountdown = (d: number): string => {
    if (!isFinite(d)) return t('operations.expiry.noExpiry', 'Sin vencimiento');
    if (d < 0) return t('operations.expiry.daysExpired', { days: Math.abs(d), defaultValue: `${Math.abs(d)}d vencida` });
    if (d === 0) return t('operations.expiry.today', 'Hoy');
    if (d < 7) return t('operations.expiry.daysLeft', { days: d, defaultValue: `${d}d` });
    if (d < 30) {
      const weeks = Math.floor(d / 7);
      return t('operations.expiry.weeksLeft', { weeks, defaultValue: `${weeks}sem` });
    }
    const months = Math.floor(d / 30);
    return t('operations.expiry.monthsLeft', { months, defaultValue: `${months}m` });
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const stagePalette =
    op.stage === 'EXPIRED' ? 'red' :
    op.stage === 'CANCELLED' ? 'gray' :
    op.stage === 'ISSUED' ? 'blue' :
    op.stage === 'CONFIRMED' ? 'green' : 'cyan';

  const statusPalette =
    op.status === 'ACTIVE' ? 'green' :
    op.status === 'PENDING_RESPONSE' ? 'orange' :
    op.status === 'ON_HOLD' ? 'gray' : 'blue';

  // Action buttons row (shared between mobile and desktop)
  const ActionButtons = () => (
    <HStack gap={1}>
      {onViewForm && (
        <IconButton
          aria-label={t('operations.actions.viewForm', 'Ver Formulario')}
          size="sm"
          variant="ghost"
          colorPalette="blue"
          onClick={(e) => { stop(e); onViewForm(op); }}
          title={t('operations.actions.viewForm', 'Ver Formulario')}
        >
          <FiFileText />
        </IconButton>
      )}
      {onViewDetails && (
        <IconButton
          aria-label={t('operations.actions.viewDetails', 'Ver Detalles')}
          size="sm"
          variant="ghost"
          onClick={(e) => { stop(e); onViewDetails(op); }}
          title={t('operations.actions.viewDetails', 'Ver Detalles')}
        >
          <FiEye />
        </IconButton>
      )}
      {onViewMessages && (
        <IconButton
          aria-label={t('operations.actions.viewMessages', 'Ver Mensajes')}
          size="sm"
          variant="ghost"
          onClick={(e) => { stop(e); onViewMessages(op); }}
          title={t('operations.actions.viewMessages', 'Ver Mensajes')}
        >
          <FiMessageSquare />
        </IconButton>
      )}
      {onExecuteEvent && (
        <IconButton
          aria-label={t('operations.actions.executeEvent', 'Ejecutar Evento')}
          size="sm"
          variant="ghost"
          colorPalette="green"
          onClick={(e) => { stop(e); onExecuteEvent(op); }}
          title={t('operations.actions.executeEvent', 'Ejecutar Evento')}
        >
          <FiActivity />
        </IconButton>
      )}
    </HStack>
  );

  return (
    <Box
      bg={cardBg}
      borderRadius="16px"
      overflow="hidden"
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.2s"
      _active={onClick ? { transform: 'scale(0.98)' } : undefined}
      _hover={{ bg: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)' }}
      onClick={onClick}
      className={`animate-fade-in-up stagger-${Math.min(delay, 6)}`}
      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      boxShadow="0 2px 12px rgba(0,0,0,0.06)"
      border="1px solid"
      borderColor={cardBorder}
      position="relative"
    >
      {/* Left accent bar */}
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        w="4px"
        bg={statusAccent}
        borderLeftRadius="16px"
      />

      {/* ── Mobile Layout (base → md) ── */}
      <Box display={{ base: 'block', md: 'none' }} p={compact ? 3 : 4} pl={compact ? 4 : 5}>
        {/* Row 1: Urgency + Date + Amount */}
        <Flex justify="space-between" align="start" gap={2} mb={compact ? 1.5 : 2}>
          <HStack gap={2} flex={1} minW={0}>
            {days !== Infinity && (
              <Box
                bg={urgency.bg}
                color={urgency.color}
                px={2}
                py={0.5}
                borderRadius="md"
                border="1px solid"
                borderColor={urgency.border}
                flexShrink={0}
                animation={urgency.pulse ? 'pulse 2s infinite' : undefined}
              >
                <Text fontSize="xs" fontWeight="bold">{formatCountdown(days)}</Text>
              </Box>
            )}
            <Text fontSize="xs" color={colors.textColorSecondary}>
              {formatDate(op.expiryDate)}
            </Text>
          </HStack>
          <Text fontWeight="bold" fontSize="sm" color={colors.textColor} flexShrink={0}>
            {formatAmountValue(op)}
          </Text>
        </Flex>

        {/* Row 2: Reference + badges */}
        <HStack gap={1.5} mb={compact ? 1 : 1.5} flexWrap="wrap">
          <Text fontWeight="bold" fontSize="sm" color={colors.textColor} lineClamp={1}>
            {op.reference || op.operationId}
          </Text>
          {showProductBadge && <ProductBadge productType={op.productType} />}
          <Badge size="sm" colorPalette="purple" fontSize="2xs">{op.messageType}</Badge>
          {op.hasAlerts && op.alertCount && op.alertCount > 0 && (
            <Badge size="sm" colorPalette="red" fontSize="2xs">
              {op.alertCount} {t('common.alerts', 'alerts')}
            </Badge>
          )}
        </HStack>

        {/* Row 3: Applicant → Beneficiary */}
        <HStack gap={1} mb={compact ? 1 : 1.5}>
          <Icon as={FiUser} boxSize={3} color={colors.textColorSecondary} />
          <Text fontSize="xs" color={colors.textColorSecondary} lineClamp={1} flex={1}>
            {op.applicantName || '-'}
          </Text>
          {op.beneficiaryName && (
            <>
              <Icon as={FiChevronRight} boxSize={3} color={colors.textColorSecondary} />
              <Text fontSize="xs" color={colors.textColorSecondary} lineClamp={1} flex={1}>
                {op.beneficiaryName}
              </Text>
            </>
          )}
        </HStack>

        {/* Row 4: Stage + Status + Actions */}
        <Flex justify="space-between" align="center">
          <HStack gap={1.5}>
            {op.stage && <Badge size="sm" fontSize="2xs" colorPalette={stagePalette}>{t(`operations.stages.${op.stage}`, op.stage)}</Badge>}
            {op.status && <Badge size="sm" fontSize="2xs" variant="outline" colorPalette={statusPalette}>{t(`operations.statuses.${op.status}`, op.status)}</Badge>}
            {op.awaitingResponse && (
              <Box px={2} py={0.5} borderRadius="full" bg="rgba(245,158,11,0.12)">
                <Text fontSize="2xs" fontWeight="700" color="#F59E0B">{t('mobileHome.badges.pending', 'Pending')}</Text>
              </Box>
            )}
          </HStack>
          {hasActions ? <ActionButtons /> : <Icon as={FiChevronRight} boxSize={4} color={colors.textColorSecondary} />}
        </Flex>
      </Box>

      {/* ── Desktop Layout (md+) ── */}
      <Flex
        display={{ base: 'none', md: 'flex' }}
        align="center"
        gap={4}
        py={3}
        px={5}
        pl={6}
      >
        {/* Col 1: Countdown badge */}
        {days !== Infinity ? (
          <Box
            bg={urgency.bg}
            color={urgency.color}
            px={3}
            py={1.5}
            borderRadius="lg"
            border="1px solid"
            borderColor={urgency.border}
            textAlign="center"
            minW="80px"
            flexShrink={0}
            animation={urgency.pulse ? 'pulse 2s infinite' : undefined}
          >
            <Text fontSize="sm" fontWeight="bold">{formatCountdown(days)}</Text>
            <Text fontSize="2xs" opacity={0.8}>{formatDate(op.expiryDate)}</Text>
          </Box>
        ) : (
          <Box minW="80px" flexShrink={0} />
        )}

        {/* Col 2: Operation info */}
        <VStack align="start" gap={0.5} flex={2} minW={0}>
          <HStack gap={1.5} flexWrap="wrap">
            <Text fontWeight="bold" fontSize="sm" color={colors.textColor} lineClamp={1}>
              {op.reference || op.operationId}
            </Text>
            {showProductBadge && <ProductBadge productType={op.productType} />}
            <Badge size="sm" colorPalette="purple" fontSize="2xs">{op.messageType}</Badge>
            {op.hasAlerts && op.alertCount && op.alertCount > 0 && (
              <Badge size="sm" colorPalette="red" fontSize="2xs">
                {op.alertCount} {t('common.alerts', 'alerts')}
              </Badge>
            )}
          </HStack>
          <HStack gap={1} fontSize="xs" color={colors.textColorSecondary}>
            <Icon as={FiUser} boxSize={3} />
            <Text lineClamp={1}>{op.applicantName || '-'}</Text>
            {op.beneficiaryName && (
              <>
                <Icon as={FiChevronRight} boxSize={3} />
                <Text lineClamp={1}>{op.beneficiaryName}</Text>
              </>
            )}
          </HStack>
        </VStack>

        {/* Col 3: Amount */}
        <Text fontWeight="bold" fontSize="sm" color={colors.textColor} textAlign="right" minW="100px" flexShrink={0}>
          {formatAmountValue(op)}
        </Text>

        {/* Col 4: Stage + Status */}
        <VStack align="end" gap={1} minW="90px" flexShrink={0}>
          {op.stage && <Badge size="sm" fontSize="2xs" colorPalette={stagePalette}>{t(`operations.stages.${op.stage}`, op.stage)}</Badge>}
          {op.status && <Badge size="sm" fontSize="2xs" variant="outline" colorPalette={statusPalette}>{t(`operations.statuses.${op.status}`, op.status)}</Badge>}
          {op.awaitingResponse && (
            <Box px={2} py={0.5} borderRadius="full" bg="rgba(245,158,11,0.12)">
              <Text fontSize="2xs" fontWeight="700" color="#F59E0B">{t('mobileHome.badges.pending', 'Pending')}</Text>
            </Box>
          )}
        </VStack>

        {/* Col 5: Actions or Arrow */}
        {hasActions ? <ActionButtons /> : <Icon as={FiChevronRight} boxSize={4} color={colors.textColorSecondary} flexShrink={0} />}
      </Flex>
    </Box>
  );
};

// Small product type badge
const ProductBadge: React.FC<{ productType: string }> = ({ productType }) => {
  const style = productTypeColors[productType] || { bg: 'rgba(156,163,175,0.12)', text: '#9CA3AF' };
  return (
    <Box px={2} py={0.5} borderRadius="full" bg={style.bg}>
      <Text fontSize="2xs" fontWeight="700" color={style.text}>
        {productTypeLabels[productType] || productType}
      </Text>
    </Box>
  );
};

export default OperationCard;
