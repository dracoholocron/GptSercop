/**
 * SwiftFieldSearch - Advanced SWIFT field search component.
 * Loads configured SWIFT field definitions and presents adaptive input
 * components based on each field's type (SELECT, TEXT, DATE, etc.).
 * Searches within the swift_message TEXT column and custom fields.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, HStack, Text, Badge, Spinner } from '@chakra-ui/react';
import { FiSearch, FiPlus, FiX, FiCode } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { swiftFieldConfigService } from '../../services/swiftFieldConfigService';
import type { SwiftFieldConfig, FieldOption } from '../../types/swiftField';
import type { SwiftSearchCondition, DashboardFilterOptions } from '../../types/dashboard';

interface SwiftFieldSearchProps {
  conditions: SwiftSearchCondition[];
  freeText: string;
  filterOptions: DashboardFilterOptions | null;
  onConditionsChange: (conditions: SwiftSearchCondition[]) => void;
  onFreeTextChange: (text: string) => void;
  compact?: boolean;
}

/** Group field configs by section for the categorized dropdown */
interface FieldGroup {
  section: string;
  fields: SwiftFieldConfig[];
}

export const SwiftFieldSearch: React.FC<SwiftFieldSearchProps> = ({
  conditions,
  freeText,
  filterOptions,
  onConditionsChange,
  onFreeTextChange,
  compact = false,
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // --- State ---
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [selectedMessageType, setSelectedMessageType] = useState('MT700');
  const [fieldConfigs, setFieldConfigs] = useState<SwiftFieldConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [selectedFieldCode, setSelectedFieldCode] = useState('');
  const [selectedOp, setSelectedOp] = useState<'contains' | 'equals' | 'startsWith'>('contains');
  const [searchValue, setSearchValue] = useState('');
  const [localFreeText, setLocalFreeText] = useState(freeText);

  const freeTextTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // --- Styles ---
  const selectStyle: React.CSSProperties = {
    padding: compact ? '6px 10px' : '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
    background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'white',
    color: colors.textColor,
    fontSize: compact ? '12px' : '13px',
    cursor: 'pointer',
    minWidth: '100px',
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    cursor: 'text',
    flex: 1,
    minWidth: '180px',
  };

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500,
    background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
    color: isDark ? '#93C5FD' : '#2563EB',
    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
  };

  const chipCloseStyle: React.CSSProperties = {
    cursor: 'pointer',
    opacity: 0.7,
    display: 'flex',
    alignItems: 'center',
  };

  // --- Load message types on mount ---
  useEffect(() => {
    swiftFieldConfigService.getMessageTypes()
      .then(types => {
        if (types.length > 0) {
          setMessageTypes(types);
          if (!types.includes(selectedMessageType)) {
            setSelectedMessageType(types[0]);
          }
        }
      })
      .catch(() => setMessageTypes(['MT700', 'MT710', 'MT760']));
  }, []);

  // --- Load field configs when message type changes ---
  useEffect(() => {
    if (!selectedMessageType) return;
    setLoadingConfigs(true);
    swiftFieldConfigService.getAll(selectedMessageType, true)
      .then(configs => {
        setFieldConfigs(configs);
        setSelectedFieldCode('');
        setSearchValue('');
      })
      .catch(() => setFieldConfigs([]))
      .finally(() => setLoadingConfigs(false));
  }, [selectedMessageType]);

  // --- Group fields by section ---
  const fieldGroups: FieldGroup[] = useMemo(() => {
    const groupMap = new Map<string, SwiftFieldConfig[]>();
    for (const config of fieldConfigs) {
      const section = config.section || 'OTROS';
      if (!groupMap.has(section)) groupMap.set(section, []);
      groupMap.get(section)!.push(config);
    }
    // Sort within each group by displayOrder
    for (const fields of groupMap.values()) {
      fields.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return Array.from(groupMap.entries()).map(([section, fields]) => ({ section, fields }));
  }, [fieldConfigs]);

  // --- Get the config for the currently selected field ---
  const selectedConfig = useMemo(() => {
    if (!selectedFieldCode) return null;
    return fieldConfigs.find(c => c.fieldCode === selectedFieldCode) || null;
  }, [selectedFieldCode, fieldConfigs]);

  // --- Operator labels ---
  const opLabels: Record<string, string> = {
    'contains': t('swiftSearch.operators.contains', 'Contains'),
    'equals': t('swiftSearch.operators.equals', 'Equals'),
    'startsWith': t('swiftSearch.operators.startsWith', 'Starts with'),
  };

  // --- Get display label for a field code ---
  const getFieldLabel = useCallback((fieldCode: string): string => {
    const config = fieldConfigs.find(c => c.fieldCode === fieldCode);
    if (!config) return fieldCode;
    const translated = t(config.fieldNameKey, '');
    return translated || config.fieldName || fieldCode;
  }, [fieldConfigs, t]);

  // --- Add a search condition ---
  const addCondition = useCallback(() => {
    if (!selectedFieldCode || !searchValue.trim()) return;

    // Convert date from YYYY-MM-DD to SWIFT format YYMMDD
    let finalValue = searchValue.trim();
    if (selectedConfig?.fieldType === 'DATE' && /^\d{4}-\d{2}-\d{2}$/.test(finalValue)) {
      const [year, month, day] = finalValue.split('-');
      finalValue = year.slice(2) + month + day; // YYMMDD
    }

    const newCondition: SwiftSearchCondition = {
      field: selectedFieldCode.replace(/:/g, ''),
      op: selectedOp,
      value: finalValue,
      fieldLabel: getFieldLabel(selectedFieldCode),
    };
    onConditionsChange([...conditions, newCondition]);
    setSearchValue('');
  }, [selectedFieldCode, selectedOp, searchValue, selectedConfig, conditions, onConditionsChange, getFieldLabel]);

  // --- Remove a condition ---
  const removeCondition = useCallback((index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  }, [conditions, onConditionsChange]);

  // --- Debounced free text ---
  useEffect(() => {
    if (freeTextTimerRef.current) clearTimeout(freeTextTimerRef.current);
    freeTextTimerRef.current = setTimeout(() => {
      if (localFreeText !== freeText) {
        onFreeTextChange(localFreeText);
      }
    }, 600);
    return () => { if (freeTextTimerRef.current) clearTimeout(freeTextTimerRef.current); };
  }, [localFreeText]);

  // --- Sync external state changes ---
  useEffect(() => { setLocalFreeText(freeText); }, [freeText]);

  // --- Handle Enter key on value input ---
  const handleValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCondition();
    }
  };

  // --- Render the adaptive input based on field type ---
  const renderValueInput = () => {
    if (!selectedConfig) {
      return (
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleValueKeyDown}
          placeholder={t('swiftSearch.selectFieldPlaceholder', 'Select a field...')}
          style={{ ...inputStyle, opacity: 0.5 }}
          disabled
        />
      );
    }

    const { fieldType, fieldOptions, componentType } = selectedConfig;

    // SELECT type with configured options
    if ((fieldType === 'SELECT' || fieldType === 'MULTISELECT') && fieldOptions && fieldOptions.length > 0) {
      return (
        <select
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Seleccionar --</option>
          {fieldOptions.map((opt: FieldOption) => (
            <option key={opt.value} value={opt.value}>
              {opt.label || opt.value}
            </option>
          ))}
        </select>
      );
    }

    // CURRENCY type - use filter options if available
    if (fieldType === 'CURRENCY' && filterOptions?.currencies?.length) {
      return (
        <select
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Moneda --</option>
          {filterOptions.currencies.map(cur => (
            <option key={cur} value={cur}>{cur}</option>
          ))}
        </select>
      );
    }

    // BOOLEAN type
    if (fieldType === 'BOOLEAN') {
      return (
        <select
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Seleccionar --</option>
          <option value="Y">Sí (Y)</option>
          <option value="N">No (N)</option>
        </select>
      );
    }

    // NUMBER / DECIMAL type
    if (fieldType === 'NUMBER' || fieldType === 'DECIMAL') {
      return (
        <input
          type="text"
          inputMode="decimal"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleValueKeyDown}
          placeholder={selectedConfig.swiftFormat || 'Valor numérico...'}
          style={inputStyle}
        />
      );
    }

    // DATE type - use native date picker
    if (fieldType === 'DATE') {
      return (
        <input
          type="date"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={inputStyle}
        />
      );
    }

    // Default: TEXT input
    const placeholderText = selectedConfig.placeholderKey
      ? t(selectedConfig.placeholderKey, 'Buscar...')
      : selectedConfig.placeholder || 'Buscar...';

    return (
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleValueKeyDown}
        placeholder={placeholderText}
        style={inputStyle}
      />
    );
  };

  const totalConditions = conditions.length + (localFreeText ? 1 : 0);

  return (
    <Box
      mt={3}
      p={compact ? 3 : 4}
      borderRadius="12px"
      border="1px solid"
      borderColor={isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}
      bg={isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.8)'}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: 'linear-gradient(180deg, #3B82F6, #8B5CF6, #EC4899)',
        borderRadius: '3px 0 0 3px',
      }}
    >
      {/* Header */}
      <HStack gap={2} mb={3}>
        <FiCode size={16} color={isDark ? '#93C5FD' : '#3B82F6'} />
        <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
          {t('swiftSearch.title', 'Búsqueda Avanzada SWIFT')}
        </Text>
        {totalConditions > 0 && (
          <Badge
            colorPalette="blue"
            variant="solid"
            borderRadius="full"
            fontSize="xs"
            px={1.5}
          >
            {totalConditions}
          </Badge>
        )}
        {loadingConfigs && <Spinner size="xs" color={colors.primaryColor} />}
      </HStack>

      {/* Message Type + Field Selector + Adaptive Input + Add Button */}
      <HStack gap={2} flexWrap="wrap" alignItems="flex-end">
        {/* Message Type Selector */}
        <Box>
          <Text fontSize="xs" color={colors.textColor} opacity={0.5} mb={0.5}>
            {t('swiftSearch.messageType', 'Message Type')}
          </Text>
          <select
            value={selectedMessageType}
            onChange={(e) => setSelectedMessageType(e.target.value)}
            style={{ ...selectStyle, minWidth: '90px' }}
          >
            {messageTypes.map(mt => (
              <option key={mt} value={mt}>{mt}</option>
            ))}
          </select>
        </Box>

        {/* SWIFT Field Selector (grouped by section) */}
        <Box flex="1" minW="200px">
          <Text fontSize="xs" color={colors.textColor} opacity={0.5} mb={0.5}>
            {t('swiftSearch.swiftField', 'SWIFT Field')}
          </Text>
          <select
            value={selectedFieldCode}
            onChange={(e) => {
              setSelectedFieldCode(e.target.value);
              setSearchValue('');
            }}
            style={{ ...selectStyle, width: '100%' }}
          >
            <option value="">{t('swiftSearch.selectField', '-- Select field --')}</option>
            {fieldGroups.map(group => (
              <optgroup
                key={group.section}
                label={t(`swift.sections.${group.section}`, group.section)}
              >
                {group.fields.map(config => {
                  const label = t(config.fieldNameKey, '') || config.fieldName || config.fieldCode;
                  return (
                    <option key={config.id} value={config.fieldCode}>
                      {config.fieldCode} - {label}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </Box>

        {/* Operator */}
        <Box>
          <Text fontSize="xs" color={colors.textColor} opacity={0.5} mb={0.5}>
            {t('swiftSearch.operator', 'Operator')}
          </Text>
          <select
            value={selectedOp}
            onChange={(e) => setSelectedOp(e.target.value as any)}
            style={{ ...selectStyle, minWidth: '110px' }}
          >
            <option value="contains">{opLabels.contains}</option>
            <option value="startsWith">{opLabels.startsWith}</option>
            <option value="equals">{opLabels.equals}</option>
          </select>
        </Box>

        {/* Adaptive Value Input */}
        <Box flex="1" minW="160px">
          <Text fontSize="xs" color={colors.textColor} opacity={0.5} mb={0.5}>
            {t('swiftSearch.value', 'Value')}
          </Text>
          {renderValueInput()}
        </Box>

        {/* Add Button */}
        <button
          onClick={addCondition}
          disabled={!selectedFieldCode || !searchValue.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: compact ? '7px 12px' : '9px 16px',
            borderRadius: '8px',
            border: 'none',
            background: (!selectedFieldCode || !searchValue.trim())
              ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
              : 'linear-gradient(135deg, #3B82F6, #6366F1)',
            color: (!selectedFieldCode || !searchValue.trim())
              ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')
              : 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: (!selectedFieldCode || !searchValue.trim()) ? 'not-allowed' : 'pointer',
            marginTop: '16px',
          }}
        >
          <FiPlus size={14} />
          {t('swiftSearch.add', 'Add')}
        </button>
      </HStack>

      {/* Active Conditions (chips) */}
      {conditions.length > 0 && (
        <HStack gap={2} flexWrap="wrap" mt={3}>
          {conditions.map((cond, idx) => (
            <span key={idx} style={chipStyle}>
              <FiCode size={11} />
              <span style={{ fontWeight: 600 }}>:{cond.field}:</span>
              <span style={{ opacity: 0.7, fontSize: '11px' }}>{opLabels[cond.op]}</span>
              <span>"{cond.value}"</span>
              <span
                onClick={() => removeCondition(idx)}
                style={chipCloseStyle}
                title={t('swiftSearch.removeCondition', 'Remove condition')}
              >
                <FiX size={12} />
              </span>
            </span>
          ))}
          {conditions.length > 1 && (
            <span
              onClick={() => onConditionsChange([])}
              style={{
                ...chipStyle,
                background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                color: isDark ? '#FCA5A5' : '#DC2626',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                cursor: 'pointer',
              }}
            >
              <FiX size={11} />
              {t('swiftSearch.clearAll', 'Clear all')}
            </span>
          )}
        </HStack>
      )}

      {/* Separator */}
      <Box
        mt={3}
        mb={2}
        borderTop="1px solid"
        borderColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
      />

      {/* Free Text Search */}
      <HStack gap={2} alignItems="center">
        <FiSearch size={14} color={isDark ? '#94A3B8' : '#64748B'} style={{ flexShrink: 0 }} />
        <Box flex="1">
          <input
            type="text"
            value={localFreeText}
            onChange={(e) => setLocalFreeText(e.target.value)}
            placeholder={t('swiftSearch.freeTextPlaceholder', 'Buscar texto libre en todo el mensaje SWIFT...')}
            style={{
              ...inputStyle,
              width: '100%',
              minWidth: 'unset',
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.8)',
            }}
          />
        </Box>
        {localFreeText && (
          <span
            onClick={() => { setLocalFreeText(''); onFreeTextChange(''); }}
            style={{ ...chipCloseStyle, color: colors.textColor }}
          >
            <FiX size={14} />
          </span>
        )}
      </HStack>

    </Box>
  );
};

export default SwiftFieldSearch;
