/**
 * JourneyMapIllustrated - Professional fintech-style journey map
 *
 * Visual design:
 * - Professional minimalist SVG vector icons (no emojis, no stick figures)
 * - Glowing progress line connecting stages horizontally
 * - Critical milestones (ISSUANCE, PAYMENT, CLOSURE) with cyan/blue glow rings
 * - Circuit board pattern background with tech data labels
 * - Secondary/technical stages (OTHER, SYSTEM) separated below main flow
 * - Alert indicators on stages with discrepancies
 * - Full dark mode / light mode support
 * - Tap-to-expand: reveals events for each stage
 *
 * Brand alignment: Uses accent color (#2DD4BF teal) for dark mode glow,
 * primary color (#0073E6 blue) for light mode glow.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
} from '@chakra-ui/react';
import {
  FiCode,
  FiChevronRight,
  FiChevronUp,
  FiChevronLeft,
} from 'react-icons/fi';
import { LuWand } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { getIcon } from '../../utils/iconMap';
import type { JourneyNode, StageGroup } from '../../hooks/useProductJourney';

export type CreationMode = 'wizard' | 'expert';
export type JourneyVariant = 'pro' | 'blueprint';

interface JourneyMapIllustratedProps {
  stages: StageGroup[];
  categoryColor: string;
  productCategory?: string;
  productDescription?: string;
  productLabel?: string;
  onEventClick: (node: JourneyNode) => void;
  onCreationClick?: (node: JourneyNode, mode: CreationMode) => void;
  selectedEventId?: number | null;
  variant?: JourneyVariant;
  /** When true, skip outer container (bg, border, shadow) - parent provides it */
  embedded?: boolean;
}

// ─── Theme config per variant ───
export interface JourneyTheme {
  containerBg: string;
  accent: string;
  iconColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  circleBg: string;
  circleBorder: string;
  lineBase: string;
  panelBg: string;
  panelBorder: string;
  scrollFadeBg: string;
  chipBg: string;
  chipBorder: string;
  circuitLine: string;
  circuitDot: string;
  circuitText: string;
  glowSpot: string;
  showCharacters: boolean;
}

export function getJourneyTheme(variant: JourneyVariant, darkMode: boolean): JourneyTheme {
  if (variant === 'blueprint') {
    return darkMode ? {
      containerBg: 'linear-gradient(145deg, #0B2135 0%, #0E2A42 40%, #0C2438 100%)',
      accent: '#2DD4BF',
      iconColor: '#5EEAD4',
      textPrimary: '#CCFBF1',
      textSecondary: '#5EEAD4',
      textMuted: '#2DD4BF80',
      circleBg: 'rgba(45,212,191,0.06)',
      circleBorder: 'rgba(45,212,191,0.20)',
      lineBase: 'rgba(45,212,191,0.08)',
      panelBg: 'rgba(11,33,53,0.94)',
      panelBorder: 'rgba(45,212,191,0.20)',
      scrollFadeBg: '#0B2135',
      chipBg: 'rgba(45,212,191,0.08)',
      chipBorder: 'rgba(45,212,191,0.15)',
      circuitLine: 'rgba(45,212,191,0.06)',
      circuitDot: 'rgba(45,212,191,0.10)',
      circuitText: 'rgba(45,212,191,0.05)',
      glowSpot: 'rgba(45,212,191,0.06)',
      showCharacters: true,
    } : {
      containerBg: 'linear-gradient(145deg, #B8E5F0 0%, #C5EBF5 30%, #D0EFF8 60%, #C2E8F3 100%)',
      accent: '#0D9488',
      iconColor: '#0F766E',
      textPrimary: '#134E4A',
      textSecondary: '#0D9488',
      textMuted: '#5EEAD4',
      circleBg: 'rgba(255,255,255,0.85)',
      circleBorder: 'rgba(13,148,136,0.25)',
      lineBase: 'rgba(13,148,136,0.10)',
      panelBg: 'rgba(255,255,255,0.93)',
      panelBorder: 'rgba(13,148,136,0.20)',
      scrollFadeBg: '#C2E8F3',
      chipBg: 'rgba(13,148,136,0.08)',
      chipBorder: 'rgba(13,148,136,0.15)',
      circuitLine: 'rgba(13,148,136,0.08)',
      circuitDot: 'rgba(13,148,136,0.12)',
      circuitText: 'rgba(13,148,136,0.06)',
      glowSpot: 'rgba(13,148,136,0.06)',
      showCharacters: true,
    };
  }

  // Pro variant
  return darkMode ? {
    containerBg: 'linear-gradient(145deg, #0A1628 0%, #0F1D32 40%, #0D1B2E 100%)',
    accent: '#2DD4BF',
    iconColor: '#E2E8F0',
    textPrimary: '#E2E8F0',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    circleBg: 'rgba(255,255,255,0.04)',
    circleBorder: 'rgba(255,255,255,0.12)',
    lineBase: 'rgba(255,255,255,0.06)',
    panelBg: 'rgba(15,29,50,0.92)',
    panelBorder: 'rgba(255,255,255,0.08)',
    scrollFadeBg: '#0A1628',
    chipBg: 'rgba(255,255,255,0.06)',
    chipBorder: 'rgba(255,255,255,0.08)',
    circuitLine: 'rgba(255,255,255,0.04)',
    circuitDot: 'rgba(255,255,255,0.06)',
    circuitText: 'rgba(255,255,255,0.035)',
    glowSpot: 'rgba(45,212,191,0.06)',
    showCharacters: false,
  } : {
    containerBg: 'linear-gradient(145deg, #F0F4F8 0%, #F8FAFC 40%, #EFF3F7 100%)',
    accent: '#0073E6',
    iconColor: '#334155',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    circleBg: 'rgba(255,255,255,0.9)',
    circleBorder: 'rgba(0,0,0,0.10)',
    lineBase: 'rgba(0,0,0,0.06)',
    panelBg: 'rgba(255,255,255,0.95)',
    panelBorder: 'rgba(0,0,0,0.08)',
    scrollFadeBg: '#F0F4F8',
    chipBg: 'rgba(0,0,0,0.04)',
    chipBorder: 'rgba(0,0,0,0.06)',
    circuitLine: 'rgba(0,0,0,0.04)',
    circuitDot: 'rgba(0,0,0,0.05)',
    circuitText: 'rgba(0,0,0,0.03)',
    glowSpot: 'rgba(0,115,230,0.04)',
    showCharacters: false,
  };
}

