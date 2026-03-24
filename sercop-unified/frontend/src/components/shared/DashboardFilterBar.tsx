/**
 * DashboardFilterBar - Reusable filter bar for dashboards.
 * Renders basic filters (period, product, currency, status) +
 * collapsible advanced filters (createdBy, beneficiary, banks, applicant) +
 * collapsible SWIFT field search panel +
 * collapsible Extended Filters panel (custom field configs from BD).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { HStack, Text, Badge, Box } from '@chakra-ui/react';
import { FiFilter, FiChevronDown, FiChevronUp, FiCode, FiDatabase, FiPlus, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { SwiftFieldSearch } from '../dashboard/SwiftFieldSearch';
import { catalogoPersonalizadoService, type CatalogoPersonalizado } from '../../services/customCatalogService';
import type { DashboardFilters, DashboardFilterOptions, SwiftSearchCondition } from '../../types/dashboard';

interface DashboardFilterBarProps {
  filters: DashboardFilters;
  filterOptions: DashboardFilterOptions | null;
  onFilterChange: (filters: DashboardFilters) => void;
  isOperator?: boolean;
  compact?: boolean;
  activeAdvancedCount?: number;
  activeSwiftCount?: number;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  filterOptions,
  onFilterChange,
  isOperator = false,
  compact = false,
  activeAdvancedCount = 0,
  activeSwiftCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSwiftSearch, setShowSwiftSearch] = useState(false);
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const selectStyle: React.CSSProperties = {
    padding: compact ? '6px 12px' : '8px 16px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : colors.borderColor}`,
    background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
    color: colors.textColor,
    fontSize: compact ? '12px' : '13px',
    cursor: 'pointer',
    minWidth: compact ? '100px' : '120px',
  };

  const disabledSelectStyle: React.CSSProperties = {
    ...selectStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    cursor: 'text',
    minWidth: '140px',
  };

  const update = (partial: Partial<DashboardFilters>) => {
    onFilterChange({ ...filters, ...partial });
  };

  // Custom field configs from filterOptions
  const customFieldConfigs = filterOptions?.customFieldConfigs || [];

  // Extended filter builder state
  const [selectedExtField, setSelectedExtField] = useState('');
  const [extFilterValue, setExtFilterValue] = useState('');

  // Count active extended filters
  const activeExtendedCount = useMemo(() => {
    if (!filters.customFieldFilters) return 0;
    return Object.values(filters.customFieldFilters).filter(v => v && v.length > 0).length;
  }, [filters.customFieldFilters]);

  // Get config for selected extended field
  const selectedExtConfig = useMemo(() => {
    if (!selectedExtField) return null;
    return customFieldConfigs.find(c => c.fieldCode === selectedExtField) || null;
  }, [selectedExtField, customFieldConfigs]);

  // Catalog options cache: dataSourceCode → options[]
  const [catalogCache, setCatalogCache] = useState<Record<string, CatalogoPersonalizado[]>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Helper to load a catalog by code into cache
  const loadCatalog = useCallback((code: string) => {
    if (catalogCache[code]) return;
    setLoadingCatalog(true);
    catalogoPersonalizadoService.getCatalogosByCodigoPadre(code)
      .then(data => {
        const active = data.filter(d => d.activo).sort((a, b) => a.orden - b.orden);
        setCatalogCache(prev => ({ ...prev, [code]: active }));
      })
      .catch(err => console.error('Error loading catalog options:', err))
      .finally(() => setLoadingCatalog(false));
  }, [catalogCache]);

  // Load catalog options when a CATALOG_LISTBOX field is selected
  useEffect(() => {
    if (!selectedExtConfig) return;
    if (selectedExtConfig.componentType !== 'CATALOG_LISTBOX') return;
    const code = selectedExtConfig.dataSourceCode;
    if (!code) return;
    loadCatalog(code);
  }, [selectedExtConfig, loadCatalog]);

  // Pre-load catalogs for already-active filters (so chips show names)
  useEffect(() => {
    if (!filters.customFieldFilters) return;
    for (const fieldCode of Object.keys(filters.customFieldFilters)) {
      const config = customFieldConfigs.find(c => c.fieldCode === fieldCode);
      if (config?.componentType === 'CATALOG_LISTBOX' && config.dataSourceCode) {
        loadCatalog(config.dataSourceCode);
      }
    }
  }, [filters.customFieldFilters, customFieldConfigs, loadCatalog]);

  // Parse field options JSON
  const parseFieldOptions = useCallback((optionsJson: string): Array<{ value: string; label: string; labelKey?: string }> => {
    try {
      const parsed = JSON.parse(optionsJson);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }, []);

  // Get display label for a field code
  const getExtFieldLabel = useCallback((fieldCode: string): string => {
    const config = customFieldConfigs.find((c: any) => c.fieldCode === fieldCode);
    if (!config) return fieldCode;
    return t(config.fieldNameKey, config.fieldCode);
  }, [customFieldConfigs, t]);

  // Get display label for a filter value (resolve catalog names, SELECT labels, etc.)
  const getExtValueLabel = useCallback((fieldCode: string, value: string): string => {
    const config = customFieldConfigs.find((c: any) => c.fieldCode === fieldCode);
    if (!config) return value;
    // CATALOG_LISTBOX: look up nombre from cache
    if (config.componentType === 'CATALOG_LISTBOX' && config.dataSourceCode) {
      const catalogOptions = catalogCache[config.dataSourceCode];
      if (catalogOptions) {
        const match = catalogOptions.find(o => o.codigo === value);
        if (match) return match.nombre;
      }
    }
    // SELECT: look up label from fieldOptions
    if (config.componentType === 'SELECT' && config.fieldOptions) {
      const options = parseFieldOptions(config.fieldOptions);
      const match = options.find(o => o.value === value);
      if (match) return match.labelKey ? t(match.labelKey, match.label || value) : (match.label || value);
    }
    return value;
  }, [customFieldConfigs, catalogCache, parseFieldOptions, t]);

  // Group custom fields by step name (translated)
  const groupedCustomFields = useMemo(() => {
    const groups: Record<string, { label: string; fields: any[] }> = {};
    for (const config of customFieldConfigs) {
      const key = config.stepNameKey || 'other';
      if (!groups[key]) {
        groups[key] = {
          label: t(config.stepNameKey, config.stepNameKey?.split('.').pop() || 'Other'),
          fields: [],
        };
      }
      groups[key].fields.push(config);
    }
    return Object.values(groups);
  }, [customFieldConfigs, t]);

  // Add extended filter
  const addExtFilter = useCallback(() => {
    if (!selectedExtField || !extFilterValue.trim()) return;
    const current = filters.customFieldFilters || {};
    const updated = { ...current, [selectedExtField]: extFilterValue.trim() };
    update({ customFieldFilters: updated });
    setExtFilterValue('');
  }, [selectedExtField, extFilterValue, filters.customFieldFilters, update]);

  // Remove extended filter
  const removeExtFilter = useCallback((fieldCode: string) => {
    const current = filters.customFieldFilters || {};
    const updated = { ...current };
    delete updated[fieldCode];
    update({ customFieldFilters: Object.keys(updated).length > 0 ? updated : undefined });
  }, [filters.customFieldFilters, update]);

  return (
    <>
      {/* Row 1: Basic filters */}
      <HStack gap={compact ? 2 : 3} flexWrap="wrap">
        {/* Period Filter */}
        <select
          value={filters.period}
          onChange={(e) => update({ period: e.target.value })}
          style={selectStyle}
        >
          {filterOptions?.periods.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Product Filter */}
        <select
          value={filters.productType || ''}
          onChange={(e) => update({ productType: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">{t('businessDashboard.allProducts', 'Todos los Productos')}</option>
          {filterOptions?.productTypes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Currency Filter */}
        <select
          value={filters.currency || ''}
          onChange={(e) => update({ currency: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">{t('businessDashboard.allCurrencies', 'Todas las Monedas')}</option>
          {filterOptions?.currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.statusFilter || 'OPEN'}
          onChange={(e) => update({ statusFilter: e.target.value })}
          style={selectStyle}
        >
          {filterOptions?.statusFilters?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )) || (
            <>
              <option value="OPEN">{t('businessDashboard.statusOpen', 'Solo Abiertas')}</option>
              <option value="CLOSED">{t('businessDashboard.statusClosed', 'Solo Cerradas')}</option>
              <option value="ALL">{t('businessDashboard.statusAll', 'Todas')}</option>
            </>
          )}
        </select>

        {/* Advanced filter toggle */}
        <HStack
          as="button"
          gap={1}
          px={compact ? 2 : 3}
          py={compact ? 1 : 1.5}
          borderRadius="lg"
          bg={showAdvanced
            ? (isDark ? 'blue.900/40' : 'blue.50')
            : (isDark ? 'whiteAlpha.100' : 'blackAlpha.50')
          }
          border="1px solid"
          borderColor={showAdvanced
            ? (isDark ? 'blue.500/40' : 'blue.200')
            : (isDark ? 'whiteAlpha.100' : 'blackAlpha.100')
          }
          cursor="pointer"
          onClick={() => setShowAdvanced(!showAdvanced)}
          _hover={{
            bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100',
          }}
        >
          <FiFilter size={compact ? 12 : 14} />
          <Text fontSize={compact ? 'xs' : 'sm'} fontWeight="medium" color={colors.textColor}>
            {t('businessDashboard.advancedFilters', 'Filtros')}
          </Text>
          {activeAdvancedCount > 0 && (
            <Badge
              colorPalette="blue"
              variant="solid"
              borderRadius="full"
              fontSize="xs"
              px={1.5}
              minW="18px"
              textAlign="center"
            >
              {activeAdvancedCount}
            </Badge>
          )}
          {showAdvanced ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        </HStack>

        {/* SWIFT Search toggle */}
        <HStack
          as="button"
          gap={1}
          px={compact ? 2 : 3}
          py={compact ? 1 : 1.5}
          borderRadius="lg"
          bg={showSwiftSearch
            ? (isDark ? 'purple.900/40' : 'purple.50')
            : (isDark ? 'whiteAlpha.100' : 'blackAlpha.50')
          }
          border="1px solid"
          borderColor={showSwiftSearch
            ? (isDark ? 'purple.500/40' : 'purple.200')
            : (isDark ? 'whiteAlpha.100' : 'blackAlpha.100')
          }
          cursor="pointer"
          onClick={() => setShowSwiftSearch(!showSwiftSearch)}
          _hover={{
            bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100',
          }}
        >
          <FiCode size={compact ? 12 : 14} />
          <Text fontSize={compact ? 'xs' : 'sm'} fontWeight="medium" color={colors.textColor}>
            SWIFT
          </Text>
          {activeSwiftCount > 0 && (
            <Badge
              colorPalette="purple"
              variant="solid"
              borderRadius="full"
              fontSize="xs"
              px={1.5}
              minW="18px"
              textAlign="center"
            >
              {activeSwiftCount}
            </Badge>
          )}
          {showSwiftSearch ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        </HStack>

        {/* Extended Filters toggle */}
        <HStack
            as="button"
            gap={1}
            px={compact ? 2 : 3}
            py={compact ? 1 : 1.5}
            borderRadius="lg"
            bg={showExtendedFilters
              ? (isDark ? 'green.900/40' : 'green.50')
              : (isDark ? 'whiteAlpha.100' : 'blackAlpha.50')
            }
            border="1px solid"
            borderColor={showExtendedFilters
              ? (isDark ? 'green.500/40' : 'green.200')
              : (isDark ? 'whiteAlpha.100' : 'blackAlpha.100')
            }
            cursor="pointer"
            onClick={() => setShowExtendedFilters(!showExtendedFilters)}
            _hover={{
              bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100',
            }}
          >
            <FiDatabase size={compact ? 12 : 14} />
            <Text fontSize={compact ? 'xs' : 'sm'} fontWeight="medium" color={colors.textColor}>
              {t('businessDashboard.extendedFilters', 'Extended Filters')}
            </Text>
            {activeExtendedCount > 0 && (
              <Badge
                colorPalette="green"
                variant="solid"
                borderRadius="full"
                fontSize="xs"
                px={1.5}
                minW="18px"
                textAlign="center"
              >
                {activeExtendedCount}
              </Badge>
            )}
            {showExtendedFilters ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
          </HStack>
      </HStack>

      {/* Row 2: Advanced filters (collapsible) */}
      {showAdvanced && (
        <HStack gap={compact ? 2 : 3} flexWrap="wrap" mt={2}>
          {/* Created By */}
          <Box>
            <Text fontSize="xs" color={colors.textColor} opacity={0.6} mb={0.5}>
              {t('businessDashboard.filterCreatedBy', 'Ingresado por')}
            </Text>
            <select
              value={filters.createdBy || ''}
              onChange={(e) => update({ createdBy: e.target.value || undefined })}
              style={isOperator ? disabledSelectStyle : selectStyle}
              disabled={isOperator}
            >
              <option value="">{t('businessDashboard.all', 'Todos')}</option>
              {filterOptions?.createdByOptions?.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </Box>

          {/* Beneficiary */}
          <Box>
            <Text fontSize="xs" color={colors.textColor} opacity={0.6} mb={0.5}>
              {t('businessDashboard.filterBeneficiary', 'Beneficiario')}
            </Text>
            <select
              value={filters.beneficiary || ''}
              onChange={(e) => update({ beneficiary: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">{t('businessDashboard.all', 'Todos')}</option>
              {filterOptions?.beneficiaryOptions?.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </Box>

          {/* Issuing Bank */}
          <Box>
            <Text fontSize="xs" color={colors.textColor} opacity={0.6} mb={0.5}>
              {t('businessDashboard.filterIssuingBank', 'Banco Emisor')}
            </Text>
            <select
              value={filters.issuingBank || ''}
              onChange={(e) => update({ issuingBank: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">{t('businessDashboard.all', 'Todos')}</option>
              {filterOptions?.issuingBankOptions?.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </Box>

          {/* Advising Bank */}
          <Box>
            <Text fontSize="xs" color={colors.textColor} opacity={0.6} mb={0.5}>
              {t('businessDashboard.filterAdvisingBank', 'Banco Avisador')}
            </Text>
            <select
              value={filters.advisingBank || ''}
              onChange={(e) => update({ advisingBank: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">{t('businessDashboard.all', 'Todos')}</option>
              {filterOptions?.advisingBankOptions?.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </Box>

          {/* Applicant */}
          <Box>
            <Text fontSize="xs" color={colors.textColor} opacity={0.6} mb={0.5}>
              {t('businessDashboard.filterApplicant', 'Solicitante')}
            </Text>
            <select
              value={filters.applicant || ''}
              onChange={(e) => update({ applicant: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">{t('businessDashboard.all', 'Todos')}</option>
              {filterOptions?.applicantOptions?.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </Box>
        </HStack>
      )}

      {/* Row 3: SWIFT Field Search (collapsible) */}
      {showSwiftSearch && (
        <SwiftFieldSearch
          conditions={filters.swiftSearch || []}
          freeText={filters.swiftFreeText || ''}
          filterOptions={filterOptions}
          onConditionsChange={(conditions: SwiftSearchCondition[]) =>
            update({ swiftSearch: conditions.length > 0 ? conditions : undefined })
          }
          onFreeTextChange={(text: string) =>
            update({ swiftFreeText: text || undefined })
          }
          compact={compact}
        />
      )}

      {/* Row 4: Extended Filters - SWIFT-style selector + value + add (collapsible) */}
      {showExtendedFilters && (
        <Box
          mt={3}
          p={compact ? 3 : 4}
          borderRadius="12px"
          border="1px solid"
          borderColor={isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'}
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
            background: 'linear-gradient(180deg, #22C55E, #10B981, #059669)',
            borderRadius: '3px 0 0 3px',
          }}
        >
          {/* Header */}
          <HStack gap={2} mb={3}>
            <FiDatabase size={16} color={isDark ? '#86EFAC' : '#16A34A'} />
            <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
              {t('businessDashboard.extendedFilters', 'Extended Filters')}
            </Text>
            {activeExtendedCount > 0 && (
              <Badge
                colorPalette="green"
                variant="solid"
                borderRadius="full"
                fontSize="xs"
                px={1.5}
              >
                {activeExtendedCount}
              </Badge>
            )}
          </HStack>

          {customFieldConfigs.length > 0 ? (
            <>
              {/* Field selector + Adaptive value input + Add button */}
              <HStack gap={2} flexWrap="wrap" alignItems="flex-end">
                {/* Field Selector — grouped by product */}
                <Box flex="1" minW="200px">
                  <Text fontSize="xs" color={colors.textColor} opacity={0.5} mb={0.5}>
                    {t('businessDashboard.field', 'Campo')}
                  </Text>
                  <select
                    value={selectedExtField}
                    onChange={(e) => { setSelectedExtField(e.target.value); setExtFilterValue(''); }}
                    style={{ ...selectStyle, width: '100%' }}
                  >
                    <option value="">{t('swiftSearch.selectField', '-- Seleccionar campo --')}</option>
                    {groupedCustomFields.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.fields.map((config: any) => {
                          const label = t(config.fieldNameKey, config.fieldCode);
                          return (
                            <option key={config.fieldCode} value={config.fieldCode}>
                              {label}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                </Box>

                {/* Adaptive Value Input */}
                <Box flex="1" minW="160px">
                  <Text fontSize="xs" color={colors.textColor} opacity={0.5} mb={0.5}>
                    {t('swiftSearch.value', 'Valor')}
                  </Text>
                  {(() => {
                    if (!selectedExtConfig) {
                      return (
                        <input
                          type="text"
                          value=""
                          placeholder={t('swiftSearch.selectFieldPlaceholder', 'Seleccione un campo...')}
                          style={{ ...inputStyle, opacity: 0.5, flex: 1 }}
                          disabled
                        />
                      );
                    }
                    const options = parseFieldOptions(selectedExtConfig.fieldOptions);
                    if (selectedExtConfig.componentType === 'SELECT' && options.length > 0) {
                      return (
                        <select
                          value={extFilterValue}
                          onChange={(e) => setExtFilterValue(e.target.value)}
                          style={{ ...selectStyle, width: '100%' }}
                        >
                          <option value="">-- {t('swiftSearch.selectField', 'Seleccionar')} --</option>
                          {options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.labelKey ? t(opt.labelKey, opt.label || opt.value) : (opt.label || opt.value)}
                            </option>
                          ))}
                        </select>
                      );
                    }
                    if (selectedExtConfig.componentType === 'CATALOG_LISTBOX' && selectedExtConfig.dataSourceCode) {
                      const catalogOptions = catalogCache[selectedExtConfig.dataSourceCode] || [];
                      if (loadingCatalog) {
                        return (
                          <input
                            type="text"
                            value=""
                            placeholder={t('common.loading', 'Cargando...')}
                            style={{ ...inputStyle, opacity: 0.5, flex: 1 }}
                            disabled
                          />
                        );
                      }
                      return (
                        <select
                          value={extFilterValue}
                          onChange={(e) => setExtFilterValue(e.target.value)}
                          style={{ ...selectStyle, width: '100%' }}
                        >
                          <option value="">-- {t('swiftSearch.selectField', 'Seleccionar')} --</option>
                          {catalogOptions.map(opt => (
                            <option key={opt.id} value={opt.codigo}>
                              {opt.nombre}
                            </option>
                          ))}
                        </select>
                      );
                    }
                    if (selectedExtConfig.componentType === 'DATE_PICKER') {
                      return (
                        <input
                          type="date"
                          value={extFilterValue}
                          onChange={(e) => setExtFilterValue(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                      );
                    }
                    return (
                      <input
                        type="text"
                        value={extFilterValue}
                        onChange={(e) => setExtFilterValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtFilter(); } }}
                        placeholder={t(selectedExtConfig.fieldNameKey, selectedExtConfig.fieldCode)}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    );
                  })()}
                </Box>

                {/* Add Button */}
                <button
                  onClick={addExtFilter}
                  disabled={!selectedExtField || !extFilterValue.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: compact ? '7px 12px' : '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (!selectedExtField || !extFilterValue.trim())
                      ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                      : 'linear-gradient(135deg, #22C55E, #10B981)',
                    color: (!selectedExtField || !extFilterValue.trim())
                      ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')
                      : 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: (!selectedExtField || !extFilterValue.trim()) ? 'not-allowed' : 'pointer',
                    marginTop: '16px',
                  }}
                >
                  <FiPlus size={14} />
                  {t('swiftSearch.add', 'Agregar')}
                </button>
              </HStack>

              {/* Active filter chips */}
              {activeExtendedCount > 0 && (
                <HStack gap={2} flexWrap="wrap" mt={3}>
                  {Object.entries(filters.customFieldFilters || {}).map(([fieldCode, value]) => (
                    <span
                      key={fieldCode}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
                        color: isDark ? '#86EFAC' : '#16A34A',
                        border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
                      }}
                    >
                      <FiDatabase size={11} />
                      <span style={{ fontWeight: 600 }}>{getExtFieldLabel(fieldCode)}</span>
                      <span>"{getExtValueLabel(fieldCode, value)}"</span>
                      <span
                        onClick={() => removeExtFilter(fieldCode)}
                        style={{ cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center' }}
                        title={t('swiftSearch.removeCondition', 'Eliminar condición')}
                      >
                        <FiX size={12} />
                      </span>
                    </span>
                  ))}
                  {activeExtendedCount > 1 && (
                    <span
                      onClick={() => update({ customFieldFilters: undefined })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                        color: isDark ? '#FCA5A5' : '#DC2626',
                        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <FiX size={11} />
                      {t('swiftSearch.clearAll', 'Limpiar todo')}
                    </span>
                  )}
                </HStack>
              )}
            </>
          ) : (
            <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
              {t('businessDashboard.noExtendedFilters', 'No custom fields configured for filtering')}
            </Text>
          )}
        </Box>
      )}
    </>
  );
};

export default DashboardFilterBar;
