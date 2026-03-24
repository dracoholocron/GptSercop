import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Badge,
  Collapsible,
  Kbd,
  Progress,
  Spinner,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiList,
  FiCheck,
  FiEdit2,
  FiClock,
  FiUpload,
  FiCpu,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiEye,
  FiGlobe,
  FiShield,
  FiPackage,
  FiInfo,
  FiAnchor,
  FiLink,
  FiHash,
  FiCrosshair,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { DynamicSwiftField } from '../DynamicSwiftField';
import type { SwiftFieldConfig } from '../../types/swiftField';
import { generateSwiftExtractionPrompt } from '../../services/ai-extraction/AIProvider.interface';
import { operationsApi } from '../../services/operationsApi';
import { parseSwiftMessage } from '../../utils/swiftMessageParser';
import type { Operation } from '../../types/operations';

// Tipos para extracción IA
interface ExtractedField {
  fieldCode: string;
  value: any;
  confidence: number;
  evidence: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  originalValue?: any;
}

// Tipos para análisis adicional
interface DocumentItem {
  type: string;
  description: string;
  originals: number;
  copies: number;
  notes: string;
}

interface DocumentsAnalysis {
  documents: DocumentItem[];
  totalDocuments: number;
  missingCommon: string[];
}

interface CountryRisk {
  code: string;
  name: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  role: string;
}

interface RiskAnalysis {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason: string;
  countries: CountryRisk[];
  alerts: string[];
  unusualTerms: string[];
}

interface PartyInfo {
  name: string;
  country: string;
  type: string;
  status: 'VALID' | 'NEEDS_REVIEW' | 'INCOMPLETE';
  statusReason?: string;
}

interface BankInfo {
  name: string;
  bic: string;
  role: string;
  bicStatus: 'VALID' | 'INVALID' | 'NOT_FOUND';
  bicStatusReason?: string;
}

interface PartiesAnalysis {
  applicant: PartyInfo;
  beneficiary: PartyInfo;
  banks: BankInfo[];
}

interface GoodsAnalysis {
  description: string;
  suggestedHSCode: string;
  category: string;
  isRestricted: boolean;
  alerts: string[];
}

interface DatesAnalysis {
  issueDate: string;
  expiryDate: string;
  presentationPeriod: string;
  latestShipmentDate: string;
  daysUntilExpiry: number;
  alerts: string[];
}

interface AdditionalAnalysis {
  documentsAnalysis?: DocumentsAnalysis;
  riskAnalysis?: RiskAnalysis;
  partiesAnalysis?: PartiesAnalysis;
  goodsAnalysis?: GoodsAnalysis;
  datesAnalysis?: DatesAnalysis;
}

interface AIExtractionResult {
  extractionId: string;
  fileName: string;
  provider: string;
  model: string;
  fields: ExtractedField[];
  processingTimeMs: number;
  totalTokens: number;
  additionalAnalysis?: AdditionalAnalysis;
}

interface QuickFieldAssistantProps {
  /** Configuraciones de campos SWIFT disponibles */
  fieldConfigs: SwiftFieldConfig[];
  /** Datos actuales del formulario */
  formData: Record<string, any>;
  /** Callback para cambios en campos */
  onFieldChange: (fieldCode: string, value: any) => void;
  /** Si el asistente está habilitado */
  enabled?: boolean;
  /** Si está en modo solo lectura */
  readOnly?: boolean;
  /** Placeholder del campo de búsqueda */
  searchPlaceholder?: string;
  /** Campos ya ingresados (para historial) */
  enteredFields?: string[];
  /** Callback cuando se completa un campo */
  onFieldCompleted?: (fieldCode: string) => void;
  /** Posición del asistente */
  position?: 'top' | 'floating';
  /** Si está colapsado inicialmente */
  defaultCollapsed?: boolean;
  /** Tipo de mensaje SWIFT (MT700, MT760, etc.) */
  messageType?: string;
  /** Habilitar extracción con IA */
  enableAIExtraction?: boolean;
  /** Callback cuando se aplican campos extraídos */
  onApplyExtractedFields?: (fields: Record<string, any>) => void;
  /** Callback para navegar a un campo — el padre se encarga de abrir la sección/paso correcto */
  onNavigateToField?: (fieldCode: string, section: string) => void;
}

// Iconos por tipo de campo
const fieldTypeIcons: Record<string, React.ElementType> = {
  TEXT: FiFileText,
  NUMBER: FiFileText,
  DECIMAL: FiDollarSign,
  DATE: FiCalendar,
  SELECT: FiList,
  MULTISELECT: FiList,
  TEXTAREA: FiFileText,
  BOOLEAN: FiCheck,
  INSTITUTION: FiUsers,
  COUNTRY: FiList,
  CURRENCY: FiDollarSign,
  PARTICIPANT: FiUsers,
  SWIFT_PARTY: FiUsers,
};

// Colores por tipo de campo
const fieldTypeColors: Record<string, string> = {
  TEXT: 'gray',
  NUMBER: 'blue',
  DECIMAL: 'green',
  DATE: 'purple',
  SELECT: 'orange',
  MULTISELECT: 'orange',
  TEXTAREA: 'gray',
  BOOLEAN: 'cyan',
  INSTITUTION: 'teal',
  COUNTRY: 'pink',
  CURRENCY: 'green',
  PARTICIPANT: 'teal',
  SWIFT_PARTY: 'teal',
};

/**
 * Genera la clave de traducción para una sección basada en su código y tipo de mensaje
 * Usa convención: sections.{messageType}.{section}.label
 * Ejemplo: messageType="MT700", section="BANKS" -> "sections.mt700.banks.label"
 */
const getSectionTranslationKey = (sectionCode: string, messageType?: string): string => {
  const msgType = (messageType || 'mt700').toLowerCase();
  const section = sectionCode.toLowerCase();
  return `sections.${msgType}.${section}.label`;
};

/**
 * Obtiene el color para una sección basado en el hash del código
 * Esto permite colores consistentes sin hardcodeo
 */
