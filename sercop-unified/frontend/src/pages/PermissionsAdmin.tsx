import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  Badge,
  Spinner,
  Button,
  NativeSelect,
  Checkbox,
} from '@chakra-ui/react';
import {
  FiShield,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiSave,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE_URL_WITH_PREFIX, TOKEN_STORAGE_KEY } from '../config/api.config';

interface Permission {
  code: string;
  name: string;
  description: string;
  module: string;
}

interface RolePermissionMatrix {
  roleId: number;
  roleName: string;
  permissions: string[];
}

const PermissionsAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [matrix, setMatrix] = useState<RolePermissionMatrix[]>([]);
  const [selectedRole, setSelectedRole] = useState<RolePermissionMatrix | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{
    toAssign: string[];
    toRevoke: string[];
  }>({ toAssign: [], toRevoke: [] });

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setPendingChanges({ toAssign: [], toRevoke: [] });

    try {
      const [permissionsRes, matrixRes] = await Promise.all([
        fetch(`${API_BASE_URL_WITH_PREFIX}/admin/permissions`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL_WITH_PREFIX}/admin/permissions/matrix`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (permissionsRes.ok) {
        const permData = await permissionsRes.json();
        setPermissions(permData.data || []);
      }

      if (matrixRes.ok) {
        const matrixData = await matrixRes.json();
        const roles = matrixData.data || [];
        setMatrix(roles);
        if (roles.length > 0 && !selectedRole) {
          setSelectedRole(roles[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(t('permissions.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = (roleId: string) => {
    const role = matrix.find((r) => r.roleId === parseInt(roleId));
    setSelectedRole(role || null);
    setPendingChanges({ toAssign: [], toRevoke: [] });
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!selectedRole) return false;
    const originalHas = selectedRole.permissions.includes(permissionCode);
    const willAssign = pendingChanges.toAssign.includes(permissionCode);
    const willRevoke = pendingChanges.toRevoke.includes(permissionCode);

    if (willAssign) return true;
    if (willRevoke) return false;
    return originalHas;
  };

  const togglePermission = (permissionCode: string) => {
    if (!selectedRole) return;

    const originalHas = selectedRole.permissions.includes(permissionCode);
    const isInAssign = pendingChanges.toAssign.includes(permissionCode);
    const isInRevoke = pendingChanges.toRevoke.includes(permissionCode);

    setPendingChanges((prev) => {
      const newAssign = [...prev.toAssign];
      const newRevoke = [...prev.toRevoke];

      if (originalHas) {
        // Originally has permission
        if (isInRevoke) {
          // Cancel revoke
          return { ...prev, toRevoke: newRevoke.filter((c) => c !== permissionCode) };
        } else {
          // Add to revoke
          return { ...prev, toRevoke: [...newRevoke, permissionCode] };
        }
      } else {
        // Originally doesn't have permission
        if (isInAssign) {
          // Cancel assign
          return { ...prev, toAssign: newAssign.filter((c) => c !== permissionCode) };
        } else {
          // Add to assign
          return { ...prev, toAssign: [...newAssign, permissionCode] };
        }
      }
    });
  };

  const hasPendingChanges = pendingChanges.toAssign.length > 0 || pendingChanges.toRevoke.length > 0;

  const saveChanges = async () => {
    if (!selectedRole || !hasPendingChanges) return;

    setSaving(true);
    setError(null);

    try {
      // Bulk assign
      if (pendingChanges.toAssign.length > 0) {
        const assignRes = await fetch(
          `${API_BASE_URL_WITH_PREFIX}/admin/permissions/role/${selectedRole.roleId}/bulk-assign`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ permissionCodes: pendingChanges.toAssign }),
          }
        );
        if (!assignRes.ok) {
          throw new Error('Failed to assign permissions');
        }
      }

      // Bulk revoke
      if (pendingChanges.toRevoke.length > 0) {
        const revokeRes = await fetch(
          `${API_BASE_URL_WITH_PREFIX}/admin/permissions/role/${selectedRole.roleId}/bulk-revoke`,
          {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ permissionCodes: pendingChanges.toRevoke }),
          }
        );
        if (!revokeRes.ok) {
          throw new Error('Failed to revoke permissions');
        }
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError(t('permissions.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const module = perm.module || 'OTHER';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const getModuleColor = (module: string) => {
    const moduleColors: Record<string, string> = {
      LC_IMPORT: 'blue',
      LC_EXPORT: 'green',
      GUARANTEE: 'purple',
      COLLECTION: 'orange',
      SWIFT: 'cyan',
      SYSTEM: 'red',
      OTHER: 'gray',
    };
    return moduleColors[module] || 'gray';
  };

  // Dark mode aware colors
  const itemBg = darkMode ? 'gray.700' : 'gray.50';
  const itemHoverBg = darkMode ? 'gray.600' : 'gray.100';
  const greenBg = darkMode ? 'green.900' : 'green.50';
  const redBg = darkMode ? 'red.900' : 'red.50';
  const yellowBg = darkMode ? 'yellow.900' : 'yellow.50';
  const yellowText = darkMode ? 'yellow.200' : 'yellow.800';
  const errorBg = darkMode ? 'red.900' : 'red.50';
  const errorText = darkMode ? 'red.200' : 'red.600';

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack py={20}>
          <Spinner size="xl" color="blue.500" />
          <Text color={colors.textColor}>{t('permissions.loading')}</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={4}>
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <FiShield size={24} />
              <Heading size="lg">{t('permissions.title')}</Heading>
            </Box>
            <Text color={colors.textColorSecondary}>{t('permissions.subtitle')}</Text>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <NativeSelect.Root size="sm" width="200px">
              <NativeSelect.Field
                value={selectedRole?.roleId || ''}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {matrix.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName.replace('ROLE_', '')}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Button onClick={fetchData} variant="outline" size="sm" disabled={saving}>
              <Box display="flex" alignItems="center" gap={2}>
                <FiRefreshCw size={14} />
                <span>{t('common.refresh')}</span>
              </Box>
            </Button>
            <Button
              onClick={saveChanges}
              colorScheme="blue"
              size="sm"
              disabled={!hasPendingChanges || saving}
              loading={saving}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <FiSave size={14} />
                <span>{t('common.save')}</span>
              </Box>
            </Button>
          </Box>
        </Box>

        {/* Error Message */}
        {error && (
          <Box bg={errorBg} p={4} borderRadius="md" color={errorText}>
            <Text>{error}</Text>
          </Box>
        )}

        {/* Pending Changes Indicator */}
        {hasPendingChanges && (
          <Box bg={yellowBg} p={3} borderRadius="md" display="flex" gap={4} alignItems="center">
            <Text fontSize="sm" color={yellowText}>
              <strong>{t('permissions.pendingChanges')}:</strong>{' '}
              {pendingChanges.toAssign.length > 0 && (
                <Badge colorScheme="green" mr={2}>
                  +{pendingChanges.toAssign.length} {t('permissions.toAdd')}
                </Badge>
              )}
              {pendingChanges.toRevoke.length > 0 && (
                <Badge colorScheme="red">
                  -{pendingChanges.toRevoke.length} {t('permissions.toRemove')}
                </Badge>
              )}
            </Text>
          </Box>
        )}

        {/* Selected Role Info */}
        {selectedRole && (
          <Card.Root bg={colors.cardBg} borderColor={colors.borderColor} borderWidth="1px">
            <Card.Body>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Text fontWeight="bold" fontSize="lg" color={colors.textColor}>
                    {selectedRole.roleName.replace('ROLE_', '')}
                  </Text>
                  <Text color={colors.textColorSecondary} fontSize="sm">
                    {selectedRole.permissions.length} {t('permissions.assigned')}
                  </Text>
                </Box>
              </Box>
            </Card.Body>
          </Card.Root>
        )}

        {/* Permissions by Module */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <Card.Root key={module} bg={colors.cardBg} borderColor={colors.borderColor} borderWidth="1px">
              <Card.Header pb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge colorScheme={getModuleColor(module)} fontSize="sm">
                    {module.replace(/_/g, ' ')}
                  </Badge>
                  <Text fontSize="sm" color={colors.textColorSecondary}>
                    ({perms.length} {t('permissions.permissions')})
                  </Text>
                </Box>
              </Card.Header>
              <Card.Body pt={0}>
                <VStack align="stretch" gap={2}>
                  {perms.map((perm) => {
                    const checked = hasPermission(perm.code);
                    const isChanged =
                      pendingChanges.toAssign.includes(perm.code) ||
                      pendingChanges.toRevoke.includes(perm.code);

                    return (
                      <Box
                        key={perm.code}
                        p={2}
                        bg={isChanged ? (checked ? greenBg : redBg) : itemBg}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        cursor="pointer"
                        onClick={() => togglePermission(perm.code)}
                        _hover={{ bg: isChanged ? undefined : itemHoverBg }}
                        transition="all 0.2s"
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Checkbox.Root
                            checked={checked}
                            onCheckedChange={() => togglePermission(perm.code)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator>
                                <FiCheck />
                              </Checkbox.Indicator>
                            </Checkbox.Control>
                          </Checkbox.Root>
                          <Box>
                            <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                              {perm.name}
                            </Text>
                            <Text fontSize="xs" color={colors.textColorSecondary}>
                              {perm.code}
                            </Text>
                          </Box>
                        </Box>
                        {isChanged && (
                          <Badge colorScheme={checked ? 'green' : 'red'} size="sm">
                            {checked ? <FiCheck /> : <FiX />}
                          </Badge>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>

        {/* Empty State */}
        {permissions.length === 0 && (
          <Box textAlign="center" py={10} color={colors.textColorSecondary}>
            <FiShield size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <Text>{t('permissions.noPermissions')}</Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default PermissionsAdmin;