// ─── Stage configuration ───

const STAGE_COLORS: Record<string, string> = {
  ISSUANCE: '#2DD4BF',
  ADVICE: '#94A3B8',
  AMENDMENT: '#F59E0B',
  DOCUMENTS: '#2DD4BF',
  PAYMENT: '#06B6D4',
  CLAIM: '#EF4444',
  CLOSURE: '#94A3B8',
  OTHER: '#64748B',
  SYSTEM: '#64748B',
};

// Critical milestones get the glow effect
const CRITICAL_STAGES = new Set(['ISSUANCE', 'DOCUMENTS', 'PAYMENT', 'CLOSURE']);

// Technical/secondary stages shown below main flow
const SECONDARY_STAGES = new Set(['OTHER', 'SYSTEM']);

// Actionable micro-copy per stage
const STAGE_MICROCOPY: Record<string, Record<string, string>> = {
  es: {
    ISSUANCE: 'Apertura del instrumento',
    ADVICE: 'Notificamos al beneficiario',
    AMENDMENT: 'Modificaciones pendientes',
    DOCUMENTS: 'Embarque y documentos',
    PAYMENT: 'Liquidación al beneficiario',
    CLAIM: 'Gestión de discrepancias',
    CLOSURE: 'Operación completada',
    OTHER: 'Otros logs',
    SYSTEM: 'Proceso batch',
  },
  en: {
    ISSUANCE: 'Instrument opening',
    ADVICE: 'Beneficiary notification',
    AMENDMENT: 'Pending modifications',
    DOCUMENTS: 'Shipping & documents',
    PAYMENT: 'Beneficiary settlement',
    CLAIM: 'Discrepancy management',
    CLOSURE: 'Operation completed',
    OTHER: 'Other logs',
    SYSTEM: 'Batch process',
  },
};

// Stage subtitle / role
const STAGE_SUBTITLES: Record<string, Record<string, string>> = {
  es: {
    ISSUANCE: '(IMPORTADOR)',
    ADVICE: '',
    AMENDMENT: '',
    DOCUMENTS: '',
    PAYMENT: '(BANCO IMPORTADOR)',
    CLAIM: '',
    CLOSURE: '',
  },
  en: {
    ISSUANCE: '(IMPORTER)',
    ADVICE: '',
    AMENDMENT: '',
    DOCUMENTS: '',
    PAYMENT: '(IMPORTER BANK)',
    CLAIM: '',
    CLOSURE: '',
  },
};

