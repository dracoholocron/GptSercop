import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  Badge,
  Button,
  Input,
  Textarea,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  DialogBackdrop,
  Tabs,
} from '@chakra-ui/react';
import { Switch } from '@chakra-ui/react/switch';
import {
  FiUserCheck,
  FiShield,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { notify } from '../../../components/ui/toaster';
import { scheduleExemptionService } from '../../../services/scheduleExemptionService';
import type { ExemptUser, ExemptRole } from '../../../services/scheduleExemptionService';
import { get } from '../../../utils/apiClient';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../../components/ui/DataTable';

interface User {
  id: number;
  username: string;
  email: string;
}

interface Role {
  id: number;
  name: string;
}

export const ScheduleExemptionsPage: React.FC = () => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { t } = useTranslation();

  // State
  const [exemptUsers, setExemptUsers] = useState<ExemptUser[]>([]);
  const [exemptRoles, setExemptRoles] = useState<ExemptRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // Dialog state
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ExemptUser | null>(null);
  const [editingRole, setEditingRole] = useState<ExemptRole | null>(null);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [exemptUsersData, exemptRolesData] = await Promise.all([
        scheduleExemptionService.getAllExemptUsers(),
        scheduleExemptionService.getAllExemptRoles(),
      ]);
      setExemptUsers(exemptUsersData);
      setExemptRoles(exemptRolesData);

      // Load users and roles for selection
      try {
        const usersResponse = await get('/users');
        const usersResult = await usersResponse.json();
        setUsers(usersResult.data || []);
      } catch (e) {
        console.warn('Could not load users list');
      }

      try {
        const rolesResponse = await get('/roles');
        const rolesResult = await rolesResponse.json();
        setRoles(rolesResult.data || []);
      } catch (e) {
        console.warn('Could not load roles list');
      }
    } catch (error) {
      notify({
        title: 'Error',
        description: 'Error al cargar las exenciones',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset form
  const resetForm = () => {
    setSelectedUserId('');
    setSelectedRoleId('');
    setReason('');
    setValidFrom('');
    setValidUntil('');
    setEditingUser(null);
    setEditingRole(null);
  };

  // User handlers
  const handleOpenUserDialog = (exemption?: ExemptUser) => {
    resetForm();
    if (exemption) {
      setEditingUser(exemption);
      setSelectedUserId(exemption.user.id);
      setReason(exemption.reason);
      setValidFrom(exemption.validFrom ? exemption.validFrom.split('T')[0] : '');
      setValidUntil(exemption.validUntil ? exemption.validUntil.split('T')[0] : '');
    }
    setShowUserDialog(true);
  };

  const handleSaveUser = async () => {
    if (!reason.trim()) {
      notify({ title: 'Error', description: 'La justificación es requerida', type: 'error' });
      return;
    }

    try {
      if (editingUser) {
        await scheduleExemptionService.updateExemptUser(editingUser.id, {
          reason,
          validFrom: validFrom || undefined,
          validUntil: validUntil || undefined,
        });
        notify({ title: 'Éxito', description: 'Exención actualizada', type: 'success' });
      } else {
        if (!selectedUserId) {
          notify({ title: 'Error', description: 'Seleccione un usuario', type: 'error' });
          return;
        }
        await scheduleExemptionService.createExemptUser({
          userId: selectedUserId as number,
          reason,
          validFrom: validFrom || undefined,
          validUntil: validUntil || undefined,
        });
        notify({ title: 'Éxito', description: 'Exención creada', type: 'success' });
      }
      setShowUserDialog(false);
      loadData();
    } catch (error: any) {
      notify({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta exención?')) return;
    try {
      await scheduleExemptionService.deleteExemptUser(id);
      notify({ title: 'Éxito', description: 'Exención eliminada', type: 'success' });
      loadData();
    } catch (error: any) {
      notify({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  const handleToggleUser = async (id: number) => {
    try {
      await scheduleExemptionService.toggleExemptUser(id);
      loadData();
    } catch (error: any) {
      notify({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  // Role handlers
  const handleOpenRoleDialog = (exemption?: ExemptRole) => {
    resetForm();
    if (exemption) {
      setEditingRole(exemption);
      setSelectedRoleId(exemption.role.id);
      setReason(exemption.reason);
      setValidFrom(exemption.validFrom ? exemption.validFrom.split('T')[0] : '');
      setValidUntil(exemption.validUntil ? exemption.validUntil.split('T')[0] : '');
    }
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    if (!reason.trim()) {
      notify({ title: 'Error', description: 'La justificación es requerida', type: 'error' });
      return;
    }

    try {
      if (editingRole) {
        await scheduleExemptionService.updateExemptRole(editingRole.id, {
          reason,
          validFrom: validFrom || undefined,
          validUntil: validUntil || undefined,
        });
        notify({ title: 'Éxito', description: 'Exención actualizada', type: 'success' });
      } else {
        if (!selectedRoleId) {
          notify({ title: 'Error', description: 'Seleccione un rol', type: 'error' });
          return;
        }
        await scheduleExemptionService.createExemptRole({
          roleId: selectedRoleId as number,
          reason,
          validFrom: validFrom || undefined,
          validUntil: validUntil || undefined,
        });
        notify({ title: 'Éxito', description: 'Exención creada', type: 'success' });
      }
      setShowRoleDialog(false);
      loadData();
    } catch (error: any) {
      notify({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta exención?')) return;
    try {
      await scheduleExemptionService.deleteExemptRole(id);
      notify({ title: 'Éxito', description: 'Exención eliminada', type: 'success' });
      loadData();
    } catch (error: any) {
      notify({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  const handleToggleRole = async (id: number) => {
    try {
      await scheduleExemptionService.toggleExemptRole(id);
      loadData();
    } catch (error: any) {
      notify({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sin límite';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // --- DataTable columns and actions for Users ---
  const userColumns: DataTableColumn<ExemptUser>[] = useMemo(() => [
    {
      key: 'user',
      label: 'Usuario',
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium" color={colors.textColor}>
            {row.user.username}
          </Text>
          <Text fontSize="xs" color={colors.mutedColor}>
            {row.user.email}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'reason',
      label: 'Justificación',
      render: (row) => (
        <Text fontSize="sm" color={colors.textColor} maxW="300px" truncate>
          {row.reason}
        </Text>
      ),
    },
    {
      key: 'validFrom',
      label: 'Vigencia',
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontSize="xs" color={colors.mutedColor}>
            Desde: {formatDate(row.validFrom)}
          </Text>
          <Text fontSize="xs" color={colors.mutedColor}>
            Hasta: {formatDate(row.validUntil)}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Activo' },
        { value: 'false', label: 'Inactivo' },
      ],
      render: (row) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={() => handleToggleUser(row.id)}
          colorPalette="green"
        />
      ),
    },
    {
      key: 'createdBy',
      label: 'Creado por',
      render: (row) => (
        <Text fontSize="xs" color={colors.mutedColor}>
          {row.createdBy}
        </Text>
      ),
    },
  ], [colors, handleToggleUser]);

  const userActions: DataTableAction<ExemptUser>[] = useMemo(() => [
    {
      key: 'edit',
      label: 'Editar',
      icon: FiEdit2,
      onClick: (row) => handleOpenUserDialog(row),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDeleteUser(row.id),
    },
  ], []);

  // --- DataTable columns and actions for Roles ---
  const roleColumns: DataTableColumn<ExemptRole>[] = useMemo(() => [
    {
      key: 'role',
      label: 'Rol',
      render: (row) => (
        <Badge colorPalette="purple">
          {row.role.name}
        </Badge>
      ),
    },
    {
      key: 'reason',
      label: 'Justificación',
      render: (row) => (
        <Text fontSize="sm" color={colors.textColor} maxW="300px" truncate>
          {row.reason}
        </Text>
      ),
    },
    {
      key: 'validFrom',
      label: 'Vigencia',
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontSize="xs" color={colors.mutedColor}>
            Desde: {formatDate(row.validFrom)}
          </Text>
          <Text fontSize="xs" color={colors.mutedColor}>
            Hasta: {formatDate(row.validUntil)}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Activo' },
        { value: 'false', label: 'Inactivo' },
      ],
      render: (row) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={() => handleToggleRole(row.id)}
          colorPalette="green"
        />
      ),
    },
    {
      key: 'createdBy',
      label: 'Creado por',
      render: (row) => (
        <Text fontSize="xs" color={colors.mutedColor}>
          {row.createdBy}
        </Text>
      ),
    },
  ], [colors, handleToggleRole]);

  const roleActions: DataTableAction<ExemptRole>[] = useMemo(() => [
    {
      key: 'edit',
      label: 'Editar',
      icon: FiEdit2,
      onClick: (row) => handleOpenRoleDialog(row),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDeleteRole(row.id),
    },
  ], []);

  return (
    <Box p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              Exenciones de Horario
            </Text>
            <Text color={colors.mutedColor} fontSize="sm">
              Usuarios y roles que pueden acceder al sistema fuera del horario establecido
            </Text>
          </VStack>
        </HStack>

        {/* Info Card */}
        <Card.Root bg={colors.warningBg} borderColor={colors.warningColor} borderWidth="1px">
          <Card.Body>
            <HStack gap={3}>
              <FiAlertCircle color={colors.warningColor} size={20} />
              <Text color={colors.textColor} fontSize="sm">
                Las exenciones permiten que ciertos usuarios o roles accedan al sistema fuera del horario normal.
                Cada exención debe tener una justificación documentada para fines de auditoría.
              </Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
          <Tabs.List bg={colors.cardBg}>
            <Tabs.Trigger value="users" px={6}>
              <HStack gap={2}>
                <FiUserCheck />
                <Text>Usuarios Exentos ({exemptUsers.length})</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="roles" px={6}>
              <HStack gap={2}>
                <FiShield />
                <Text>Roles Exentos ({exemptRoles.length})</Text>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Users Tab */}
          <Tabs.Content value="users">
            <Box mt={4}>
              <DataTable<ExemptUser>
                data={exemptUsers}
                columns={userColumns}
                rowKey={(row) => String(row.id)}
                actions={userActions}
                isLoading={loading}
                emptyMessage="No hay usuarios exentos configurados"
                emptyIcon={FiUserCheck}
                defaultPageSize={10}
                size="sm"
                toolbarRight={
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={() => handleOpenUserDialog()}
                  >
                    <FiPlus /> Agregar Usuario
                  </Button>
                }
              />
            </Box>
          </Tabs.Content>

          {/* Roles Tab */}
          <Tabs.Content value="roles">
            <Box mt={4}>
              <DataTable<ExemptRole>
                data={exemptRoles}
                columns={roleColumns}
                rowKey={(row) => String(row.id)}
                actions={roleActions}
                isLoading={loading}
                emptyMessage="No hay roles exentos configurados"
                emptyIcon={FiShield}
                defaultPageSize={10}
                size="sm"
                toolbarRight={
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={() => handleOpenRoleDialog()}
                  >
                    <FiPlus /> Agregar Rol
                  </Button>
                }
              />
            </Box>
          </Tabs.Content>
        </Tabs.Root>

        {/* User Dialog */}
        <DialogRoot open={showUserDialog} onOpenChange={(e) => setShowUserDialog(e.open)}>
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Exención de Usuario' : 'Nueva Exención de Usuario'}
              </DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <VStack gap={4}>
                {!editingUser && (
                  <Box w="100%">
                    <Text mb={2} fontWeight="medium">Usuario</Text>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        background: colors.inputBg,
                        color: colors.textColor,
                      }}
                    >
                      <option value="">Seleccione un usuario</option>
                      {users
                        .filter(u => !exemptUsers.some(e => e.user.id === u.id))
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} ({user.email})
                          </option>
                        ))}
                    </select>
                  </Box>
                )}
                {editingUser && (
                  <Box w="100%">
                    <Text mb={2} fontWeight="medium">Usuario</Text>
                    <Input value={editingUser.user.username} disabled />
                  </Box>
                )}
                <Box w="100%">
                  <Text mb={2} fontWeight="medium">Justificación *</Text>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo de la exención (requerido para auditoría)"
                    rows={3}
                  />
                </Box>
                <HStack w="100%" gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">Válido desde</Text>
                    <Input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">Válido hasta</Text>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </Box>
                </HStack>
                <Text fontSize="xs" color={colors.mutedColor}>
                  * Deje las fechas vacías para una exención permanente
                </Text>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowUserDialog(false)}>
                Cancelar
              </Button>
              <Button colorPalette="blue" onClick={handleSaveUser}>
                <FiCheck /> Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>

        {/* Role Dialog */}
        <DialogRoot open={showRoleDialog} onOpenChange={(e) => setShowRoleDialog(e.open)}>
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Editar Exención de Rol' : 'Nueva Exención de Rol'}
              </DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <VStack gap={4}>
                {!editingRole && (
                  <Box w="100%">
                    <Text mb={2} fontWeight="medium">Rol</Text>
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        background: colors.inputBg,
                        color: colors.textColor,
                      }}
                    >
                      <option value="">Seleccione un rol</option>
                      {roles
                        .filter(r => !exemptRoles.some(e => e.role.id === r.id))
                        .map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                    </select>
                  </Box>
                )}
                {editingRole && (
                  <Box w="100%">
                    <Text mb={2} fontWeight="medium">Rol</Text>
                    <Input value={editingRole.role.name} disabled />
                  </Box>
                )}
                <Box w="100%">
                  <Text mb={2} fontWeight="medium">Justificación *</Text>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo de la exención (requerido para auditoría)"
                    rows={3}
                  />
                </Box>
                <HStack w="100%" gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">Válido desde</Text>
                    <Input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">Válido hasta</Text>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </Box>
                </HStack>
                <Text fontSize="xs" color={colors.mutedColor}>
                  * Deje las fechas vacías para una exención permanente
                </Text>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowRoleDialog(false)}>
                Cancelar
              </Button>
              <Button colorPalette="blue" onClick={handleSaveRole}>
                <FiCheck /> Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </VStack>
    </Box>
  );
};

export default ScheduleExemptionsPage;
