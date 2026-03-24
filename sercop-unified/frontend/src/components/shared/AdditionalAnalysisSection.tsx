/**
 * AdditionalAnalysisSection - Componente compartido para mostrar análisis adicional de extracción IA
 *
 * Usado por:
 * - QuickFieldAssistant (wizard)
 * - GlobalAIExtractionModal (modal global)
 */

import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Collapsible,
  Spinner,
  Tabs,
  Grid,
  Progress,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiShield,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiGlobe,
  FiAnchor,
  FiSearch,
  FiList,
  FiPlay,
  FiActivity,
  FiAlertTriangle,
  FiDatabase,
  FiZap,
  FiTrendingUp,
  FiFlag,
  FiDollarSign,
  FiInfo,
  FiClipboard,
  FiClock,
  FiSend,
  FiEye,
  FiThumbsUp,
  FiTruck,
  FiCreditCard,
  FiMoreHorizontal,
} from 'react-icons/fi';
import apiIntegrationTestService from '../../services/apiIntegrationTestService';
import type { SpecificScreeningResult } from '../../services/apiIntegrationTestService';

// Interfaces existentes
export interface DocumentItem {
  type: string;
  description: string;
  originals: number;
  copies: number;
  notes: string;
}

export interface CountryRisk {
  code: string;
  name: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  role: string;
}

export interface RiskAnalysis {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason: string;
  countries: CountryRisk[];
  alerts: string[];
  unusualTerms: string[];
}

export interface PartyInfo {
  name: string;
  country: string;
  type: string;
  status: 'VALID' | 'NEEDS_REVIEW' | 'INCOMPLETE';
  statusReason?: string;
}

export interface BankInfo {
  name: string;
  bic: string;
  role: string;
  bicStatus: 'VALID' | 'INVALID' | 'NOT_FOUND';
  bicStatusReason?: string;
}

// Nuevas interfaces para análisis mejorado
export interface ExecutiveSummary {
  summary: string;
  documentType: string;
  detectedLanguage: string;
  overallConfidence: number;
  keyPoints: string[];
}

export interface DiscrepancyItem {
  type: 'DATE' | 'AMOUNT' | 'PARTY' | 'DOCUMENT' | 'TERM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  field1: string;
  field2: string;
  description: string;
  suggestion?: string;
}

export interface DiscrepancyAnalysis {
  hasDiscrepancies: boolean;
  discrepancies: DiscrepancyItem[];
  totalCount: number;
  highSeverityCount: number;
}

export interface ComplianceAlert {
  type: 'COUNTRY' | 'ENTITY' | 'PRODUCT' | 'AMOUNT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  entity: string;
  reason: string;
  action: string;
}

export interface ComplianceAnalysis {
  requiresReview: boolean;
  alerts: ComplianceAlert[];
  countriesOfConcern: string[];
  suggestedScreenings: string[];
}

export interface DataQualityAnalysis {
  completenessScore: number;
  totalFields: number;
  populatedFields: number;
  missingRequired: string[];
  invalidFormats: Array<{field: string; issue: string; suggestion: string}>;
  warnings: string[];
}

// Interface para Mensajes SWIFT recomendados
export interface SwiftMessageRecommendation {
  messageType: string;  // MT700, MT707, MT799, MT760, etc.
  direction: 'SEND' | 'RECEIVE' | 'BOTH';
  purpose: string;      // Propósito del mensaje
  parties: string[];    // Partes involucradas (Issuing Bank, Advising Bank, etc.)
}

// Interface para Acciones Recomendadas
export interface RecommendedAction {
  id: string;
  description: string;
  dueDate?: string;
  dueDays?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  responsible: string;
  type: 'VERIFICATION' | 'DOCUMENT' | 'COMMUNICATION' | 'REVIEW' | 'APPROVAL' | 'SHIPMENT' | 'PAYMENT' | 'SWIFT_MESSAGE' | 'OTHER';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  relatedField?: string;
  notes?: string;
  // Nuevo: información de mensaje SWIFT
  swiftMessage?: SwiftMessageRecommendation;
}

export interface RecommendedActionsAnalysis {
  actions: RecommendedAction[];
  totalActions: number;
  highPriorityCount: number;
  nextDeadline?: string;
  nextDeadlineDays?: number;
  summary: string;
}

export interface AdditionalAnalysis {
  // Existentes
  documentsAnalysis?: {
    documents: DocumentItem[];
    totalDocuments: number;
    missingCommon: string[];
  };
  riskAnalysis?: RiskAnalysis;
  partiesAnalysis?: {
    applicant: PartyInfo;
    beneficiary: PartyInfo;
    banks: BankInfo[];
  };
  goodsAnalysis?: {
    description: string;
    suggestedHSCode: string;
    category: string;
    isRestricted: boolean;
    alerts: string[];
  };
  datesAnalysis?: {
    issueDate: string;
    expiryDate: string;
    presentationPeriod: string;
    latestShipmentDate: string;
    daysUntilExpiry: number;
    alerts: string[];
  };
  // Nuevos
  executiveSummary?: ExecutiveSummary;
  discrepancyAnalysis?: DiscrepancyAnalysis;
  complianceAnalysis?: ComplianceAnalysis;
  dataQualityAnalysis?: DataQualityAnalysis;
  recommendedActionsAnalysis?: RecommendedActionsAnalysis;
}

interface AdditionalAnalysisSectionProps {
  analysis: AdditionalAnalysis;
  isDark: boolean;
  colors: any;
  t: (key: string, fallback?: string) => string;
}

// Lista de verificaciones de cumplimiento recomendadas (con claves i18n)
const COMPLIANCE_CHECKS = [
  { code: 'SCREENING_INTERNAL_LIST', nameKey: 'workflow.api.internal', fallback: 'Internal List', icon: FiList },
  { code: 'SCREENING_OFAC_SDN', nameKey: 'workflow.api.ofac', fallback: 'OFAC SDN', icon: FiShield },
  { code: 'SCREENING_UN_CONSOLIDATED', nameKey: 'workflow.api.un', fallback: 'UN Consolidated', icon: FiGlobe },
  { code: 'SCREENING_PEPS', nameKey: 'workflow.api.peps', fallback: 'PEPs', icon: FiUsers },
  { code: 'SCREENING_UAFE_NACIONAL', nameKey: 'workflow.api.uafe', fallback: 'UAFE', icon: FiShield },
];

// Tipo para almacenar resultados de screening por entidad
interface ScreeningState {
  loading: boolean;
  executed: boolean;
  results: SpecificScreeningResult[];
}

// ==========================================
// SUB-COMPONENTE: Executive Summary Card
// ==========================================
interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary;
  isDark: boolean;
  colors: any;
  t: (key: string, fallback?: string) => string;
}