// ─── Professional SVG Icons ───

const StageIconSVG: React.FC<{ category: string; color: string; size?: number }> = ({ category, color, size = 24 }) => {
  const icons: Record<string, React.ReactNode> = {
    // Bank / Temple columns
    ISSUANCE: (
      <>
        <line x1="6" y1="20" x2="18" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="8" x2="18" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4 L5 8 L19 8 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="8" y1="8" x2="8" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="12" y1="8" x2="12" y2="20" stroke={color} strokeWidth="1.5" />
        <line x1="16" y1="8" x2="16" y2="20" stroke={color} strokeWidth="1.5" />
      </>
    ),
    // Envelope
    ADVICE: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke={color} strokeWidth="1.5" />
        <polyline points="4,6 12,13 20,6" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
    // Pencil / Edit
    AMENDMENT: (
      <>
        <path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="14" y1="5" x2="19" y2="10" stroke={color} strokeWidth="1.5" />
      </>
    ),
    // Ship / Cargo
    DOCUMENTS: (
      <>
        <path d="M3 18 L6 18 L8 14 L16 14 L18 18 L21 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M21 18 C21 20 18 22 12 22 C6 22 3 20 3 18" fill="none" stroke={color} strokeWidth="1.5" />
        <rect x="9" y="8" width="6" height="6" fill="none" stroke={color} strokeWidth="1.3" />
        <line x1="12" y1="4" x2="12" y2="8" stroke={color} strokeWidth="1.5" />
        <line x1="10" y1="5" x2="12" y2="4" stroke={color} strokeWidth="1.2" />
        <line x1="14" y1="5" x2="12" y2="4" stroke={color} strokeWidth="1.2" />
      </>
    ),
    // Dollar search / Magnifying glass with $
    PAYMENT: (
      <>
        <circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="1.5" />
        <line x1="15" y1="15" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <text x="10" y="13" textAnchor="middle" fontSize="8" fill={color} fontWeight="bold">$</text>
      </>
    ),
    // Alert triangle
    CLAIM: (
      <>
        <path d="M12 3 L22 20 L2 20 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="17" r="0.8" fill={color} />
      </>
    ),
    // Checkmark circle
    CLOSURE: (
      <>
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.5" />
        <polyline points="8,12 11,15 17,9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // Gear
    OTHER: (
      <>
        <circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M12 1 L12 4 M12 20 L12 23 M1 12 L4 12 M20 12 L23 12 M4.2 4.2 L6.3 6.3 M17.7 17.7 L19.8 19.8 M19.8 4.2 L17.7 6.3 M6.3 17.7 L4.2 19.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    // Server / Database
    SYSTEM: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" fill="none" stroke={color} strokeWidth="1.3" />
        <path d="M4 5 L4 12 C4 13.7 7.6 15 12 15 C16.4 15 20 13.7 20 12 L20 5" fill="none" stroke={color} strokeWidth="1.3" />
        <path d="M4 12 L4 19 C4 20.7 7.6 22 12 22 C16.4 22 20 20.7 20 19 L20 12" fill="none" stroke={color} strokeWidth="1.3" />
        <line x1="8" y1="9" x2="10" y2="9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="16" x2="10" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      {icons[category] || icons.OTHER}
    </svg>
  );
};

// ─── Circuit Board Background ───

export const CircuitBoardBg: React.FC<{ theme: JourneyTheme }> = ({ theme }) => (
  <Box position="absolute" inset={0} pointerEvents="none" overflow="hidden">
    <Box
      position="absolute" inset={0}
      bg={`radial-gradient(ellipse at 20% 50%, ${theme.glowSpot} 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, ${theme.glowSpot} 0%, transparent 50%)`}
    />

    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity: 1 }}
      preserveAspectRatio="none"
    >
      <line x1="0" y1="25%" x2="100%" y2="25%" stroke={theme.circuitLine} strokeWidth="0.5" />
      <line x1="0" y1="50%" x2="100%" y2="50%" stroke={theme.circuitLine} strokeWidth="0.5" />
      <line x1="0" y1="75%" x2="100%" y2="75%" stroke={theme.circuitLine} strokeWidth="0.5" />
      <line x1="20%" y1="0" x2="20%" y2="100%" stroke={theme.circuitLine} strokeWidth="0.5" />
      <line x1="50%" y1="0" x2="50%" y2="100%" stroke={theme.circuitLine} strokeWidth="0.5" />
      <line x1="80%" y1="0" x2="80%" y2="100%" stroke={theme.circuitLine} strokeWidth="0.5" />
      <line x1="65%" y1="15%" x2="85%" y2="35%" stroke={theme.circuitLine} strokeWidth="0.5" strokeDasharray="4 6" />
      <line x1="10%" y1="60%" x2="30%" y2="80%" stroke={theme.circuitLine} strokeWidth="0.5" strokeDasharray="4 6" />
      <circle cx="20%" cy="25%" r="2" fill={theme.circuitDot} />
      <circle cx="50%" cy="50%" r="2" fill={theme.circuitDot} />
      <circle cx="80%" cy="25%" r="2" fill={theme.circuitDot} />
      <circle cx="20%" cy="75%" r="2" fill={theme.circuitDot} />
      <circle cx="80%" cy="75%" r="1.5" fill={theme.circuitDot} />
      <rect x="45%" y="20%" width="10" height="6" rx="1" fill="none" stroke={theme.circuitLine} strokeWidth="0.5" />
      <rect x="70%" y="65%" width="8" height="5" rx="1" fill="none" stroke={theme.circuitLine} strokeWidth="0.5" />
    </svg>

    {[
      { x: '8%', y: '15%', text: 'D.EFCMS 16' },
      { x: '72%', y: '12%', text: 'D.EREMS 15' },
      { x: '55%', y: '85%', text: 'D.ETCMS 160' },
      { x: '85%', y: '70%', text: 'D.ETEM AN0' },
      { x: '15%', y: '88%', text: 'D.EFCMS 16' },
    ].map((label, i) => (
      <Text
        key={i}
        position="absolute"
        left={label.x} top={label.y}
        fontSize="6px"
        fontFamily="monospace"
        color={theme.circuitText}
        letterSpacing="0.05em"
        transform="rotate(-5deg)"
        userSelect="none"
      >
        {label.text}
      </Text>
    ))}

    <Box
      position="absolute" top="-20%" left="-10%"
      w="40%" h="60%" borderRadius="full"
      bg={theme.glowSpot}
      filter="blur(40px)"
    />
    <Box
      position="absolute" bottom="-15%" right="-5%"
      w="30%" h="50%" borderRadius="full"
      bg={theme.glowSpot}
      filter="blur(30px)"
    />
  </Box>
);

