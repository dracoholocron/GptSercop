/**
 * RolesAdminPanel Component
 * Professional admin panel for managing roles
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Alert,
  Input,
  SimpleGrid,
  Stat,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Checkbox,
  Textarea,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import {
  FaUserShield,
  FaSync,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaKey,
  FaSave,
  FaCheck,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { notify } from '../ui/toaster';
import { adminService, Role, Permission, CreateRoleCommand, UpdateRoleCommand } from '../../services/adminService';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface RolesAdminPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const RolesAdminPanel: React.FC<RolesAdminPanelProps> = ({
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const { t } = useTranslation();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateRoleCommand>({
    name: '',
    description: '',
    permissionCodes: [],
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [rolesResponse, permsResponse] = await Promise.all([
        adminService.getAllRoles(),
        adminService.getAllPermissions(),
      ]);
      setRoles(rolesResponse);
      setPermissions(permsResponse);
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

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      permissionCodes: [],
    });
    setIsCreateOpen(true);
  };

  // Open edit dialog
  const openEditDialog = async (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionCodes: role.permissions?.map(p => p.code) || [],
    });
    setIsEditOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  // Toggle permission in form
  const togglePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      permissionCodes: prev.permissionCodes?.includes(code)
        ? prev.permissionCodes.filter(c => c !== code)
        : [...(prev.permissionCodes || []), code],
    }));
  };

  // Create role
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      notify.error(t('common.error', 'Error'), t('roles.nameRequired', 'Role name is required'));
      return;
    }

    setSaving(true);
    try {
      await adminService.createRole(formData);
      notify.success(
        t('roles.created', 'Created'),
        t('roles.roleCreated', 'Role created successfully')
      );
      setIsCreateOpen(false);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to create role'
      );
    } finally {
      setSaving(false);
    }
  };

  // Update role
  const handleUpdate = async () => {
    if (!selectedRole || !formData.name.trim()) return;

    setSaving(true);
    try {
      const updateCommand: UpdateRoleCommand = {
        name: formData.name,
        description: formData.description,
        permissionCodes: formData.permissionCodes,
      };
      await adminService.updateRole(selectedRole.id, updateCommand);
      notify.success(
        t('roles.updated', 'Updated'),
        t('roles.roleUpdated', 'Role updated successfully')
      );
      setIsEditOpen(false);
      setSelectedRole(null);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to update role'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete role
  const handleDelete = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      await adminService.deleteRole(selectedRole.id);
      notify.success(
        t('roles.deleted', 'Deleted'),
        t('roles.roleDeleted', 'Role deleted successfully')
      );
      setIsDeleteOpen(false);
      setSelectedRole(null);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to delete role'
      );
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Get role badge color
  const getRoleBadgeColor = (roleName: string): string => {
    if (roleName === 'ROLE_ADMIN') return 'red';
    if (roleName === 'ROLE_MANAGER') return 'purple';
    if (roleName === 'ROLE_OPERATOR') return 'blue';
    return 'gray';
  };

  // DataTable columns
  const columns: DataTableColumn<Role>[] = [
    {
      key: 'name',
      label: t('roles.name', 'Name'),
      render: (role) => (
        <Badge colorPalette={getRoleBadgeColor(role.name)} size="lg">
          {role.name.replace('ROLE_', '')}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: t('roles.description', 'Description'),
      render: (role) => (
        <Text color="gray.600">{role.description || '-'}</Text>
      ),
    },
    {
      key: 'permissions',
      label: t('roles.permissions', 'Permissions'),
      sortable: false,
      filterable: false,
      render: (role) => (
        <Badge colorPalette="purple">
          {role.permissions?.length || 0} {t('roles.permissions', 'permissions')}
        </Badge>
      ),
    },
    {
      key: 'userCount',
      label: t('roles.users', 'Users'),
      render: (role) => (
        <Badge colorPalette="blue">
          {role.userCount || 0} {t('roles.users', 'users')}
        </Badge>
      ),
    },
  ];

  // DataTable actions
  const actions: DataTableAction<Role>[] = [
    {
      key: 'edit',
      label: t('common.edit', 'Edit'),
      icon: FaEdit,
      colorPalette: 'blue',
      onClick: (role) => openEditDialog(role),
      isDisabled: (role) => role.name === 'ROLE_ADMIN',
    },
    {
      key: 'delete',
      label: t('common.delete', 'Delete'),
      icon: FaTrash,
      colorPalette: 'red',
      onClick: (role) => openDeleteDialog(role),
      isDisabled: (role) => ['ROLE_ADMIN', 'ROLE_USER'].includes(role.name),
    },
  ];

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
          <Box p={2} borderRadius="lg" bg="green.50" color="green.600">
            <Icon fontSize="2xl"><FaUserShield /></Icon>
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">
              {t('roles.title', 'Role Management')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('roles.totalRoles', 'Total Roles')}: {roles.length}
            </Text>
          </VStack>
        </HStack>

        <HStack gap={2}>
          <Button onClick={openCreateDialog} colorPalette="green">
            <HStack gap={2}>
              <FaPlus />
              <Text>{t('roles.createRole', 'Create Role')}</Text>
            </HStack>
          </Button>
          <Button onClick={fetchData} variant="outline" colorPalette="blue">
            <HStack gap={2}>
              <FaSync />
              <Text>{t('common.refresh', 'Refresh')}</Text>
            </HStack>
          </Button>
        </HStack>
      </HStack>

      {/* Statistics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Box p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="green.500"><FaUserShield /></Icon>
                <Text>{t('roles.totalRoles', 'Total Roles')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl">{roles.length}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="purple.500"><FaKey /></Icon>
                <Text>{t('roles.totalPermissions', 'Total Permissions')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl">{permissions.length}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="blue.500"><FaUsers /></Icon>
                <Text>{t('roles.modules', 'Permission Modules')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="2xl">{Object.keys(permissionsByModule).length}</Stat.ValueText>
          </Stat.Root>
        </Box>
      </SimpleGrid>

      {/* Roles DataTable */}
      <DataTable<Role>
        data={roles}
        columns={columns}
        rowKey={(role) => String(role.id)}
        actions={actions}
        isLoading={loading}
        emptyMessage={t('roles.noRoles', 'No roles found')}
        emptyIcon={FaUserShield}
        searchPlaceholder={t('roles.searchRoles', 'Search roles...')}
        defaultPageSize={10}
      />

      {/* Create/Edit Dialog */}
      <DialogRoot
        open={isCreateOpen || isEditOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setSelectedRole(null);
          }
        }}
        placement="center"
        size="xl"
      >
        <DialogContent bg="white" borderRadius="lg" maxH="90vh" display="flex" flexDirection="column">
          <DialogHeader flexShrink={0}>
            <HStack gap={2}>
              <Icon color="green.500"><FaUserShield /></Icon>
              <DialogTitle>
                {isCreateOpen ? t('roles.createRole', 'Create Role') : t('roles.editRole', 'Edit Role')}
              </DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody overflowY="auto" flex={1}>
            <VStack gap={4} align="stretch">
              {/* Name */}
              <Box>
                <Text fontWeight="medium" mb={2}>{t('roles.name', 'Name')}</Text>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ROLE_CUSTOM"
                />
              </Box>

              {/* Description */}
              <Box>
                <Text fontWeight="medium" mb={2}>{t('roles.description', 'Description')}</Text>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('roles.descriptionPlaceholder', 'Role description...')}
                />
              </Box>

              {/* Permissions */}
              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t('roles.permissions', 'Permissions')} ({formData.permissionCodes?.length || 0})
                </Text>
                <Box
                  maxH="400px"
                  overflowY="auto"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={4}
                >
                  <VStack align="stretch" gap={4}>
                    {Object.entries(permissionsByModule).map(([module, perms]) => (
                      <Box key={module}>
                        <HStack mb={2}>
                          <Badge colorPalette="purple">{module}</Badge>
                          <Text fontSize="sm" color="gray.500">
                            ({perms.filter(p => formData.permissionCodes?.includes(p.code)).length}/{perms.length})
                          </Text>
                        </HStack>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                          {perms.map((perm) => (
                            <Checkbox.Root
                              key={perm.code}
                              checked={formData.permissionCodes?.includes(perm.code)}
                              onCheckedChange={() => togglePermission(perm.code)}
                              colorPalette="green"
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control>
                                <Checkbox.Indicator>
                                  <Icon><FaCheck /></Icon>
                                </Checkbox.Indicator>
                              </Checkbox.Control>
                              <Checkbox.Label>
                                <VStack align="start" gap={0}>
                                  <Text fontSize="sm">{perm.name}</Text>
                                  <Text fontSize="xs" color="gray.500" fontFamily="mono">
                                    {perm.code}
                                  </Text>
                                </VStack>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </SimpleGrid>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </Box>
            </VStack>
          </DialogBody>

          <DialogFooter gap={3}>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedRole(null);
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorPalette="green"
              onClick={isCreateOpen ? handleCreate : handleUpdate}
              loading={saving}
            >
              <HStack gap={2}>
                <FaSave />
                <Text>{isCreateOpen ? t('common.create', 'Create') : t('common.save', 'Save')}</Text>
              </HStack>
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Delete Confirmation Dialog */}
      <DialogRoot
        open={isDeleteOpen}
        onOpenChange={(e) => !e.open && setIsDeleteOpen(false)}
        placement="center"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="red.500"><FaTrash /></Icon>
              <DialogTitle>{t('roles.deleteRole', 'Delete Role')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <Text>
              {t('roles.deleteConfirm', 'Are you sure you want to delete this role? This action cannot be undone.')}
            </Text>
            {selectedRole && (
              <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                <HStack>
                  <Text fontWeight="bold">{t('roles.role', 'Role')}:</Text>
                  <Badge colorPalette={getRoleBadgeColor(selectedRole.name)}>
                    {selectedRole.name.replace('ROLE_', '')}
                  </Badge>
                </HStack>
              </Box>
            )}
          </DialogBody>

          <DialogFooter gap={3}>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorPalette="red" onClick={handleDelete} loading={saving}>
              <HStack gap={2}>
                <FaTrash />
                <Text>{t('common.delete', 'Delete')}</Text>
              </HStack>
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
};

export default RolesAdminPanel;