const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  summary,
  isDark,
  colors,
  t,
}) => {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'green';
    if (confidence >= 70) return 'yellow';
    return 'red';
  };

  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      pt: 'Português',
    };
    return labels[lang] || lang.toUpperCase();
  };

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      mb={4}
      border="1px solid"
      borderColor={isDark ? 'blue.700' : 'blue.200'}
      bg={isDark ? 'gray.800' : 'white'}
      boxShadow="sm"
    >
      {/* Header con gradiente */}
      <Box
        bgGradient={isDark
          ? 'linear(to-r, blue.900, purple.900)'
          : 'linear(to-r, blue.500, purple.500)'
        }
        px={4}
        py={3}
      >
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <Box
              p={2}
              borderRadius="lg"
              bg="whiteAlpha.200"
            >
              <FiZap size={18} color="white" />
            </Box>
            <Text fontSize="14px" fontWeight="bold" color="white">
              {t('common:assistant.executiveSummary', 'Resumen Ejecutivo')}
            </Text>
          </HStack>
          <Badge
            colorPalette={getConfidenceColor(summary.overallConfidence)}
            variant="solid"
            px={2}
            py={1}
            borderRadius="full"
          >
            <HStack gap={1}>
              <FiActivity size={12} />
              <Text>{summary.overallConfidence}%</Text>
            </HStack>
          </Badge>
        </HStack>
      </Box>

      {/* Contenido */}
      <Box p={4}>
        {/* Resumen principal */}
        <Text
          fontSize="14px"
          color={colors.textColor}
          lineHeight="1.6"
          mb={4}
          fontStyle="italic"
          borderLeft="3px solid"
          borderLeftColor={isDark ? 'blue.400' : 'blue.500'}
          pl={3}
        >
          "{summary.summary}"
        </Text>

        {/* Badges informativos */}
        <HStack gap={3} flexWrap="wrap" mb={4}>
          <Badge
            colorPalette="purple"
            variant="subtle"
            px={3}
            py={1.5}
            borderRadius="full"
          >
            <HStack gap={1}>
              <FiFileText size={12} />
              <Text fontSize="12px">{summary.documentType}</Text>
            </HStack>
          </Badge>
          <Badge
            colorPalette="teal"
            variant="subtle"
            px={3}
            py={1.5}
            borderRadius="full"
          >
            <HStack gap={1}>
              <FiGlobe size={12} />
              <Text fontSize="12px">{getLanguageLabel(summary.detectedLanguage)}</Text>
            </HStack>
          </Badge>
          <Badge
            colorPalette={getConfidenceColor(summary.overallConfidence)}
            variant="subtle"
            px={3}
            py={1.5}
            borderRadius="full"
          >
            <HStack gap={1}>
              <FiTrendingUp size={12} />
              <Text fontSize="12px">{t('common:assistant.confidence', 'Confianza')}: {summary.overallConfidence}%</Text>
            </HStack>
          </Badge>
        </HStack>

        {/* Puntos clave */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <Box
            p={3}
            borderRadius="lg"
            bg={isDark ? 'gray.750' : 'gray.50'}
          >
            <Text fontSize="11px" fontWeight="600" color={colors.textColorSecondary} mb={2}>
              {t('common:assistant.keyPoints', 'Puntos Clave')}
            </Text>
            <VStack align="stretch" gap={1}>
              {summary.keyPoints.map((point, idx) => (
                <HStack key={idx} gap={2} align="start">
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg={isDark ? 'blue.400' : 'blue.500'}
                    mt="7px"
                    flexShrink={0}
                  />
                  <Text fontSize="12px" color={colors.textColor}>
                    {point}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ==========================================
// SUB-COMPONENTE: Alerts Dashboard Card
// ==========================================
interface AlertsDashboardProps {
  complianceAnalysis?: ComplianceAnalysis;
  dataQualityAnalysis?: DataQualityAnalysis;
  discrepancyAnalysis?: DiscrepancyAnalysis;
  isDark: boolean;
  colors: any;
  t: (key: string, fallback?: string) => string;
}

const AlertsDashboard: React.FC<AlertsDashboardProps> = ({
  complianceAnalysis,
  dataQualityAnalysis,
  discrepancyAnalysis,
  isDark,
  colors,
  t,
}) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      INFO: 'blue',
      WARNING: 'yellow',
      CRITICAL: 'red',
      LOW: 'green',
      MEDIUM: 'yellow',
      HIGH: 'red',
    };
    return colors[severity] || 'gray';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return <FiXCircle size={14} color="var(--chakra-colors-red-500)" />;
    }
    if (severity === 'WARNING' || severity === 'MEDIUM') {
      return <FiAlertTriangle size={14} color="var(--chakra-colors-yellow-500)" />;
    }
    return <FiInfo size={14} color="var(--chakra-colors-blue-500)" />;
  };

  const getDiscrepancyTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      DATE: <FiCalendar size={12} />,
      AMOUNT: <FiDollarSign size={12} />,
      PARTY: <FiUsers size={12} />,
      DOCUMENT: <FiFileText size={12} />,
      TERM: <FiFlag size={12} />,
    };
    return icons[type] || <FiAlertCircle size={12} />;
  };

  // Contadores para badges
  const complianceAlertCount = complianceAnalysis?.alerts?.length || 0;
  const criticalAlertCount = complianceAnalysis?.alerts?.filter(a => a.severity === 'CRITICAL').length || 0;
  const discrepancyCount = discrepancyAnalysis?.totalCount || 0;
  const highDiscrepancyCount = discrepancyAnalysis?.highSeverityCount || 0;
  const completenessScore = dataQualityAnalysis?.completenessScore || 0;

  // Si no hay nada que mostrar, retornar null
  if (!complianceAnalysis && !dataQualityAnalysis && !discrepancyAnalysis) return null;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mb={4}>
      {/* Card de Alertas de Compliance - Solo se muestra si hay alertas */}
      {complianceAnalysis && complianceAlertCount > 0 && (
        <Box
          borderRadius="lg"
          border="1px solid"
          borderColor={isDark ? 'red.700' : 'red.300'}
          bg={isDark ? 'gray.800' : 'white'}
          overflow="hidden"
        >
          <Box
            px={3}
            py={2}
            bg={isDark ? 'red.900' : 'red.50'}
            cursor="pointer"
            onClick={() => setExpandedAlert(expandedAlert === 'compliance' ? null : 'compliance')}
          >
            <HStack justify="space-between">
              <HStack gap={2}>
                <FiShield size={16} color="var(--chakra-colors-red-500)" />
                <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                  {t('common:assistant.complianceAlerts', 'Alertas de Riesgo')}
                </Text>
              </HStack>
              <HStack gap={1}>
                {criticalAlertCount > 0 && (
                  <Badge colorPalette="red" size="sm" variant="solid">
                    {criticalAlertCount} críticas
                  </Badge>
                )}
                <Badge colorPalette="orange" size="sm">
                  {complianceAlertCount}
                </Badge>
                {expandedAlert === 'compliance' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
          </Box>
          <Collapsible.Root open={expandedAlert === 'compliance'}>
            <Collapsible.Content>
              <Box px={3} py={2} maxH="200px" overflowY="auto">
                <VStack align="stretch" gap={2}>
                  {complianceAnalysis.alerts.map((alert, idx) => (
                      <Box
                        key={idx}
                        p={2}
                        borderRadius="md"
                        bg={isDark ? `${getSeverityColor(alert.severity)}.900` : `${getSeverityColor(alert.severity)}.50`}
                        borderLeft="3px solid"
                        borderLeftColor={`${getSeverityColor(alert.severity)}.500`}
                      >
                        <HStack gap={2} mb={1}>
                          {getSeverityIcon(alert.severity)}
                          <Text fontSize="11px" fontWeight="600" color={colors.textColor}>
                            {alert.entity}
                          </Text>
                          <Badge colorPalette={getSeverityColor(alert.severity)} size="sm">
                            {alert.type}
                          </Badge>
                        </HStack>
                        <Text fontSize="10px" color={colors.textColorSecondary}>
                          {alert.reason}
                        </Text>
                        {alert.action && (
                          <Text fontSize="10px" color={`${getSeverityColor(alert.severity)}.500`} mt={1}>
                            {alert.action}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                {complianceAnalysis.countriesOfConcern.length > 0 && (
                  <Box mt={2} pt={2} borderTop="1px solid" borderColor={colors.borderColor}>
                    <Text fontSize="10px" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                      {t('common:assistant.countriesOfConcern', 'Países de interés')}:
                    </Text>
                    <HStack gap={1} flexWrap="wrap">
                      {complianceAnalysis.countriesOfConcern.map((country, idx) => (
                        <Badge key={idx} colorPalette="orange" size="sm" variant="outline">
                          {country}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>
      )}

      {/* Card de Calidad de Datos */}
      {dataQualityAnalysis && (
        <Box
          borderRadius="lg"
          border="1px solid"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
          bg={isDark ? 'gray.800' : 'white'}
          overflow="hidden"
        >
          <Box
            px={3}
            py={2}
            bg={isDark ? 'gray.750' : 'gray.50'}
            cursor="pointer"
            onClick={() => setExpandedAlert(expandedAlert === 'quality' ? null : 'quality')}
          >
            <HStack justify="space-between">
              <HStack gap={2}>
                <FiDatabase size={16} color={colors.textColorSecondary} />
                <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                  {t('common:assistant.dataQuality', 'Calidad')}
                </Text>
              </HStack>
              <HStack gap={1}>
                <Badge
                  colorPalette={completenessScore >= 80 ? 'green' : completenessScore >= 60 ? 'yellow' : 'red'}
                  size="sm"
                  variant="solid"
                >
                  {completenessScore}%
                </Badge>
                {expandedAlert === 'quality' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
            {/* Mini barra de progreso */}
            <Box mt={2}>
              <Progress.Root
                value={completenessScore}
                size="xs"
                colorPalette={completenessScore >= 80 ? 'green' : completenessScore >= 60 ? 'yellow' : 'red'}
              >
                <Progress.Track borderRadius="full">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Box>
          </Box>
          <Collapsible.Root open={expandedAlert === 'quality'}>
            <Collapsible.Content>
              <Box px={3} py={2} maxH="200px" overflowY="auto">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="11px" color={colors.textColorSecondary}>
                    {t('common:assistant.fieldsPopulated', 'Campos completados')}
                  </Text>
                  <Text fontSize="11px" fontWeight="600" color={colors.textColor}>
                    {dataQualityAnalysis.populatedFields}/{dataQualityAnalysis.totalFields}
                  </Text>
                </HStack>
                {dataQualityAnalysis.missingRequired.length > 0 && (
                  <Box mb={2}>
                    <Text fontSize="10px" fontWeight="600" color="red.500" mb={1}>
                      {t('common:assistant.missingRequired', 'Campos requeridos faltantes')}:
                    </Text>
                    <HStack gap={1} flexWrap="wrap">
                      {dataQualityAnalysis.missingRequired.map((field, idx) => (
                        <Badge key={idx} colorPalette="red" size="sm" variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
                {dataQualityAnalysis.invalidFormats.length > 0 && (
                  <Box mb={2}>
                    <Text fontSize="10px" fontWeight="600" color="orange.500" mb={1}>
                      {t('common:assistant.invalidFormats', 'Formatos inválidos')}:
                    </Text>
                    <VStack align="stretch" gap={1}>
                      {dataQualityAnalysis.invalidFormats.map((item, idx) => (
                        <Box key={idx} p={1.5} borderRadius="sm" bg={isDark ? 'orange.900' : 'orange.50'}>
                          <Text fontSize="10px" fontWeight="600" color={colors.textColor}>
                            {item.field}: {item.issue}
                          </Text>
                          {item.suggestion && (
                            <Text fontSize="9px" color={colors.textColorSecondary}>
                              {item.suggestion}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
                {dataQualityAnalysis.warnings.length > 0 && (
                  <Box>
                    <Text fontSize="10px" fontWeight="600" color="yellow.500" mb={1}>
                      {t('common:assistant.warnings', 'Advertencias')}:
                    </Text>
                    {dataQualityAnalysis.warnings.map((warning, idx) => (
                      <Text key={idx} fontSize="10px" color={colors.textColorSecondary}>
                        {warning}
                      </Text>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>
      )}

      {/* Card de Discrepancias */}
      {discrepancyAnalysis && (
        <Box
          borderRadius="lg"
          border="1px solid"
          borderColor={discrepancyAnalysis.hasDiscrepancies
            ? (isDark ? 'orange.700' : 'orange.300')
            : (isDark ? 'gray.700' : 'gray.200')
          }
          bg={isDark ? 'gray.800' : 'white'}
          overflow="hidden"
        >
          <Box
            px={3}
            py={2}
            bg={discrepancyAnalysis.hasDiscrepancies
              ? (isDark ? 'orange.900' : 'orange.50')
              : (isDark ? 'gray.750' : 'gray.50')
            }
            cursor="pointer"
            onClick={() => setExpandedAlert(expandedAlert === 'discrepancy' ? null : 'discrepancy')}
          >
            <HStack justify="space-between">
              <HStack gap={2}>
                <FiAlertTriangle size={16} color={discrepancyAnalysis.hasDiscrepancies ? 'var(--chakra-colors-orange-500)' : colors.textColorSecondary} />
                <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                  {t('common:assistant.discrepancies', 'Discrepancias')}
                </Text>
              </HStack>
              <HStack gap={1}>
                {highDiscrepancyCount > 0 && (
                  <Badge colorPalette="red" size="sm" variant="solid">
                    {highDiscrepancyCount}
                  </Badge>
                )}
                <Badge colorPalette={discrepancyCount > 0 ? 'orange' : 'green'} size="sm">
                  {discrepancyCount}
                </Badge>
                {expandedAlert === 'discrepancy' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
          </Box>
          <Collapsible.Root open={expandedAlert === 'discrepancy'}>
            <Collapsible.Content>
              <Box px={3} py={2} maxH="200px" overflowY="auto">
                {!discrepancyAnalysis.hasDiscrepancies ? (
                  <HStack gap={2} py={2}>
                    <FiCheckCircle size={14} color="var(--chakra-colors-green-500)" />
                    <Text fontSize="11px" color={colors.textColorSecondary}>
                      {t('common:assistant.noDiscrepancies', 'Sin discrepancias detectadas')}
                    </Text>
                  </HStack>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {discrepancyAnalysis.discrepancies.map((disc, idx) => (
                      <Box
                        key={idx}
                        p={2}
                        borderRadius="md"
                        bg={isDark ? `${getSeverityColor(disc.severity)}.900` : `${getSeverityColor(disc.severity)}.50`}
                        borderLeft="3px solid"
                        borderLeftColor={`${getSeverityColor(disc.severity)}.500`}
                      >
                        <HStack gap={2} mb={1}>
                          {getDiscrepancyTypeIcon(disc.type)}
                          <Text fontSize="11px" fontWeight="600" color={colors.textColor}>
                            {disc.field1} vs {disc.field2}
                          </Text>
                          <Badge colorPalette={getSeverityColor(disc.severity)} size="sm">
                            {disc.severity}
                          </Badge>
                        </HStack>
                        <Text fontSize="10px" color={colors.textColorSecondary}>
                          {disc.description}
                        </Text>
                        {disc.suggestion && (
                          <Text fontSize="10px" color={`${getSeverityColor(disc.severity)}.500`} mt={1}>
                            {disc.suggestion}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>
      )}
    </SimpleGrid>
  );
};

// ==========================================
// SUB-COMPONENTE: Recommended Actions Card
// ==========================================
interface RecommendedActionsCardProps {
  actionsAnalysis: RecommendedActionsAnalysis;
  isDark: boolean;
  colors: any;
  t: (key: string, fallback?: string) => string;
}

const RecommendedActionsCard: React.FC<RecommendedActionsCardProps> = ({
  actionsAnalysis,
  isDark,
  colors,
  t,
}) => {
  const [expandedActions, setExpandedActions] = useState<boolean>(true);

  const getPriorityColor = (priority: string): string => {
    const priorityColors: Record<string, string> = {
      HIGH: 'red',
      MEDIUM: 'yellow',
      LOW: 'green',
    };
    return priorityColors[priority] || 'gray';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'HIGH') return <FiAlertCircle size={14} color="var(--chakra-colors-red-500)" />;
    if (priority === 'MEDIUM') return <FiClock size={14} color="var(--chakra-colors-yellow-500)" />;
    return <FiCheckCircle size={14} color="var(--chakra-colors-green-500)" />;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      VERIFICATION: <FiSearch size={14} />,
      DOCUMENT: <FiFileText size={14} />,
      COMMUNICATION: <FiSend size={14} />,
      REVIEW: <FiEye size={14} />,
      APPROVAL: <FiThumbsUp size={14} />,
      SHIPMENT: <FiTruck size={14} />,
      PAYMENT: <FiCreditCard size={14} />,
      SWIFT_MESSAGE: <FiZap size={14} />,
      OTHER: <FiMoreHorizontal size={14} />,
    };
    return icons[type] || <FiClipboard size={14} />;
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      VERIFICATION: t('common:assistant.actionType.verification', 'Verificación'),
      DOCUMENT: t('common:assistant.actionType.document', 'Documento'),
      COMMUNICATION: t('common:assistant.actionType.communication', 'Comunicación'),
      REVIEW: t('common:assistant.actionType.review', 'Revisión'),
      APPROVAL: t('common:assistant.actionType.approval', 'Aprobación'),
      SHIPMENT: t('common:assistant.actionType.shipment', 'Embarque'),
      PAYMENT: t('common:assistant.actionType.payment', 'Pago'),
      SWIFT_MESSAGE: t('common:assistant.actionType.swiftMessage', 'Mensaje SWIFT'),
      OTHER: t('common:assistant.actionType.other', 'Otro'),
    };
    return labels[type] || type;
  };

  const getDirectionLabel = (direction: string): string => {
    const labels: Record<string, string> = {
      SEND: t('common:assistant.direction.send', 'Enviar'),
      RECEIVE: t('common:assistant.direction.receive', 'Recibir'),
      BOTH: t('common:assistant.direction.both', 'Enviar/Recibir'),
    };
    return labels[direction] || direction;
  };

  const getDirectionColor = (direction: string): string => {
    const colors: Record<string, string> = {
      SEND: 'blue',
      RECEIVE: 'green',
      BOTH: 'purple',
    };
    return colors[direction] || 'gray';
  };

  // Agrupar acciones por prioridad
  const highPriorityActions = actionsAnalysis.actions.filter(a => a.priority === 'HIGH');
  const mediumPriorityActions = actionsAnalysis.actions.filter(a => a.priority === 'MEDIUM');
  const lowPriorityActions = actionsAnalysis.actions.filter(a => a.priority === 'LOW');

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      mb={4}
      border="1px solid"
      borderColor={actionsAnalysis.highPriorityCount > 0
        ? (isDark ? 'orange.700' : 'orange.300')
        : (isDark ? 'green.700' : 'green.200')
      }
      bg={isDark ? 'gray.800' : 'white'}
      boxShadow="sm"
    >
      {/* Header */}
      <Box
        bgGradient={actionsAnalysis.highPriorityCount > 0
          ? (isDark ? 'linear(to-r, orange.900, red.900)' : 'linear(to-r, orange.400, red.400)')
          : (isDark ? 'linear(to-r, green.900, teal.900)' : 'linear(to-r, green.400, teal.400)')
        }
        px={4}
        py={3}
        cursor="pointer"
        onClick={() => setExpandedActions(!expandedActions)}
      >
        <HStack justify="space-between" align="center">
          <HStack gap={2}>
            <Box p={2} borderRadius="lg" bg="whiteAlpha.200">
              <FiClipboard size={18} color="white" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontSize="14px" fontWeight="bold" color="white">
                {t('common:assistant.recommendedActions', 'Acciones Recomendadas')}
              </Text>
              <Text fontSize="11px" color="whiteAlpha.800">
                {actionsAnalysis.summary}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2}>
            {actionsAnalysis.highPriorityCount > 0 && (
              <Badge colorPalette="red" variant="solid" px={2} py={1} borderRadius="full">
                <HStack gap={1}>
                  <FiAlertCircle size={12} />
                  <Text>{actionsAnalysis.highPriorityCount} {t('common:assistant.urgent', 'urgentes')}</Text>
                </HStack>
              </Badge>
            )}
            <Badge colorPalette="gray" variant="solid" px={2} py={1} borderRadius="full">
              {actionsAnalysis.totalActions} {t('common:assistant.total', 'total')}
            </Badge>
            {expandedActions ? <FiChevronUp size={16} color="white" /> : <FiChevronDown size={16} color="white" />}
          </HStack>
        </HStack>
      </Box>

      {/* Contenido expandible */}
      <Collapsible.Root open={expandedActions}>
        <Collapsible.Content>
          <Box p={4}>
            {/* Próximo vencimiento */}
            {actionsAnalysis.nextDeadline && (
              <Box
                mb={4}
                p={3}
                borderRadius="lg"
                bg={isDark ? 'blue.900' : 'blue.50'}
                border="1px solid"
                borderColor={isDark ? 'blue.700' : 'blue.200'}
              >
                <HStack gap={2}>
                  <FiClock size={16} color={isDark ? '#90CDF4' : '#3182CE'} />
                  <Text fontSize="12px" color={colors.textColor}>
                    <Text as="span" fontWeight="bold">
                      {t('common:assistant.nextDeadline', 'Próximo vencimiento')}:
                    </Text>{' '}
                    {actionsAnalysis.nextDeadline}
                    {actionsAnalysis.nextDeadlineDays !== undefined && (
                      <Badge
                        ml={2}
                        colorPalette={actionsAnalysis.nextDeadlineDays <= 3 ? 'red' : actionsAnalysis.nextDeadlineDays <= 7 ? 'yellow' : 'green'}
                        size="sm"
                      >
                        {actionsAnalysis.nextDeadlineDays} {t('common:assistant.days', 'días')}
                      </Badge>
                    )}
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Acciones de Alta Prioridad */}
            {highPriorityActions.length > 0 && (
              <Box mb={4}>
                <HStack gap={2} mb={2}>
                  <FiAlertCircle size={14} color="var(--chakra-colors-red-500)" />
                  <Text fontSize="12px" fontWeight="bold" color="red.500">
                    {t('common:assistant.highPriority', 'ALTA PRIORIDAD')}
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2}>
                  {highPriorityActions.map((action, idx) => (
                    <Box
                      key={action.id || idx}
                      p={3}
                      borderRadius="md"
                      bg={isDark ? 'red.900' : 'red.50'}
                      border="1px solid"
                      borderColor={isDark ? 'red.700' : 'red.200'}
                      borderLeft="4px solid"
                      borderLeftColor="red.500"
                    >
                      <HStack justify="space-between" align="start" mb={1}>
                        <HStack gap={2} flex={1}>
                          {getTypeIcon(action.type)}
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {action.description}
                          </Text>
                        </HStack>
                        <Badge colorPalette="purple" size="sm" variant="subtle">
                          {getTypeLabel(action.type)}
                        </Badge>
                      </HStack>
                      <HStack gap={4} mt={2} flexWrap="wrap">
                        {action.dueDate && (
                          <HStack gap={1}>
                            <FiCalendar size={10} color={colors.textColorSecondary} />
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {action.dueDate}
                              {action.dueDays !== undefined && (
                                <Text as="span" fontWeight="bold" color={action.dueDays <= 3 ? 'red.500' : 'inherit'}>
                                  {' '}({action.dueDays} {t('common:assistant.days', 'días')})
                                </Text>
                              )}
                            </Text>
                          </HStack>
                        )}
                        {action.responsible && (
                          <HStack gap={1}>
                            <FiUsers size={10} color={colors.textColorSecondary} />
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {action.responsible}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                      {/* Información de mensaje SWIFT */}
                      {action.swiftMessage && (
                        <Box
                          mt={2}
                          p={2}
                          borderRadius="md"
                          bg={isDark ? 'blue.800' : 'blue.50'}
                          border="1px solid"
                          borderColor={isDark ? 'blue.600' : 'blue.200'}
                        >
                          <HStack gap={2} mb={1}>
                            <FiZap size={12} color={isDark ? '#90CDF4' : '#3182CE'} />
                            <Text fontSize="11px" fontWeight="bold" color={isDark ? 'blue.200' : 'blue.700'}>
                              {t('common:assistant.swiftMessage', 'Mensaje SWIFT')}
                            </Text>
                          </HStack>
                          <HStack gap={2} flexWrap="wrap">
                            <Badge colorPalette="blue" size="sm" variant="solid">
                              {action.swiftMessage.messageType}
                            </Badge>
                            <Badge colorPalette={getDirectionColor(action.swiftMessage.direction)} size="sm" variant="outline">
                              {getDirectionLabel(action.swiftMessage.direction)}
                            </Badge>
                          </HStack>
                          <Text fontSize="10px" color={colors.textColorSecondary} mt={1}>
                            {action.swiftMessage.purpose}
                          </Text>
                          {action.swiftMessage.parties && action.swiftMessage.parties.length > 0 && (
                            <HStack gap={1} mt={1} flexWrap="wrap">
                              <Text fontSize="9px" color={colors.textColorSecondary}>
                                {t('common:assistant.parties', 'Partes')}:
                              </Text>
                              {action.swiftMessage.parties.map((party, pIdx) => (
                                <Badge key={pIdx} colorPalette="gray" size="sm" variant="subtle">
                                  {party}
                                </Badge>
                              ))}
                            </HStack>
                          )}
                        </Box>
                      )}
                      {action.notes && (
                        <Text fontSize="10px" color={colors.textColorSecondary} mt={1} fontStyle="italic">
                          {action.notes}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Acciones de Media Prioridad */}
            {mediumPriorityActions.length > 0 && (
              <Box mb={4}>
                <HStack gap={2} mb={2}>
                  <FiClock size={14} color="var(--chakra-colors-yellow-500)" />
                  <Text fontSize="12px" fontWeight="bold" color="yellow.600">
                    {t('common:assistant.mediumPriority', 'PRÓXIMOS 7 DÍAS')}
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2}>
                  {mediumPriorityActions.map((action, idx) => (
                    <Box
                      key={action.id || idx}
                      p={3}
                      borderRadius="md"
                      bg={isDark ? 'yellow.900' : 'yellow.50'}
                      border="1px solid"
                      borderColor={isDark ? 'yellow.700' : 'yellow.200'}
                      borderLeft="4px solid"
                      borderLeftColor="yellow.500"
                    >
                      <HStack justify="space-between" align="start" mb={1}>
                        <HStack gap={2} flex={1}>
                          {getTypeIcon(action.type)}
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {action.description}
                          </Text>
                        </HStack>
                        <Badge colorPalette="purple" size="sm" variant="subtle">
                          {getTypeLabel(action.type)}
                        </Badge>
                      </HStack>
                      <HStack gap={4} mt={2} flexWrap="wrap">
                        {action.dueDate && (
                          <HStack gap={1}>
                            <FiCalendar size={10} color={colors.textColorSecondary} />
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {action.dueDate}
                              {action.dueDays !== undefined && (
                                <Text as="span"> ({action.dueDays} {t('common:assistant.days', 'días')})</Text>
                              )}
                            </Text>
                          </HStack>
                        )}
                        {action.responsible && (
                          <HStack gap={1}>
                            <FiUsers size={10} color={colors.textColorSecondary} />
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {action.responsible}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                      {/* Información de mensaje SWIFT */}
                      {action.swiftMessage && (
                        <Box
                          mt={2}
                          p={2}
                          borderRadius="md"
                          bg={isDark ? 'blue.800' : 'blue.50'}
                          border="1px solid"
                          borderColor={isDark ? 'blue.600' : 'blue.200'}
                        >
                          <HStack gap={2} mb={1}>
                            <FiZap size={12} color={isDark ? '#90CDF4' : '#3182CE'} />
                            <Text fontSize="11px" fontWeight="bold" color={isDark ? 'blue.200' : 'blue.700'}>
                              {t('common:assistant.swiftMessage', 'Mensaje SWIFT')}
                            </Text>
                          </HStack>
                          <HStack gap={2} flexWrap="wrap">
                            <Badge colorPalette="blue" size="sm" variant="solid">
                              {action.swiftMessage.messageType}
                            </Badge>
                            <Badge colorPalette={getDirectionColor(action.swiftMessage.direction)} size="sm" variant="outline">
                              {getDirectionLabel(action.swiftMessage.direction)}
                            </Badge>
                          </HStack>
                          <Text fontSize="10px" color={colors.textColorSecondary} mt={1}>
                            {action.swiftMessage.purpose}
                          </Text>
                          {action.swiftMessage.parties && action.swiftMessage.parties.length > 0 && (
                            <HStack gap={1} mt={1} flexWrap="wrap">
                              <Text fontSize="9px" color={colors.textColorSecondary}>
                                {t('common:assistant.parties', 'Partes')}:
                              </Text>
                              {action.swiftMessage.parties.map((party, pIdx) => (
                                <Badge key={pIdx} colorPalette="gray" size="sm" variant="subtle">
                                  {party}
                                </Badge>
                              ))}
                            </HStack>
                          )}
                        </Box>
                      )}
                      {action.notes && (
                        <Text fontSize="10px" color={colors.textColorSecondary} mt={1} fontStyle="italic">
                          {action.notes}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Acciones de Baja Prioridad */}
            {lowPriorityActions.length > 0 && (
              <Box>
                <HStack gap={2} mb={2}>
                  <FiCheckCircle size={14} color="var(--chakra-colors-green-500)" />
                  <Text fontSize="12px" fontWeight="bold" color="green.600">
                    {t('common:assistant.lowPriority', 'PENDIENTES')}
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2}>
                  {lowPriorityActions.map((action, idx) => (
                    <Box
                      key={action.id || idx}
                      p={3}
                      borderRadius="md"
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      border="1px solid"
                      borderColor={isDark ? 'gray.600' : 'gray.200'}
                      borderLeft="4px solid"
                      borderLeftColor="green.500"
                    >
                      <HStack justify="space-between" align="start" mb={1}>
                        <HStack gap={2} flex={1}>
                          {getTypeIcon(action.type)}
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {action.description}
                          </Text>
                        </HStack>
                        <Badge colorPalette="purple" size="sm" variant="subtle">
                          {getTypeLabel(action.type)}
                        </Badge>
                      </HStack>
                      <HStack gap={4} mt={2} flexWrap="wrap">
                        {action.dueDate && (
                          <HStack gap={1}>
                            <FiCalendar size={10} color={colors.textColorSecondary} />
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {action.dueDate}
                            </Text>
                          </HStack>
                        )}
                        {action.responsible && (
                          <HStack gap={1}>
                            <FiUsers size={10} color={colors.textColorSecondary} />
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {action.responsible}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                      {/* Información de mensaje SWIFT */}
                      {action.swiftMessage && (
                        <Box
                          mt={2}
                          p={2}
                          borderRadius="md"
                          bg={isDark ? 'blue.800' : 'blue.50'}
                          border="1px solid"
                          borderColor={isDark ? 'blue.600' : 'blue.200'}
                        >
                          <HStack gap={2} mb={1}>
                            <FiZap size={12} color={isDark ? '#90CDF4' : '#3182CE'} />
                            <Text fontSize="11px" fontWeight="bold" color={isDark ? 'blue.200' : 'blue.700'}>
                              {t('common:assistant.swiftMessage', 'Mensaje SWIFT')}
                            </Text>
                          </HStack>
                          <HStack gap={2} flexWrap="wrap">
                            <Badge colorPalette="blue" size="sm" variant="solid">
                              {action.swiftMessage.messageType}
                            </Badge>
                            <Badge colorPalette={getDirectionColor(action.swiftMessage.direction)} size="sm" variant="outline">
                              {getDirectionLabel(action.swiftMessage.direction)}
                            </Badge>
                          </HStack>
                          <Text fontSize="10px" color={colors.textColorSecondary} mt={1}>
                            {action.swiftMessage.purpose}
                          </Text>
                          {action.swiftMessage.parties && action.swiftMessage.parties.length > 0 && (
                            <HStack gap={1} mt={1} flexWrap="wrap">
                              <Text fontSize="9px" color={colors.textColorSecondary}>
                                {t('common:assistant.parties', 'Partes')}:
                              </Text>
                              {action.swiftMessage.parties.map((party, pIdx) => (
                                <Badge key={pIdx} colorPalette="gray" size="sm" variant="subtle">
                                  {party}
                                </Badge>
                              ))}
                            </HStack>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export const AdditionalAnalysisSection: React.FC<AdditionalAnalysisSectionProps> = ({
  analysis,
  isDark,
  colors,
  t,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCompliance, setExpandedCompliance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('parties');

  // Estado para resultados de screening por entidad (applicant, beneficiary, bank_0, bank_1, etc.)
  const [screeningResults, setScreeningResults] = useState<Record<string, ScreeningState>>({});

  // Ejecutar screening para una entidad
  const executeScreening = useCallback(async (entityKey: string, entityName: string, countryCode?: string) => {
    // Marcar como loading
    setScreeningResults(prev => ({
      ...prev,
      [entityKey]: { loading: true, executed: false, results: [] }
    }));

    try {
      const screeningCodes = COMPLIANCE_CHECKS.map(c => c.code);
      const results = await apiIntegrationTestService.executeBatchScreening({
        screeningCodes,
        entityName,
        identification: '',
        countryCode: countryCode || 'XX'
      });

      setScreeningResults(prev => ({
        ...prev,
        [entityKey]: { loading: false, executed: true, results }
      }));
    } catch (error) {
      console.error('Error executing screening:', error);
      setScreeningResults(prev => ({
        ...prev,
        [entityKey]: { loading: false, executed: true, results: [] }
      }));
    }
  }, []);

  // Helper para obtener el color del resultado de screening
  const getScreeningStatusColor = (status: string): string => {
    if (status === 'CLEAR') return 'green';
    if (status === 'MATCH') return 'red';
    return 'gray';
  };

  // Helper para obtener el icono del resultado
  const getScreeningStatusIcon = (status: string) => {
    if (status === 'CLEAR') return <FiCheckCircle size={12} color="var(--chakra-colors-green-500)" />;
    if (status === 'MATCH') return <FiXCircle size={12} color="var(--chakra-colors-red-500)" />;
    return <FiAlertCircle size={12} color="var(--chakra-colors-gray-500)" />;
  };

  // Helper para obtener el color del nivel de riesgo
  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH'): string => {
    const riskColors = { LOW: 'green', MEDIUM: 'yellow', HIGH: 'red' };
    return riskColors[risk] || 'gray';
  };

  // Helper para obtener el icono del nivel de riesgo
  const getRiskIcon = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (risk === 'LOW') return <FiCheckCircle size={14} color="var(--chakra-colors-green-500)" />;
    if (risk === 'MEDIUM') return <FiAlertCircle size={14} color="var(--chakra-colors-yellow-500)" />;
    return <FiXCircle size={14} color="var(--chakra-colors-red-500)" />;
  };

  // Contar elementos de análisis disponibles (incluyendo nuevos)
  const analysisCount = [
    analysis.documentsAnalysis,
    analysis.riskAnalysis,
    analysis.partiesAnalysis,
    analysis.goodsAnalysis,
    analysis.datesAnalysis,
    analysis.executiveSummary,
    analysis.discrepancyAnalysis,
    analysis.complianceAnalysis,
    analysis.dataQualityAnalysis,
    analysis.recommendedActionsAnalysis,
  ].filter(Boolean).length;

  // Si no hay nada, retornar null
  if (analysisCount === 0) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Determinar las tabs disponibles basado en los datos
  const availableTabs = [
    { id: 'parties', label: t('common:assistant.parties', 'Partes'), icon: FiUsers, available: !!analysis.partiesAnalysis },
    { id: 'risk', label: t('common:assistant.risk', 'Riesgo'), icon: FiShield, available: !!analysis.riskAnalysis },
    { id: 'dates', label: t('common:assistant.dates', 'Fechas'), icon: FiCalendar, available: !!analysis.datesAnalysis },
    { id: 'goods', label: t('common:assistant.goods', 'Bienes'), icon: FiPackage, available: !!analysis.goodsAnalysis },
    { id: 'documents', label: t('common:assistant.documents', 'Docs'), icon: FiFileText, available: !!analysis.documentsAnalysis },
  ].filter(tab => tab.available);

  // Verificar si hay nuevos análisis disponibles
  const hasNewAnalysis = !!(analysis.executiveSummary || analysis.discrepancyAnalysis || analysis.complianceAnalysis || analysis.dataQualityAnalysis);
  const hasDetailedAnalysis = availableTabs.length > 0;

  return (
    <Box
      borderBottom="1px solid"
      borderColor={colors.borderColor}
      bg={isDark ? 'gray.800' : 'white'}
    >
      <VStack align="stretch" gap={0} p={3}>
        {/* NUEVO: Resumen Ejecutivo */}
        {analysis.executiveSummary && (
          <ExecutiveSummaryCard
            summary={analysis.executiveSummary}
            isDark={isDark}
            colors={colors}
            t={t}
          />
        )}

        {/* NUEVO: Dashboard de Alertas */}
        {(analysis.complianceAnalysis || analysis.dataQualityAnalysis || analysis.discrepancyAnalysis) && (
          <AlertsDashboard
            complianceAnalysis={analysis.complianceAnalysis}
            dataQualityAnalysis={analysis.dataQualityAnalysis}
            discrepancyAnalysis={analysis.discrepancyAnalysis}
            isDark={isDark}
            colors={colors}
            t={t}
          />
        )}

        {/* NUEVO: Acciones Recomendadas */}
        {analysis.recommendedActionsAnalysis && analysis.recommendedActionsAnalysis.actions.length > 0 && (
          <RecommendedActionsCard
            actionsAnalysis={analysis.recommendedActionsAnalysis}
            isDark={isDark}
            colors={colors}
            t={t}
          />
        )}

        {/* NUEVO: Análisis Detallado con Tabs */}
        {hasDetailedAnalysis && (
          <Box
            borderRadius="xl"
            border="1px solid"
            borderColor={isDark ? 'gray.700' : 'gray.200'}
            overflow="hidden"
            mb={2}
          >
            {/* Header con tabs */}
            <Box
              px={3}
              py={2}
              bg={isDark ? 'gray.750' : 'gray.50'}
              borderBottom="1px solid"
              borderColor={isDark ? 'gray.700' : 'gray.200'}
            >
              <HStack gap={2} mb={2}>
                <FiActivity size={16} color={colors.textColorSecondary} />
                <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                  {t('common:assistant.detailedAnalysis', 'Análisis Detallado')}
                </Text>
              </HStack>
              <HStack gap={1} flexWrap="wrap">
                {availableTabs.map(tab => (
                  <Box
                    key={tab.id}
                    as="button"
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    bg={activeTab === tab.id
                      ? (isDark ? 'blue.600' : 'blue.500')
                      : (isDark ? 'gray.700' : 'gray.100')
                    }
                    color={activeTab === tab.id ? 'white' : colors.textColor}
                    fontSize="11px"
                    fontWeight="500"
                    onClick={() => setActiveTab(tab.id)}
                    transition="all 0.2s"
                    _hover={{
                      bg: activeTab === tab.id
                        ? (isDark ? 'blue.500' : 'blue.600')
                        : (isDark ? 'gray.600' : 'gray.200'),
                    }}
                  >
                    <HStack gap={1}>
                      <tab.icon size={12} />
                      <Text>{tab.label}</Text>
                    </HStack>
                  </Box>
                ))}
              </HStack>
            </Box>

            {/* Contenido de tabs */}
            <Box p={3} bg={isDark ? 'gray.800' : 'white'}>
              {/* Tab: Documentos */}
              {activeTab === 'documents' && analysis.documentsAnalysis && (
                <Box>
                  <HStack gap={2} mb={3}>
                    <Badge colorPalette="purple" size="md">
                      {analysis.documentsAnalysis.totalDocuments} {t('common:assistant.documentsIdentified', 'documentos')}
                    </Badge>
                    {analysis.documentsAnalysis.missingCommon.length > 0 && (
                      <Badge colorPalette="orange" size="sm" variant="outline">
                        {analysis.documentsAnalysis.missingCommon.length} {t('common:assistant.missing', 'faltantes')}
                      </Badge>
                    )}
                  </HStack>
                  <VStack align="stretch" gap={2}>
                    {analysis.documentsAnalysis.documents.map((doc, idx) => (
                      <HStack
                        key={idx}
                        p={2}
                        borderRadius="md"
                        bg={isDark ? 'gray.750' : 'gray.50'}
                        border="1px solid"
                        borderColor={colors.borderColor}
                        align="start"
                      >
                        <Box flex={1}>
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {doc.type}
                          </Text>
                          <Text fontSize="11px" color={colors.textColorSecondary}>
                            {doc.description}
                          </Text>
                          {doc.notes && (
                            <Text fontSize="10px" color="orange.500" mt={1}>
                              {doc.notes}
                            </Text>
                          )}
                        </Box>
                        <VStack gap={0.5} align="end">
                          <Badge colorPalette="blue" size="sm" variant="subtle">
                            {doc.originals} {t('common:assistant.originals', 'Original(es)')}
                          </Badge>
                          <Badge colorPalette="gray" size="sm" variant="subtle">
                            {doc.copies} {t('common:assistant.copies', 'Copia(s)')}
                          </Badge>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                  {analysis.documentsAnalysis.missingCommon.length > 0 && (
                    <Box mt={3} p={2} borderRadius="md" bg={isDark ? 'orange.900' : 'orange.50'}>
                      <Text fontSize="11px" fontWeight="600" color="orange.500" mb={1}>
                        {t('common:assistant.missingDocuments', 'Documentos comunes no encontrados:')}
                      </Text>
                      <HStack gap={1} flexWrap="wrap">
                        {analysis.documentsAnalysis.missingCommon.map((doc, idx) => (
                          <Badge key={idx} colorPalette="orange" size="sm" variant="outline">
                            {doc}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab: Riesgo */}
              {activeTab === 'risk' && analysis.riskAnalysis && (
                <Box>
                  {/* Header con nivel de riesgo */}
                  <HStack gap={3} mb={3}>
                    <Badge
                      colorPalette={getRiskColor(analysis.riskAnalysis.overallRisk)}
                      size="lg"
                      variant="solid"
                      px={3}
                      py={1}
                    >
                      <HStack gap={1}>
                        {getRiskIcon(analysis.riskAnalysis.overallRisk)}
                        <Text>{analysis.riskAnalysis.overallRisk}</Text>
                      </HStack>
                    </Badge>
                  </HStack>

                  {/* Justificación del nivel de riesgo */}
                  {analysis.riskAnalysis.riskReason && (
                    <Box
                      mb={3}
                      p={3}
                      borderRadius="md"
                      bg={isDark ? `${getRiskColor(analysis.riskAnalysis.overallRisk)}.900` : `${getRiskColor(analysis.riskAnalysis.overallRisk)}.50`}
                      borderLeft="3px solid"
                      borderLeftColor={`${getRiskColor(analysis.riskAnalysis.overallRisk)}.500`}
                    >
                      <Text fontSize="11px" fontWeight="600" color={`${getRiskColor(analysis.riskAnalysis.overallRisk)}.500`} mb={1}>
                        {t('common:assistant.riskReason', '¿Por qué este nivel de riesgo?')}
                      </Text>
                      <Text fontSize="12px" color={colors.textColor}>
                        {analysis.riskAnalysis.riskReason}
                      </Text>
                    </Box>
                  )}

                  {/* Países involucrados */}
                  {analysis.riskAnalysis.countries.length > 0 && (
                    <Box mb={3}>
                      <Text fontSize="11px" fontWeight="600" color={colors.textColorSecondary} mb={2}>
                        {t('common:assistant.countriesInvolved', 'Países involucrados:')}
                      </Text>
                      <HStack gap={2} flexWrap="wrap">
                        {analysis.riskAnalysis.countries.map((country, idx) => (
                          <Badge
                            key={idx}
                            colorPalette={getRiskColor(country.risk)}
                            size="sm"
                            variant="subtle"
                          >
                            <HStack gap={1}>
                              <FiGlobe size={10} />
                              <Text>{country.name} ({country.role})</Text>
                            </HStack>
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  {/* Alertas */}
                  {analysis.riskAnalysis.alerts.length > 0 && (
                    <Box mb={3} p={2} borderRadius="md" bg={isDark ? 'red.900' : 'red.50'}>
                      <Text fontSize="11px" fontWeight="600" color="red.500" mb={1}>
                        {t('common:assistant.alerts', 'Alertas:')}
                      </Text>
                      {analysis.riskAnalysis.alerts.map((alert, idx) => (
                        <HStack key={idx} gap={2} py={1}>
                          <FiAlertCircle size={12} color="var(--chakra-colors-red-500)" />
                          <Text fontSize="11px" color={colors.textColor}>{alert}</Text>
                        </HStack>
                      ))}
                    </Box>
                  )}

                  {/* Términos inusuales */}
                  {analysis.riskAnalysis.unusualTerms.length > 0 && (
                    <Box p={2} borderRadius="md" bg={isDark ? 'yellow.900' : 'yellow.50'}>
                      <Text fontSize="11px" fontWeight="600" color="yellow.500" mb={1}>
                        {t('common:assistant.unusualTerms', 'Términos inusuales detectados:')}
                      </Text>
                      <HStack gap={1} flexWrap="wrap">
                        {analysis.riskAnalysis.unusualTerms.map((term, idx) => (
                          <Badge key={idx} colorPalette="yellow" size="sm" variant="outline">
                            {term}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab: Partes */}
              {activeTab === 'parties' && analysis.partiesAnalysis && (
                <Box>
                  <HStack gap={2} mb={3}>
                    <Badge colorPalette="teal" size="md">
                      {2 + analysis.partiesAnalysis.banks.length} {t('common:assistant.entitiesIdentified', 'entidades')}
                    </Badge>
                  </HStack>
                  <VStack align="stretch" gap={3}>
                    {/* Ordenante */}
                    <Box
                      p={3}
                      borderRadius="md"
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      border="1px solid"
                      borderColor={colors.borderColor}
                    >
                      <HStack justify="space-between" align="start">
                        <Box flex={1}>
                          <HStack gap={2} mb={1}>
                            <Badge colorPalette="blue" size="sm">{t('common:assistant.applicant', 'Ordenante')}</Badge>
                          </HStack>
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {analysis.partiesAnalysis.applicant.name}
                          </Text>
                          <Text fontSize="10px" color={colors.textColorSecondary}>
                            {analysis.partiesAnalysis.applicant.country} - {analysis.partiesAnalysis.applicant.type}
                          </Text>
                        </Box>
                        {/* Botón de verificación */}
                        <Box
                          as="button"
                          px={2}
                          py={1}
                          borderRadius="md"
                          bg={screeningResults['applicant']?.executed
                            ? (isDark ? 'green.800' : 'green.100')
                            : expandedCompliance === 'applicant'
                              ? (isDark ? 'orange.800' : 'orange.100')
                              : (isDark ? 'orange.900' : 'orange.50')
                          }
                          border="1px solid"
                          borderColor={screeningResults['applicant']?.executed
                            ? (isDark ? 'green.600' : 'green.300')
                            : (isDark ? 'orange.600' : 'orange.300')
                          }
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setExpandedCompliance(expandedCompliance === 'applicant' ? null : 'applicant');
                          }}
                          _hover={{ bg: isDark ? 'orange.700' : 'orange.200' }}
                          transition="all 0.2s"
                        >
                          <HStack gap={1}>
                            {screeningResults['applicant']?.executed ? (
                              <FiCheckCircle size={10} color={isDark ? '#9AE6B4' : '#276749'} />
                            ) : (
                              <FiSearch size={10} color={isDark ? '#FBD38D' : '#C05621'} />
                            )}
                            <Text fontSize="10px" fontWeight="600" color={
                              screeningResults['applicant']?.executed
                                ? (isDark ? 'green.200' : 'green.700')
                                : (isDark ? 'orange.200' : 'orange.700')
                            }>
                              {screeningResults['applicant']?.executed
                                ? t('common:assistant.verified', 'Verificado')
                                : t('common:assistant.verifyCompliance', 'Verificar')
                              }
                            </Text>
                            {expandedCompliance === 'applicant' ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
                          </HStack>
                        </Box>
                      </HStack>
                      {/* Panel de verificaciones */}
                      <Collapsible.Root open={expandedCompliance === 'applicant'}>
                        <Collapsible.Content>
                          <Box
                            mt={2}
                            p={2}
                            borderRadius="md"
                            bg={isDark ? 'gray.700' : 'white'}
                            border="1px solid"
                            borderColor={screeningResults['applicant']?.executed
                              ? (isDark ? 'green.700' : 'green.200')
                              : (isDark ? 'orange.700' : 'orange.200')
                            }
                          >
                            {screeningResults['applicant']?.executed ? (
                              <>
                                <Text fontSize="10px" fontWeight="600" color={isDark ? 'green.300' : 'green.600'} mb={2}>
                                  {t('common:assistant.screeningResults', 'Resultados de verificación:')}
                                </Text>
                                <VStack align="stretch" gap={1}>
                                  {screeningResults['applicant'].results.map(result => {
                                    const check = COMPLIANCE_CHECKS.find(c => c.code === result.screeningCode);
                                    return (
                                      <HStack key={result.screeningCode} gap={2} py={1} justify="space-between">
                                        <HStack gap={2}>
                                          {check && <check.icon size={12} color={colors.textColorSecondary} />}
                                          <Text fontSize="11px" color={colors.textColor}>
                                            {check ? t(check.nameKey, check.fallback) : result.screeningName}
                                          </Text>
                                        </HStack>
                                        <Badge colorPalette={getScreeningStatusColor(result.status)} size="sm" variant="solid">
                                          <HStack gap={1}>
                                            {getScreeningStatusIcon(result.status)}
                                            <Text>{result.status}</Text>
                                          </HStack>
                                        </Badge>
                                      </HStack>
                                    );
                                  })}
                                </VStack>
                              </>
                            ) : screeningResults['applicant']?.loading ? (
                              <HStack justify="center" py={3}>
                                <Spinner size="sm" color="orange.500" />
                                <Text fontSize="11px" color={colors.textColorSecondary}>
                                  {t('common:assistant.executingScreening', 'Ejecutando verificaciones...')}
                                </Text>
                              </HStack>
                            ) : (
                              <>
                                <Text fontSize="10px" fontWeight="600" color={isDark ? 'orange.300' : 'orange.600'} mb={2}>
                                  {t('common:assistant.recommendedChecks', 'Verificaciones recomendadas:')}
                                </Text>
                                <VStack align="stretch" gap={1}>
                                  {COMPLIANCE_CHECKS.map(check => (
                                    <HStack key={check.code} gap={2} py={1}>
                                      <check.icon size={12} color={colors.textColorSecondary} />
                                      <Text fontSize="11px" color={colors.textColor}>{t(check.nameKey, check.fallback)}</Text>
                                    </HStack>
                                ))}
                              </VStack>
                              {/* Botón para ejecutar */}
                              <Box
                                as="button"
                                mt={3}
                                px={3}
                                py={1.5}
                                borderRadius="md"
                                bg={isDark ? 'orange.600' : 'orange.500'}
                                color="white"
                                fontSize="11px"
                                fontWeight="600"
                                width="100%"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  executeScreening(
                                    'applicant',
                                    analysis.partiesAnalysis!.applicant.name,
                                    analysis.partiesAnalysis!.applicant.country
                                  );
                                }}
                                _hover={{ bg: isDark ? 'orange.500' : 'orange.600' }}
                                transition="all 0.2s"
                              >
                                <HStack justify="center" gap={2}>
                                  <FiPlay size={12} />
                                  <Text>{t('common:assistant.executeScreening', 'Ejecutar Verificaciones')}</Text>
                                </HStack>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  </Box>
                  {/* Beneficiario */}
                  <Box py={2} borderBottom="1px solid" borderColor={colors.borderColor}>
                    <HStack justify="space-between" align="start">
                      <Box flex={1}>
                        <HStack gap={2} mb={1}>
                          <Badge colorPalette="green" size="sm">{t('common:assistant.beneficiary', 'Beneficiario')}</Badge>
                        </HStack>
                        <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                          {analysis.partiesAnalysis.beneficiary.name}
                        </Text>
                        <Text fontSize="10px" color={colors.textColorSecondary}>
                          {analysis.partiesAnalysis.beneficiary.country} - {analysis.partiesAnalysis.beneficiary.type}
                        </Text>
                      </Box>
                      {/* Botón de verificación */}
                      <Box
                        as="button"
                        px={2}
                        py={1}
                        borderRadius="md"
                        bg={screeningResults['beneficiary']?.executed
                          ? (isDark ? 'green.800' : 'green.100')
                          : expandedCompliance === 'beneficiary'
                            ? (isDark ? 'orange.800' : 'orange.100')
                            : (isDark ? 'orange.900' : 'orange.50')
                        }
                        border="1px solid"
                        borderColor={screeningResults['beneficiary']?.executed
                          ? (isDark ? 'green.600' : 'green.300')
                          : (isDark ? 'orange.600' : 'orange.300')
                        }
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setExpandedCompliance(expandedCompliance === 'beneficiary' ? null : 'beneficiary');
                        }}
                        _hover={{ bg: isDark ? 'orange.700' : 'orange.200' }}
                        transition="all 0.2s"
                      >
                        <HStack gap={1}>
                          {screeningResults['beneficiary']?.executed ? (
                            <FiCheckCircle size={10} color={isDark ? '#9AE6B4' : '#276749'} />
                          ) : (
                            <FiSearch size={10} color={isDark ? '#FBD38D' : '#C05621'} />
                          )}
                          <Text fontSize="10px" fontWeight="600" color={
                            screeningResults['beneficiary']?.executed
                              ? (isDark ? 'green.200' : 'green.700')
                              : (isDark ? 'orange.200' : 'orange.700')
                          }>
                            {screeningResults['beneficiary']?.executed
                              ? t('common:assistant.verified', 'Verificado')
                              : t('common:assistant.verifyCompliance', 'Verificar')
                            }
                          </Text>
                          {expandedCompliance === 'beneficiary' ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
                        </HStack>
                      </Box>
                    </HStack>
                    {/* Panel de verificaciones */}
                    <Collapsible.Root open={expandedCompliance === 'beneficiary'}>
                      <Collapsible.Content>
                        <Box
                          mt={2}
                          p={2}
                          borderRadius="md"
                          bg={isDark ? 'gray.750' : 'gray.50'}
                          border="1px solid"
                          borderColor={screeningResults['beneficiary']?.executed
                            ? (isDark ? 'green.700' : 'green.200')
                            : (isDark ? 'orange.700' : 'orange.200')
                          }
                        >
                          {/* Mostrar resultados si ya se ejecutó */}
                          {screeningResults['beneficiary']?.executed ? (
                            <>
                              <Text fontSize="10px" fontWeight="600" color={isDark ? 'green.300' : 'green.600'} mb={2}>
                                {t('common:assistant.screeningResults', 'Resultados de verificación:')}
                              </Text>
                              <VStack align="stretch" gap={1}>
                                {screeningResults['beneficiary'].results.map(result => {
                                  const check = COMPLIANCE_CHECKS.find(c => c.code === result.screeningCode);
                                  return (
                                    <HStack key={result.screeningCode} gap={2} py={1} justify="space-between">
                                      <HStack gap={2}>
                                        {check && <check.icon size={12} color={colors.textColorSecondary} />}
                                        <Text fontSize="11px" color={colors.textColor}>
                                          {check ? t(check.nameKey, check.fallback) : result.screeningName}
                                        </Text>
                                      </HStack>
                                      <Badge
                                        colorPalette={getScreeningStatusColor(result.status)}
                                        size="sm"
                                        variant="solid"
                                      >
                                        <HStack gap={1}>
                                          {getScreeningStatusIcon(result.status)}
                                          <Text>{result.status}</Text>
                                        </HStack>
                                      </Badge>
                                    </HStack>
                                  );
                                })}
                              </VStack>
                            </>
                          ) : screeningResults['beneficiary']?.loading ? (
                            <HStack justify="center" py={3}>
                              <Spinner size="sm" color="orange.500" />
                              <Text fontSize="11px" color={colors.textColorSecondary}>
                                {t('common:assistant.executingScreening', 'Ejecutando verificaciones...')}
                              </Text>
                            </HStack>
                          ) : (
                            <>
                              <Text fontSize="10px" fontWeight="600" color={isDark ? 'orange.300' : 'orange.600'} mb={2}>
                                {t('common:assistant.recommendedChecks', 'Verificaciones recomendadas:')}
                              </Text>
                              <VStack align="stretch" gap={1}>
                                {COMPLIANCE_CHECKS.map(check => (
                                  <HStack key={check.code} gap={2} py={1}>
                                    <Box
                                      w="16px"
                                      h="16px"
                                      borderRadius="sm"
                                      border="1px solid"
                                      borderColor={isDark ? 'gray.500' : 'gray.400'}
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      bg={isDark ? 'gray.700' : 'white'}
                                    >
                                      <Box w="8px" h="8px" borderRadius="sm" bg={isDark ? 'gray.600' : 'gray.200'} />
                                    </Box>
                                    <check.icon size={12} color={colors.textColorSecondary} />
                                    <Text fontSize="11px" color={colors.textColor}>{t(check.nameKey, check.fallback)}</Text>
                                  </HStack>
                                ))}
                              </VStack>
                              {/* Botón para ejecutar */}
                              <Box
                                as="button"
                                mt={3}
                                px={3}
                                py={1.5}
                                borderRadius="md"
                                bg={isDark ? 'orange.600' : 'orange.500'}
                                color="white"
                                fontSize="11px"
                                fontWeight="600"
                                width="100%"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  executeScreening(
                                    'beneficiary',
                                    analysis.partiesAnalysis!.beneficiary.name,
                                    analysis.partiesAnalysis!.beneficiary.country
                                  );
                                }}
                                _hover={{ bg: isDark ? 'orange.500' : 'orange.600' }}
                                transition="all 0.2s"
                              >
                                <HStack justify="center" gap={2}>
                                  <FiPlay size={12} />
                                  <Text>{t('common:assistant.executeScreening', 'Ejecutar Verificaciones')}</Text>
                                </HStack>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  </Box>
                  {/* Bancos */}
                  {analysis.partiesAnalysis.banks.map((bank, idx) => {
                    const bankKey = `bank_${idx}`;
                    return (
                      <Box
                        key={idx}
                        py={2}
                        borderBottom={idx < analysis.partiesAnalysis!.banks.length - 1 ? '1px solid' : 'none'}
                        borderColor={colors.borderColor}
                      >
                        <HStack justify="space-between" align="start">
                          <Box flex={1}>
                            <HStack gap={2} mb={1}>
                              <Badge colorPalette="purple" size="sm">{bank.role}</Badge>
                              {bank.bic && (
                                <Badge
                                  colorPalette="gray"
                                  size="sm"
                                  variant="outline"
                                  fontFamily="mono"
                                >
                                  BIC: {bank.bic}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                              {bank.name}
                            </Text>
                            {bank.bicStatusReason && (
                              <Text fontSize="10px" color={colors.textColorSecondary} mt={1}>
                                {bank.bicStatusReason}
                              </Text>
                            )}
                          </Box>
                          {/* Botón de verificación para bancos */}
                          <Box
                            as="button"
                            px={2}
                            py={1}
                            borderRadius="md"
                            bg={screeningResults[bankKey]?.executed
                              ? (isDark ? 'green.800' : 'green.100')
                              : expandedCompliance === bankKey
                                ? (isDark ? 'orange.800' : 'orange.100')
                                : (isDark ? 'orange.900' : 'orange.50')
                            }
                            border="1px solid"
                            borderColor={screeningResults[bankKey]?.executed
                              ? (isDark ? 'green.600' : 'green.300')
                              : (isDark ? 'orange.600' : 'orange.300')
                            }
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setExpandedCompliance(expandedCompliance === bankKey ? null : bankKey);
                            }}
                            _hover={{ bg: isDark ? 'orange.700' : 'orange.200' }}
                            transition="all 0.2s"
                          >
                            <HStack gap={1}>
                              {screeningResults[bankKey]?.executed ? (
                                <FiCheckCircle size={10} color={isDark ? '#9AE6B4' : '#276749'} />
                              ) : (
                                <FiSearch size={10} color={isDark ? '#FBD38D' : '#C05621'} />
                              )}
                              <Text fontSize="10px" fontWeight="600" color={
                                screeningResults[bankKey]?.executed
                                  ? (isDark ? 'green.200' : 'green.700')
                                  : (isDark ? 'orange.200' : 'orange.700')
                              }>
                                {screeningResults[bankKey]?.executed
                                  ? t('common:assistant.verified', 'Verificado')
                                  : t('common:assistant.verifyCompliance', 'Verificar')
                                }
                              </Text>
                              {expandedCompliance === bankKey ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
                            </HStack>
                          </Box>
                        </HStack>
                        {/* Panel de verificaciones para bancos */}
                        <Collapsible.Root open={expandedCompliance === bankKey}>
                          <Collapsible.Content>
                            <Box
                              mt={2}
                              p={2}
                              borderRadius="md"
                              bg={isDark ? 'gray.750' : 'gray.50'}
                              border="1px solid"
                              borderColor={screeningResults[bankKey]?.executed
                                ? (isDark ? 'green.700' : 'green.200')
                                : (isDark ? 'orange.700' : 'orange.200')
                              }
                            >
                              {/* Mostrar resultados si ya se ejecutó */}
                              {screeningResults[bankKey]?.executed ? (
                                <>
                                  <Text fontSize="10px" fontWeight="600" color={isDark ? 'green.300' : 'green.600'} mb={2}>
                                    {t('common:assistant.screeningResults', 'Resultados de verificación:')}
                                  </Text>
                                  <VStack align="stretch" gap={1}>
                                    {screeningResults[bankKey].results.map(result => {
                                      const check = COMPLIANCE_CHECKS.find(c => c.code === result.screeningCode);
                                      return (
                                        <HStack key={result.screeningCode} gap={2} py={1} justify="space-between">
                                          <HStack gap={2}>
                                            {check && <check.icon size={12} color={colors.textColorSecondary} />}
                                            <Text fontSize="11px" color={colors.textColor}>
                                              {check ? t(check.nameKey, check.fallback) : result.screeningName}
                                            </Text>
                                          </HStack>
                                          <Badge
                                            colorPalette={getScreeningStatusColor(result.status)}
                                            size="sm"
                                            variant="solid"
                                          >
                                            <HStack gap={1}>
                                              {getScreeningStatusIcon(result.status)}
                                              <Text>{result.status}</Text>
                                            </HStack>
                                          </Badge>
                                        </HStack>
                                      );
                                    })}
                                  </VStack>
                                </>
                              ) : screeningResults[bankKey]?.loading ? (
                                <HStack justify="center" py={3}>
                                  <Spinner size="sm" color="orange.500" />
                                  <Text fontSize="11px" color={colors.textColorSecondary}>
                                    {t('common:assistant.executingScreening', 'Ejecutando verificaciones...')}
                                  </Text>
                                </HStack>
                              ) : (
                                <>
                                  <Text fontSize="10px" fontWeight="600" color={isDark ? 'orange.300' : 'orange.600'} mb={2}>
                                    {t('common:assistant.recommendedChecks', 'Verificaciones recomendadas:')}
                                  </Text>
                                  <VStack align="stretch" gap={1}>
                                    {COMPLIANCE_CHECKS.map(check => (
                                      <HStack key={check.code} gap={2} py={1}>
                                        <Box
                                          w="16px"
                                          h="16px"
                                          borderRadius="sm"
                                          border="1px solid"
                                          borderColor={isDark ? 'gray.500' : 'gray.400'}
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                          bg={isDark ? 'gray.700' : 'white'}
                                        >
                                          <Box w="8px" h="8px" borderRadius="sm" bg={isDark ? 'gray.600' : 'gray.200'} />
                                        </Box>
                                        <check.icon size={12} color={colors.textColorSecondary} />
                                        <Text fontSize="11px" color={colors.textColor}>{t(check.nameKey, check.fallback)}</Text>
                                      </HStack>
                                    ))}
                                  </VStack>
                                  {/* Botón para ejecutar */}
                                  <Box
                                    as="button"
                                    mt={3}
                                    px={3}
                                    py={1.5}
                                    borderRadius="md"
                                    bg={isDark ? 'orange.600' : 'orange.500'}
                                    color="white"
                                    fontSize="11px"
                                    fontWeight="600"
                                    width="100%"
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      executeScreening(bankKey, bank.name);
                                    }}
                                    _hover={{ bg: isDark ? 'orange.500' : 'orange.600' }}
                                    transition="all 0.2s"
                                  >
                                    <HStack justify="center" gap={2}>
                                      <FiPlay size={12} />
                                      <Text>{t('common:assistant.executeScreening', 'Ejecutar Verificaciones')}</Text>
                                    </HStack>
                                  </Box>
                                </>
                              )}
                            </Box>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      </Box>
                    );
                  })}
                    </VStack>
                  </Box>
                )}

              {/* Tab: Bienes */}
              {activeTab === 'goods' && analysis.goodsAnalysis && (
                <Box>
                  <HStack gap={2} mb={3} flexWrap="wrap">
                    <Badge colorPalette="orange" size="md">
                      {analysis.goodsAnalysis.category}
                    </Badge>
                    {analysis.goodsAnalysis.suggestedHSCode && (
                      <Badge colorPalette="gray" size="md" fontFamily="mono">
                        HS: {analysis.goodsAnalysis.suggestedHSCode}
                      </Badge>
                    )}
                    {analysis.goodsAnalysis.isRestricted && (
                      <Badge colorPalette="red" size="md" variant="solid">
                        {t('common:assistant.restricted', 'Restringido')}
                      </Badge>
                    )}
                  </HStack>

                  <Box
                    p={3}
                    borderRadius="md"
                    bg={isDark ? 'gray.750' : 'gray.50'}
                    border="1px solid"
                    borderColor={colors.borderColor}
                    mb={3}
                  >
                    <Text fontSize="12px" color={colors.textColor}>
                      {analysis.goodsAnalysis.description}
                    </Text>
                  </Box>

                  {analysis.goodsAnalysis.alerts.length > 0 && (
                    <Box p={2} borderRadius="md" bg={isDark ? 'red.900' : 'red.50'}>
                      <Text fontSize="11px" fontWeight="600" color="red.500" mb={1}>
                        {t('common:assistant.goodsAlerts', 'Alertas de mercancías:')}
                      </Text>
                      {analysis.goodsAnalysis.alerts.map((alert, idx) => (
                        <HStack key={idx} gap={2} py={1}>
                          <FiAlertCircle size={12} color="var(--chakra-colors-red-500)" />
                          <Text fontSize="11px" color={colors.textColor}>{alert}</Text>
                        </HStack>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab: Fechas */}
              {activeTab === 'dates' && analysis.datesAnalysis && (
                <Box>
                  {/* Header con días hasta vencimiento */}
                  <HStack gap={3} mb={3}>
                    <Badge
                      colorPalette={analysis.datesAnalysis.daysUntilExpiry <= 30 ? 'red' : analysis.datesAnalysis.daysUntilExpiry <= 60 ? 'yellow' : 'green'}
                      size="lg"
                      variant="solid"
                      px={3}
                      py={1}
                    >
                      <HStack gap={1}>
                        <FiCalendar size={14} />
                        <Text>
                          {analysis.datesAnalysis.daysUntilExpiry > 0
                            ? `${analysis.datesAnalysis.daysUntilExpiry} ${t('common:assistant.daysRemaining', 'días')}`
                            : t('common:assistant.expired', 'Vencido')
                          }
                        </Text>
                      </HStack>
                    </Badge>
                  </HStack>

                  {/* Grid de fechas */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mb={3}>
                    <Box
                      p={3}
                      borderRadius="md"
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      border="1px solid"
                      borderColor={colors.borderColor}
                    >
                      <Text fontSize="10px" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                        {t('common:assistant.issueDate', 'Fecha de Emisión')}
                      </Text>
                      <Text fontSize="14px" fontWeight="600" color={colors.textColor}>
                        {analysis.datesAnalysis.issueDate || '-'}
                      </Text>
                    </Box>
                    <Box
                      p={3}
                      borderRadius="md"
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      border="1px solid"
                      borderColor={analysis.datesAnalysis.daysUntilExpiry <= 30 ? 'red.400' : colors.borderColor}
                    >
                      <Text fontSize="10px" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                        {t('common:assistant.expiryDate', 'Fecha de Vencimiento')}
                      </Text>
                      <Text fontSize="14px" fontWeight="600" color={analysis.datesAnalysis.daysUntilExpiry <= 30 ? 'red.500' : colors.textColor}>
                        {analysis.datesAnalysis.expiryDate || '-'}
                      </Text>
                    </Box>
                    {analysis.datesAnalysis.latestShipmentDate && (
                      <Box
                        p={3}
                        borderRadius="md"
                        bg={isDark ? 'gray.750' : 'gray.50'}
                        border="1px solid"
                        borderColor={colors.borderColor}
                      >
                        <HStack gap={1} mb={1}>
                          <FiAnchor size={10} color={colors.textColorSecondary} />
                          <Text fontSize="10px" fontWeight="600" color={colors.textColorSecondary}>
                            {t('common:assistant.latestShipment', 'Último Embarque')}
                          </Text>
                        </HStack>
                        <Text fontSize="14px" fontWeight="600" color={colors.textColor}>
                          {analysis.datesAnalysis.latestShipmentDate}
                        </Text>
                      </Box>
                    )}
                    {analysis.datesAnalysis.presentationPeriod && (
                      <Box
                        p={3}
                        borderRadius="md"
                        bg={isDark ? 'gray.750' : 'gray.50'}
                        border="1px solid"
                        borderColor={colors.borderColor}
                      >
                        <Text fontSize="10px" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                          {t('common:assistant.presentationPeriod', 'Período de Presentación')}
                        </Text>
                        <Text fontSize="14px" fontWeight="600" color={colors.textColor}>
                          {analysis.datesAnalysis.presentationPeriod}
                        </Text>
                      </Box>
                    )}
                  </SimpleGrid>

                  {/* Alertas de fechas */}
                  {analysis.datesAnalysis.alerts.length > 0 && (
                    <Box p={2} borderRadius="md" bg={isDark ? 'orange.900' : 'orange.50'}>
                      <Text fontSize="11px" fontWeight="600" color="orange.500" mb={1}>
                        {t('common:assistant.dateAlerts', 'Alertas de fechas:')}
                      </Text>
                      {analysis.datesAnalysis.alerts.map((alert, idx) => (
                        <HStack key={idx} gap={2} py={1}>
                          <FiAlertCircle size={12} color="var(--chakra-colors-orange-500)" />
                          <Text fontSize="11px" color={colors.textColor}>{alert}</Text>
                        </HStack>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default AdditionalAnalysisSection;