// ─── Main Stage Node ───

// Blueprint mode: small character emojis next to certain stages
const STAGE_CHARACTERS: Record<string, string> = {
  ISSUANCE: '🏦',
  ADVICE: '📨',
  AMENDMENT: '✍️',
  DOCUMENTS: '🚢',
  PAYMENT: '💰',
  CLAIM: '⚠️',
  CLOSURE: '✅',
};

const MainStageNode: React.FC<{
  stage: StageGroup;
  stepNumber: number;
  isCritical: boolean;
  isExpanded: boolean;
  theme: JourneyTheme;
  lang: string;
  onClick: () => void;
  animDelay: number;
}> = ({ stage, stepNumber, isCritical, isExpanded, theme, lang, onClick, animDelay }) => {
  const l = lang.startsWith('es') ? 'es' : 'en';
  const microcopy = STAGE_MICROCOPY[l]?.[stage.category] || '';
  const subtitle = STAGE_SUBTITLES[l]?.[stage.category] || '';
  const circleSize = isCritical ? '68px' : '54px';
  const iconSize = isCritical ? 26 : 20;

  return (
    <VStack
      gap={1.5}
      align="center"
      cursor="pointer"
      onClick={onClick}
      transition="transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
      _active={{ transform: 'scale(0.92)' }}
      className={`journey-circle-pop journey-stagger-${Math.min(animDelay, 7)}`}
      flexShrink={0}
      minW={isCritical ? '80px' : '68px'}
    >
      {/* Circle container */}
      <Box position="relative">
        {/* Glow ring for critical milestones */}
        {isCritical && (
          <Box
            position="absolute"
            inset="-6px"
            borderRadius="full"
            border="2px solid"
            borderColor={isExpanded ? theme.accent : `${theme.accent}60`}
            boxShadow={`0 0 20px ${theme.accent}40, inset 0 0 12px ${theme.accent}15`}
            transition="all 0.4s"
            className={isExpanded ? 'journey-pulse' : ''}
          />
        )}

        {/* Blueprint character decoration */}
        {theme.showCharacters && STAGE_CHARACTERS[stage.category] && (
          <Text
            position="absolute"
            top="-10px"
            right="-8px"
            fontSize="14px"
            zIndex={2}
            className="journey-float"
            lineHeight="1"
            userSelect="none"
          >
            {STAGE_CHARACTERS[stage.category]}
          </Text>
        )}

        {/* Main circle */}
        <Flex
          w={circleSize}
          h={circleSize}
          borderRadius="full"
          bg={theme.circleBg}
          align="center"
          justify="center"
          border="2px solid"
          borderColor={isExpanded ? theme.accent : theme.circleBorder}
          boxShadow={
            isExpanded
              ? `0 0 24px ${theme.accent}30, 0 4px 16px rgba(0,0,0,0.1)`
              : isCritical
                ? `0 0 12px ${theme.accent}15, 0 2px 8px rgba(0,0,0,0.08)`
                : '0 2px 8px rgba(0,0,0,0.06)'
          }
          transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          position="relative"
          overflow="hidden"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {isCritical && (
            <Box
              position="absolute" inset={0} borderRadius="full"
              bg={`radial-gradient(circle at 40% 35%, ${theme.accent}08, transparent 70%)`}
            />
          )}
          <StageIconSVG category={stage.category} color={theme.iconColor} size={iconSize} />
        </Flex>
      </Box>

      {/* Label */}
      <VStack gap={0} align="center">
        <Text
          fontSize="9px"
          fontWeight="800"
          color={isExpanded ? theme.accent : theme.textPrimary}
          textAlign="center"
          letterSpacing="0.06em"
          textTransform="uppercase"
          lineClamp={1}
          maxW="85px"
          transition="color 0.2s"
        >
          {stage.label}
        </Text>
        {subtitle && (
          <Text
            fontSize="7px"
            fontWeight="600"
            color={theme.textMuted}
            textAlign="center"
            letterSpacing="0.04em"
            textTransform="uppercase"
            mt="-1px"
          >
            {subtitle}
          </Text>
        )}
      </VStack>

      {/* Micro-copy */}
      {microcopy && (
        <Text
          fontSize="7px"
          color={theme.textSecondary}
          textAlign="center"
          maxW="90px"
          lineClamp={1}
          lineHeight="1.3"
          mt="-2px"
        >
          {microcopy}
        </Text>
      )}

      {/* Event count bubble */}
      <Box
        px={2}
        py={0.5}
        borderRadius="full"
        bg={theme.chipBg}
        border="1px solid"
        borderColor={theme.chipBorder}
      >
        <Text
          fontSize="7px"
          fontWeight="700"
          color={theme.textSecondary}
          textAlign="center"
        >
          {stage.events.length} {stage.events.length === 1 ? 'evento' : 'eventos'}
        </Text>
      </Box>
    </VStack>
  );
};

