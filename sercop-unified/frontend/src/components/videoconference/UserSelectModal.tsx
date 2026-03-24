/**
 * UserSelectModal Component
 * Modal for selecting users to invite to a video call
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Spinner,
  Checkbox,
  Badge,
  Icon,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiUser, FiUsers, FiVideo } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { userService, type User } from '../../services/userService';
import { apiClient } from '../../config/api.client';

interface RealTimeStatus {
  enabled: boolean;
  provider: string;
  connectedUsers: number;
}

interface ConnectedUsersResponse {
  connectedUserIds: string[];
  count: number;
  connectionStatus: Record<string, boolean>;
}

interface UserSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedUserIds: string[]) => void;
  title?: string;
  loading?: boolean;
  excludeUserIds?: string[];
}

export function UserSelectModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  loading = false,
  excludeUserIds = [],
}: UserSelectModalProps) {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Check connected status after users are loaded
  useEffect(() => {
    if (users.length > 0) {
      checkConnectedUsers(users.map(u => u.username));
    }
  }, [users]);

  const checkConnectedUsers = async (userIds: string[]) => {
    try {
      const response = await apiClient.post<ConnectedUsersResponse>('/realtime/connected', {
        userIds: userIds
      });
      const connectedSet = new Set(response.data.connectedUserIds);
      setConnectedUserIds(connectedSet);
    } catch (error) {
      // Silently fail - connected status is optional
      console.log('Could not check connected users:', error);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const allUsers = await userService.getAllUsers();
      // Filter out excluded users
      const availableUsers = allUsers.filter(
        (user) => !excludeUserIds.includes(user.username) && user.enabled
      );
      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.username));
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedUserIds);
    setSelectedUserIds([]);
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedUserIds([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && handleClose()}
      size="md"
      placement="center"
    >
      <DialogContent bg={colors.cardBg}>
        <DialogHeader>
          <DialogTitle color={colors.textColor}>
            <HStack>
              <Icon as={FiUsers} />
              <Text>{title || t('videoConference.selectUsers', 'Seleccionar Participantes')}</Text>
            </HStack>
          </DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />

        <DialogBody>
          <VStack gap={4} align="stretch">
            {/* Search */}
            <Box position="relative">
              <Input
                placeholder={t('common.search', 'Buscar...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={colors.bgColor}
                borderColor={colors.borderColor}
                color={colors.textColor}
                pl={10}
              />
              <Icon
                as={FiSearch}
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                color={colors.textColorSecondary}
              />
            </Box>

            {/* Select All */}
            {filteredUsers.length > 0 && (
              <HStack justify="space-between">
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {selectedUserIds.length} {t('common.selected', 'seleccionados')}
                </Text>
                <Button size="xs" variant="ghost" onClick={handleSelectAll}>
                  {selectedUserIds.length === filteredUsers.length
                    ? t('common.deselectAll', 'Deseleccionar todos')
                    : t('common.selectAll', 'Seleccionar todos')}
                </Button>
              </HStack>
            )}

            {/* User List */}
            <Box
              maxH="300px"
              overflowY="auto"
              borderWidth={1}
              borderColor={colors.borderColor}
              borderRadius="md"
            >
              {loadingUsers ? (
                <Box p={8} textAlign="center">
                  <Spinner size="lg" color="blue.500" />
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Icon as={FiUser} boxSize={8} color="gray.400" mb={2} />
                  <Text color={colors.textColorSecondary}>
                    {t('common.noResults', 'No se encontraron usuarios')}
                  </Text>
                </Box>
              ) : (
                <VStack gap={0} align="stretch">
                  {filteredUsers.map((user) => (
                    <Box
                      key={user.username}
                      p={3}
                      borderBottomWidth={1}
                      borderColor={colors.borderColor}
                      _hover={{ bg: colors.bgColor }}
                      cursor="pointer"
                      onClick={() => handleToggleUser(user.username)}
                    >
                      <HStack justify="space-between">
                        <HStack>
                          <Checkbox.Root
                            checked={selectedUserIds.includes(user.username)}
                            onCheckedChange={() => handleToggleUser(user.username)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                          <VStack align="start" gap={0}>
                            <HStack gap={2}>
                              <Text fontWeight="medium" color={colors.textColor}>
                                {user.username}
                              </Text>
                              {connectedUserIds.has(user.username) ? (
                                <Box
                                  w={2}
                                  h={2}
                                  borderRadius="full"
                                  bg="green.500"
                                  title={t('videoConference.online', 'En línea')}
                                />
                              ) : (
                                <Box
                                  w={2}
                                  h={2}
                                  borderRadius="full"
                                  bg="gray.400"
                                  title={t('videoConference.offline', 'Desconectado')}
                                />
                              )}
                            </HStack>
                            <Text fontSize="xs" color={colors.textColorSecondary}>
                              {user.email || user.username}
                            </Text>
                          </VStack>
                        </HStack>
                        {user.roles && user.roles.length > 0 && (
                          <Badge colorPalette="blue" fontSize="xs">
                            {user.roles[0].name}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            colorPalette="green"
            onClick={handleConfirm}
            disabled={selectedUserIds.length === 0}
            loading={loading}
            loadingText={t('videoConference.inviting', 'Invitando...')}
          >
            <FiVideo />
            {t('videoConference.startCall', 'Iniciar Llamada')} ({selectedUserIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

export default UserSelectModal;
