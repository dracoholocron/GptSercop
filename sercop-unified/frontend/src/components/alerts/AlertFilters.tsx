import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Input,
  Badge,
  Flex,
  IconButton,
  Collapsible,
  Checkbox,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiRefreshCw,
  FiUser,
  FiUsers,
  FiGlobe,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { TagSelector } from './TagSelector';
import { getAlertTypes, getSearchCounts } from '../../services/alertService';
import { getUsers } from '../../services/userService';
import type {
  AlertType,
  AlertPriority,
  AlertStatus,
  AlertViewMode,
  AlertTypeConfig,
  AlertSearchCounts,
  AlertSearchRequest,
} from '../../services/alertService';

interface UserOption {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AlertFiltersProps {
  filters: AlertSearchRequest;
  onFiltersChange: (filters: AlertSearchRequest) => void;
  onSearch: () => void;
  showAllOption?: boolean;
  loading?: boolean;
}

export const AlertFilters = ({
  filters,
  onFiltersChange,
  onSearch,
  showAllOption = false,
  loading = false,
}: AlertFiltersProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [expanded, setExpanded] = useState(false);
  const [alertTypes, setAlertTypes] = useState<AlertTypeConfig[]>([]);
  const [counts, setCounts] = useState<AlertSearchCounts | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);

  const lang = i18n.language === 'en' ? 'en' : 'es';

  useEffect(() => {
    loadConfig();
  }, []);

  // Load users when admin has permission to filter by user
  useEffect(() => {
    if (showAllOption) {
      loadUsers();
    }
  }, [showAllOption]);

  const loadConfig = async () => {
    try {
      const [types, searchCounts] = await Promise.all([
        getAlertTypes(true),
        getSearchCounts(),
      ]);
      setAlertTypes(types);
      setCounts(searchCounts);
    } catch (error) {
      console.error('Error loading filter config:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleViewModeChange = (viewMode: AlertViewMode) => {
    onFiltersChange({ ...filters, viewMode, page: 0 });
  };

  const handleFilterChange = (key: keyof AlertSearchRequest, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined, page: 0 });
  };