// ─── Secondary Stage Node (smaller, for OTHER/SYSTEM) ───

const SecondaryStageNode: React.FC<{
  stage: StageGroup;
  isExpanded: boolean;
  theme: JourneyTheme;
  lang: string;
  onClick: () => void;
}> = ({ stage, isExpanded, theme, lang, onClick }) => {
  const l = lang.startsWith('es') ? 'es' : 'en';
  const microcopy = STAGE_MICROCOPY[l]?.[stage.category] || '';

  return (
    <HStack
      gap={2.5}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _active={{ transform: 'scale(0.95)' }}
      className="animate-fade-in-up"
    >
      <Box
        w="6px" h="6px" borderRadius="full"
        bg={theme.circleBorder}
        flexShrink={0}
      />

      <Flex
        w="44px" h="44px" borderRadius="full"
        bg={theme.circleBg}
        align="center" justify="center"
        border="1.5px solid"
        borderColor={isExpanded ? theme.textMuted : theme.circleBorder}
        flexShrink={0}
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      >
        <StageIconSVG category={stage.category} color={theme.textSecondary} size={18} />
      </Flex>

      <VStack gap={0} align="start">
        <Text
          fontSize="10px"
          fontWeight="700"
          color={theme.textPrimary}
          letterSpacing="0.04em"
          textTransform="uppercase"
        >
          {stage.label}
        </Text>
        {microcopy && (
          <Text fontSize="8px" color={theme.textMuted}>
            {microcopy}
          </Text>
        )}
        <Text fontSize="8px" color={theme.textMuted} mt="1px">
          {stage.events.length} {stage.events.length === 1 ? 'evento' : 'eventos'}
        </Text>
      </VStack>
    </HStack>
  );
};

