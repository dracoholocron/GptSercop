/**
 * UsersAdminPanel Component
 * Professional admin panel for user management with SSO support
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Spinner,
  Alert,
  Input,
  NativeSelect,
  SimpleGrid,
  Stat,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Avatar,
  Checkbox,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaUsers,
  FaSync,
  FaPlus,
  FaEdit,
  FaLock,
  FaUnlock,
  FaKey,
  FaSignOutAlt,
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaCloud,
  FaDesktop,
  FaCheck,
  FaSave,
  FaTrash,
  FaEye,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { notify } from '../ui/toaster';
import { adminService } from '../../services/adminService';
import type { UserExtended, Role } from '../../services/adminService';
import { userService } from '../../services/userService';
import type { CreateUserCommand, UpdateUserCommand } from '../../services/userService';
import { participanteService } from '../../services/participantService';
import type { Participante } from '../../services/participantService';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface UsersAdminPanelProps {
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

export const UsersAdminPanel: React.FC<UsersAdminPanelProps> = ({
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserExtended[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [participants, setParticipants] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserExtended | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalRoleIds, setApprovalRoleIds] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateUserCommand>({
    username: '',
    email: '',
    password: '',
    enabled: true,
    roleIds: [],
    userType: 'INTERNAL',
    clienteId: '',
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [usersResponse, rolesResponse, participantsResponse] = await Promise.all([
        adminService.getAllUsersExtended(),
        adminService.getAllRoles(),
        participanteService.getAllParticipantes().catch(() => []), // Don't fail if participants can't be loaded
      ]);
      setUsers(usersResponse);
      setRoles(rolesResponse);
      setParticipants(participantsResponse);
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
      username: '',
      email: '',
      password: '',
      enabled: true,
      roleIds: [],
      userType: 'INTERNAL',
      clienteId: '',
    });
    setIsCreateOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (user: UserExtended) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      enabled: user.enabled,
      roleIds: user.roles.map(r => r.id),
      userType: user.userType || 'INTERNAL',
      clienteId: user.clienteId || '',
    });
    setIsEditOpen(true);
  };

  // Open detail dialog
  const openDetailDialog = (user: UserExtended) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  // Toggle role in form
  const toggleRole = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds?.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...(prev.roleIds || []), roleId],
    }));
  };

  // Create user
  const handleCreate = async () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      notify.error(t('common.error', 'Error'), t('users.requiredFields', 'Username, email and password are required'));
      return;
    }

    setSaving(true);
    try {
      await userService.createUser(formData);
      notify.success(
        t('users.created', 'Created'),
        t('users.userCreated', 'User created successfully')
      );
      setIsCreateOpen(false);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to create user'
      );
    } finally {
      setSaving(false);
    }
  };

  // Update user
  const handleUpdate = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const updateCommand: UpdateUserCommand = {
        email: formData.email,
        enabled: formData.enabled,
        roleIds: formData.roleIds,
        userType: formData.userType,
        clienteId: formData.userType === 'CLIENT' ? formData.clienteId : '',
      };
      if (formData.password) {
        updateCommand.password = formData.password;
      }

      await userService.updateUser(selectedUser.id, updateCommand);
      notify.success(
        t('users.updated', 'Updated'),
        t('users.userUpdated', 'User updated successfully')
      );
      setIsEditOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to update user'
      );
    } finally {
      setSaving(false);
    }
  };

  // Lock user
  const handleLockUser = async (user: UserExtended) => {
    try {
      await adminService.lockUser(user.id, 'Admin action');
      notify.success(
        t('users.locked', 'Locked'),
        t('users.userLocked', 'User account locked')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to lock user'
      );
    }
  };

  // Unlock user
  const handleUnlockUser = async (user: UserExtended) => {
    try {
      await adminService.unlockUser(user.id);
      notify.success(
        t('users.unlocked', 'Unlocked'),
        t('users.userUnlocked', 'User account unlocked')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to unlock user'
      );
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const newPassword = await adminService.resetUserPassword(selectedUser.id);
      setTempPassword(newPassword);
      notify.success(
        t('users.passwordReset', 'Password Reset'),
        t('users.passwordResetSuccess', 'Password has been reset')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to reset password'
      );
    } finally {
      setSaving(false);
    }
  };

  // Force logout
  const handleForceLogout = async (user: UserExtended) => {
    try {
      await adminService.forceLogout(user.id);
      notify.success(
        t('users.loggedOut', 'Logged Out'),
        t('users.forceLogoutSuccess', 'User has been logged out')
      );
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to force logout'
      );
    }
  };

  // Open approve dialog
  const openApproveDialog = (user: UserExtended) => {
    setSelectedUser(user);
    setApprovalRoleIds([]);
    setIsApproveOpen(true);
  };

  // Open reject dialog
  const openRejectDialog = (user: UserExtended) => {
    setSelectedUser(user);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  // Toggle approval role
  const toggleApprovalRole = (roleId: number) => {
    setApprovalRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Approve user
  const handleApproveUser = async () => {
    if (!selectedUser) return;

    if (approvalRoleIds.length === 0) {
      notify.error(
        t('common.error', 'Error'),
        t('users.selectAtLeastOneRole', 'Please select at least one role')
      );
      return;
    }

    setSaving(true);
    try {
      await adminService.approveUser(selectedUser.id, approvalRoleIds);
      notify.success(
        t('users.approved', 'Approved'),
        t('users.userApproved', 'User has been approved successfully')
      );
      setIsApproveOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to approve user'
      );
    } finally {
      setSaving(false);
    }
  };

  // Reject user
  const handleRejectUser = async () => {
    if (!selectedUser) return;

    if (!rejectionReason.trim()) {
      notify.error(
        t('common.error', 'Error'),
        t('users.rejectionReasonRequired', 'Please provide a reason for rejection')
      );
      return;
    }

    setSaving(true);
    try {
      await adminService.rejectUser(selectedUser.id, rejectionReason);
      notify.success(
        t('users.rejected', 'Rejected'),
        t('users.userRejected', 'User has been rejected')
      );
      setIsRejectOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      notify.error(
        t('common.error', 'Error'),
        err instanceof Error ? err.message : 'Failed to reject user'
      );
    } finally {
      setSaving(false);
    }
  };

  // Get identity provider icon
  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'AUTH0':
      case 'AZURE_AD':
      case 'GOOGLE':
      case 'COGNITO':
        return <FaCloud />;
      default:
        return <FaDesktop />;
    }
  };

  // Get user status badge
  const getUserStatusBadge = (user: UserExtended) => {
    if (user.approvalStatus === 'PENDING') {
      return <Badge colorPalette="orange">{t('users.pending', 'Pending Approval')}</Badge>;
    }
    if (user.approvalStatus === 'REJECTED') {
      return <Badge colorPalette="red">{t('users.rejected', 'Rejected')}</Badge>;
    }
    if (!user.enabled) {
      return <Badge colorPalette="gray">{t('users.disabled', 'Disabled')}</Badge>;
    }
    if (!user.accountNonLocked) {
      return <Badge colorPalette="red">{t('users.locked', 'Locked')}</Badge>;
    }
    return <Badge colorPalette="green">{t('users.active', 'Active')}</Badge>;
  };

  // Get role badge color
  const getRoleBadgeColor = (roleName: string): string => {
    if (roleName === 'ROLE_ADMIN') return 'red';
    if (roleName === 'ROLE_MANAGER') return 'purple';
    if (roleName === 'ROLE_OPERATOR') return 'blue';
    return 'gray';
  };

  // Format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  // Compute user status for filtering
  const getUserStatus = (user: UserExtended): string => {
    if (user.approvalStatus === 'PENDING') return 'pending';
    if (user.approvalStatus === 'REJECTED') return 'rejected';
    if (!user.enabled) return 'disabled';
    if (!user.accountNonLocked) return 'locked';
    return 'active';
  };

  // Augmented data with computed fields for DataTable filtering
  const tableData = useMemo(() =>
    users.map(user => ({
      ...user,
      _status: getUserStatus(user),
      _provider: user.identityProvider || 'LOCAL',
    })),
    [users],
  );

  type UserRow = typeof tableData[number];

  // DataTable columns
  const columns: DataTableColumn<UserRow>[] = useMemo(() => [
    {
      key: 'username',
      label: t('users.user', 'User'),
      sortable: true,
      filterable: false,
      render: (row) => (
        <HStack gap={2}>
          <Avatar.Root size="sm">
            {row.avatarUrl ? (
              <Avatar.Image src={row.avatarUrl} />
            ) : (
              <Avatar.Fallback name={row.name || row.username} />
            )}
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Text fontWeight="medium">{row.name || row.username}</Text>
            <Text fontSize="xs" color="gray.500">@{row.username}</Text>
          </VStack>
        </HStack>
      ),
    },
    {
      key: 'email',
      label: t('users.email', 'Email'),
      sortable: true,
      filterable: false,
      render: (row) => <Text fontSize="sm">{row.email}</Text>,
    },
    {
      key: 'roles',
      label: t('users.roles', 'Roles'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <HStack gap={1} flexWrap="wrap">
          {row.roles.slice(0, 2).map(role => (
            <Badge key={role.id} colorPalette={getRoleBadgeColor(role.name)} size="sm">
              {role.name.replace('ROLE_', '')}
            </Badge>
          ))}
          {row.roles.length > 2 && (
            <Badge colorPalette="gray" size="sm">+{row.roles.length - 2}</Badge>
          )}
        </HStack>
      ),
    },
    {
      key: '_provider',
      label: t('users.provider', 'Provider'),
      sortable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'LOCAL', label: 'Local' },
        { value: 'AUTH0', label: 'Auth0' },
        { value: 'AZURE_AD', label: 'Azure AD' },
        { value: 'GOOGLE', label: 'Google' },
        { value: 'COGNITO', label: 'Cognito' },
      ],
      render: (row) => (
        <HStack gap={1}>
          <Icon color={row._provider !== 'LOCAL' ? 'purple.500' : 'gray.500'}>
            {getProviderIcon(row.identityProvider)}
          </Icon>
          <Text fontSize="sm">{row._provider}</Text>
        </HStack>
      ),
    },
    {
      key: '_status',
      label: t('users.status', 'Status'),
      sortable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: t('users.active', 'Active') },
        { value: 'pending', label: t('users.pending', 'Pending Approval') },
        { value: 'locked', label: t('users.locked', 'Locked') },
        { value: 'disabled', label: t('users.disabled', 'Disabled') },
        { value: 'rejected', label: t('users.rejected', 'Rejected') },
      ],
      render: (row) => getUserStatusBadge(row),
    },
    {
      key: 'lastLogin',
      label: t('users.lastLogin', 'Last Login'),
      sortable: true,
      filterable: false,
      render: (row) => (
        <Text fontSize="sm" color="gray.600">
          {formatDate(row.lastLogin || row.lastSsoLogin)}
        </Text>
      ),
    },
  ], [t]);

  // DataTable actions
  const tableActions: DataTableAction<UserRow>[] = useMemo(() => [
    {
      key: 'approve',
      label: t('users.approve', 'Approve'),
      icon: FaCheckCircle,
      colorPalette: 'green',
      onClick: (row) => openApproveDialog(row),
      isHidden: (row) => row.approvalStatus !== 'PENDING',
    },
    {
      key: 'reject',
      label: t('users.reject', 'Reject'),
      icon: FaTimesCircle,
      colorPalette: 'red',
      onClick: (row) => openRejectDialog(row),
      isHidden: (row) => row.approvalStatus !== 'PENDING',
    },
    {
      key: 'view',
      label: t('users.viewDetails', 'View Details'),
      icon: FaEye,
      onClick: (row) => openDetailDialog(row),
    },
    {
      key: 'edit',
      label: t('users.edit', 'Edit'),
      icon: FaEdit,
      colorPalette: 'blue',
      onClick: (row) => openEditDialog(row),
    },
    {
      key: 'lock',
      label: t('users.lock', 'Lock'),
      icon: FaLock,
      colorPalette: 'red',
      onClick: (row) => handleLockUser(row),
      isHidden: (row) => row.approvalStatus === 'PENDING' || !row.accountNonLocked,
    },
    {
      key: 'unlock',
      label: t('users.unlock', 'Unlock'),
      icon: FaUnlock,
      colorPalette: 'green',
      onClick: (row) => handleUnlockUser(row),
      isHidden: (row) => row.approvalStatus === 'PENDING' || row.accountNonLocked,
    },
    {
      key: 'resetPassword',
      label: t('users.resetPassword', 'Reset Password'),
      icon: FaKey,
      colorPalette: 'orange',
      onClick: (row) => {
        setSelectedUser(row);
        setTempPassword(null);
        setIsResetPasswordOpen(true);
      },
      isHidden: (row) => row.approvalStatus === 'PENDING' || (!!row.identityProvider && row.identityProvider !== 'LOCAL'),
    },
    {
      key: 'forceLogout',
      label: t('users.forceLogout', 'Force Logout'),
      icon: FaSignOutAlt,
      colorPalette: 'purple',
      onClick: (row) => handleForceLogout(row),
      isHidden: (row) => row.approvalStatus === 'PENDING',
    },
  ], [t]);

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.enabled && u.accountNonLocked && u.approvalStatus !== 'PENDING').length,
    locked: users.filter(u => !u.accountNonLocked).length,
    pending: users.filter(u => u.approvalStatus === 'PENDING').length,
    sso: users.filter(u => u.identityProvider && u.identityProvider !== 'LOCAL').length,
    local: users.filter(u => !u.identityProvider || u.identityProvider === 'LOCAL').length,
  };

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
          <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
            <Icon fontSize="2xl"><FaUsers /></Icon>
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">
              {t('users.title', 'User Management')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('users.totalUsers', 'Total Users')}: {users.length}
            </Text>
          </VStack>
        </HStack>

        <HStack gap={2}>
          <Button onClick={fetchData} variant="outline" colorPalette="gray">
            <Icon mr={2}><FaSync /></Icon>
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button colorPalette="blue" onClick={openCreateDialog}>
            <Icon mr={2}><FaPlus /></Icon>
            {t('users.createUser', 'Create User')}
          </Button>
        </HStack>
      </HStack>

      {/* Statistics */}
      <SimpleGrid columns={{ base: 2, md: 6 }} gap={4}>
        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="blue.500"><FaUsers /></Icon>
                <Text fontSize="xs">{t('users.totalUsers', 'Total')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="xl">{stats.total}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="green.500"><FaCheckCircle /></Icon>
                <Text fontSize="xs">{t('users.active', 'Active')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="xl">{stats.active}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={stats.pending > 0 ? 'orange.50' : COLORS.bg} borderRadius="lg" border="1px solid" borderColor={stats.pending > 0 ? 'orange.200' : COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="orange.500"><FaUserShield /></Icon>
                <Text fontSize="xs">{t('users.pendingApproval', 'Pending')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="xl" color={stats.pending > 0 ? 'orange.600' : undefined}>
              {stats.pending}
            </Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="red.500"><FaLock /></Icon>
                <Text fontSize="xs">{t('users.locked', 'Locked')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="xl">{stats.locked}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="purple.500"><FaCloud /></Icon>
                <Text fontSize="xs">{t('users.sso', 'SSO')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="xl">{stats.sso}</Stat.ValueText>
          </Stat.Root>
        </Box>

        <Box p={4} bg={COLORS.bg} borderRadius="lg" border="1px solid" borderColor={COLORS.border}>
          <Stat.Root>
            <Stat.Label>
              <HStack gap={2}>
                <Icon color="gray.500"><FaDesktop /></Icon>
                <Text fontSize="xs">{t('users.local', 'Local')}</Text>
              </HStack>
            </Stat.Label>
            <Stat.ValueText fontSize="xl">{stats.local}</Stat.ValueText>
          </Stat.Root>
        </Box>
      </SimpleGrid>

      {/* Users Table */}
      <DataTable<UserRow>
        data={tableData}
        columns={columns}
        rowKey={(row) => String(row.id)}
        actions={tableActions}
        emptyMessage={t('users.noUsers', 'No users found')}
        emptyIcon={FaUsers}
        defaultPageSize={10}
        searchPlaceholder={t('users.searchUsers', 'Search users...')}
      />

      {/* Create/Edit User Dialog */}
      <DialogRoot
        open={isCreateOpen || isEditOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setSelectedUser(null);
          }
        }}
        placement="center"
        size="lg"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="blue.500"><FaUsers /></Icon>
              <DialogTitle>
                {isCreateOpen ? t('users.createUser', 'Create User') : t('users.editUser', 'Edit User')}
              </DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack gap={4} align="stretch">
              {/* Username */}
              <Box>
                <Text fontWeight="medium" mb={2}>{t('users.username', 'Username')}</Text>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={isEditOpen}
                  placeholder="johndoe"
                />
              </Box>

              {/* Email */}
              <Box>
                <Text fontWeight="medium" mb={2}>{t('users.email', 'Email')}</Text>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </Box>

              {/* Password */}
              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t('users.password', 'Password')}
                  {isEditOpen && <Text as="span" fontSize="sm" color="gray.500"> ({t('users.leaveBlank', 'leave blank to keep current')})</Text>}
                </Text>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={isEditOpen ? '********' : 'Password'}
                />
              </Box>

              {/* Enabled */}
              <Checkbox.Root
                checked={formData.enabled}
                onCheckedChange={(e) => setFormData(prev => ({ ...prev, enabled: !!e.checked }))}
                colorPalette="green"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator>
                    <Icon><FaCheck /></Icon>
                  </Checkbox.Indicator>
                </Checkbox.Control>
                <Checkbox.Label>{t('users.enabled', 'Enabled')}</Checkbox.Label>
              </Checkbox.Root>

              {/* Roles */}
              <Box>
                <Text fontWeight="medium" mb={2}>{t('users.roles', 'Roles')}</Text>
                <VStack align="stretch" gap={2}>
                  {roles.map((role) => (
                    <Checkbox.Root
                      key={role.id}
                      checked={formData.roleIds?.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      colorPalette="blue"
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator>
                          <Icon><FaCheck /></Icon>
                        </Checkbox.Indicator>
                      </Checkbox.Control>
                      <Checkbox.Label>
                        <HStack gap={2}>
                          <Badge colorPalette={getRoleBadgeColor(role.name)}>
                            {role.name.replace('ROLE_', '')}
                          </Badge>
                          {role.description && (
                            <Text fontSize="sm" color="gray.500">{role.description}</Text>
                          )}
                        </HStack>
                      </Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </VStack>
              </Box>

              {/* User Type */}
              <Box>
                <Text fontWeight="medium" mb={2}>{t('users.userType', 'User Type')}</Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={formData.userType || 'INTERNAL'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      userType: e.target.value as 'INTERNAL' | 'CLIENT',
                      clienteId: e.target.value === 'INTERNAL' ? '' : prev.clienteId
                    }))}
                  >
                    <option value="INTERNAL">{t('users.userTypeInternal', 'Internal User')}</option>
                    <option value="CLIENT">{t('users.userTypeClient', 'Client Portal User')}</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>

              {/* Participant Selector - Only show for CLIENT users */}
              {formData.userType === 'CLIENT' && (
                <Box>
                  <Text fontWeight="medium" mb={2}>{t('users.linkedParticipant', 'Linked Participant/Client')}</Text>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={formData.clienteId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value }))}
                    >
                      <option value="">{t('users.selectParticipant', '-- Select a participant --')}</option>
                      {participants.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.nombres} {p.apellidos} ({p.identificacion})
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                  {formData.clienteId && (
                    <Text fontSize="sm" color="green.600" mt={1}>
                      {t('users.participantLinked', 'This user will have access to the client portal')}
                    </Text>
                  )}
                </Box>
              )}
            </VStack>
          </DialogBody>

          <DialogFooter gap={3}>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedUser(null);
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorPalette="blue"
              onClick={isCreateOpen ? handleCreate : handleUpdate}
              loading={saving}
            >
              <Icon mr={2}><FaSave /></Icon>
              {isCreateOpen ? t('common.create', 'Create') : t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* User Detail Dialog */}
      <DialogRoot
        open={isDetailOpen}
        onOpenChange={(e) => !e.open && setIsDetailOpen(false)}
        placement="center"
        size="lg"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="blue.500"><FaEye /></Icon>
              <DialogTitle>{t('users.userDetails', 'User Details')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            {selectedUser && (
              <VStack align="stretch" gap={4}>
                <HStack gap={4}>
                  <Avatar.Root size="xl">
                    {selectedUser.avatarUrl ? (
                      <Avatar.Image src={selectedUser.avatarUrl} />
                    ) : (
                      <Avatar.Fallback name={selectedUser.name || selectedUser.username} />
                    )}
                  </Avatar.Root>
                  <VStack align="start" gap={1}>
                    <Text fontSize="xl" fontWeight="bold">
                      {selectedUser.name || selectedUser.username}
                    </Text>
                    <Text color="gray.500">@{selectedUser.username}</Text>
                    {getUserStatusBadge(selectedUser)}
                  </VStack>
                </HStack>

                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">{t('users.email', 'Email')}</Text>
                    <Text>{selectedUser.email}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">{t('users.provider', 'Provider')}</Text>
                    <HStack gap={2}>
                      <Icon>{getProviderIcon(selectedUser.identityProvider)}</Icon>
                      <Text>{selectedUser.identityProvider || 'LOCAL'}</Text>
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">{t('users.roles', 'Roles')}</Text>
                    <HStack gap={1} flexWrap="wrap">
                      {selectedUser.roles.map(role => (
                        <Badge key={role.id} colorPalette={getRoleBadgeColor(role.name)}>
                          {role.name.replace('ROLE_', '')}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">{t('users.externalId', 'External ID')}</Text>
                    <Text fontFamily="mono" fontSize="sm">{selectedUser.externalId || '-'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">{t('users.createdAt', 'Created At')}</Text>
                    <Text>{formatDate(selectedUser.createdAt)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">{t('users.lastLogin', 'Last Login')}</Text>
                    <Text>{formatDate(selectedUser.lastLogin || selectedUser.lastSsoLogin)}</Text>
                  </Box>
                </SimpleGrid>

                {selectedUser.loginAttempts !== undefined && selectedUser.loginAttempts > 0 && (
                  <Alert.Root status="warning" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>
                      {t('users.failedLoginAttempts', 'Failed Login Attempts')}: {selectedUser.loginAttempts}
                    </Alert.Content>
                  </Alert.Root>
                )}
              </VStack>
            )}
          </DialogBody>

          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Reset Password Dialog */}
      <DialogRoot
        open={isResetPasswordOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsResetPasswordOpen(false);
            setTempPassword(null);
            setSelectedUser(null);
          }
        }}
        placement="center"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="orange.500"><FaKey /></Icon>
              <DialogTitle>{t('users.resetPassword', 'Reset Password')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            {tempPassword ? (
              <VStack gap={4} align="stretch">
                <Alert.Root status="success" borderRadius="md">
                  <Alert.Indicator />
                  <Alert.Content>{t('users.passwordResetSuccess', 'Password has been reset successfully')}</Alert.Content>
                </Alert.Root>

                <Box p={4} bg={COLORS.infoBg} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>{t('users.temporaryPassword', 'Temporary Password')}</Text>
                  <Text fontFamily="mono" fontSize="lg" p={2} bg="white" borderRadius="md" border="1px solid" borderColor={COLORS.border}>
                    {tempPassword}
                  </Text>
                </Box>

                <Text fontSize="sm" color="gray.500">
                  {t('users.passwordResetNote', 'Please share this password securely with the user. They will be required to change it on their next login.')}
                </Text>
              </VStack>
            ) : (
              <VStack gap={4} align="stretch">
                <Text>
                  {t('users.resetPasswordConfirm', 'Are you sure you want to reset the password for this user?')}
                </Text>
                {selectedUser && (
                  <Box p={3} bg={COLORS.infoBg} borderRadius="md">
                    <HStack>
                      <Text fontWeight="bold">{t('users.user', 'User')}:</Text>
                      <Text>{selectedUser.username}</Text>
                    </HStack>
                  </Box>
                )}
              </VStack>
            )}
          </DialogBody>

          <DialogFooter gap={3}>
            {tempPassword ? (
              <Button onClick={() => {
                setIsResetPasswordOpen(false);
                setTempPassword(null);
                setSelectedUser(null);
              }}>
                {t('common.close', 'Close')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsResetPasswordOpen(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button colorPalette="orange" onClick={handleResetPassword} loading={saving}>
                  <Icon mr={2}><FaKey /></Icon>
                  {t('users.resetPassword', 'Reset Password')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Approve User Dialog */}
      <DialogRoot
        open={isApproveOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsApproveOpen(false);
            setSelectedUser(null);
            setApprovalRoleIds([]);
          }
        }}
        placement="center"
        size="lg"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="green.500"><FaCheckCircle /></Icon>
              <DialogTitle>{t('users.approveUser', 'Approve User')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack gap={4} align="stretch">
              {selectedUser && (
                <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                  <HStack gap={3}>
                    <Avatar.Root size="md">
                      {selectedUser.avatarUrl ? (
                        <Avatar.Image src={selectedUser.avatarUrl} />
                      ) : (
                        <Avatar.Fallback name={selectedUser.name || selectedUser.username} />
                      )}
                    </Avatar.Root>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold">{selectedUser.name || selectedUser.username}</Text>
                      <Text fontSize="sm" color="gray.600">{selectedUser.email}</Text>
                      {selectedUser.identityProvider && (
                        <Badge colorPalette="purple" size="sm">{selectedUser.identityProvider}</Badge>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              )}

              <Box>
                <Text fontWeight="medium" mb={3}>
                  {t('users.selectRoles', 'Select roles for this user')}:
                </Text>
                <VStack align="stretch" gap={2}>
                  {roles.map((role) => (
                    <Checkbox.Root
                      key={role.id}
                      checked={approvalRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleApprovalRole(role.id)}
                      colorPalette="green"
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator>
                          <Icon><FaCheck /></Icon>
                        </Checkbox.Indicator>
                      </Checkbox.Control>
                      <Checkbox.Label>
                        <HStack gap={2}>
                          <Badge colorPalette={getRoleBadgeColor(role.name)}>
                            {role.name.replace('ROLE_', '')}
                          </Badge>
                          {role.description && (
                            <Text fontSize="sm" color="gray.500">{role.description}</Text>
                          )}
                        </HStack>
                      </Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </VStack>
              </Box>

              <Alert.Root status="info" borderRadius="md">
                <Alert.Indicator />
                <Alert.Content>
                  {t('users.approvalNote', 'The user will be notified and granted access to the system with the selected roles.')}
                </Alert.Content>
              </Alert.Root>
            </VStack>
          </DialogBody>

          <DialogFooter gap={3}>
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorPalette="green"
              onClick={handleApproveUser}
              loading={saving}
              disabled={approvalRoleIds.length === 0}
            >
              <Icon mr={2}><FaCheckCircle /></Icon>
              {t('users.approve', 'Approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Reject User Dialog */}
      <DialogRoot
        open={isRejectOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsRejectOpen(false);
            setSelectedUser(null);
            setRejectionReason('');
          }
        }}
        placement="center"
      >
        <DialogContent bg="white" borderRadius="lg">
          <DialogHeader>
            <HStack gap={2}>
              <Icon color="red.500"><FaTimesCircle /></Icon>
              <DialogTitle>{t('users.rejectUser', 'Reject User')}</DialogTitle>
            </HStack>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack gap={4} align="stretch">
              {selectedUser && (
                <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                  <HStack gap={3}>
                    <Avatar.Root size="md">
                      {selectedUser.avatarUrl ? (
                        <Avatar.Image src={selectedUser.avatarUrl} />
                      ) : (
                        <Avatar.Fallback name={selectedUser.name || selectedUser.username} />
                      )}
                    </Avatar.Root>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold">{selectedUser.name || selectedUser.username}</Text>
                      <Text fontSize="sm" color="gray.600">{selectedUser.email}</Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t('users.rejectionReason', 'Reason for rejection')}:
                </Text>
                <Input
                  as="textarea"
                  value={rejectionReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectionReason(e.target.value)}
                  placeholder={t('users.rejectionReasonPlaceholder', 'Please provide a reason for rejecting this user request...')}
                  minH="100px"
                />
              </Box>

              <Alert.Root status="warning" borderRadius="md">
                <Alert.Indicator />
                <Alert.Content>
                  {t('users.rejectionWarning', 'The user will be notified that their access request has been rejected.')}
                </Alert.Content>
              </Alert.Root>
            </VStack>
          </DialogBody>

          <DialogFooter gap={3}>
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorPalette="red"
              onClick={handleRejectUser}
              loading={saving}
              disabled={!rejectionReason.trim()}
            >
              <Icon mr={2}><FaTimesCircle /></Icon>
              {t('users.reject', 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
};

export default UsersAdminPanel;