  const handleTagsChange = (tags: string[]) => {
    onFiltersChange({ ...filters, tags: tags.length > 0 ? tags : undefined, page: 0 });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      viewMode: filters.viewMode,
      page: 0,
      size: filters.size || 20,
    });
  };

  const hasActiveFilters = !!(
    filters.status ||
    filters.alertType ||
    filters.priority ||
    filters.startDate ||
    filters.endDate ||
    filters.searchText ||
    filters.userId ||
    (filters.tags && filters.tags.length > 0)
  );

  const activeFilterCount = [
    filters.status,
    filters.alertType,
    filters.priority,
    filters.startDate,
    filters.endDate,
    filters.searchText,
    filters.userId,
    filters.tags?.length,
  ].filter(Boolean).length;

  const getTypeLabel = (config: AlertTypeConfig): string => {
    return lang === 'en' ? config.labelEn : config.labelEs;
  };

  return (
    <Box
      bg={colors.cardBg}
      borderRadius="lg"
      borderWidth={1}
      borderColor={colors.borderColor}
      overflow="hidden"
    >
      {/* View Mode Tabs */}
      <Flex
        borderBottomWidth={1}
        borderColor={colors.borderColor}
        bg={colors.bgColor}
        p={2}
        gap={3}
        flexWrap="wrap"
        align="center"
      >
        <Text fontSize="sm" fontWeight="600" color={colors.textColorSecondary}>
          {t('alerts.filters.viewMode', 'Vista')}:
        </Text>
        <HStack gap={1} flex={1} flexWrap="wrap">
          <Button
            size="sm"
            variant={filters.viewMode === 'ASSIGNED_TO_ME' ? 'solid' : 'ghost'}
            bg={filters.viewMode === 'ASSIGNED_TO_ME' ? colors.primaryColor : 'transparent'}
            color={filters.viewMode === 'ASSIGNED_TO_ME' ? 'white' : colors.textColor}
            leftIcon={<FiUser />}
            onClick={() => handleViewModeChange('ASSIGNED_TO_ME')}
            _hover={{ bg: filters.viewMode === 'ASSIGNED_TO_ME' ? colors.primaryColor : colors.activeBg }}
          >
            {t('alerts.filters.assignedToMe', 'Asignadas a mí')}
            {counts?.assignedToMe !== undefined && (
              <Badge ml={1} colorPalette="blue" fontSize="xs">
                {counts.assignedToMe}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={filters.viewMode === 'ASSIGNED_BY_ME' ? 'solid' : 'ghost'}
            bg={filters.viewMode === 'ASSIGNED_BY_ME' ? colors.primaryColor : 'transparent'}
            color={filters.viewMode === 'ASSIGNED_BY_ME' ? 'white' : colors.textColor}
            leftIcon={<FiUsers />}
            onClick={() => handleViewModeChange('ASSIGNED_BY_ME')}
            _hover={{ bg: filters.viewMode === 'ASSIGNED_BY_ME' ? colors.primaryColor : colors.activeBg }}
          >
            {t('alerts.filters.assignedByMe', 'Asignadas por mí')}
            {counts?.assignedByMe !== undefined && (
              <Badge ml={1} colorPalette="purple" fontSize="xs">
                {counts.assignedByMe}
              </Badge>
            )}
          </Button>

          {showAllOption && (
            <Button
              size="sm"
              variant={filters.viewMode === 'ALL' ? 'solid' : 'ghost'}
              bg={filters.viewMode === 'ALL' ? colors.primaryColor : 'transparent'}
              color={filters.viewMode === 'ALL' ? 'white' : colors.textColor}
              leftIcon={<FiGlobe />}
              onClick={() => handleViewModeChange('ALL')}
              _hover={{ bg: filters.viewMode === 'ALL' ? colors.primaryColor : colors.activeBg }}
            >
              {t('alerts.filters.all', 'Todas')}
            </Button>
          )}

          {/* User Filter - visible when in ALL mode */}
          {showAllOption && filters.viewMode === 'ALL' && (
            <Box minW="180px" ml={2}>
              <NativeSelectRoot size="sm">
                <NativeSelectField
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  bg={colors.cardBg}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                >
                  <option value="">{t('alerts.filters.allUsers', 'Todos los usuarios')}</option>
                  {users.length === 0 ? (
                    <option value="" disabled>{t('alerts.filters.loadingUsers', 'Cargando usuarios...')}</option>
                  ) : (
                    users.map((user) => (
                      <option key={user.username} value={user.username}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))
                  )}
                </NativeSelectField>
              </NativeSelectRoot>
            </Box>
          )}
        </HStack>

        {counts?.overdue !== undefined && counts.overdue > 0 && (
          <Badge colorPalette="red" fontSize="sm" px={2} py={1}>
            {counts.overdue} {t('alerts.overdue', 'vencidas')}
          </Badge>
        )}
      </Flex>

      {/* Search Bar */}
      <HStack p={3} gap={2} flexWrap="wrap">
        <Box flex={1} position="relative" minW="200px">
          <Input
            placeholder={t('alerts.filters.searchPlaceholder', 'Buscar por título, descripción o cliente...')}
            value={filters.searchText || ''}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            bg={colors.bgColor}
            borderColor={colors.borderColor}
            color={colors.textColor}
            pl={10}
          />
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
            <FiSearch color={colors.textColorSecondary} />
          </Box>
        </Box>

        <Button
          leftIcon={<FiFilter />}
          variant="outline"
          borderColor={colors.borderColor}
          color={colors.textColor}
          onClick={() => setExpanded(!expanded)}
          rightIcon={expanded ? <FiChevronUp /> : <FiChevronDown />}
        >
          {t('alerts.filters.filters', 'Filtros')}
          {activeFilterCount > 0 && (
            <Badge ml={1} colorPalette="blue" borderRadius="full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Hide Completed Toggle */}
        <Checkbox.Root
          checked={filters.hideCompleted || false}
          onCheckedChange={(e) => handleFilterChange('hideCompleted', e.checked ? true : undefined)}
          colorPalette="green"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>
            <Text fontSize="sm" color={colors.textColor}>
              {t('alerts.filters.hideCompleted', 'Ocultar completadas')}
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>

        <Button
          colorPalette="blue"
          onClick={onSearch}
          loading={loading}
          leftIcon={<FiSearch />}
        >
          {t('alerts.filters.search', 'Buscar')}
        </Button>
      </HStack>

      {/* Expanded Filters */}
      <Collapsible.Root open={expanded}>
        <Collapsible.Content>
        <Box p={4} borderTopWidth={1} borderColor={colors.borderColor} bg={colors.bgColor}>
          <VStack align="stretch" gap={4}>
            {/* First Row: User Filter (for admins), Status, Type, Priority */}
            <HStack gap={4} flexWrap="wrap">
              {/* User Filter - visible for admin/supervisor/manager roles */}
              {showAllOption && (
                <Box flex={1} minW="200px">
                  <Text fontSize="sm" color={colors.textColor} mb={1}>
                    <FiUser style={{ display: 'inline', marginRight: '4px' }} />
                    {t('alerts.filters.user', 'Usuario')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={filters.userId || ''}
                      onChange={(e) => handleFilterChange('userId', e.target.value)}
                      bg={colors.cardBg}
                      borderColor={colors.borderColor}
                      color={colors.textColor}
                    >
                      <option value="">{t('alerts.filters.allUsers', 'Todos los usuarios')}</option>
                      {users.length === 0 ? (
                        <option value="" disabled>{t('alerts.filters.loadingUsers', 'Cargando...')}</option>
                      ) : (
                        users.map((user) => (
                          <option key={user.username} value={user.username}>
                            {user.firstName} {user.lastName}
                          </option>
                        ))
                      )}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              )}

              <Box flex={1} minW="150px">
                <Text fontSize="sm" color={colors.textColor} mb={1}>
                  {t('alerts.filters.status', 'Estado')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value as AlertStatus)}
                    bg={colors.cardBg}
                    borderColor={colors.borderColor}
                    color={colors.textColor}
                  >
                    <option value="">{t('alerts.filters.allStatuses', 'Todos los estados')}</option>
                    <option value="PENDING">{t('alerts.status.pending', 'Pendiente')}</option>
                    <option value="IN_PROGRESS">{t('alerts.status.inProgress', 'En progreso')}</option>
                    <option value="COMPLETED">{t('alerts.status.completed', 'Completada')}</option>
                    <option value="SNOOZED">{t('alerts.status.snoozed', 'Pospuesta')}</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              <Box flex={1} minW="150px">
                <Text fontSize="sm" color={colors.textColor} mb={1}>
                  {t('alerts.filters.type', 'Tipo')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={filters.alertType || ''}
                    onChange={(e) => handleFilterChange('alertType', e.target.value as AlertType)}
                    bg={colors.cardBg}
                    borderColor={colors.borderColor}
                    color={colors.textColor}
                  >
                    <option value="">{t('alerts.filters.allTypes', 'Todos los tipos')}</option>
                    {alertTypes.map((type) => (
                      <option key={type.typeCode} value={type.typeCode}>
                        {getTypeLabel(type)}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              <Box flex={1} minW="150px">
                <Text fontSize="sm" color={colors.textColor} mb={1}>
                  {t('alerts.filters.priority', 'Prioridad')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={filters.priority || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value as AlertPriority)}
                    bg={colors.cardBg}
                    borderColor={colors.borderColor}
                    color={colors.textColor}
                  >
                    <option value="">{t('alerts.filters.allPriorities', 'Todas las prioridades')}</option>
                    <option value="URGENT">{t('alerts.priority.urgent', 'Urgente')}</option>
                    <option value="HIGH">{t('alerts.priority.high', 'Alta')}</option>
                    <option value="NORMAL">{t('alerts.priority.normal', 'Normal')}</option>
                    <option value="LOW">{t('alerts.priority.low', 'Baja')}</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>
            </HStack>

            {/* Second Row: Dates */}
            <HStack gap={4} flexWrap="wrap">
              <Box flex={1} minW="150px">
                <Text fontSize="sm" color={colors.textColor} mb={1}>
                  {t('alerts.filters.startDate', 'Desde')}
                </Text>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  bg={colors.cardBg}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>

              <Box flex={1} minW="150px">
                <Text fontSize="sm" color={colors.textColor} mb={1}>
                  {t('alerts.filters.endDate', 'Hasta')}
                </Text>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  bg={colors.cardBg}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>

              <Box flex={2} minW="200px">
                <Text fontSize="sm" color={colors.textColor} mb={1}>
                  {t('alerts.filters.tags', 'Etiquetas')}
                </Text>
                <TagSelector
                  selectedTags={filters.tags || []}
                  onChange={handleTagsChange}
                  size="sm"
                />
              </Box>
            </HStack>

            {/* Quick Date Buttons */}
            <HStack gap={2} flexWrap="wrap">
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t('alerts.filters.quickDates', 'Fechas rápidas')}:
              </Text>
              {[
                { key: 'today', label: t('alerts.today', 'Hoy'), days: 0 },
                { key: 'week', label: t('alerts.thisWeek', 'Esta semana'), days: 7 },
                { key: 'month', label: t('alerts.thisMonth', 'Este mes'), days: 30 },
                { key: 'all', label: t('alerts.filters.allTime', 'Todo'), days: -1 },
              ].map(({ key, label, days }) => (
                <Button
                  key={key}
                  size="xs"
                  variant="outline"
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                  onClick={() => {
                    if (days === -1) {
                      handleFilterChange('startDate', undefined);
                      handleFilterChange('endDate', undefined);
                    } else {
                      const today = new Date();
                      const start = days === 0 ? today : new Date(today.setDate(today.getDate() - days));
                      handleFilterChange('startDate', new Date().toISOString().split('T')[0]);
                      handleFilterChange('endDate', days === 0
                        ? new Date().toISOString().split('T')[0]
                        : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                    }
                  }}
                >
                  {label}
                </Button>
              ))}
            </HStack>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Flex justify="flex-end">
                <Button
                  size="sm"
                  variant="ghost"
                  color="red.500"
                  leftIcon={<FiX />}
                  onClick={handleClearFilters}
                >
                  {t('alerts.filters.clearFilters', 'Limpiar filtros')}
                </Button>
              </Flex>
            )}
          </VStack>
        </Box>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Flex p={2} bg={colors.bgColor} borderTopWidth={1} borderColor={colors.borderColor} flexWrap="wrap" gap={2}>
          <Text fontSize="xs" color={colors.textColorSecondary}>
            {t('alerts.filters.activeFilters', 'Filtros activos')}:
          </Text>
          {filters.userId && (
            <Badge
              colorPalette="teal"
              fontSize="xs"
              cursor="pointer"
              onClick={() => handleFilterChange('userId', undefined)}
            >
              <FiUser style={{ display: 'inline', marginRight: '4px' }} />
              {users.find(u => u.username === filters.userId)?.firstName || filters.userId}
              <FiX style={{ display: 'inline', marginLeft: '2px' }} />
            </Badge>
          )}
          {filters.status && (
            <Badge
              colorPalette="blue"
              fontSize="xs"
              cursor="pointer"
              onClick={() => handleFilterChange('status', undefined)}
            >
              {filters.status} <FiX style={{ display: 'inline', marginLeft: '2px' }} />
            </Badge>
          )}
          {filters.alertType && (
            <Badge
              colorPalette="green"
              fontSize="xs"
              cursor="pointer"
              onClick={() => handleFilterChange('alertType', undefined)}
            >
              {filters.alertType} <FiX style={{ display: 'inline', marginLeft: '2px' }} />
            </Badge>
          )}
          {filters.priority && (
            <Badge
              colorPalette="orange"
              fontSize="xs"
              cursor="pointer"
              onClick={() => handleFilterChange('priority', undefined)}
            >
              {filters.priority} <FiX style={{ display: 'inline', marginLeft: '2px' }} />
            </Badge>
          )}
          {filters.tags?.map(tag => (
            <Badge
              key={tag}
              colorPalette="purple"
              fontSize="xs"
              cursor="pointer"
              onClick={() => handleTagsChange(filters.tags?.filter(t => t !== tag) || [])}
            >
              {tag} <FiX style={{ display: 'inline', marginLeft: '2px' }} />
            </Badge>
          ))}
          {(filters.startDate || filters.endDate) && (
            <Badge
              colorPalette="cyan"
              fontSize="xs"
              cursor="pointer"
              onClick={() => {
                handleFilterChange('startDate', undefined);
                handleFilterChange('endDate', undefined);
              }}
            >
              {filters.startDate} - {filters.endDate} <FiX style={{ display: 'inline', marginLeft: '2px' }} />
            </Badge>
          )}
        </Flex>
      )}
    </Box>
  );
};

export default AlertFilters;