// ─── Main Component ───

export const JourneyMapIllustrated: React.FC<JourneyMapIllustratedProps> = ({
  stages,
  categoryColor,
  productCategory,
  productDescription,
  productLabel,
  onEventClick,
  onCreationClick,
  variant = 'pro',
  embedded = false,
}) => {
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const lang = document.documentElement.lang || 'es';

  // Compute theme from variant + darkMode
  const theme = getJourneyTheme(variant, darkMode);
  const accentColor = theme.accent;

  // Separate main stages from secondary/technical stages
  const mainStages = stages.filter(s => !SECONDARY_STAGES.has(s.category));
  const secondaryStages = stages.filter(s => SECONDARY_STAGES.has(s.category));

  // Scroll navigation
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, stages]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }, []);

  const scrollBy = useCallback((amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  if (stages.length === 0) return null;

  const Wrapper = embedded
    ? ({ children }: { children: React.ReactNode }) => <Box position="relative">{children}</Box>
    : ({ children }: { children: React.ReactNode }) => (
        <Box
          borderRadius="20px"
          background={theme.containerBg}
          position="relative"
          overflow="hidden"
          mb={3}
          border="1.5px solid"
          borderColor={theme.circleBorder}
          boxShadow={darkMode
            ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
            : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
          }
        >
          <CircuitBoardBg theme={theme} />
          {children}
        </Box>
      );

  return (
    <Wrapper>
      {/* === Title banner === */}
      <Box position="relative" px={4} pt={embedded ? 2 : 4} pb={2}>
        <HStack gap={3}>
          <Flex
            w="38px" h="38px" borderRadius="10px"
            bg={theme.circleBg}
            align="center" justify="center"
            border="1.5px solid"
            borderColor={theme.circleBorder}
            boxShadow={`0 0 12px ${theme.accent}10`}
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M12 2 L4 6 L4 12 C4 17 8 21 12 22 C16 21 20 17 20 12 L20 6 Z"
                fill="none"
                stroke={theme.accent}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <text x="12" y="15" textAnchor="middle" fontSize="7" fill={theme.accent} fontWeight="bold" fontFamily="system-ui">Y</text>
            </svg>
          </Flex>

          <VStack gap={0} align="start" flex={1} minW={0}>
            <Text
              fontSize="11px"
              fontWeight="900"
              color={theme.textPrimary}
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Journey: {productLabel || 'LC Importación'}
            </Text>
            {productDescription && (
              <Text
                fontSize="9px"
                color={theme.textMuted}
                lineClamp={1}
                lineHeight="1.3"
              >
                {productDescription}
              </Text>
            )}
          </VStack>
        </HStack>
      </Box>

      {/* === Main stages - horizontal flow with glowing progress line === */}
      <Box position="relative">
        {canScrollLeft && (
          <Flex
            position="absolute" left={0} top={0} bottom={0} w="32px"
            align="center" justify="center" zIndex={3}
            cursor="pointer" onClick={() => scrollBy(-160)}
            background={`linear-gradient(90deg, ${theme.scrollFadeBg} 30%, transparent)`}
          >
            <Flex
              w="24px" h="24px" borderRadius="full"
              bg={theme.chipBg}
              align="center" justify="center"
            >
              <Icon as={FiChevronLeft} boxSize={3.5} color={theme.textSecondary} />
            </Flex>
          </Flex>
        )}

        {canScrollRight && (
          <Flex
            position="absolute" right={0} top={0} bottom={0} w="32px"
            align="center" justify="center" zIndex={3}
            cursor="pointer" onClick={() => scrollBy(160)}
            background={`linear-gradient(270deg, ${theme.scrollFadeBg} 30%, transparent)`}
          >
            <Flex
              w="24px" h="24px" borderRadius="full"
              bg={theme.chipBg}
              align="center" justify="center"
            >
              <Icon as={FiChevronRight} boxSize={3.5} color={theme.textSecondary} />
            </Flex>
          </Flex>
        )}

        <Box
          ref={scrollRef}
          overflowX="auto"
          className="hide-scrollbar"
          px={4}
          pt={4}
          pb={3}
          onWheel={handleWheel}
        >
          <Box position="relative" minW="max-content">
            {mainStages.length > 1 && (
              <Box
                position="absolute"
                top="34px"
                left="34px"
                right="34px"
                h="3px"
                borderRadius="full"
                zIndex={0}
              >
                <Box
                  position="absolute" inset={0}
                  borderRadius="full"
                  bg={theme.lineBase}
                />
                <Box
                  position="absolute" inset={0}
                  borderRadius="full"
                  bg={`linear-gradient(90deg, ${theme.accent}, ${theme.accent}80, ${theme.lineBase})`}
                  boxShadow={`0 0 10px ${theme.accent}30, 0 0 20px ${theme.accent}15`}
                />
              </Box>
            )}

            <HStack gap={5} align="start" position="relative" zIndex={1}>
              {mainStages.map((stage, index) => {
                const isCritical = CRITICAL_STAGES.has(stage.category);
                return (
                  <MainStageNode
                    key={stage.category}
                    stage={stage}
                    stepNumber={index + 1}
                    isCritical={isCritical}
                    isExpanded={expandedStage === stage.category}
                    theme={theme}
                    lang={lang}
                    onClick={() => setExpandedStage(
                      expandedStage === stage.category ? null : stage.category
                    )}
                    animDelay={index + 1}
                  />
                );
              })}
            </HStack>
          </Box>
        </Box>
      </Box>

      {secondaryStages.length > 0 && (
        <Box px={4} pb={3} position="relative">
          <Box
            position="absolute"
            top={0}
            left="40px"
            w="1px"
            h="16px"
            bg={theme.lineBase}
          />
          <Box
            position="absolute"
            top="16px"
            left="40px"
            w="20px"
            h="1px"
            bg={theme.lineBase}
          />

          <HStack gap={6} pt={4} px={2} flexWrap="wrap">
            {secondaryStages.map((stage) => (
              <SecondaryStageNode
                key={stage.category}
                stage={stage}
                isExpanded={expandedStage === stage.category}
                theme={theme}
                lang={lang}
                onClick={() => setExpandedStage(
                  expandedStage === stage.category ? null : stage.category
                )}
              />
            ))}
          </HStack>
        </Box>
      )}

      {expandedStage && (() => {
        const stage = stages.find(s => s.category === expandedStage);
        if (!stage) return null;
        const stageColor = STAGE_COLORS[stage.category] || accentColor;

        return (
          <Box px={3} pb={4} className="animate-fade-in-up">
            <Box
              bg={theme.panelBg}
              borderRadius="16px"
              border="1.5px solid"
              borderColor={theme.panelBorder}
              overflow="hidden"
              style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
              boxShadow={`0 8px 32px ${stageColor}10, 0 2px 8px rgba(0,0,0,0.08)`}
            >
              <HStack
                px={3.5} py={3}
                borderBottom="1px solid"
                borderColor={theme.chipBorder}
              >
                <Flex
                  w="32px" h="32px" borderRadius="10px"
                  bg={theme.chipBg}
                  align="center" justify="center"
                  border="1px solid"
                  borderColor={theme.chipBorder}
                >
                  <StageIconSVG category={stage.category} color={stageColor} size={16} />
                </Flex>
                <VStack gap={0} align="start" flex={1}>
                  <Text
                    fontSize="xs"
                    fontWeight="800"
                    color={theme.textPrimary}
                    letterSpacing="0.04em"
                    textTransform="uppercase"
                  >
                    {stage.label}
                  </Text>
                  <Text fontSize="2xs" color={theme.textMuted}>
                    {stage.events.length} {stage.events.length === 1 ? 'evento' : 'eventos'}
                  </Text>
                </VStack>
                <Box
                  as="button" cursor="pointer" p={1.5} borderRadius="full"
                  bg={theme.chipBg}
                  _active={{ opacity: 0.6 }}
                  onClick={() => setExpandedStage(null)}
                  transition="all 0.2s"
                >
                  <Icon as={FiChevronUp} boxSize={4} color={theme.textSecondary} />
                </Box>
              </HStack>

              <VStack gap={0} align="stretch">
                {stage.events.map((node, nodeIndex) => {
                  const NodeIcon = getIcon(node.icon || null);
                  const nodeColor = node.color || stageColor;

                  if (node.isInitialEvent && onCreationClick) {
                    return (
                      <VStack
                        key={node.id} gap={2.5} p={3.5} align="stretch"
                        borderBottom={nodeIndex < stage.events.length - 1 ? '1px solid' : 'none'}
                        borderColor={theme.chipBorder}
                        className={`animate-fade-in-up stagger-${Math.min(nodeIndex + 1, 6)}`}
                      >
                        <HStack gap={2}>
                          <Box
                            w="6px" h="6px" borderRadius="full"
                            bg={theme.accent} boxShadow={`0 0 6px ${theme.accent}50`}
                          />
                          <Text
                            fontSize="xs" fontWeight="800"
                            color={theme.textPrimary}
                          >
                            {node.eventName}
                          </Text>
                        </HStack>
                        <HStack gap={2.5}>
                          <Box
                            as="button" flex={1}
                            bg={`${theme.accent}08`}
                            borderRadius="12px" px={3} py={3}
                            border="1.5px solid"
                            borderColor={`${theme.accent}20`}
                            cursor="pointer"
                            transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                            _hover={{
                              borderColor: `${theme.accent}50`,
                              boxShadow: `0 4px 16px ${theme.accent}15`,
                              transform: 'translateY(-2px)',
                            }}
                            _active={{ transform: 'scale(0.95)' }}
                            onClick={() => onCreationClick(node, 'wizard')}
                          >
                            <VStack gap={1.5}>
                              <Flex
                                w="34px" h="34px" borderRadius="10px"
                                bg={`${theme.accent}10`}
                                align="center" justify="center"
                                border="1px solid" borderColor={`${theme.accent}20`}
                              >
                                <Icon as={LuWand} boxSize={4.5} color={theme.accent} />
                              </Flex>
                              <VStack gap={0}>
                                <Text fontSize="xs" fontWeight="800" color={theme.accent}>Wizard</Text>
                                <Text fontSize="2xs" color={theme.textMuted}>Paso a paso</Text>
                              </VStack>
                            </VStack>
                          </Box>
                          <Box
                            as="button" flex={1}
                            bg="rgba(139,92,246,0.06)"
                            borderRadius="12px" px={3} py={3}
                            border="1.5px solid"
                            borderColor="rgba(139,92,246,0.15)"
                            cursor="pointer"
                            transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                            _hover={{
                              borderColor: '#8B5CF650',
                              boxShadow: '0 4px 16px rgba(139,92,246,0.15)',
                              transform: 'translateY(-2px)',
                            }}
                            _active={{ transform: 'scale(0.95)' }}
                            onClick={() => onCreationClick(node, 'expert')}
                          >
                            <VStack gap={1.5}>
                              <Flex
                                w="34px" h="34px" borderRadius="10px"
                                bg="rgba(139,92,246,0.10)"
                                align="center" justify="center"
                                border="1px solid rgba(139,92,246,0.20)"
                              >
                                <Icon as={FiCode} boxSize={4.5} color="#8B5CF6" />
                              </Flex>
                              <VStack gap={0}>
                                <Text fontSize="xs" fontWeight="800" color="#8B5CF6">Experto</Text>
                                <Text fontSize="2xs" color={theme.textMuted}>Completo</Text>
                              </VStack>
                            </VStack>
                          </Box>
                        </HStack>
                      </VStack>
                    );
                  }

                  return (
                    <HStack
                      key={node.id} as="button"
                      px={3.5} py={3} gap={2.5}
                      cursor="pointer" transition="all 0.2s"
                      _hover={{ bg: `${theme.accent}05` }}
                      _active={{ transform: 'scale(0.98)' }}
                      onClick={() => onEventClick(node)}
                      borderBottom={nodeIndex < stage.events.length - 1 ? '1px solid' : 'none'}
                      borderColor={theme.chipBorder}
                      className={`animate-fade-in-up stagger-${Math.min(nodeIndex + 1, 6)}`}
                      w="100%"
                    >
                      <Flex
                        w="32px" h="32px" borderRadius="9px"
                        bg={theme.chipBg}
                        align="center" justify="center"
                        flexShrink={0}
                        border="1px solid"
                        borderColor={theme.chipBorder}
                      >
                        <Icon as={NodeIcon} boxSize={3.5} color={nodeColor} />
                      </Flex>
                      <Text
                        fontSize="xs" fontWeight="600"
                        color={theme.textPrimary}
                        flex={1} textAlign="left" lineClamp={2} lineHeight="1.35"
                      >
                        {node.eventName}
                      </Text>
                      <Icon as={FiChevronRight} boxSize={3.5} color={theme.textMuted} />
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          </Box>
        );
      })()}
    </Wrapper>
  );
};

export default JourneyMapIllustrated;