const getSectionColor = (sectionCode: string): string => {
  const colors = ['blue', 'green', 'purple', 'teal', 'orange', 'cyan', 'pink', 'yellow', 'red', 'indigo'];
  // Crear un hash simple del código de sección
  let hash = 0;
  for (let i = 0; i < sectionCode.length; i++) {
    hash = sectionCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Componente para mostrar el análisis adicional de la extracción IA
 */
interface AdditionalAnalysisSectionProps {
  analysis: AdditionalAnalysis;
  isDark: boolean;
  colors: any;
  t: (key: string, fallback?: string) => string;
}

const AdditionalAnalysisSection: React.FC<AdditionalAnalysisSectionProps> = ({
  analysis,
  isDark,
  colors,
  t,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  // Contar elementos de análisis disponibles
  const analysisCount = [
    analysis.documentsAnalysis,
    analysis.riskAnalysis,
    analysis.partiesAnalysis,
    analysis.goodsAnalysis,
    analysis.datesAnalysis,
  ].filter(Boolean).length;

  if (analysisCount === 0) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Box
      borderBottom="1px solid"
      borderColor={isDark ? 'purple.700' : 'purple.200'}
      bg={isDark ? 'gray.900' : 'purple.50'}
    >
      {/* Cards de análisis */}
      <VStack align="stretch" gap={0} p={3}>
        {/* Análisis de Documentos */}
        {analysis.documentsAnalysis && (
          <Box
            borderRadius="lg"
            border="1px solid"
            borderColor={expandedSection === 'documents' ? 'purple.400' : colors.borderColor}
            mb={2}
            overflow="hidden"
            transition="all 0.2s"
          >
            <HStack
              px={3}
              py={2.5}
              bg={expandedSection === 'documents'
                ? (isDark ? 'purple.900' : 'purple.50')
                : (isDark ? 'gray.750' : 'gray.50')
              }
              cursor="pointer"
              onClick={() => toggleSection('documents')}
              justify="space-between"
            >
              <HStack gap={2}>
                <Box
                  p={1.5}
                  borderRadius="md"
                  bg={isDark ? 'purple.800' : 'purple.100'}
                >
                  <FiFileText size={14} color="var(--chakra-colors-purple-500)" />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                    {t('common:assistant.documentsRequired', 'Documentos Requeridos')}
                  </Text>
                  <Text fontSize="10px" color={colors.textColorSecondary}>
                    {analysis.documentsAnalysis.totalDocuments} {t('common:assistant.documentsIdentified', 'documentos identificados')}
                  </Text>
                </Box>
              </HStack>
              <HStack gap={2}>
                <Badge colorPalette="purple" size="sm">
                  {analysis.documentsAnalysis.totalDocuments}
                </Badge>
                {expandedSection === 'documents' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
            <Collapsible.Root open={expandedSection === 'documents'}>
              <Collapsible.Content>
                <Box px={3} py={2} bg={isDark ? 'gray.800' : 'white'}>
                  {analysis.documentsAnalysis.documents.map((doc, idx) => (
                    <HStack
                      key={idx}
                      py={2}
                      borderBottom={idx < analysis.documentsAnalysis!.documents.length - 1 ? '1px solid' : 'none'}
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
                            ⚠️ {doc.notes}
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
                  {analysis.documentsAnalysis.missingCommon.length > 0 && (
                    <Box mt={2} p={2} borderRadius="md" bg={isDark ? 'orange.900' : 'orange.50'}>
                      <Text fontSize="11px" fontWeight="600" color="orange.500">
                        {t('common:assistant.missingDocuments', 'Documentos comunes no encontrados:')}
                      </Text>
                      <Text fontSize="11px" color={colors.textColorSecondary}>
                        {analysis.documentsAnalysis.missingCommon.join(', ')}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}

        {/* Análisis de Riesgo */}
        {analysis.riskAnalysis && (
          <Box
            borderRadius="lg"
            border="1px solid"
            borderColor={expandedSection === 'risk' ? `${getRiskColor(analysis.riskAnalysis.overallRisk)}.400` : colors.borderColor}
            mb={2}
            overflow="hidden"
            transition="all 0.2s"
          >
            <HStack
              px={3}
              py={2.5}
              bg={expandedSection === 'risk'
                ? (isDark ? `${getRiskColor(analysis.riskAnalysis.overallRisk)}.900` : `${getRiskColor(analysis.riskAnalysis.overallRisk)}.50`)
                : (isDark ? 'gray.750' : 'gray.50')
              }
              cursor="pointer"
              onClick={() => toggleSection('risk')}
              justify="space-between"
            >
              <HStack gap={2}>
                <Box
                  p={1.5}
                  borderRadius="md"
                  bg={isDark ? `${getRiskColor(analysis.riskAnalysis.overallRisk)}.800` : `${getRiskColor(analysis.riskAnalysis.overallRisk)}.100`}
                >
                  <FiShield size={14} color={`var(--chakra-colors-${getRiskColor(analysis.riskAnalysis.overallRisk)}-500)`} />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                    {t('common:assistant.riskAnalysis', 'Análisis de Riesgo')}
                  </Text>
                  <HStack gap={1}>
                    {getRiskIcon(analysis.riskAnalysis.overallRisk)}
                    <Text fontSize="10px" color={`${getRiskColor(analysis.riskAnalysis.overallRisk)}.500`} fontWeight="600">
                      {t(`common:assistant.risk${analysis.riskAnalysis.overallRisk}`, analysis.riskAnalysis.overallRisk)}
                    </Text>
                  </HStack>
                </Box>
              </HStack>
              <HStack gap={2}>
                <Badge colorPalette={getRiskColor(analysis.riskAnalysis.overallRisk)} size="sm" variant="solid">
                  {analysis.riskAnalysis.overallRisk}
                </Badge>
                {expandedSection === 'risk' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
            <Collapsible.Root open={expandedSection === 'risk'}>
              <Collapsible.Content>
                <Box px={3} py={2} bg={isDark ? 'gray.800' : 'white'}>
                  {/* Justificación del nivel de riesgo */}
                  {analysis.riskAnalysis.riskReason && (
                    <Box
                      mb={3}
                      p={2.5}
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
                    <Box mb={2}>
                      <Text fontSize="11px" fontWeight="600" color={colors.textColorSecondary} mb={1}>
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
                    <Box mb={2} p={2} borderRadius="md" bg={isDark ? 'red.900' : 'red.50'}>
                      <Text fontSize="11px" fontWeight="600" color="red.500" mb={1}>
                        {t('common:assistant.alerts', 'Alertas:')}
                      </Text>
                      {analysis.riskAnalysis.alerts.map((alert, idx) => (
                        <Text key={idx} fontSize="11px" color={colors.textColor}>
                          • {alert}
                        </Text>
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
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}

        {/* Análisis de Partes */}
        {analysis.partiesAnalysis && (
          <Box
            borderRadius="lg"
            border="1px solid"
            borderColor={expandedSection === 'parties' ? 'teal.400' : colors.borderColor}
            mb={2}
            overflow="hidden"
            transition="all 0.2s"
          >
            <HStack
              px={3}
              py={2.5}
              bg={expandedSection === 'parties'
                ? (isDark ? 'teal.900' : 'teal.50')
                : (isDark ? 'gray.750' : 'gray.50')
              }
              cursor="pointer"
              onClick={() => toggleSection('parties')}
              justify="space-between"
            >
              <HStack gap={2}>
                <Box
                  p={1.5}
                  borderRadius="md"
                  bg={isDark ? 'teal.800' : 'teal.100'}
                >
                  <FiUsers size={14} color="var(--chakra-colors-teal-500)" />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                    {t('common:assistant.partiesIdentification', 'Identificación de Partes')}
                  </Text>
                  <Text fontSize="10px" color={colors.textColorSecondary}>
                    {analysis.partiesAnalysis.banks.length} {t('common:assistant.banksIdentified', 'bancos identificados')}
                  </Text>
                </Box>
              </HStack>
              <HStack gap={2}>
                <Badge colorPalette="teal" size="sm">
                  {2 + analysis.partiesAnalysis.banks.length}
                </Badge>
                {expandedSection === 'parties' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
            <Collapsible.Root open={expandedSection === 'parties'}>
              <Collapsible.Content>
                <Box px={3} py={2} bg={isDark ? 'gray.800' : 'white'}>
                  {/* Ordenante */}
                  <Box py={2} borderBottom="1px solid" borderColor={colors.borderColor}>
                    <HStack justify="space-between" align="start">
                      <Box flex={1}>
                        <HStack gap={2} mb={1}>
                          <Badge colorPalette="blue" size="sm">{t('common:assistant.applicant', 'Ordenante')}</Badge>
                          <Badge
                            colorPalette={
                              analysis.partiesAnalysis.applicant.status === 'VALID' ? 'green' :
                              analysis.partiesAnalysis.applicant.status === 'NEEDS_REVIEW' ? 'yellow' : 'red'
                            }
                            size="sm"
                            variant="solid"
                          >
                            <HStack gap={1}>
                              {analysis.partiesAnalysis.applicant.status === 'VALID' ? <FiCheckCircle size={10} /> :
                               analysis.partiesAnalysis.applicant.status === 'NEEDS_REVIEW' ? <FiAlertCircle size={10} /> :
                               <FiXCircle size={10} />}
                              <Text>{t(`common:assistant.status${analysis.partiesAnalysis.applicant.status}`, analysis.partiesAnalysis.applicant.status)}</Text>
                            </HStack>
                          </Badge>
                        </HStack>
                        <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                          {analysis.partiesAnalysis.applicant.name}
                        </Text>
                        <Text fontSize="10px" color={colors.textColorSecondary}>
                          {analysis.partiesAnalysis.applicant.country} • {analysis.partiesAnalysis.applicant.type}
                        </Text>
                        {analysis.partiesAnalysis.applicant.statusReason && (
                          <Text fontSize="10px" color={
                            analysis.partiesAnalysis.applicant.status === 'VALID' ? 'green.500' :
                            analysis.partiesAnalysis.applicant.status === 'NEEDS_REVIEW' ? 'yellow.600' : 'red.500'
                          } mt={1}>
                            ℹ️ {analysis.partiesAnalysis.applicant.statusReason}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>
                  {/* Beneficiario */}
                  <Box py={2} borderBottom="1px solid" borderColor={colors.borderColor}>
                    <HStack justify="space-between" align="start">
                      <Box flex={1}>
                        <HStack gap={2} mb={1}>
                          <Badge colorPalette="green" size="sm">{t('common:assistant.beneficiary', 'Beneficiario')}</Badge>
                          <Badge
                            colorPalette={
                              analysis.partiesAnalysis.beneficiary.status === 'VALID' ? 'green' :
                              analysis.partiesAnalysis.beneficiary.status === 'NEEDS_REVIEW' ? 'yellow' : 'red'
                            }
                            size="sm"
                            variant="solid"
                          >
                            <HStack gap={1}>
                              {analysis.partiesAnalysis.beneficiary.status === 'VALID' ? <FiCheckCircle size={10} /> :
                               analysis.partiesAnalysis.beneficiary.status === 'NEEDS_REVIEW' ? <FiAlertCircle size={10} /> :
                               <FiXCircle size={10} />}
                              <Text>{t(`common:assistant.status${analysis.partiesAnalysis.beneficiary.status}`, analysis.partiesAnalysis.beneficiary.status)}</Text>
                            </HStack>
                          </Badge>
                        </HStack>
                        <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                          {analysis.partiesAnalysis.beneficiary.name}
                        </Text>
                        <Text fontSize="10px" color={colors.textColorSecondary}>
                          {analysis.partiesAnalysis.beneficiary.country} • {analysis.partiesAnalysis.beneficiary.type}
                        </Text>
                        {analysis.partiesAnalysis.beneficiary.statusReason && (
                          <Text fontSize="10px" color={
                            analysis.partiesAnalysis.beneficiary.status === 'VALID' ? 'green.500' :
                            analysis.partiesAnalysis.beneficiary.status === 'NEEDS_REVIEW' ? 'yellow.600' : 'red.500'
                          } mt={1}>
                            ℹ️ {analysis.partiesAnalysis.beneficiary.statusReason}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>
                  {/* Bancos */}
                  {analysis.partiesAnalysis.banks.map((bank, idx) => (
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
                            {bank.bicStatus && (
                              <Badge
                                colorPalette={
                                  bank.bicStatus === 'VALID' ? 'green' :
                                  bank.bicStatus === 'NOT_FOUND' ? 'yellow' : 'red'
                                }
                                size="sm"
                                variant="solid"
                              >
                                <HStack gap={1}>
                                  {bank.bicStatus === 'VALID' ? <FiCheckCircle size={10} /> :
                                   bank.bicStatus === 'NOT_FOUND' ? <FiAlertCircle size={10} /> :
                                   <FiXCircle size={10} />}
                                  <Text>{t(`common:assistant.bic${bank.bicStatus}`, bank.bicStatus)}</Text>
                                </HStack>
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {bank.name}
                          </Text>
                          {bank.bicStatusReason && (
                            <Text fontSize="10px" color={
                              bank.bicStatus === 'VALID' ? 'green.500' :
                              bank.bicStatus === 'NOT_FOUND' ? 'yellow.600' : 'red.500'
                            } mt={1}>
                              ℹ️ {bank.bicStatusReason}
                            </Text>
                          )}
                        </Box>
                        {bank.bic && (
                          <Badge
                            colorPalette={bank.bicStatus === 'VALID' ? 'green' : bank.bicStatus === 'NOT_FOUND' ? 'gray' : 'red'}
                            size="sm"
                            variant="outline"
                            fontFamily="mono"
                          >
                            {bank.bic}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}

        {/* Análisis de Mercancías */}
        {analysis.goodsAnalysis && (
          <Box
            borderRadius="lg"
            border="1px solid"
            borderColor={expandedSection === 'goods' ? 'orange.400' : colors.borderColor}
            mb={2}
            overflow="hidden"
            transition="all 0.2s"
          >
            <HStack
              px={3}
              py={2.5}
              bg={expandedSection === 'goods'
                ? (isDark ? 'orange.900' : 'orange.50')
                : (isDark ? 'gray.750' : 'gray.50')
              }
              cursor="pointer"
              onClick={() => toggleSection('goods')}
              justify="space-between"
            >
              <HStack gap={2}>
                <Box
                  p={1.5}
                  borderRadius="md"
                  bg={isDark ? 'orange.800' : 'orange.100'}
                >
                  <FiPackage size={14} color="var(--chakra-colors-orange-500)" />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                    {t('common:assistant.goodsClassification', 'Clasificación de Mercancías')}
                  </Text>
                  <Text fontSize="10px" color={colors.textColorSecondary}>
                    {analysis.goodsAnalysis.category}
                  </Text>
                </Box>
              </HStack>
              <HStack gap={2}>
                {analysis.goodsAnalysis.isRestricted && (
                  <Badge colorPalette="red" size="sm" variant="solid">
                    {t('common:assistant.restricted', 'Restringido')}
                  </Badge>
                )}
                {analysis.goodsAnalysis.suggestedHSCode && (
                  <Badge colorPalette="orange" size="sm" fontFamily="mono">
                    HS: {analysis.goodsAnalysis.suggestedHSCode}
                  </Badge>
                )}
                {expandedSection === 'goods' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
            <Collapsible.Root open={expandedSection === 'goods'}>
              <Collapsible.Content>
                <Box px={3} py={2} bg={isDark ? 'gray.800' : 'white'}>
                  <Text fontSize="12px" color={colors.textColor} mb={2}>
                    {analysis.goodsAnalysis.description}
                  </Text>
                  <HStack gap={2} mb={2}>
                    <Badge colorPalette="blue" size="sm">
                      {t('common:assistant.category', 'Categoría')}: {analysis.goodsAnalysis.category}
                    </Badge>
                    {analysis.goodsAnalysis.suggestedHSCode && (
                      <Badge colorPalette="gray" size="sm" fontFamily="mono">
                        {t('common:assistant.hsCode', 'Código HS')}: {analysis.goodsAnalysis.suggestedHSCode}
                      </Badge>
                    )}
                  </HStack>
                  {analysis.goodsAnalysis.alerts.length > 0 && (
                    <Box p={2} borderRadius="md" bg={isDark ? 'red.900' : 'red.50'}>
                      <Text fontSize="11px" fontWeight="600" color="red.500" mb={1}>
                        {t('common:assistant.goodsAlerts', 'Alertas de mercancías:')}
                      </Text>
                      {analysis.goodsAnalysis.alerts.map((alert, idx) => (
                        <Text key={idx} fontSize="11px" color={colors.textColor}>
                          • {alert}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}

        {/* Análisis de Fechas y Plazos */}
        {analysis.datesAnalysis && (
          <Box
            borderRadius="lg"
            border="1px solid"
            borderColor={expandedSection === 'dates' ? 'cyan.400' : colors.borderColor}
            overflow="hidden"
            transition="all 0.2s"
          >
            <HStack
              px={3}
              py={2.5}
              bg={expandedSection === 'dates'
                ? (isDark ? 'cyan.900' : 'cyan.50')
                : (isDark ? 'gray.750' : 'gray.50')
              }
              cursor="pointer"
              onClick={() => toggleSection('dates')}
              justify="space-between"
            >
              <HStack gap={2}>
                <Box
                  p={1.5}
                  borderRadius="md"
                  bg={isDark ? 'cyan.800' : 'cyan.100'}
                >
                  <FiCalendar size={14} color="var(--chakra-colors-cyan-500)" />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                    {t('common:assistant.datesAnalysis', 'Análisis de Fechas y Plazos')}
                  </Text>
                  <Text fontSize="10px" color={colors.textColorSecondary}>
                    {analysis.datesAnalysis.daysUntilExpiry > 0
                      ? `${analysis.datesAnalysis.daysUntilExpiry} ${t('common:assistant.daysUntilExpiry', 'días hasta vencimiento')}`
                      : t('common:assistant.expired', 'Vencido')
                    }
                  </Text>
                </Box>
              </HStack>
              <HStack gap={2}>
                <Badge
                  colorPalette={analysis.datesAnalysis.daysUntilExpiry <= 30 ? 'red' : analysis.datesAnalysis.daysUntilExpiry <= 60 ? 'yellow' : 'green'}
                  size="sm"
                  variant="solid"
                >
                  {analysis.datesAnalysis.daysUntilExpiry}d
                </Badge>
                {expandedSection === 'dates' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </HStack>
            </HStack>
            <Collapsible.Root open={expandedSection === 'dates'}>
              <Collapsible.Content>
                <Box px={3} py={2} bg={isDark ? 'gray.800' : 'white'}>
                  <VStack align="stretch" gap={2}>
                    <HStack justify="space-between">
                      <Text fontSize="11px" color={colors.textColorSecondary}>
                        {t('common:assistant.issueDate', 'Fecha de Emisión')}
                      </Text>
                      <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                        {analysis.datesAnalysis.issueDate || '-'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="11px" color={colors.textColorSecondary}>
                        {t('common:assistant.expiryDate', 'Fecha de Vencimiento')}
                      </Text>
                      <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                        {analysis.datesAnalysis.expiryDate || '-'}
                      </Text>
                    </HStack>
                    {analysis.datesAnalysis.latestShipmentDate && (
                      <HStack justify="space-between">
                        <Text fontSize="11px" color={colors.textColorSecondary}>
                          <FiAnchor size={10} style={{ display: 'inline', marginRight: 4 }} />
                          {t('common:assistant.latestShipment', 'Último Embarque')}
                        </Text>
                        <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                          {analysis.datesAnalysis.latestShipmentDate}
                        </Text>
                      </HStack>
                    )}
                    {analysis.datesAnalysis.presentationPeriod && (
                      <HStack justify="space-between">
                        <Text fontSize="11px" color={colors.textColorSecondary}>
                          {t('common:assistant.presentationPeriod', 'Período de Presentación')}
                        </Text>
                        <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                          {analysis.datesAnalysis.presentationPeriod}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                  {analysis.datesAnalysis.alerts.length > 0 && (
                    <Box mt={2} p={2} borderRadius="md" bg={isDark ? 'orange.900' : 'orange.50'}>
                      <Text fontSize="11px" fontWeight="600" color="orange.500" mb={1}>
                        {t('common:assistant.dateAlerts', 'Alertas de fechas:')}
                      </Text>
                      {analysis.datesAnalysis.alerts.map((alert, idx) => (
                        <Text key={idx} fontSize="11px" color={colors.textColor}>
                          • {alert}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

/**
 * QuickFieldAssistant - Asistente de digitación rápida
 *
 * Permite buscar campos SWIFT por código o descripción y
 * completarlos de forma rápida sin navegar por el formulario.
 */
export const QuickFieldAssistant: React.FC<QuickFieldAssistantProps> = ({
  fieldConfigs,
  formData,
  onFieldChange,
  enabled = true,
  readOnly = false,
  searchPlaceholder,
  enteredFields = [],
  onFieldCompleted,
  position = 'top',
  defaultCollapsed = true,
  messageType = 'MT700',
  enableAIExtraction = true,
  onApplyExtractedFields,
  onNavigateToField,
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractedFieldsRef = useRef<ExtractedField[]>([]);
  const formDataRef = useRef<Record<string, any>>(formData);

  // Función para comparar valores enviados vs recibidos
  const compareValues = (sent: any, received: any): boolean => {
    // Si ambos son undefined/null, es match
    if ((sent === undefined || sent === null) && (received === undefined || received === null)) {
      return true;
    }

    // Si uno es undefined/null y el otro no, no es match
    if (sent === undefined || sent === null || received === undefined || received === null) {
      return false;
    }

    // Para objetos, comparar propiedades relevantes
    if (typeof sent === 'object' && typeof received === 'object') {
      // Comparar cada propiedad del objeto enviado
      for (const key of Object.keys(sent)) {
        const sentVal = sent[key];
        const receivedVal = received[key];

        // Normalizar valores para comparación
        const sentNorm = String(sentVal || '').trim();
        const receivedNorm = String(receivedVal || '').trim();

        if (sentNorm !== receivedNorm) {
          return false;
        }
      }
      return true;
    }

    // Para valores simples, comparar como strings
    return String(sent).trim() === String(received).trim();
  };

  // Mantener formDataRef actualizado y verificar campos pendientes
  useEffect(() => {
    formDataRef.current = formData;

    // Si hay verificación pendiente, ejecutarla
    if (pendingVerificationRef.current) {
      const updates = pendingVerificationRef.current;

      const newVerificationResults: Record<string, 'verified' | 'failed' | 'pending'> = {};
      let verified = 0;
      let failed = 0;

      Object.entries(updates).forEach(([code, sentValue]) => {
        const receivedValue = formData[code];
        const originalCode = code.replace(/^:|:$/g, '').replace(':', '');

        const isMatch = compareValues(sentValue, receivedValue);

        if (isMatch) {
          newVerificationResults[originalCode] = 'verified';
          verified++;
        } else {
          newVerificationResults[originalCode] = 'failed';
          failed++;
        }
      });

      setVerificationResults(newVerificationResults);
      setVerificationSummary({ verified, failed, total: verified + failed });
      pendingVerificationRef.current = null; // Limpiar verificación pendiente
    }
  }, [formData]);

  // Estado
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeField, setActiveField] = useState<SwiftFieldConfig | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Estados para secciones colapsables de extracción
  const [isAnalysisSectionExpanded, setIsAnalysisSectionExpanded] = useState(true);
  const [isFieldsSectionExpanded, setIsFieldsSectionExpanded] = useState(true);

  // Estado para extracción IA
  const [activeTab, setActiveTab] = useState<'search' | 'extraction' | 'reference'>('search');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<AIExtractionResult | null>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [selectedExtractedField, setSelectedExtractedField] = useState<ExtractedField | null>(null);
  const [showEvidence, setShowEvidence] = useState<string | null>(null);

  // Estado para búsqueda por referencia
  const [referenceQuery, setReferenceQuery] = useState('');
  const [referenceResults, setReferenceResults] = useState<Operation[]>([]);
  const [isSearchingReference, setIsSearchingReference] = useState(false);
  const [hasSearchedReference, setHasSearchedReference] = useState(false);

  // Estado para verificación de campos aplicados
  const [verificationResults, setVerificationResults] = useState<Record<string, 'verified' | 'failed' | 'pending'>>({});
  const [verificationSummary, setVerificationSummary] = useState<{ verified: number; failed: number; total: number } | null>(null);
  const pendingVerificationRef = useRef<Record<string, any> | null>(null);

  // Estado para sincronización manual de campos
  const [manualSyncField, setManualSyncField] = useState<string | null>(null);

  // Constantes para validación de archivos
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_FILES = 5;
  const ESTIMATED_TIME_PER_MB = 3; // segundos por MB

  // Estado para múltiples archivos
  interface FileUploadInfo {
    file: File;
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    result?: any;
  }
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadInfo[]>([]);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState<number>(0);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Campos filtrados
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) {
      // Sin búsqueda, mostrar campos obligatorios primero
      return fieldConfigs
        .filter(f => f.isActive)
        .sort((a, b) => {
          if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        })
        .slice(0, 6);
    }

    const query = searchQuery.toLowerCase().trim();

    return fieldConfigs
      .filter(field => {
        if (!field.isActive) return false;

        // Buscar por código de campo
        if (field.fieldCode.toLowerCase().includes(query)) return true;

        // Buscar por nombre (traducido o legacy)
        const fieldName = t(field.fieldNameKey, field.fieldName || field.fieldCode);
        if (fieldName.toLowerCase().includes(query)) return true;

        // Buscar por descripción
        const description = t(field.descriptionKey || '', field.description || '');
        if (description.toLowerCase().includes(query)) return true;

        // Buscar por sección
        const sectionKey = getSectionTranslationKey(field.section, field.messageType);
        const sectionLabel = t(`common:${sectionKey}`, field.section);
        if (sectionLabel.toLowerCase().includes(query)) return true;

        return false;
      })
      .sort((a, b) => {
        // Priorizar coincidencias exactas en código
        const aCodeMatch = a.fieldCode.toLowerCase() === query;
        const bCodeMatch = b.fieldCode.toLowerCase() === query;
        if (aCodeMatch !== bCodeMatch) return aCodeMatch ? -1 : 1;

        // Luego por obligatoriedad
        if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;

        return (a.displayOrder || 0) - (b.displayOrder || 0);
      })
      .slice(0, 6);
  }, [fieldConfigs, searchQuery, t]);

  // Campos ingresados en esta sesión
  const sessionEnteredFields = useMemo(() => {
    return fieldConfigs.filter(field => {
      const value = formData[field.fieldCode];
      return value !== undefined && value !== null && value !== '';
    });
  }, [fieldConfigs, formData]);

  // Estadísticas
  const stats = useMemo(() => {
    const required = fieldConfigs.filter(f => f.isRequired && f.isActive);
    const requiredFilled = required.filter(f => {
      const value = formData[f.fieldCode];
      return value !== undefined && value !== null && value !== '';
    });

    return {
      requiredTotal: required.length,
      requiredFilled: requiredFilled.length,
      totalFilled: sessionEnteredFields.length,
      totalFields: fieldConfigs.filter(f => f.isActive).length,
    };
  }, [fieldConfigs, formData, sessionEnteredFields]);

  // Estadísticas de extracción IA
  const extractionStats = useMemo(() => {
    if (!extractedFields.length) return null;

    const approved = extractedFields.filter(f => f.status === 'approved').length;
    const rejected = extractedFields.filter(f => f.status === 'rejected').length;
    const edited = extractedFields.filter(f => f.status === 'edited').length;
    const pending = extractedFields.filter(f => f.status === 'pending').length;

    // Campos obligatorios extraídos
    const requiredCodes = fieldConfigs.filter(f => f.isRequired && f.isActive).map(f => f.fieldCode);
    const extractedRequired = extractedFields.filter(f => requiredCodes.includes(f.fieldCode));

    return {
      total: extractedFields.length,
      approved,
      rejected,
      edited,
      pending,
      requiredExtracted: extractedRequired.length,
      requiredTotal: requiredCodes.length,
      avgConfidence: extractedFields.reduce((acc, f) => acc + f.confidence, 0) / extractedFields.length,
    };
  }, [extractedFields, fieldConfigs]);

  // Funciones de utilidad para archivos
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const estimateProcessingTime = (files: File[]): number => {
    const totalSizeMB = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
    return Math.ceil(totalSizeMB * ESTIMATED_TIME_PER_MB) + (files.length * 5); // Base + por archivo
  };

  const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (files.length > MAX_FILES) {
      errors.push(t('common:assistant.errorMaxFiles', `Máximo ${MAX_FILES} archivos permitidos`));
    }

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(t('common:assistant.errorFileSize', `${file.name} excede el límite de ${MAX_FILE_SIZE_MB}MB`));
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // Combinar resultados de múltiples extracciones (mayor confianza gana)
  const mergeExtractionResults = (results: ExtractedField[][]): ExtractedField[] => {
    const mergedMap = new Map<string, ExtractedField>();

    results.flat().forEach(field => {
      const existing = mergedMap.get(field.fieldCode);
      if (!existing || field.confidence > existing.confidence) {
        mergedMap.set(field.fieldCode, field);
      }
    });

    return Array.from(mergedMap.values());
  };

  // Procesar un solo archivo
  const processFile = async (file: File): Promise<{ fields: ExtractedField[]; additionalAnalysis?: AdditionalAnalysis }> => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || result);
      };
      reader.readAsDataURL(file);
    });

    const extractionPrompt = generateSwiftExtractionPrompt(fieldConfigs, messageType, 'es');

    const response = await fetch('/api/ai/extraction/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('globalcmx_token')}`,
      },
      body: JSON.stringify({
        file: {
          content: base64,
          type: 'base64',
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
        },
        messageType: messageType,
        provider: 'openai',
        prompt: extractionPrompt,
        language: 'es',
      }),
    });

    const result = await response.json();

    if (result.success && result.data) {
      const extractionData = result.data;
      let parsedFields: any[] = [];
      let additionalAnalysis: AdditionalAnalysis | undefined;

      if (extractionData.content) {
        try {
          let contentJson = extractionData.content;
          const jsonMatch = contentJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            contentJson = jsonMatch[1].trim();
          }
          const parsed = JSON.parse(contentJson);
          parsedFields = parsed.fields || [];
          additionalAnalysis = parsed.additionalAnalysis;
        } catch {
          // Si no se puede parsear, continuar
        }
      } else if (extractionData.fields) {
        parsedFields = extractionData.fields;
      }

      const fields: ExtractedField[] = parsedFields.map((f: any) => ({
        fieldCode: f.fieldCode || f.field_code || f.code || '',
        value: f.value || f.extractedValue || '',
        confidence: f.confidence || f.certainty || 0.8,
        evidence: f.evidence || f.source || f.context || '',
        status: 'pending' as const,
        originalValue: f.value || f.extractedValue || '',
      }));

      return { fields, additionalAnalysis };
    }

    throw new Error(result.message || 'Error en extracción');
  };

  // Manejar carga de múltiples archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    // Validar archivos
    const validation = validateFiles(files);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Preparar estado inicial
    const fileInfos: FileUploadInfo[] = files.map((file, idx) => ({
      file,
      id: `file-${Date.now()}-${idx}`,
      status: 'pending' as const,
      progress: 0,
    }));

    setUploadedFiles(fileInfos);
    setTotalEstimatedTime(estimateProcessingTime(files));
    setIsExtracting(true);
    setActiveTab('extraction');
    setExtractedFields([]);
    setExtractionResult(null);
    setVerificationResults({});
    setVerificationSummary(null);
    setProcessingProgress({ current: 0, total: files.length });

    const allFieldResults: ExtractedField[][] = [];
    let lastAdditionalAnalysis: AdditionalAnalysis | undefined;
    let totalProcessingTime = 0;

    try {
      // Procesar archivos secuencialmente
      for (let i = 0; i < fileInfos.length; i++) {
        const fileInfo = fileInfos[i];
        setCurrentProcessingFile(fileInfo.file.name);
        setProcessingProgress({ current: i + 1, total: files.length });

        // Actualizar estado a 'processing'
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileInfo.id ? { ...f, status: 'processing' as const, progress: 50 } : f
        ));

        const startTime = Date.now();

        try {
          const result = await processFile(fileInfo.file);
          allFieldResults.push(result.fields);

          if (result.additionalAnalysis) {
            lastAdditionalAnalysis = result.additionalAnalysis;
          }

          const processingTime = Date.now() - startTime;
          totalProcessingTime += processingTime;

          // Actualizar estado a 'completed'
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileInfo.id ? { ...f, status: 'completed' as const, progress: 100, result } : f
          ));
        } catch (error) {
          // Actualizar estado a 'error'
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileInfo.id ? {
              ...f,
              status: 'error' as const,
              progress: 0,
              error: error instanceof Error ? error.message : 'Error desconocido'
            } : f
          ));
        }
      }

      // Combinar resultados de todos los archivos
      const mergedFields = mergeExtractionResults(allFieldResults);

      setExtractedFields(mergedFields);
      setExtractionResult({
        extractionId: `multi-${Date.now()}`,
        fileName: files.length > 1 ? `${files.length} archivos` : files[0].name,
        provider: 'openai',
        model: 'gpt-4-vision',
        fields: mergedFields,
        processingTimeMs: totalProcessingTime,
        totalTokens: 0,
        additionalAnalysis: lastAdditionalAnalysis,
      });

    } catch (error) {
      console.error('Error al procesar archivos:', error);
    } finally {
      setIsExtracting(false);
      setCurrentProcessingFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Limpiar archivos subidos
  const handleClearFiles = () => {
    setUploadedFiles([]);
    setExtractedFields([]);
    setExtractionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Normalizar código de campo (agregar : si no los tiene)
  const normalizeFieldCode = (code: string): string => {
    if (!code) return code;
    // Si ya tiene formato :XX:, devolverlo
    if (code.startsWith(':') && code.endsWith(':')) return code;
    // Si no tiene los dos puntos, agregarlos
    const cleanCode = code.replace(/^:/, '').replace(/:$/, '');
    return `:${cleanCode}:`;
  };

  // Parsear fecha de texto a formato ISO (YYYY-MM-DD)
  const parseTextDate = (text: string): string | null => {
    if (!text) return null;

    // Usar configuración de meses desde i18n o parsear con Date
    const textLower = text.toLowerCase();

    // Intentar parsear con Date nativo (funciona con formatos comunes)
    const dateAttempt = new Date(text);
    if (!isNaN(dateAttempt.getTime())) {
      const year = dateAttempt.getFullYear();
      const month = String(dateAttempt.getMonth() + 1).padStart(2, '0');
      const day = String(dateAttempt.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Intentar formato dd/mm/yyyy o dd-mm-yyyy
    const dateMatch = textLower.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Intentar formato yyyy-mm-dd (ya ISO)
    const isoMatch = textLower.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return text;
    }

    return null;
  };

  // Transformar valor extraído según el componentType de la configuración
  const transformValueForField = (fieldCode: string, value: any, fieldConfig?: SwiftFieldConfig): any => {
    if (!fieldConfig) {
      return value;
    }

    const componentType = fieldConfig.componentType;

    // Algunos componentes requieren transformación especial incluso si el valor es objeto
    // Por ejemplo, TOLERANCE_PERCENTAGE espera string "NN/NN", no objeto
    const needsSpecialTransform = ['TOLERANCE_PERCENTAGE'].includes(componentType || '');

    // Si el valor ya es un objeto y no necesita transformación especial, usarlo directamente
    if (typeof value === 'object' && value !== null && !needsSpecialTransform) {
      return value;
    }

    const textValue = typeof value === 'string' ? value : String(value);

    // Transformar según componentType (cómo se renderiza el campo)
    switch (componentType) {
      // Campo de moneda + monto: { currency: "USD", amount: "125750.00" }
      case 'CURRENCY_AMOUNT_INPUT':
        const currencyMatch = textValue.match(/([A-Z]{3})\s*([\d,\.]+)/i) ||
                              textValue.match(/([\d,\.]+)\s*([A-Z]{3})/i);
        if (currencyMatch) {
          let currency, amountStr;
          if (/^[A-Z]{3}$/i.test(currencyMatch[1])) {
            currency = currencyMatch[1].toUpperCase();
            amountStr = currencyMatch[2];
          } else {
            amountStr = currencyMatch[1];
            currency = currencyMatch[2].toUpperCase();
          }
          // Limpiar el monto (formato: sin separador de miles, con punto decimal)
          const cleanAmount = amountStr.replace(/\./g, '').replace(',', '.');
          return { currency, amount: cleanAmount };
        }
        return { currency: '', amount: textValue };

      // Campo de fecha + lugar: { date: "2026-04-14", place: "Shanghai" }
      case 'DATE_PLACE_INPUT':
      case 'DATE_PLACE':
        // Buscar patrón "fecha en lugar" o "fecha, lugar"
        const datePlaceMatch = textValue.match(/^(.+?)\s+en\s+(.+)$/i) ||
                               textValue.match(/^(.+?),\s*(.+)$/);
        if (datePlaceMatch) {
          const dateText = datePlaceMatch[1].trim();
          const place = datePlaceMatch[2].trim();
          const parsedDate = parseTextDate(dateText);
          return { date: parsedDate || '', place };
        }
        // Solo fecha
        const dateOnly = parseTextDate(textValue);
        if (dateOnly) {
          return { date: dateOnly, place: '' };
        }
        return { date: '', place: textValue };

      // Campo de tolerancia: formato especial
      case 'TOLERANCE_PERCENTAGE':
        // El componente espera formato string "NN/NN" (ej: "05/05")
        // Si ya viene como objeto {plusTolerance, minusTolerance}, convertirlo
        if (typeof value === 'object' && value.plusTolerance !== undefined) {
          const plus = String(value.plusTolerance || '0').padStart(2, '0').slice(-2);
          const minus = String(value.minusTolerance || '0').padStart(2, '0').slice(-2);
          return `${plus}/${minus}`;
        }
        // El formato puede ser "+/-5%" o "5/5" o similar
        const toleranceMatch = textValue.match(/([+-]?\d+(?:[.,]\d+)?)\s*[\/]\s*([+-]?\d+(?:[.,]\d+)?)/);
        if (toleranceMatch) {
          const plus = toleranceMatch[1].replace(',', '.').padStart(2, '0').slice(-2);
          const minus = toleranceMatch[2].replace(',', '.').padStart(2, '0').slice(-2);
          return `${plus}/${minus}`;
        }
        // Formato +/-X%
        const singleMatch = textValue.match(/[+-\/]*\s*(\d+(?:[.,]\d+)?)\s*%?/);
        if (singleMatch) {
          const val = singleMatch[1].replace(',', '.').padStart(2, '0').slice(-2);
          return `${val}/${val}`;
        }
        return textValue;

      // Campo SWIFT Party: { text: "..." } o texto directo
      case 'SWIFT_PARTY':
        return { text: textValue };

      // Selector de fecha simple
      case 'DATE_PICKER':
        return parseTextDate(textValue) || textValue;

      // Selectores (dropdown, select)
      case 'DROPDOWN':
      case 'SELECT':
        // Buscar coincidencia en las opciones del campo
        const fieldOptions = fieldConfig.fieldOptions;
        if (fieldOptions && Array.isArray(fieldOptions) && fieldOptions.length > 0) {
          const lowerText = textValue.toLowerCase();
          const matchedOption = fieldOptions.find((opt: any) => {
            const optValue = String(opt.value || opt).toLowerCase();
            const optLabel = String(opt.label || opt).toLowerCase();
            return lowerText.includes(optValue) || lowerText.includes(optLabel) ||
                   optValue.includes(lowerText) || optLabel.includes(lowerText);
          });
          if (matchedOption) {
            return (matchedOption as any).value || matchedOption;
          }
        }
        return textValue;

      // Campos de solo monto (sin moneda)
      case 'CURRENCY_AMOUNT':
        const amountMatch = textValue.match(/([\d,\.]+)/);
        if (amountMatch) {
          return amountMatch[1].replace(/\./g, '').replace(',', '.');
        }
        return textValue;

      // Selectores de instituciones financieras (campos como :57A:, :53A:, etc.)
      // Estos campos usan un componente multi-opción que espera una estructura compleja
      case 'INSTITUTION_SELECTOR':
      case 'FINANCIAL_INSTITUTION_SELECTOR':
      case 'BANK_SELECTOR':
      case 'SWIFT_MULTI_OPTION':
        // Si ya es un objeto con la estructura correcta, devolverlo
        if (typeof value === 'object' && value !== null && value.detectedOption) {
          return value;
        }
        // Detectar si es un código BIC (8 u 11 caracteres alfanuméricos)
        const bicMatch = textValue.match(/^([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?)$/i);
        if (bicMatch) {
          const bicValue = bicMatch[1].toUpperCase();
          return {
            detectedOption: 'A',
            inputMethod: 'bic',
            bic: bicValue,
            bicInstitution: null,
            manualText: [],
            partyIdentifier: { code: '', accountId: '' }
          };
        }
        // Si no es BIC, asumir texto libre (opción D)
        const lines = textValue.split(/[\n\r]+/).filter(l => l.trim());
        return {
          detectedOption: 'D',
          inputMethod: 'manual',
          bic: '',
          bicInstitution: null,
          manualText: lines.length > 0 ? lines : [textValue],
          partyIdentifier: { code: '', accountId: '' }
        };

      // Campos de texto
      case 'TEXT_INPUT':
      case 'TEXTAREA':
      default:
        return textValue;
    }
  };

  // Aprobar campo extraído
  const handleApproveField = (fieldCode: string) => {
    // Usar el ref para obtener el estado más reciente (evita closure stale)
    const currentFields = extractedFieldsRef.current;

    // Buscar el campo en el estado actual
    const field = currentFields.find(f => f.fieldCode === fieldCode);

    if (field) {
      // Normalizar el código del campo para que coincida con el formato del formulario
      const normalizedCode = normalizeFieldCode(fieldCode);

      // Buscar si existe un campo con este código en la configuración
      const matchingConfig = fieldConfigs.find(fc =>
        fc.fieldCode === normalizedCode ||
        fc.fieldCode === fieldCode ||
        normalizeFieldCode(fc.fieldCode) === normalizedCode
      );

      const actualFieldCode = matchingConfig?.fieldCode || normalizedCode;

      // Transformar el valor según el tipo de campo de la configuración
      const transformedValue = transformValueForField(fieldCode, field.value, matchingConfig);

      // Aplicar valor transformado al formulario
      onFieldChange(actualFieldCode, transformedValue);
    }

    setExtractedFields(prev => prev.map(f =>
      f.fieldCode === fieldCode ? { ...f, status: 'approved' as const } : f
    ));
  };

  // Rechazar campo extraído
  const handleRejectField = (fieldCode: string) => {
    setExtractedFields(prev => prev.map(f =>
      f.fieldCode === fieldCode ? { ...f, status: 'rejected' as const } : f
    ));
  };

  // Editar campo extraído
  const handleEditExtractedField = (fieldCode: string, newValue: any) => {
    setExtractedFields(prev => prev.map(f =>
      f.fieldCode === fieldCode ? { ...f, value: newValue, status: 'edited' as const } : f
    ));
  };

  // Aprobar todos los campos pendientes
  const handleApproveAll = () => {
    // Usar el ref para obtener el estado más reciente (evita closure stale)
    const currentFields = extractedFieldsRef.current;

    // Primero construir el objeto de updates ANTES de actualizar el estado
    const updates: Record<string, any> = {};
    const pendingFields = currentFields.filter(f => f.status === 'pending');

    pendingFields.forEach(f => {
      // Normalizar el código del campo
      const normalizedCode = normalizeFieldCode(f.fieldCode);

      // Buscar el campo en la configuración
      const matchingConfig = fieldConfigs.find(fc =>
        fc.fieldCode === normalizedCode ||
        fc.fieldCode === f.fieldCode ||
        normalizeFieldCode(fc.fieldCode) === normalizedCode
      );

      const actualFieldCode = matchingConfig?.fieldCode || normalizedCode;

      // Transformar el valor según la configuración del campo (respaldo si la IA no formateó bien)
      const transformedValue = transformValueForField(f.fieldCode, f.value, matchingConfig);
      updates[actualFieldCode] = transformedValue;
    });

    // Ahora actualizar el estado
    setExtractedFields(prev => prev.map(f =>
      f.status === 'pending' ? { ...f, status: 'approved' as const } : f
    ));

    // Aplicar todos los valores al formulario
    Object.entries(updates).forEach(([code, value]) => {
      onFieldChange(code, value);
    });

    onApplyExtractedFields?.(updates);

    // Guardar los updates para verificación cuando formData se actualice
    pendingVerificationRef.current = updates;
  };

  // Obtener color por nivel de confianza
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'green';
    if (confidence >= 0.7) return 'yellow';
    if (confidence >= 0.5) return 'orange';
    return 'red';
  };

  /**
   * Navega al campo en el formulario principal: scroll + highlight
   */
  const navigateToField = useCallback((fieldCode: string, section?: string) => {
    const cleanCode = fieldCode.replace(/:/g, '');

    // 1) Wizard: cambiar de paso
    if (onNavigateToField && section) {
      onNavigateToField(fieldCode, section);
    }

    // 2) Expert accordion: abrir sección si está cerrada (via custom event)
    if (section) {
      const fieldEl = document.getElementById(`swift-field-${cleanCode}`);
      const fieldRect = fieldEl?.getBoundingClientRect();
      const isVisible = fieldEl && fieldRect && fieldRect.height > 0;
      if (!isVisible) {
        window.dispatchEvent(new CustomEvent('openAccordionSection', { detail: { sectionCode: section } }));
      }
    }

    // 3) Scroll y highlight con retry
    const tryScroll = (attempt: number) => {
      const el = document.getElementById(`swift-field-${cleanCode}`);
      const rect = el?.getBoundingClientRect();
      const isVisible = el && rect && rect.height > 0;
      if (el && isVisible) {

        // Approach 1: scrollIntoView
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Approach 2: fallback with window.scrollTo after a tick
        setTimeout(() => {
          const rect2 = el.getBoundingClientRect();
          if (rect2.top < 0 || rect2.top > window.innerHeight * 0.6) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = scrollTop + rect2.top - (window.innerHeight / 3);
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          }
        }, 100);

        // Approach 3: find scrollable parent and scroll it
        let parent = el.parentElement;
        while (parent) {
          const style = window.getComputedStyle(parent);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            const parentRect = parent.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const scrollTarget = parent.scrollTop + (elRect.top - parentRect.top) - (parentRect.height / 3);
            parent.scrollTo({ top: scrollTarget, behavior: 'smooth' });
            break;
          }
          parent = parent.parentElement;
        }

        // Highlight - very visible
        el.style.transition = 'box-shadow 0.3s ease, outline 0.3s ease';
        el.style.boxShadow = '0 0 0 4px rgba(66, 153, 225, 0.8), 0 0 30px rgba(66, 153, 225, 0.5)';
        el.style.outline = '3px solid rgba(66, 153, 225, 0.9)';
        el.style.outlineOffset = '4px';
        el.style.borderRadius = '8px';
        setTimeout(() => {
          el.style.boxShadow = '';
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.borderRadius = '';
          el.style.transition = '';
        }, 3000);

        // Focus input
        const input = el.querySelector('input, textarea, select') as HTMLElement;
        if (input) setTimeout(() => input.focus(), 600);
      } else if (attempt < 12) {
        setTimeout(() => tryScroll(attempt + 1), 300);
      }
    };

    setTimeout(() => tryScroll(0), 200);
  }, [onNavigateToField]);

  // Manejar navegación por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredFields.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFields[selectedIndex]) {
        navigateToField(filteredFields[selectedIndex].fieldCode, filteredFields[selectedIndex].section);
      }
    } else if (e.key === 'Escape') {
      if (activeField) {
        setActiveField(null);
      } else {
        setSearchQuery('');
      }
    }
  }, [filteredFields, selectedIndex, activeField, navigateToField]);

  // Atajo global Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    if (enabled) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [enabled]);

  // Reset selected index cuando cambian los filtros
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Mantener ref sincronizado con el estado para evitar closures stale
  useEffect(() => {
    extractedFieldsRef.current = extractedFields;
  }, [extractedFields]);

  // Búsqueda por referencia con debounce (mismo patrón que SmartCommandBar)
  useEffect(() => {
    if (referenceQuery.length < 2) {
      setReferenceResults([]);
      setHasSearchedReference(false);
      return;
    }
    const debounceMs = referenceQuery.length >= 5 ? 150 : 250;
    const timer = setTimeout(async () => {
      setIsSearchingReference(true);
      setHasSearchedReference(true);
      try {
        const results = await operationsApi.searchByReference(referenceQuery);
        setReferenceResults(results.slice(0, 15));
      } catch {
        setReferenceResults([]);
      } finally {
        setIsSearchingReference(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [referenceQuery]);

  // Cargar campos desde operación seleccionada por referencia
  const handleLoadFromReference = useCallback((operation: Operation) => {
    if (!operation.swiftMessage) return;

    // Reutilizar el parser existente
    const parsedFields = parseSwiftMessage(operation.swiftMessage, fieldConfigs);

    // Convertir a ExtractedField[] (mismo formato que Extracción IA)
    const referenceFields: ExtractedField[] = Object.entries(parsedFields)
      .filter(([, value]) => value !== '' && value !== null && value !== undefined)
      .map(([fieldCode, value]) => ({
        fieldCode,
        value,
        confidence: 1.0,
        evidence: `${t('common:assistant.fromOperation', 'Copiado de operación')} ${operation.operationId}`,
        status: 'pending' as const,
      }));

    // Inyectar en el state existente que usa la UI de extracción
    setExtractedFields(referenceFields);
    extractedFieldsRef.current = referenceFields;
    setExtractionResult({
      extractionId: `ref-${operation.operationId}`,
      fileName: `Op: ${operation.operationId} - ${operation.reference || ''}`,
      provider: 'Reference',
      model: 'operation-lookup',
      fields: referenceFields,
      processingTimeMs: 0,
      totalTokens: 0,
    });

    // Limpiar verificaciones anteriores
    setVerificationResults({});
    setVerificationSummary(null);

    // Cambiar a tab extraction para mostrar campos con approve/reject
    setActiveTab('extraction');
  }, [fieldConfigs, t]);

  // Guardar y continuar
  const handleSaveAndNext = () => {
    if (activeField) {
      onFieldCompleted?.(activeField.fieldCode);
      setActiveField(null);
      setSearchQuery('');
      searchInputRef.current?.focus();
    }
  };

  // Omitir campo
  const handleSkip = () => {
    setActiveField(null);
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  if (!enabled) return null;

  const FieldIcon = activeField
    ? fieldTypeIcons[activeField.fieldType] || FiFileText
    : FiFileText;

  return (
    <Box
      bg={isDark ? 'gray.900' : 'purple.50'}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      border="2px solid"
      borderColor={isDark ? 'purple.700' : 'purple.200'}
      mb={4}
    >
      {/* Header colapsable */}
      <HStack
        px={4}
        py={3}
        bg={isExpanded
          ? (isDark ? 'purple.900' : 'purple.600')
          : (isDark ? 'gray.700' : 'gray.100')
        }
        color={isExpanded ? 'white' : colors.textColor}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        justify="space-between"
        transition="all 0.2s"
      >
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg={isExpanded ? 'whiteAlpha.200' : (isDark ? 'purple.800' : 'purple.100')}
          >
            <FiZap size={18} color={isExpanded ? 'white' : (isDark ? '#B794F4' : '#805AD5')} />
          </Box>
          <Box>
            <Text fontWeight="600" fontSize="sm">
              {t('common:assistant.title', 'Asistente de Digitación')}
            </Text>
            <Text fontSize="xs" opacity={0.8}>
              {t('common:assistant.subtitle', 'Busca por código SWIFT o descripción')}
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {!isExpanded && (
            <HStack gap={2}>
              <Badge colorPalette="green" size="sm">
                {stats.requiredFilled}/{stats.requiredTotal}
              </Badge>
              <Kbd size="sm" bg={isDark ? 'gray.600' : 'gray.200'}>Ctrl+K</Kbd>
            </HStack>
          )}
          <IconButton
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            size="sm"
            variant="ghost"
            color={isExpanded ? 'white' : colors.textColor}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </IconButton>
        </HStack>
      </HStack>

      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          <VStack align="stretch" gap={0}>
            {/* Tabs de navegación */}
            {enableAIExtraction && (
              <HStack px={4} py={2} bg={isDark ? 'purple.900' : 'purple.600'} gap={2}>
                <Box
                  as="button"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontSize="13px"
                  fontWeight="600"
                  bg={activeTab === 'search' ? 'white' : 'whiteAlpha.200'}
                  color={activeTab === 'search' ? 'purple.600' : 'white'}
                  cursor="pointer"
                  onClick={() => setActiveTab('search')}
                  transition="all 0.2s"
                >
                  <HStack gap={1}>
                    <FiSearch size={14} />
                    <Text>{t('common:assistant.tabSearch', 'Búsqueda')}</Text>
                  </HStack>
                </Box>
                <Box
                  as="button"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontSize="13px"
                  fontWeight="600"
                  bg={activeTab === 'extraction' ? 'white' : 'whiteAlpha.200'}
                  color={activeTab === 'extraction' ? 'purple.600' : 'white'}
                  cursor="pointer"
                  onClick={() => setActiveTab('extraction')}
                  transition="all 0.2s"
                >
                  <HStack gap={1}>
                    <FiCpu size={14} />
                    <Text>{t('common:assistant.tabExtraction', 'Extracción IA')}</Text>
                    {extractionStats && (
                      <Badge colorPalette="green" size="sm" ml={1}>
                        {extractionStats.approved}/{extractionStats.total}
                      </Badge>
                    )}
                  </HStack>
                </Box>
                <Box
                  as="button"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontSize="13px"
                  fontWeight="600"
                  bg={activeTab === 'reference' ? 'white' : 'whiteAlpha.200'}
                  color={activeTab === 'reference' ? 'purple.600' : 'white'}
                  cursor="pointer"
                  onClick={() => setActiveTab('reference')}
                  transition="all 0.2s"
                >
                  <HStack gap={1}>
                    <FiLink size={14} />
                    <Text>{t('common:assistant.tabReference', 'Por Referencia')}</Text>
                  </HStack>
                </Box>
              </HStack>
            )}

            {/* Barra de búsqueda */}
            <Box px={4} py={3} bg={isDark ? 'purple.900' : 'purple.600'}>
              <HStack gap={2}>
                <Box position="relative" flex={1}>
                  <Box
                    position="absolute"
                    left={3}
                    top="50%"
                    transform="translateY(-50%)"
                    color={isDark ? 'purple.200' : 'purple.700'}
                    zIndex={1}
                  >
                    <FiSearch size={16} />
                  </Box>
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder || t('common:assistant.searchPlaceholder', 'Ej: 31D, fecha, monto, beneficiario...')}
                    pl={10}
                    pr={16}
                    bg={isDark ? 'whiteAlpha.100' : 'white'}
                    border="none"
                    borderRadius="lg"
                    _placeholder={{ color: isDark ? 'whiteAlpha.500' : 'gray.400' }}
                    _focus={{
                      bg: isDark ? 'whiteAlpha.200' : 'white',
                      boxShadow: '0 0 0 2px rgba(128, 90, 213, 0.3)'
                    }}
                    disabled={readOnly || activeTab !== 'search'}
                  />
                  <Box
                    position="absolute"
                    right={3}
                    top="50%"
                    transform="translateY(-50%)"
                  >
                    <Kbd size="sm" bg={isDark ? 'whiteAlpha.200' : 'gray.100'}>Ctrl+K</Kbd>
                  </Box>
                </Box>

                {/* Botón de carga de archivo */}
                {enableAIExtraction && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <IconButton
                      aria-label={t('common:assistant.uploadFile', 'Cargar documento')}
                      onClick={() => fileInputRef.current?.click()}
                      bg={isDark ? 'whiteAlpha.200' : 'white'}
                      color={isDark ? 'white' : 'purple.600'}
                      _hover={{ bg: isDark ? 'whiteAlpha.300' : 'purple.50' }}
                      disabled={isExtracting || readOnly}
                      size="md"
                    >
                      {isExtracting ? <Spinner size="sm" /> : <FiUpload size={18} />}
                    </IconButton>
                  </>
                )}
              </HStack>
            </Box>

            {/* Panel de extracción IA */}
            {activeTab === 'extraction' && (
              <Box>
                {/* Estado de extracción en progreso con lista de archivos */}
                {isExtracting && uploadedFiles.length > 0 && (
                  <Box>
                    {/* Header con progreso general */}
                    <HStack
                      px={4}
                      py={3}
                      bg={isDark ? 'purple.900' : 'purple.50'}
                      borderBottom="1px solid"
                      borderColor={colors.borderColor}
                      justify="space-between"
                    >
                      <HStack gap={2}>
                        <Spinner size="sm" color="purple.500" />
                        <Box>
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {t('common:assistant.processingFiles', 'Procesando archivos')} ({processingProgress.current}/{processingProgress.total})
                          </Text>
                          <Text fontSize="10px" color={colors.textColorSecondary}>
                            {currentProcessingFile && `${t('common:assistant.processing', 'Procesando')}: ${currentProcessingFile}`}
                          </Text>
                        </Box>
                      </HStack>
                      <Badge colorPalette="purple" size="sm">
                        ~{totalEstimatedTime}s
                      </Badge>
                    </HStack>

                    {/* Lista de archivos */}
                    <VStack align="stretch" gap={0} maxH="200px" overflowY="auto">
                      {uploadedFiles.map((fileInfo) => (
                        <HStack
                          key={fileInfo.id}
                          px={4}
                          py={2}
                          borderBottom="1px solid"
                          borderColor={colors.borderColor}
                          bg={
                            fileInfo.status === 'completed' ? (isDark ? 'green.900' : 'green.50') :
                            fileInfo.status === 'error' ? (isDark ? 'red.900' : 'red.50') :
                            fileInfo.status === 'processing' ? (isDark ? 'blue.900' : 'blue.50') :
                            'transparent'
                          }
                          justify="space-between"
                        >
                          <HStack gap={2} flex={1}>
                            {fileInfo.status === 'processing' && <Spinner size="xs" color="blue.500" />}
                            {fileInfo.status === 'completed' && <FiCheckCircle size={14} color="var(--chakra-colors-green-500)" />}
                            {fileInfo.status === 'error' && <FiXCircle size={14} color="var(--chakra-colors-red-500)" />}
                            {fileInfo.status === 'pending' && <FiClock size={14} color="var(--chakra-colors-gray-400)" />}
                            <Box>
                              <Text fontSize="12px" fontWeight="500" color={colors.textColor} noOfLines={1}>
                                {fileInfo.file.name}
                              </Text>
                              {fileInfo.error && (
                                <Text fontSize="10px" color="red.500">{fileInfo.error}</Text>
                              )}
                            </Box>
                          </HStack>
                          <HStack gap={2}>
                            <Badge colorPalette="gray" size="sm" variant="subtle">
                              {formatFileSize(fileInfo.file.size)}
                            </Badge>
                            {fileInfo.status === 'processing' && (
                              <Progress.Root size="xs" w="60px" value={fileInfo.progress}>
                                <Progress.Track>
                                  <Progress.Range />
                                </Progress.Track>
                              </Progress.Root>
                            )}
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Sin resultados - Mostrar zona de carga */}
                {!isExtracting && extractedFields.length === 0 && uploadedFiles.length === 0 && (
                  <VStack py={6} color={colors.textColorSecondary}>
                    <Box
                      p={6}
                      borderRadius="lg"
                      border="2px dashed"
                      borderColor={colors.borderColor}
                      w="90%"
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ borderColor: 'purple.400', bg: isDark ? 'whiteAlpha.50' : 'purple.50' }}
                      onClick={() => fileInputRef.current?.click()}
                      transition="all 0.2s"
                    >
                      <VStack gap={2}>
                        <FiUpload size={32} opacity={0.6} />
                        <Text fontSize="sm" fontWeight="500">
                          {t('common:assistant.dropFiles', 'Arrastra archivos aquí o haz clic para seleccionar')}
                        </Text>
                        <Text fontSize="11px" color={colors.textColorSecondary}>
                          {t('common:assistant.fileTypes', 'PDF, PNG, JPG, DOCX')} • {t('common:assistant.maxSize', 'Máx')} {MAX_FILE_SIZE_MB}MB • {t('common:assistant.maxFiles', 'Hasta')} {MAX_FILES} {t('common:assistant.files', 'archivos')}
                        </Text>
                      </VStack>
                    </Box>
                    <Box
                      as="button"
                      mt={2}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      bg="purple.500"
                      color="white"
                      fontSize="13px"
                      fontWeight="600"
                      cursor="pointer"
                      _hover={{ bg: 'purple.600' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <HStack gap={2}>
                        <FiUpload size={14} />
                        <Text>{t('common:assistant.selectFile', 'Seleccionar archivo')}</Text>
                      </HStack>
                    </Box>
                  </VStack>
                )}

                {/* Resultados de extracción */}
                {!isExtracting && extractedFields.length > 0 && (
                  <>
                    {/* Header con stats */}
                    <HStack
                      px={4}
                      py={3}
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      justify="space-between"
                      borderBottom="1px solid"
                      borderColor={colors.borderColor}
                    >
                      <VStack align="start" gap={0}>
                        <HStack gap={2}>
                          <FiCpu size={14} color="var(--chakra-colors-purple-500)" />
                          <Text fontSize="13px" fontWeight="600" color={colors.textColor}>
                            {extractionResult?.fileName}
                          </Text>
                        </HStack>
                        <Text fontSize="11px" color={colors.textColorSecondary}>
                          {extractionResult?.provider} • {extractionResult?.model} • {extractionResult?.processingTimeMs}ms
                        </Text>
                      </VStack>
                      <HStack gap={3}>
                        <VStack gap={0} align="end">
                          <Text fontSize="11px" color={colors.textColorSecondary}>Obligatorios</Text>
                          <Badge colorPalette="blue" size="sm">
                            {extractionStats?.requiredExtracted}/{extractionStats?.requiredTotal}
                          </Badge>
                        </VStack>
                        <VStack gap={0} align="end">
                          <Text fontSize="11px" color={colors.textColorSecondary}>Total</Text>
                          <Badge colorPalette="purple" size="sm">
                            {extractionStats?.approved}/{extractionStats?.total}
                          </Badge>
                        </VStack>
                      </HStack>
                    </HStack>

                    {/* Acciones masivas */}
                    {extractionStats && extractionStats.pending > 0 && (
                      <HStack px={4} py={2} bg={isDark ? 'blue.900' : 'blue.50'} justify="space-between">
                        <Text fontSize="12px" color={isDark ? 'blue.200' : 'blue.700'}>
                          {extractionStats.pending} {t('common:assistant.fieldsPending', 'campos pendientes de revisar')}
                        </Text>
                        <Box
                          as="button"
                          px={3}
                          py={1}
                          borderRadius="md"
                          bg="green.500"
                          color="white"
                          fontSize="11px"
                          fontWeight="600"
                          cursor="pointer"
                          _hover={{ bg: 'green.600' }}
                          onClick={handleApproveAll}
                        >
                          <HStack gap={1}>
                            <FiCheckCircle size={12} />
                            <Text>{t('common:assistant.approveAll', 'Aprobar todos')}</Text>
                          </HStack>
                        </Box>
                      </HStack>
                    )}

                    {/* Banner de verificación */}
                    {verificationSummary && (
                      <HStack
                        px={4}
                        py={2}
                        bg={verificationSummary.failed === 0
                          ? (isDark ? 'green.900' : 'green.50')
                          : (isDark ? 'orange.900' : 'orange.50')
                        }
                        justify="space-between"
                        borderBottom="1px solid"
                        borderColor={colors.borderColor}
                      >
                        <HStack gap={2}>
                          {verificationSummary.failed === 0 ? (
                            <FiCheckCircle size={16} color="var(--chakra-colors-green-500)" />
                          ) : (
                            <FiAlertCircle size={16} color="var(--chakra-colors-orange-500)" />
                          )}
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {verificationSummary.failed === 0
                              ? t('common:assistant.allVerified', 'Todos los campos fueron aplicados correctamente')
                              : t('common:assistant.someNotVerified', '{{failed}} de {{total}} campos no se aplicaron correctamente', {
                                  failed: verificationSummary.failed,
                                  total: verificationSummary.total
                                })
                            }
                          </Text>
                        </HStack>
                        <HStack gap={2}>
                          <Badge colorPalette="green" size="sm">
                            <HStack gap={1}>
                              <FiCheck size={10} />
                              <Text>{verificationSummary.verified}</Text>
                            </HStack>
                          </Badge>
                          {verificationSummary.failed > 0 && (
                            <Badge colorPalette="orange" size="sm">
                              <HStack gap={1}>
                                <FiAlertCircle size={10} />
                                <Text>{verificationSummary.failed}</Text>
                              </HStack>
                            </Badge>
                          )}
                        </HStack>
                      </HStack>
                    )}

                    {/* Sección de Información Adicional (Análisis IA) - Colapsable */}
                    {extractionResult?.additionalAnalysis && (
                      <Box borderBottom="1px solid" borderColor={colors.borderColor}>
                        <HStack
                          px={4}
                          py={2}
                          bg={isDark ? 'blue.900' : 'blue.50'}
                          cursor="pointer"
                          onClick={() => setIsAnalysisSectionExpanded(!isAnalysisSectionExpanded)}
                          justify="space-between"
                          _hover={{ bg: isDark ? 'blue.800' : 'blue.100' }}
                          transition="all 0.2s"
                        >
                          <HStack gap={2}>
                            <FiInfo size={14} color="var(--chakra-colors-blue-500)" />
                            <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                              {t('common:assistant.additionalAnalysis', 'Análisis Adicional')}
                            </Text>
                            <Badge colorPalette="blue" size="sm">5</Badge>
                          </HStack>
                          <IconButton
                            aria-label="Toggle analysis"
                            size="xs"
                            variant="ghost"
                          >
                            {isAnalysisSectionExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                          </IconButton>
                        </HStack>
                        <Collapsible.Root open={isAnalysisSectionExpanded}>
                          <Collapsible.Content>
                            <AdditionalAnalysisSection
                              analysis={extractionResult.additionalAnalysis}
                              isDark={isDark}
                              colors={colors}
                              t={t}
                            />
                          </Collapsible.Content>
                        </Collapsible.Root>
                      </Box>
                    )}

                    {/* Lista de campos extraídos - Colapsable */}
                    <Box>
                      <HStack
                        px={4}
                        py={2}
                        bg={isDark ? 'purple.900' : 'purple.50'}
                        cursor="pointer"
                        onClick={() => setIsFieldsSectionExpanded(!isFieldsSectionExpanded)}
                        justify="space-between"
                        _hover={{ bg: isDark ? 'purple.800' : 'purple.100' }}
                        transition="all 0.2s"
                      >
                        <HStack gap={2}>
                          <FiList size={14} color="var(--chakra-colors-purple-500)" />
                          <Text fontSize="12px" fontWeight="600" color={colors.textColor}>
                            {t('common:assistant.extractedFields', 'Campos Extraídos')}
                          </Text>
                          <Badge colorPalette="purple" size="sm">{extractedFields.length}</Badge>
                        </HStack>
                        <IconButton
                          aria-label="Toggle fields"
                          size="xs"
                          variant="ghost"
                        >
                          {isFieldsSectionExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        </IconButton>
                      </HStack>
                      <Collapsible.Root open={isFieldsSectionExpanded}>
                        <Collapsible.Content>
                          <Box maxH="350px" overflowY="auto">
                      {extractedFields.map((extracted) => {
                        // Normalizar código para buscar en config (ej: "39A" -> ":39A:")
                        const normalizedCode = normalizeFieldCode(extracted.fieldCode);
                        const fieldConfig = fieldConfigs.find(f =>
                          f.fieldCode === normalizedCode ||
                          f.fieldCode === extracted.fieldCode ||
                          normalizeFieldCode(f.fieldCode) === normalizedCode
                        );
                        const fieldName = fieldConfig
                          ? t(fieldConfig.fieldNameKey, fieldConfig.fieldName || extracted.fieldCode)
                          : extracted.fieldCode;
                        const confidenceColor = getConfidenceColor(extracted.confidence);
                        const isEditing = selectedExtractedField?.fieldCode === extracted.fieldCode;
                        const verificationStatus = verificationResults[extracted.fieldCode];

                        return (
                          <Box
                            key={extracted.fieldCode}
                            px={4}
                            py={3}
                            borderBottom="1px solid"
                            borderColor={colors.borderColor}
                            bg={
                              extracted.status === 'approved' ? (isDark ? 'green.900' : 'green.50') :
                              extracted.status === 'rejected' ? (isDark ? 'red.900' : 'red.50') :
                              extracted.status === 'edited' ? (isDark ? 'yellow.900' : 'yellow.50') :
                              'transparent'
                            }
                            opacity={extracted.status === 'rejected' ? 0.6 : 1}
                          >
                            {/* Cabecera del campo */}
                            <HStack justify="space-between" mb={2}>
                              <VStack align="start" gap={0}>
                                <HStack gap={2}>
                                  <Badge colorPalette="purple" size="sm">{extracted.fieldCode}</Badge>
                                  <Text fontSize="13px" fontWeight="600" color={colors.textColor}>
                                    {fieldName}
                                  </Text>
                                  {fieldConfig?.isRequired && (
                                    <Badge colorPalette="red" size="sm" variant="subtle">
                                      {t('common:required', 'Obligatorio')}
                                    </Badge>
                                  )}
                                </HStack>
                                {/* Sección del campo */}
                                {fieldConfig?.section && (
                                  <Text fontSize="10px" color={colors.textColorSecondary}>
                                    {t(`common:${getSectionTranslationKey(fieldConfig.section, fieldConfig.messageType)}`, fieldConfig.section)}
                                  </Text>
                                )}
                              </VStack>
                              <HStack gap={2}>
                                {/* Indicador de confianza */}
                                <HStack gap={1}>
                                  <Box
                                    w="8px"
                                    h="8px"
                                    borderRadius="full"
                                    bg={`${confidenceColor}.500`}
                                  />
                                  <Text fontSize="11px" fontWeight="600" color={`${confidenceColor}.500`}>
                                    {Math.round(extracted.confidence * 100)}%
                                  </Text>
                                </HStack>
                                {/* Status icon */}
                                {extracted.status === 'approved' && (
                                  <FiCheckCircle size={16} color="var(--chakra-colors-green-500)" />
                                )}
                                {extracted.status === 'rejected' && (
                                  <FiXCircle size={16} color="var(--chakra-colors-red-500)" />
                                )}
                                {/* Indicador de verificación */}
                                {verificationStatus === 'verified' && (
                                  <Badge colorPalette="green" size="sm" variant="solid">
                                    <HStack gap={1}>
                                      <FiCheck size={10} />
                                      <Text fontSize="10px">{t('common:assistant.applied', 'Aplicado')}</Text>
                                    </HStack>
                                  </Badge>
                                )}
                                {verificationStatus === 'failed' && manualSyncField !== extracted.fieldCode && (
                                  <Badge colorPalette="orange" size="sm" variant="solid">
                                    <HStack gap={1}>
                                      <FiAlertCircle size={10} />
                                      <Text fontSize="10px">{t('common:assistant.needsSync', 'Requiere sync')}</Text>
                                    </HStack>
                                  </Badge>
                                )}
                                {manualSyncField === extracted.fieldCode && (
                                  <Badge colorPalette="blue" size="sm" variant="solid">
                                    <HStack gap={1}>
                                      <FiEdit2 size={10} />
                                      <Text fontSize="10px">{t('common:assistant.syncing', 'Sincronizando...')}</Text>
                                    </HStack>
                                  </Badge>
                                )}
                                {extracted.status === 'edited' && (
                                  <FiEdit2 size={16} color="var(--chakra-colors-yellow-500)" />
                                )}
                              </HStack>
                            </HStack>

                            {/* Valor extraído o componente de sincronización manual */}
                            <Box
                              p={2}
                              mb={2}
                              borderRadius="md"
                              bg={manualSyncField === extracted.fieldCode
                                ? (isDark ? 'blue.900' : 'blue.50')
                                : (isDark ? 'gray.700' : 'gray.100')
                              }
                              fontSize="13px"
                              border={manualSyncField === extracted.fieldCode ? '2px solid' : 'none'}
                              borderColor="blue.400"
                            >
                              {manualSyncField === extracted.fieldCode && fieldConfig ? (
                                // Modo sincronización manual - usa el componente real del formulario
                                <VStack align="stretch" gap={2}>
                                  <Text fontSize="11px" color="blue.600" fontWeight="600">
                                    {t('common:assistant.manualSyncHint', 'Ingrese el valor usando el componente del formulario:')}
                                  </Text>
                                  <DynamicSwiftField
                                    config={fieldConfig}
                                    value={formData[fieldConfig.fieldCode] || extracted.value}
                                    onChange={(value) => {
                                      // Aplicar directamente al formulario
                                      onFieldChange(fieldConfig.fieldCode, value);
                                    }}
                                    formData={formData}
                                  />
                                  <HStack gap={2} justify="flex-end">
                                    <Box
                                      as="button"
                                      px={3}
                                      py={1}
                                      borderRadius="md"
                                      bg="gray.500"
                                      color="white"
                                      fontSize="11px"
                                      fontWeight="600"
                                      cursor="pointer"
                                      _hover={{ bg: 'gray.600' }}
                                      onClick={() => setManualSyncField(null)}
                                    >
                                      {t('common:cancel', 'Cancelar')}
                                    </Box>
                                    <Box
                                      as="button"
                                      px={3}
                                      py={1}
                                      borderRadius="md"
                                      bg="green.500"
                                      color="white"
                                      fontSize="11px"
                                      fontWeight="600"
                                      cursor="pointer"
                                      _hover={{ bg: 'green.600' }}
                                      onClick={() => {
                                        setManualSyncField(null);
                                        // Actualizar verificación para este campo
                                        setVerificationResults(prev => ({
                                          ...prev,
                                          [extracted.fieldCode]: 'verified'
                                        }));
                                      }}
                                    >
                                      <HStack gap={1}>
                                        <FiCheck size={12} />
                                        <Text>{t('common:assistant.confirmSync', 'Confirmar')}</Text>
                                      </HStack>
                                    </Box>
                                  </HStack>
                                </VStack>
                              ) : isEditing && fieldConfig ? (
                                <DynamicSwiftField
                                  config={fieldConfig}
                                  value={extracted.value}
                                  onChange={(value) => handleEditExtractedField(extracted.fieldCode, value)}
                                  variant="clean"
                                />
                              ) : (
                                <Text color={colors.textColor}>
                                  {typeof extracted.value === 'object'
                                    ? JSON.stringify(extracted.value)
                                    : String(extracted.value)}
                                </Text>
                              )}
                            </Box>

                            {/* Evidencia */}
                            {extracted.evidence && (
                              <Box mb={2}>
                                <HStack
                                  gap={1}
                                  cursor="pointer"
                                  onClick={() => setShowEvidence(
                                    showEvidence === extracted.fieldCode ? null : extracted.fieldCode
                                  )}
                                >
                                  <FiEye size={12} color="var(--chakra-colors-gray-500)" />
                                  <Text fontSize="11px" color={colors.textColorSecondary}>
                                    {t('common:assistant.showEvidence', 'Ver evidencia')}
                                  </Text>
                                  {showEvidence === extracted.fieldCode ? (
                                    <FiChevronUp size={12} />
                                  ) : (
                                    <FiChevronDown size={12} />
                                  )}
                                </HStack>
                                <Collapsible.Root open={showEvidence === extracted.fieldCode}>
                                  <Collapsible.Content>
                                    <Box
                                      mt={2}
                                      p={2}
                                      borderRadius="md"
                                      bg={isDark ? 'gray.800' : 'white'}
                                      border="1px dashed"
                                      borderColor={colors.borderColor}
                                      fontSize="11px"
                                      color={colors.textColorSecondary}
                                      fontStyle="italic"
                                    >
                                      "{extracted.evidence}"
                                    </Box>
                                  </Collapsible.Content>
                                </Collapsible.Root>
                              </Box>
                            )}

                            {/* Acciones para campos pendientes */}
                            {extracted.status === 'pending' && (
                              <HStack gap={2} mt={2}>
                                <Box
                                  as="button"
                                  flex={1}
                                  py={1.5}
                                  borderRadius="md"
                                  bg="green.500"
                                  color="white"
                                  fontSize="12px"
                                  fontWeight="600"
                                  cursor="pointer"
                                  _hover={{ bg: 'green.600' }}
                                  onClick={() => handleApproveField(extracted.fieldCode)}
                                >
                                  <HStack gap={1} justify="center">
                                    <FiCheck size={12} />
                                    <Text>{t('common:assistant.approve', 'Aprobar')}</Text>
                                  </HStack>
                                </Box>
                                <Box
                                  as="button"
                                  py={1.5}
                                  px={3}
                                  borderRadius="md"
                                  bg={isDark ? 'gray.600' : 'gray.200'}
                                  color={colors.textColor}
                                  fontSize="12px"
                                  fontWeight="600"
                                  cursor="pointer"
                                  _hover={{ bg: isDark ? 'gray.500' : 'gray.300' }}
                                  onClick={() => setSelectedExtractedField(
                                    isEditing ? null : extracted
                                  )}
                                >
                                  <FiEdit2 size={12} />
                                </Box>
                                <Box
                                  as="button"
                                  py={1.5}
                                  px={3}
                                  borderRadius="md"
                                  bg="red.500"
                                  color="white"
                                  fontSize="12px"
                                  fontWeight="600"
                                  cursor="pointer"
                                  _hover={{ bg: 'red.600' }}
                                  onClick={() => handleRejectField(extracted.fieldCode)}
                                >
                                  <FiX size={12} />
                                </Box>
                              </HStack>
                            )}

                            {/* Botón de sincronización manual cuando la verificación falla */}
                            {extracted.status === 'approved' && verificationStatus === 'failed' && manualSyncField !== extracted.fieldCode && (
                              <Box
                                as="button"
                                w="100%"
                                py={2}
                                mt={2}
                                borderRadius="md"
                                bg="orange.500"
                                color="white"
                                fontSize="12px"
                                fontWeight="600"
                                cursor="pointer"
                                _hover={{ bg: 'orange.600' }}
                                onClick={() => setManualSyncField(extracted.fieldCode)}
                              >
                                <HStack gap={2} justify="center">
                                  <FiEdit2 size={14} />
                                  <Text>{t('common:assistant.manualSync', 'Sincronizar manualmente')}</Text>
                                </HStack>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                          </Box>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* Panel de búsqueda por referencia */}
            {activeTab === 'reference' && (
              <Box>
                {/* Input de búsqueda por referencia */}
                <Box px={4} py={3} bg={isDark ? 'gray.750' : 'gray.50'} borderBottom="1px solid" borderColor={colors.borderColor}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left={3}
                      top="50%"
                      transform="translateY(-50%)"
                      color={isDark ? 'purple.200' : 'purple.500'}
                      zIndex={1}
                    >
                      <FiHash size={16} />
                    </Box>
                    <Input
                      value={referenceQuery}
                      onChange={(e) => setReferenceQuery(e.target.value)}
                      placeholder={t('common:assistant.referencePlaceholder', 'Buscar por ID, referencia, beneficiario...')}
                      pl={10}
                      bg={isDark ? 'gray.800' : 'white'}
                      border="1px solid"
                      borderColor={colors.borderColor}
                      borderRadius="lg"
                      _placeholder={{ color: isDark ? 'whiteAlpha.500' : 'gray.400' }}
                      _focus={{
                        borderColor: 'purple.400',
                        boxShadow: '0 0 0 2px rgba(128, 90, 213, 0.3)'
                      }}
                      disabled={readOnly}
                      autoFocus
                    />
                  </Box>
                </Box>

                {/* Loading */}
                {isSearchingReference && (
                  <HStack px={4} py={4} justify="center" gap={2}>
                    <Spinner size="sm" color="purple.500" />
                    <Text fontSize="12px" color={colors.textColorSecondary}>
                      {t('common:assistant.searchingOperations', 'Buscando operaciones...')}
                    </Text>
                  </HStack>
                )}

                {/* Resultados */}
                {!isSearchingReference && hasSearchedReference && (
                  <Box maxH="300px" overflowY="auto">
                    {referenceResults.length === 0 ? (
                      <VStack py={8} color={colors.textColorSecondary}>
                        <FiSearch size={32} opacity={0.4} />
                        <Text fontSize="sm">
                          {t('common:assistant.noOperationsFound', 'No se encontraron operaciones')}
                        </Text>
                        <Text fontSize="xs" opacity={0.7}>
                          {t('common:assistant.tryDifferentSearch', 'Intenta con otro término de búsqueda')}
                        </Text>
                      </VStack>
                    ) : (
                      referenceResults.map((op) => (
                        <HStack
                          key={op.id}
                          px={4}
                          py={3}
                          cursor="pointer"
                          borderBottom="1px solid"
                          borderColor={colors.borderColor}
                          _hover={{ bg: isDark ? 'purple.900' : 'purple.50' }}
                          onClick={() => handleLoadFromReference(op)}
                          transition="all 0.15s"
                          gap={3}
                        >
                          <Box
                            w="36px"
                            h="36px"
                            borderRadius="lg"
                            bg={isDark ? 'purple.800' : 'purple.100'}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <FiFileText size={16} color={isDark ? 'var(--chakra-colors-purple-200)' : 'var(--chakra-colors-purple-600)'} />
                          </Box>

                          <Box flex={1} minW={0}>
                            <HStack gap={2} flexWrap="wrap">
                              <Text fontWeight="600" fontSize="13px" color={colors.textColor} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                {op.operationId}
                              </Text>
                              <Badge size="sm" colorPalette="purple" variant="subtle">
                                {op.productType}
                              </Badge>
                              {op.stage && (
                                <Badge size="sm" colorPalette="blue" variant="subtle">
                                  {op.stage}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="11px" color={colors.textColorSecondary} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                              {[op.reference, op.applicantName, op.beneficiaryName].filter(Boolean).join(' · ')}
                            </Text>
                            {op.amount && (
                              <Text fontSize="11px" fontWeight="600" color={isDark ? 'green.300' : 'green.600'}>
                                {op.currency} {op.amount.toLocaleString()}
                              </Text>
                            )}
                          </Box>

                          <Box color={isDark ? 'purple.300' : 'purple.500'} flexShrink={0}>
                            <FiChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                          </Box>
                        </HStack>
                      ))
                    )}
                  </Box>
                )}

                {/* Estado inicial */}
                {!isSearchingReference && !hasSearchedReference && (
                  <VStack py={8} color={colors.textColorSecondary} gap={2}>
                    <FiLink size={32} opacity={0.4} />
                    <Text fontSize="sm" textAlign="center">
                      {t('common:assistant.referenceHint', 'Busca una operación para copiar sus campos')}
                    </Text>
                    <Text fontSize="xs" opacity={0.7} textAlign="center">
                      {t('common:assistant.referenceHintDetail', 'Los campos SWIFT se extraerán automáticamente')}
                    </Text>
                  </VStack>
                )}
              </Box>
            )}

            {/* Panel de sugerencias */}
            {activeTab === 'search' && !activeField && (
              <Box maxH="240px" overflowY="auto" borderBottom="1px solid" borderColor={colors.borderColor}>
                {filteredFields.length === 0 ? (
                  <VStack py={8} color={colors.textColorSecondary}>
                    <FiSearch size={32} opacity={0.4} />
                    <Text fontSize="sm">{t('common:assistant.noResults', 'No se encontraron campos')}</Text>
                  </VStack>
                ) : (
                  filteredFields.map((field, index) => {
                    const Icon = fieldTypeIcons[field.fieldType] || FiFileText;
                    const colorScheme = fieldTypeColors[field.fieldType] || 'gray';
                    const fieldName = t(field.fieldNameKey, field.fieldName || field.fieldCode);
                    const description = t(field.descriptionKey || '', field.description || '');
                    const hasValue = formData[field.fieldCode] !== undefined &&
                                     formData[field.fieldCode] !== null &&
                                     formData[field.fieldCode] !== '';

                    return (
                      <HStack
                        key={field.fieldCode}
                        px={4}
                        py={3}
                        cursor="pointer"
                        bg={index === selectedIndex
                          ? (isDark ? `${colorScheme}.900` : `${colorScheme}.50`)
                          : 'transparent'
                        }
                        borderLeft={index === selectedIndex ? '3px solid' : '3px solid transparent'}
                        borderLeftColor={index === selectedIndex ? `${colorScheme}.500` : 'transparent'}
                        _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}
                        onClick={(e) => {
                          // Solo abrir editor si el click fue en la fila, no en un botón
                          if (!(e.target as HTMLElement).closest('button')) {
                            setActiveField(field);
                          }
                        }}
                        transition="all 0.15s"
                      >
                        <Box
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          bg={isDark ? `${colorScheme}.800` : `${colorScheme}.100`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Icon size={16} color={isDark ? `var(--chakra-colors-${colorScheme}-200)` : `var(--chakra-colors-${colorScheme}-600)`} />
                        </Box>

                        <Box flex={1} minW={0}>
                          <HStack gap={2} flexWrap="wrap">
                            <Text fontWeight="600" fontSize="13px" color={colors.textColor}>
                              {fieldName}
                            </Text>
                            <Badge size="sm" colorPalette="purple" variant="subtle">
                              {field.fieldCode}
                            </Badge>
                            {hasValue && (
                              <Badge size="sm" colorPalette="green" variant="solid">
                                <FiCheck size={10} />
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="11px" color={colors.textColorSecondary}>
                            {description}{field.isRequired ? ` - ${t('common:required', 'Obligatorio')}` : ''}
                          </Text>
                        </Box>

                        <HStack gap={1} flexShrink={0}>
                          <button
                            type="button"
                            aria-label={t('common:assistant.goToField', 'Ir al campo')}
                            title={t('common:assistant.goToField', 'Ir al campo')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: 'var(--chakra-colors-blue-500)',
                              color: 'white',
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigateToField(field.fieldCode, field.section);
                            }}
                          >
                            <FiCrosshair size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={t('common:assistant.editInline', 'Editar')}
                            title={t('common:assistant.editInline', 'Editar aquí')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: isDark ? 'rgba(128, 90, 213, 0.2)' : 'rgba(128, 90, 213, 0.1)',
                              color: isDark ? 'var(--chakra-colors-purple-200)' : 'var(--chakra-colors-purple-600)',
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setActiveField(field);
                            }}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <Badge
                            size="sm"
                            variant="solid"
                            colorPalette={getSectionColor(field.section)}
                          >
                            {t(`common:${getSectionTranslationKey(field.section, field.messageType)}`, field.section)}
                          </Badge>
                        </HStack>
                      </HStack>
                    );
                  })
                )}
              </Box>
            )}

            {/* Panel de entrada activa */}
            {activeTab === 'search' && activeField && (
              <Box p={4} bg={isDark ? 'gray.750' : 'gray.50'}>
                <Box
                  bg={isDark ? 'gray.800' : 'white'}
                  borderRadius="xl"
                  p={4}
                  boxShadow="sm"
                  border="1px solid"
                  borderColor={colors.borderColor}
                >
                  {/* Header del campo activo */}
                  <HStack justify="space-between" mb={3}>
                    <HStack gap={2}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={isDark
                          ? `${fieldTypeColors[activeField.fieldType]}.800`
                          : `${fieldTypeColors[activeField.fieldType]}.100`
                        }
                      >
                        <FieldIcon size={16} />
                      </Box>
                      <Box>
                        <Text fontWeight="600" fontSize="14px" color={colors.textColor}>
                          {t(activeField.fieldNameKey, activeField.fieldName || activeField.fieldCode)}
                        </Text>
                        <Badge size="sm" colorPalette="purple">:{activeField.fieldCode}:</Badge>
                      </Box>
                    </HStack>
                    <IconButton
                      aria-label="Close"
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveField(null)}
                    >
                      <FiX />
                    </IconButton>
                  </HStack>

                  {/* Campo dinámico */}
                  <Box mb={3}>
                    <DynamicSwiftField
                      config={activeField}
                      value={formData[activeField.fieldCode]}
                      onChange={(value) => onFieldChange(activeField.fieldCode, value)}
                      readOnly={readOnly}
                      variant="clean"
                    />
                  </Box>

                  {/* Acciones */}
                  <HStack gap={2}>
                      <Box
                        as="button"
                        flex={1}
                        py={2}
                        px={4}
                        borderRadius="lg"
                        bg={isDark ? 'gray.700' : 'gray.100'}
                        color={colors.textColor}
                        fontSize="13px"
                        fontWeight="600"
                        cursor="pointer"
                        _hover={{ bg: isDark ? 'gray.600' : 'gray.200' }}
                        onClick={handleSkip}
                      >
                        {t('common:assistant.skip', 'Omitir')}
                      </Box>
                      <Box
                        as="button"
                        flex={2}
                        py={2}
                        px={4}
                        borderRadius="lg"
                        bg="purple.600"
                        color="white"
                        fontSize="13px"
                        fontWeight="600"
                        cursor="pointer"
                        _hover={{ bg: 'purple.700' }}
                        onClick={handleSaveAndNext}
                      >
                        {t('common:assistant.saveAndNext', 'Guardar y Siguiente')} →
                      </Box>
                    </HStack>
                </Box>
              </Box>
            )}

            {/* Historial */}
            {sessionEnteredFields.length > 0 && (
              <Box borderTop="1px solid" borderColor={colors.borderColor}>
                <HStack
                  px={4}
                  py={2}
                  cursor="pointer"
                  bg={isDark ? 'gray.750' : 'gray.50'}
                  onClick={() => setShowHistory(!showHistory)}
                  justify="space-between"
                >
                  <HStack gap={2} fontSize="13px" color={colors.textColorSecondary}>
                    <FiClock size={14} />
                    <Text>{t('common:assistant.enteredFields', 'Campos ingresados')}</Text>
                    <Badge colorPalette="purple" size="sm">{sessionEnteredFields.length}</Badge>
                  </HStack>
                  <IconButton aria-label="Toggle" size="xs" variant="ghost">
                    {showHistory ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </IconButton>
                </HStack>

                <Collapsible.Root open={showHistory}>
                  <Collapsible.Content>
                    <Box maxH="150px" overflowY="auto">
                      {sessionEnteredFields.slice(0, 10).map(field => {
                        const value = formData[field.fieldCode];
                        const displayValue = typeof value === 'object'
                          ? JSON.stringify(value).slice(0, 40)
                          : String(value).slice(0, 40);

                        return (
                          <HStack
                            key={field.fieldCode}
                            px={4}
                            py={2}
                            fontSize="12px"
                            borderBottom="1px solid"
                            borderColor={colors.borderColor}
                            _last={{ borderBottom: 'none' }}
                          >
                            <Badge size="sm" colorPalette="purple" minW="50px">
                              :{field.fieldCode}:
                            </Badge>
                            <Text flex={1} color={colors.textColorSecondary} noOfLines={1}>
                              {displayValue}
                            </Text>
                            <Box
                              as="button"
                              color="purple.500"
                              fontSize="11px"
                              cursor="pointer"
                              _hover={{ textDecoration: 'underline' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveField(field);
                                setShowHistory(false);
                              }}
                            >
                              <FiEdit2 size={12} />
                            </Box>
                          </HStack>
                        );
                      })}
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            )}

            {/* Footer con stats */}
            <HStack
              px={4}
              py={3}
              bg={isDark ? 'purple.900' : 'purple.100'}
              borderTop="2px solid"
              borderColor={isDark ? 'purple.700' : 'purple.300'}
              justify="space-between"
              fontSize="12px"
            >
              <HStack gap={4} color={colors.textColorSecondary}>
                <HStack gap={1}>
                  <FiCheck size={14} color="var(--chakra-colors-green-500)" />
                  <Text>
                    <Text as="span" fontWeight="600" color="green.500">{stats.requiredFilled}</Text>
                    /{stats.requiredTotal} obligatorios
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <FiFileText size={14} />
                  <Text>
                    <Text as="span" fontWeight="600" color={colors.textColor}>{stats.totalFilled}</Text>
                    /{stats.totalFields} total
                  </Text>
                </HStack>
              </HStack>

              <Box
                as="button"
                px={3}
                py={1}
                borderRadius="lg"
                bg="green.500"
                color="white"
                fontSize="12px"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: 'green.600' }}
                onClick={() => setIsExpanded(false)}
              >
                {t('common:assistant.viewForm', 'Ver Formulario')}
              </Box>
            </HStack>
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export default QuickFieldAssistant;
