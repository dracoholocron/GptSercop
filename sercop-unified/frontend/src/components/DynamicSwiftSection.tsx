import React, { useMemo } from 'react';
import { Alert, Box, SimpleGrid, Spinner, Text, VStack, Icon } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useSwiftFields } from '../hooks/useSwiftFields';
import { DynamicSwiftField } from './swift/DynamicSwiftField';
import type { SwiftFieldConfig } from '../types/swiftField';

type DynamicSwiftSectionProps = {
  messageType: string;
  section: string;
  formData: Record<string, any>;
  onChange: (fieldCode: string, value: any) => void;
  columns?: number;
  showOptionalFields?: boolean;
  sectionTitle?: string;
  variant?: 'default' | 'clean';
  readOnly?: boolean;
  hasError?: boolean;
  fieldComments?: Record<string, { comment: string; commentedAt: string; commentedBy: string }>;
  onSaveFieldComment?: (fieldCode: string, comment: string) => void;
  onRemoveFieldComment?: (fieldCode: string) => void;
  fieldCommentMode?: 'approver' | 'creator' | 'none';
};

const SECTION_ALIASES: Record<string, string[]> = {
  BASIC: ['BASIC', 'BASICA'],
  BASICA: ['BASICA', 'BASIC'],
  PARTIES: ['PARTIES', 'PARTES'],
  PARTES: ['PARTES', 'PARTIES'],
  TERMS: ['TERMS', 'TERMINOS'],
  TERMINOS: ['TERMINOS', 'TERMS'],
  AMOUNTS: ['AMOUNTS', 'MONTOS'],
  MONTOS: ['MONTOS', 'AMOUNTS'],
  DATES: ['DATES', 'FECHAS'],
  FECHAS: ['FECHAS', 'DATES'],
  INSTRUCTIONS: ['INSTRUCTIONS', 'INSTRUCCIONES'],
  INSTRUCCIONES: ['INSTRUCCIONES', 'INSTRUCTIONS'],
  BANKS: ['BANKS', 'BANCOS'],
  BANCOS: ['BANCOS', 'BANKS'],
  GOODS: ['GOODS', 'MERCANCIAS'],
  MERCANCIAS: ['MERCANCIAS', 'GOODS'],
  CONDITIONS: ['CONDITIONS', 'CONDICIONES'],
  CONDICIONES: ['CONDICIONES', 'CONDITIONS'],
};

const normalize = (value: string) => (value || '').trim().toUpperCase();

const resolveAliases = (section: string): string[] => {
  const key = normalize(section);
  return SECTION_ALIASES[key] || [key];
};

export const DynamicSwiftSection: React.FC<DynamicSwiftSectionProps> = ({
  messageType,
  section,
  formData,
  onChange,
  columns = 2,
  showOptionalFields = true,
  sectionTitle,
  variant = 'default',
  readOnly = false,
}) => {
  const { fields, loading, error } = useSwiftFields(messageType);

  const sectionFields = useMemo(() => {
    const aliases = resolveAliases(section);
    const aliasSet = new Set(aliases.map(normalize));

    const filtered = fields
      .filter((field) => aliasSet.has(normalize(field.section || '')))
      .filter((field) => showOptionalFields || !!field.isRequired)
      .filter((field) => field.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Deduplicate by fieldCode in case aliases overlap.
    const byCode = new Map<string, SwiftFieldConfig>();
    for (const field of filtered) {
      byCode.set(field.fieldCode, field);
    }
    return Array.from(byCode.values());
  }, [fields, section, showOptionalFields]);

  if (loading) {
    return (
      <Box py={6} textAlign="center">
        <Spinner size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="warning" borderRadius="md">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  if (sectionFields.length === 0) {
    return (
      <VStack align="stretch" gap={2}>
        {sectionTitle ? (
          <Text fontWeight="semibold" fontSize={variant === 'clean' ? 'sm' : 'md'}>
            {sectionTitle}
          </Text>
        ) : null}
        <Alert.Root status="info" borderRadius="md">
          <Alert.Indicator>
            <Icon as={FiInfo} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>
              No hay campos configurados para la sección `{section}` en {messageType}.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {sectionTitle ? (
        <Text fontWeight="semibold" fontSize={variant === 'clean' ? 'sm' : 'md'}>
          {sectionTitle}
        </Text>
      ) : null}
      <SimpleGrid columns={{ base: 1, md: columns }} gap={4}>
        {sectionFields.map((config) => (
          <DynamicSwiftField
            key={config.fieldCode}
            config={config}
            value={formData[config.fieldCode]}
            onChange={onChange}
            formData={formData}
            disabled={readOnly}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default DynamicSwiftSection;
