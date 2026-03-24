/**
 * PermissionsAdminPanel Component
 * Professional admin panel for managing permissions
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Table,
  Badge,
  Spinner,
  Alert,
  NativeSelect,
  SimpleGrid,
  Stat,
  Checkbox,
  Tabs,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaShieldAlt,
  FaSync,
  FaSave,
  FaKey,
  FaUserShield,
  FaLayerGroup,
  FaCheck,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { notify } from '../ui/toaster';
import { adminService, Permission, PermissionModule, PermissionMatrix, Role } from '../../services/adminService';
import { DataTable, type DataTableColumn } from '../ui/DataTable';

interface PermissionsAdminPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const COLORS = {
  bg: 'white',
  border: 'gray.200',
  headerBg: 'gray.50',
  hoverBg: 'gray.50',
  infoBg: 'gray.50',
};

export const PermissionsAdminPanel: React.FC<PermissionsAdminPanelProps> = ({
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const { t } = useTranslation();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<number, Set<string>>>(new Map());
  const [activeTab, setActiveTab] = useState('matrix');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [permsResponse, modulesResponse, matrixResponse, rolesResponse] = await Promise.all([
        adminService.getAllPermissions(),
        adminService.getPermissionsByModule(),
        adminService.getPermissionMatrix(),
        adminService.getAllRoles(),
      ]);
      setPermissions(permsResponse);
      setModules(modulesResponse);
      setMatrix(matrixResponse);
      setRoles(rolesResponse);

      // Initialize pending changes with current state
      const initialChanges = new Map<number, Set<string>>();
      matrixResponse.roles.forEach(role => {
        initialChanges.set(role.roleId, new Set(role.permissionCodes));
      });
      setPendingChanges(initialChanges);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Toggle permission for role
  const togglePermission = (roleId: number, permissionCode: string) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const rolePerms = new Set(newMap.get(roleId) || []);

      if (rolePerms.has(permissionCode)) {
        rolePerms.delete(permissionCode);
      } else {
        rolePerms.add(permissionCode);
      }

      newMap.set(roleId, rolePerms);
      return newMap;
    });
  };

  // Check if a role has permission (from pending changes)
  const hasPermission = (roleId: number, permissionCode: string): boolean => {
    return pendingChanges.get(roleId)?.has(permissionCode) || false;
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!matrix) return false;

    for (const role of matrix.roles) {
      const current = new Set(role.permissionCodes);
      const pending = pendingChanges.get(role.roleId);

      if (!pending) continue;

      if (current.size !== pending.size) return true;
      for (const perm of current) {
        if (!pending.has(perm)) return true;
      }
    }
    return false;
  };

  // Save changes for a role
  const saveRoleChanges = async (roleId: number) => {
    const rolePerms = pendingChanges.get(roleId);
    if (!rolePerms) return;

    setSaving(true);
    try {
      await adminService.syncRolePermissions(roleId, Array.from(rolePerms));
      notify.success(
        t('permissions.saved', 'Saved'),
        t('permissions.permissionsSaved', 'Permissions saved successfully')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to save permissions'
      );
    } finally {
      setSaving(false);
    }
  };

  // Save all changes
  const saveAllChanges = async () => {
    if (!matrix) return;

    setSaving(true);
    try {
      for (const role of matrix.roles) {
        const rolePerms = pendingChanges.get(role.roleId);
        if (rolePerms) {
          const current = new Set(role.permissionCodes);
          const isDifferent = current.size !== rolePerms.size ||
            Array.from(current).some(p => !rolePerms.has(p));

          if (isDifferent) {
            await adminService.syncRolePermissions(role.roleId, Array.from(rolePerms));
          }
        }
      }
      notify.success(
        t('permissions.saved', 'Saved'),
        t('permissions.allPermissionsSaved', 'All permissions saved successfully')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to save permissions'
      );
    } finally {
      setSaving(false);
    }
  };

  // Filter permissions (used by matrix tab)
  const filteredPermissions = permissions.filter(perm => {
    return !filterModule || perm.module === filterModule;
  });

  // Get unique modules
  const uniqueModules = [...new Set(permissions.map(p => p.module))];

  // Columns for the permission list DataTable
  const permissionListColumns = useMemo<DataTableColumn<Permission>[]>(() => [
    {
      key: 'code',
      label: t('permissions.code', 'Code'),
      render: (row) => <Text fontFamily="mono" fontSize="sm">{row.code}</Text>,
    },
    {
      key: 'name',
      label: t('permissions.name', 'Name'),
      render: (row) => <Text fontWeight="medium">{row.name}</Text>,
    },
    {
      key: 'module',
      label: t('permissions.module', 'Module'),
      filterType: 'select',
      filterOptions: uniqueModules.map(mod => ({ value: mod, label: mod })),
      render: (row) => <Badge colorPalette="purple">{row.module}</Badge>,
    },
    {
      key: 'description',
      label: t('permissions.description', 'Description'),
      render: (row) => (
        <Text color="gray.600" fontSize="sm">
          {row.description || '-'}
        </Text>
      ),
    },
  ], [t, uniqueModules]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.500">{t('common.loading', 'Loading...')}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" borderRadius="lg">
        <Alert.Indicator />
        <Alert.Content>{error}</Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="purple.50" color="purple.600">
            <Icon fontSize="2xl"><FaShieldAlt /></Icon>
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">
              {t('permissions.title', 'Permission Management')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('permissions.totalPermissions', 'Total Permissions')}: {permissions.length}
            </Text>
          </VStack>
        </HStack>

        <HStack gap={2}>
          {hasUnsavedChanges() && (
            <Button
              onClick={saveAllChanges}
              colorPalette="green"
              loading={saving}
            >
              <Icon mr={2}><FaSave /></Icon>
              {t('common.saveAll', 'Save All')}
            </Button>
          )}
          <Button onClick={fetchData} variant="outline" colorPalette="blue">
            <Icon mr={2}><FaSync /></Icon>
            {t('common.refresh', 'Refresh')}
          </Button>
        </HStack>
      </HStack>

      {/* Statistics */}
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="purple.500"><FaKey /></Icon>
                <Text>{t('permissions.totalPermissions', 'Total Permissions')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl">{permissions.length}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="blue.500"><FaLayerGroup /></Icon>
                <Text>{t('permissions.modules', 'Modules')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl">{modules.length}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="green.500"><FaUserShield /></Icon>
                <Text>{t('permissions.roles', 'Roles')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl">{roles.length}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="orange.500"><FaSave /></Icon>
                <Text>{t('permissions.pendingChanges', 'Pending Changes')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl" color={hasUnsavedChanges() ? 'orange.500' : 'gray.500'}>
              {hasUnsavedChanges() ? t('common.yes', 'Yes') : t('common.no', 'No')}
            </Stat.ValueText>
          </Stat.Root>
        </Box>
      </SimpleGrid>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Tabs.List>
          <Tabs.Trigger value="matrix">{t('permissions.matrix', 'Permission Matrix')}</Tabs.Trigger>
          <Tabs.Trigger value="list">{t('permissions.list', 'Permission List')}</Tabs.Trigger>
          <Tabs.Trigger value="byModule">{t('permissions.byModule', 'By Module')}</Tabs.Trigger>
        </Tabs.List>

        {/* Matrix Tab */}
        <Tabs.Content value="matrix">
          <VStack gap={4} align="stretch" pt={4}>
            {/* Filters */}
            <HStack gap={4}>
              <NativeSelect.Root maxW="250px">
                <NativeSelect.Field
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                >
                  <option value="">{t('permissions.allModules', 'All Modules')}</option>
                  {uniqueModules.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>

              <NativeSelect.Root maxW="250px">
                <NativeSelect.Field
                  value={selectedRole?.toString() || ''}
                  onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">{t('permissions.allRoles', 'All Roles')}</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </HStack>

            {/* Matrix Table */}
            <Box
              bg={COLORS.bg}
              borderRadius="lg"
              border="1px solid"
              borderColor={COLORS.border}
              overflowX="auto"
            >
              <Table.Root variant="simple" size="sm">
                <Table.Header bg={COLORS.headerBg}>
                  <Table.Row>
                    <Table.ColumnHeader position="sticky" left={0} bg={COLORS.headerBg} minW="200px">
                      {t('permissions.permission', 'Permission')}
                    </Table.ColumnHeader>
                    {matrix?.roles
                      .filter(r => !selectedRole || r.roleId === selectedRole)
                      .map(role => (
                        <Table.ColumnHeader key={role.roleId} textAlign="center" minW="120px">
                          <VStack gap={1}>
                            <Text>{role.roleName.replace('ROLE_', '')}</Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorPalette="green"
                              onClick={() => saveRoleChanges(role.roleId)}
                              loading={saving}
                            >
                              <Icon><FaSave /></Icon>
                            </Button>
                          </VStack>
                        </Table.ColumnHeader>
                      ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredPermissions.map((perm) => (
                    <Table.Row key={perm.code} _hover={{ bg: COLORS.hoverBg }}>
                      <Table.Cell position="sticky" left={0} bg="white" borderRight="1px solid" borderColor={COLORS.border}>
                        <VStack align="start" gap={0}>
                          <HStack gap={2}>
                            <Badge colorPalette="purple" size="sm">{perm.module}</Badge>
                            <Text fontWeight="medium" fontSize="sm">{perm.name}</Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500" fontFamily="mono">
                            {perm.code}
                          </Text>
                        </VStack>
                      </Table.Cell>
                      {matrix?.roles
                        .filter(r => !selectedRole || r.roleId === selectedRole)
                        .map(role => (
                          <Table.Cell key={role.roleId} textAlign="center">
                            <Checkbox.Root
                              checked={hasPermission(role.roleId, perm.code)}
                              onCheckedChange={() => togglePermission(role.roleId, perm.code)}
                              colorPalette="green"
                              disabled={role.roleName === 'ROLE_ADMIN'}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control>
                                <Checkbox.Indicator>
                                  <Icon><FaCheck /></Icon>
                                </Checkbox.Indicator>
                              </Checkbox.Control>
                            </Checkbox.Root>
                          </Table.Cell>
                        ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </VStack>
        </Tabs.Content>

        {/* List Tab */}
        <Tabs.Content value="list">
          <Box pt={4}>
            <DataTable<Permission>
              data={permissions}
              columns={permissionListColumns}
              rowKey={(row) => row.code}
              isLoading={false}
              emptyMessage={t('permissions.noPermissions', 'No permissions found')}
              defaultPageSize={10}
              searchPlaceholder={t('common.search', 'Search...')}
            />
          </Box>
        </Tabs.Content>

        {/* By Module Tab */}
        <Tabs.Content value="byModule">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} pt={4}>
            {modules.map((mod) => (
              <Box
                key={mod.module}
                bg={COLORS.bg}
                borderRadius="lg"
                border="1px solid"
                borderColor={COLORS.border}
                overflow="hidden"
              >
                <Box bg={COLORS.headerBg} p={4} borderBottom="1px solid" borderColor={COLORS.border}>
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <Icon color="purple.500"><FaLayerGroup /></Icon>
                      <Text fontWeight="bold">{mod.module}</Text>
                    </HStack>
                    <Badge colorPalette="blue">{mod.permissions.length}</Badge>
                  </HStack>
                </Box>
                <VStack align="stretch" p={4} gap={2}>
                  {mod.permissions.map((perm) => (
                    <HStack key={perm.code} justify="space-between" p={2} bg={COLORS.infoBg} borderRadius="md">
                      <VStack align="start" gap={0}>
                        <Text fontWeight="medium" fontSize="sm">{perm.name}</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="mono">{perm.code}</Text>
                      </VStack>
                      <Icon color="green.500"><FaCheck /></Icon>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
};

export default PermissionsAdminPanel;
