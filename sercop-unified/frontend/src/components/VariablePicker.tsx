/**
 * VariablePicker — Reusable component for picking template variables
 * Supports both #{var} (hash) and ${var} (dollar) syntax
 * Includes useTemplateVariables hook for fetching from API
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Flex,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { FiChevronRight, FiCopy, FiHash } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { get } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';

// ── Exported types ──────────────────────────────────────────────────

export interface VariableItem {
  name: string;
  label: string;
  description: string;
}

export interface VariableCategory {
  category: string;
  color: string;
  variables: VariableItem[];
}

// Raw API types
interface TemplateVariableDTO {
  id: number;
  code: string;
  labelKey: string;
  descriptionKey?: string;
  category: string;
  color: string;
  sourceTable: string;
  sourceColumn: string;
  dataType: string;
  formatPattern?: string;
  displayOrder: number;
  isActive: boolean;
}

interface CategoryVariablesDTO {
  category: string;
  color: string;
  variables: TemplateVariableDTO[];
}

// ── Fallback variables ──────────────────────────────────────────────

const FALLBACK_VARIABLES: VariableCategory[] = [
  {
    category: 'OPERATION',
    color: 'blue',
    variables: [
      { name: 'reference', label: 'Reference', description: 'Operation reference code' },
      { name: 'operationId', label: 'Operation ID', description: 'Unique operation identifier' },
    ],
  },
];

// ── Hook: useTemplateVariables ──────────────────────────────────────

export function useTemplateVariables(): {
  variables: VariableCategory[];
  loading: boolean;
  categoryLabels: Record<string, string>;
} {
  const { t } = useTranslation();
  const [variables, setVariables] = useState<VariableCategory[]>(FALLBACK_VARIABLES);
  const [loading, setLoading] = useState(true);

  const categoryLabels: Record<string, string> = {
    OPERATION: t('templateVariables.categories.OPERATION'),
    AMOUNTS: t('templateVariables.categories.AMOUNTS'),
    APPLICANT: t('templateVariables.categories.APPLICANT'),
    BENEFICIARY: t('templateVariables.categories.BENEFICIARY'),
    BANKS: t('templateVariables.categories.BANKS'),
    DATES: t('templateVariables.categories.DATES'),
    USER: t('templateVariables.categories.USER'),
    SWIFT: t('templateVariables.categories.SWIFT'),
  };

  useEffect(() => {
    const fetchVariables = async () => {
      try {
        setLoading(true);
        const response = await get(`${API_BASE_URL}/v1/template-variables/active`);
        if (response.ok) {
          const data = await response.json();
          const categories: CategoryVariablesDTO[] = data.data || [];

          const transformed: VariableCategory[] = categories.map((cat) => ({
            category: cat.category,
            color: cat.color,
            variables: cat.variables.map((v) => ({
              name: v.code,
              label: t(v.labelKey, { defaultValue: v.code }),
              description: v.descriptionKey ? t(v.descriptionKey, { defaultValue: '' }) : '',
            })),
          }));

          if (transformed.length > 0) {
            setVariables(transformed);
          }
        }
      } catch {
        console.warn('Failed to fetch template variables, using fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, [t]);

  return { variables, loading, categoryLabels };
}

// ── VariablePicker Component ────────────────────────────────────────

export interface VariablePickerProps {
  onSelect: (variable: string) => void;
  disabled?: boolean;
  availableVariables: VariableCategory[];
  categoryLabels: Record<string, string>;
  /** Controls the syntax used when copying: #{var} (hash) or ${var} (dollar) */
  variableSyntax?: 'hash' | 'dollar';
}

export const VariablePicker: React.FC<VariablePickerProps> = ({
  onSelect,
  disabled,
  availableVariables,
  categoryLabels,
  variableSyntax = 'hash',
}) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const [expanded, setExpanded] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const wrapVariable = (varName: string): string => {
    return variableSyntax === 'dollar' ? `\${${varName}}` : `#{${varName}}`;
  };

  const handleCopy = (varName: string) => {
    const fullVar = wrapVariable(varName);
    navigator.clipboard.writeText(fullVar);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const totalVariables = availableVariables.reduce((acc, cat) => acc + cat.variables.length, 0);

  return (
    <Box
      border="1px"
      borderColor={colors.borderColor}
      borderRadius="md"
      overflow="hidden"
      mb={3}
    >
      <Flex
        p={2}
        bg={colors.bgColor}
        justify="space-between"
        align="center"
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
        _hover={{ bg: colors.hoverBg }}
      >
        <HStack gap={2}>
          <FiHash color={colors.primaryColor} />
          <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
            Variables Disponibles
          </Text>
          <Badge colorPalette="blue" size="sm">
            {totalVariables} variables
          </Badge>
        </HStack>
        <FiChevronRight
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </Flex>

      {expanded && (
        <Box p={3} maxH="300px" overflowY="auto">
          <Text fontSize="xs" color={colors.textColorSecondary} mb={3}>
            Haz clic en una variable para insertarla o copia el código completo
          </Text>
          <VStack align="stretch" gap={3}>
            {availableVariables.map((category) => (
              <Box key={category.category}>
                <HStack gap={2} mb={2}>
                  <Box
                    w="3px"
                    h="14px"
                    borderRadius="full"
                    bg={`${category.color}.500`}
                  />
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={`${category.color}.600`}
                    _dark={{ color: `${category.color}.300` }}
                    textTransform="uppercase"
                  >
                    {categoryLabels[category.category] || category.category}
                  </Text>
                </HStack>
                <Flex wrap="wrap" gap={1}>
                  {category.variables.map((v) => (
                    <HStack
                      key={v.name}
                      gap={0}
                      borderRadius="md"
                      overflow="hidden"
                      border="1px"
                      borderColor={`${category.color}.300`}
                      bg={`${category.color}.50`}
                      _dark={{ bg: `${category.color}.900`, borderColor: `${category.color}.700` }}
                    >
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => !disabled && onSelect(v.name)}
                        disabled={disabled}
                        title={v.description}
                        borderRadius="0"
                        px={2}
                        color={`${category.color}.600`}
                        _dark={{ color: `${category.color}.200` }}
                        _hover={{ bg: `${category.color}.100`, _dark: { bg: `${category.color}.800` } }}
                      >
                        <Text fontSize="xs" fontFamily="monospace" fontWeight="600">
                          {v.label}
                        </Text>
                      </Button>
                      <IconButton
                        aria-label="Copiar"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopy(v.name)}
                        borderRadius="0"
                        borderLeft="1px"
                        borderColor={`${category.color}.300`}
                        color={`${category.color}.500`}
                        _dark={{ borderColor: `${category.color}.700`, color: `${category.color}.300` }}
                        _hover={{ bg: `${category.color}.100`, _dark: { bg: `${category.color}.800` } }}
                      >
                        {copiedVar === v.name ? (
                          <Text fontSize="xs" color="green.500">✓</Text>
                        ) : (
                          <FiCopy size={10} />
                        )}
                      </IconButton>
                    </HStack>
                  ))}
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default VariablePicker;
