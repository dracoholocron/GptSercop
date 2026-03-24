import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogBackdrop,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Box,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPaperclip, FiUpload, FiFile, FiX, FiImage, FiFileText } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../ui/toaster';
import { createAlert, getAlertTypes, getAvailableRoles } from '../../services/alertService';
import type { AlertType, AlertPriority, AlertTypeConfig, RoleDTO } from '../../services/alertService';
import { TagSelector } from './TagSelector';
import { userService, type User } from '../../services/userService';
import { apiClient } from '../../config/api.client';
import { documentService } from '../../services/documentService';

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

interface AlertCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultDate?: string;
  defaultOperationId?: string;
  defaultClientId?: string;
  defaultClientName?: string;
}

export const AlertCreateModal = ({
  isOpen,
  onClose,
  onCreated,
  defaultDate,
  defaultOperationId,
  defaultClientId,
  defaultClientName,
}: AlertCreateModalProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [loading, setLoading] = useState(false);
  const [alertTypes, setAlertTypes] = useState<AlertTypeConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());
  const [assignmentMode, setAssignmentMode] = useState<'user' | 'role'>('user');

  // Attachments state
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('FOLLOW_UP');
  const [priority, setPriority] = useState<AlertPriority>('NORMAL');
  const [scheduledDate, setScheduledDate] = useState(defaultDate || '');
  const [scheduledTime, setScheduledTime] = useState('');
  const [clientName, setClientName] = useState(defaultClientName || '');
  const [assignToUserId, setAssignToUserId] = useState('');
  const [assignToRole, setAssignToRole] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lang = i18n.language === 'en' ? 'en' : 'es';

  useEffect(() => {
    if (isOpen) {
      loadAlertTypes();
      loadUsers();
      loadRoles();
      // Reset form
      setTitle('');
      setDescription('');
      setAlertType('FOLLOW_UP');
      setPriority('NORMAL');
      setScheduledDate(defaultDate || new Date().toISOString().split('T')[0]);
      setScheduledTime('');
      setClientName(defaultClientName || '');
      setAssignToUserId('');
      setAssignToRole('');
      setAssignmentMode('user');
      setSelectedTags([]);
      setErrors({});
      setShowAttachments(false);
      setAttachedFiles([]);
    }
  }, [isOpen, defaultDate, defaultClientName]);

  // Check connected users when users list changes
  useEffect(() => {
    if (isOpen && users.length > 0) {
      loadConnectedUsers(users);
    }
  }, [isOpen, users]);

  const loadAlertTypes = async () => {
    try {
      const types = await getAlertTypes(true);
      setAlertTypes(types);
    } catch (error) {
      console.error('Error loading alert types:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers.filter(u => u.enabled));
    } catch {
      // Silently fail
    }
  };

  const loadRoles = async () => {
    try {
      const availableRoles = await getAvailableRoles();
      setRoles(availableRoles);
    } catch {
      // Silently fail
    }
  };

  const loadConnectedUsers = async (userList: User[]) => {
    try {
      if (userList.length === 0) return;

      const userIds = userList.map(u => u.username);
      const response = await apiClient.post<ConnectedUsersResponse>('/realtime/connected', {
        userIds: userIds
      });

      const connectedSet = new Set(response.data.connectedUserIds);
      setConnectedUserIds(connectedSet);
    } catch {
      // Silently fail - connected status is optional
      setConnectedUserIds(new Set());
    }
  };

  // ==================== File attachment handlers ====================
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files) return;
    const maxFiles = 10;
    const newFiles: File[] = [];
    for (let i = 0; i < Math.min(files.length, maxFiles - attachedFiles.length); i++) {
      const file = files[i];
      if (file.size <= MAX_FILE_SIZE) {
        newFiles.push(file);
      } else {
        toaster.error({
          title: t('documents.errors.fileTooLarge', 'Archivo muy grande'),
          description: `${file.name} - Max 50 MB`,
        });
      }
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
  }, [attachedFiles.length, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FiImage;
    if (mimeType === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const uploadAttachmentsForAlert = async (alertId: string) => {
    const results = [];
    for (const file of attachedFiles) {
      try {
        await documentService.uploadDocument({
          file,
          alertId,
          categoryCode: 'OTHER',
          documentTypeCode: 'OTHER',
        });
        results.push({ file: file.name, success: true });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        results.push({ file: file.name, success: false });
      }
    }
    return results;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t('alerts.validation.titleRequired', 'El título es requerido');
    } else if (title.length > 300) {
      newErrors.title = t('alerts.validation.titleTooLong', 'El título no puede exceder 300 caracteres');
    }

    if (!scheduledDate) {
      newErrors.scheduledDate = t('alerts.validation.dateRequired', 'La fecha es requerida');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await createAlert({
        title: title.trim(),
        description: description.trim() || undefined,
        alertType,
        priority,
        scheduledDate,
        scheduledTime: scheduledTime || undefined,
        operationId: defaultOperationId,
        clientId: defaultClientId,
        clientName: clientName.trim() || undefined,
        assignToUserId: assignmentMode === 'user' && assignToUserId ? assignToUserId : undefined,
        assignToRole: assignmentMode === 'role' && assignToRole ? assignToRole : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      // Upload attached files if any
      if (attachedFiles.length > 0 && result.length > 0) {
        const alertId = result[0].alertId;
        const uploadResults = await uploadAttachmentsForAlert(alertId);
        const failedUploads = uploadResults.filter(r => !r.success);
        if (failedUploads.length > 0) {
          toaster.error({
            title: t('alerts.create.attachmentError', 'Error en archivos adjuntos'),
            description: t('alerts.create.someFilesFailed', `${failedUploads.length} archivo(s) no se pudieron subir`),
          });
        }
      }

      const alertCount = result.length;
      toaster.success({
        title: t('alerts.created', 'Alerta creada'),
        description: alertCount > 1
          ? t('alerts.createdForRole', `Se crearon ${alertCount} alertas para el rol seleccionado`)
          : attachedFiles.length > 0
          ? t('alerts.createdWithAttachments', 'Alerta creada con archivos adjuntos')
          : undefined,
      });

      onCreated();
      onClose();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (config: AlertTypeConfig): string => {
    return lang === 'en' ? config.labelEn : config.labelEs;
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="lg"
    >
      <DialogBackdrop bg="rgba(0, 0, 0, 0.5)" />
      <DialogContent
        bg={colors.cardBg}
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1400}
        maxH="90vh"
        display="flex"
        flexDirection="column"
        width={{ base: "95vw", md: "600px" }}
      >
        <DialogHeader flexShrink={0}>
          <DialogTitle color={colors.textColor}>
            {t('alerts.create.title', 'Nueva Alerta')}
          </DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger color={colors.textColor} />

        <DialogBody overflowY="auto" flex={1}>
          <VStack align="stretch" gap={4}>
            {/* Title */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={1}>
                {t('alerts.create.alertTitle', 'Título')} *
              </Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('alerts.create.titlePlaceholder', 'Ej: Llamar al cliente para seguimiento')}
                bg={colors.bgColor}
                borderColor={errors.title ? 'red.500' : colors.borderColor}
                color={colors.textColor}
              />
              {errors.title && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {errors.title}
                </Text>
              )}
            </Box>

            {/* Description */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={1}>
                {t('alerts.create.description', 'Descripción')}
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('alerts.create.descriptionPlaceholder', 'Detalles adicionales...')}
                bg={colors.bgColor}
                borderColor={colors.borderColor}
                color={colors.textColor}
                rows={3}
              />
            </Box>

            {/* Type and Priority */}
            <HStack gap={4}>
              <Box flex={1}>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('alerts.create.type', 'Tipo')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as AlertType)}
                    bg={colors.bgColor}
                    borderColor={colors.borderColor}
                    color={colors.textColor}
                  >
                    {alertTypes.map((type) => (
                      <option key={type.typeCode} value={type.typeCode}>
                        {getTypeLabel(type)}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              <Box flex={1}>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('alerts.create.priority', 'Prioridad')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AlertPriority)}
                    bg={colors.bgColor}
                    borderColor={colors.borderColor}
                    color={colors.textColor}
                  >
                    <option value="LOW">{t('alerts.priority.low', 'Baja')}</option>
                    <option value="NORMAL">{t('alerts.priority.normal', 'Normal')}</option>
                    <option value="HIGH">{t('alerts.priority.high', 'Alta')}</option>
                    <option value="URGENT">{t('alerts.priority.urgent', 'Urgente')}</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>
            </HStack>

            {/* Assign To - User or Role */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={1}>
                {t('alerts.create.assignTo', 'Asignar a')} ({t('common.optional', 'opcional')})
              </Text>
              <VStack align="stretch" gap={2}>
                {/* Assignment Mode Toggle */}
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant={assignmentMode === 'user' ? 'solid' : 'outline'}
                    colorPalette={assignmentMode === 'user' ? 'blue' : 'gray'}
                    onClick={() => {
                      setAssignmentMode('user');
                      setAssignToRole('');
                    }}
                  >
                    {t('alerts.create.assignToUser', 'Usuario')}
                  </Button>
                  <Button
                    size="xs"
                    variant={assignmentMode === 'role' ? 'solid' : 'outline'}
                    colorPalette={assignmentMode === 'role' ? 'blue' : 'gray'}
                    onClick={() => {
                      setAssignmentMode('role');
                      setAssignToUserId('');
                    }}
                  >
                    {t('alerts.create.assignToRole', 'Rol')}
                  </Button>
                </HStack>

                {/* User Selection */}
                {assignmentMode === 'user' && (
                  <>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={assignToUserId}
                        onChange={(e) => setAssignToUserId(e.target.value)}
                        bg={colors.bgColor}
                        borderColor={colors.borderColor}
                        color={colors.textColor}
                      >
                        <option value="">{t('alerts.create.selectUser', '-- Seleccionar usuario --')}</option>
                        {users.map((user) => (
                          <option key={user.username} value={user.username}>
                            {connectedUserIds.has(user.username) ? '🟢 ' : '⚫ '}
                            {user.username} - {user.email}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      🟢 {t('alerts.online', 'En línea')} | ⚫ {t('alerts.offline', 'Desconectado')}
                    </Text>
                  </>
                )}

                {/* Role Selection */}
                {assignmentMode === 'role' && (
                  <>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={assignToRole}
                        onChange={(e) => setAssignToRole(e.target.value)}
                        bg={colors.bgColor}
                        borderColor={colors.borderColor}
                        color={colors.textColor}
                      >
                        <option value="">{t('alerts.create.selectRole', '-- Seleccionar rol --')}</option>
                        {roles.map((role) => (
                          <option key={role.name} value={role.name}>
                            {role.name.replace('ROLE_', '')} - {role.description}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('alerts.create.roleNote', 'Se creará una alerta para cada usuario con este rol')}
                    </Text>
                  </>
                )}
              </VStack>
            </Box>

            {/* Date and Time */}
            <HStack gap={4}>
              <Box flex={1}>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('alerts.create.date', 'Fecha')} *
                </Text>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  bg={colors.bgColor}
                  borderColor={errors.scheduledDate ? 'red.500' : colors.borderColor}
                  color={colors.textColor}
                />
                {errors.scheduledDate && (
                  <Text color="red.500" fontSize="xs" mt={1}>
                    {errors.scheduledDate}
                  </Text>
                )}
              </Box>

              <Box flex={1}>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('alerts.create.time', 'Hora')} ({t('common.optional', 'opcional')})
                </Text>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>
            </HStack>

            {/* Client Name */}
            {!defaultClientName && (
              <Box>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('alerts.create.client', 'Cliente')} ({t('common.optional', 'opcional')})
                </Text>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={t('alerts.create.clientPlaceholder', 'Nombre del cliente')}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>
            )}

            {/* Tags */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={1}>
                {t('alerts.create.tags', 'Etiquetas')} ({t('common.optional', 'opcional')})
              </Text>
              <TagSelector
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                placeholder={t('alerts.create.tagsPlaceholder', 'Seleccionar etiquetas para clasificar...')}
                maxTags={5}
              />
              <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
                {t('alerts.create.tagsHelp', 'Las etiquetas ayudan a organizar y filtrar alertas')}
              </Text>
            </Box>

            {/* Attachments */}
            <Box>
              <Button
                size="sm"
                variant={showAttachments ? 'solid' : 'outline'}
                colorPalette={showAttachments ? 'blue' : 'gray'}
                borderColor={colors.borderColor}
                color={showAttachments ? undefined : colors.textColor}
                onClick={() => setShowAttachments(!showAttachments)}
              >
                <HStack gap={1}>
                  <FiPaperclip />
                  <Text>{t('alerts.create.attachFiles', 'Adjuntar archivos')}</Text>
                  {attachedFiles.length > 0 && (
                    <Badge colorPalette="blue" ml={1}>{attachedFiles.length}</Badge>
                  )}
                </HStack>
              </Button>

              {showAttachments && (
                <VStack align="stretch" gap={2} mt={3}>
                  {/* Drop Zone */}
                  <Box
                    border="2px dashed"
                    borderColor={isDragging ? 'blue.500' : colors.borderColor}
                    borderRadius="lg"
                    p={4}
                    textAlign="center"
                    bg={isDragging ? 'blue.500/10' : 'transparent'}
                    transition="all 0.2s"
                    cursor="pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    _hover={{ borderColor: 'blue.400' }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        handleFilesSelected(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <VStack gap={1}>
                      <FiUpload size={20} color="var(--chakra-colors-blue-500)" />
                      <Text fontSize="sm" color={colors.textColor}>
                        {t('documents.dropFilesHere', 'Arrastra archivos aquí')}
                      </Text>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {t('documents.orClickToSelect', 'o haz clic para seleccionar')} - Max 50 MB
                      </Text>
                    </VStack>
                  </Box>

                  {/* File List */}
                  {attachedFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                      <HStack
                        key={`${file.name}-${index}`}
                        p={2}
                        bg={colors.bgColor}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={colors.borderColor}
                        justify="space-between"
                      >
                        <HStack>
                          <FileIcon size={16} />
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" color={colors.textColor} lineClamp={1}>
                              {file.name}
                            </Text>
                            <Text fontSize="xs" color={colors.textColorSecondary}>
                              {documentService.formatFileSize(file.size)}
                            </Text>
                          </VStack>
                        </HStack>
                        <IconButton
                          aria-label="Remove"
                          size="xs"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                        >
                          <FiX />
                        </IconButton>
                      </HStack>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Quick Date Buttons */}
            <VStack align="stretch" gap={2}>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {t('alerts.create.quickDates', 'Fechas rápidas')}:
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {[
                  { days: 0, label: t('alerts.today', 'Hoy') },
                  { days: 1, label: t('alerts.tomorrow', 'Mañana') },
                  { days: 7, label: '1 ' + t('alerts.week', 'semana') },
                  { days: 14, label: '2 ' + t('alerts.weeks', 'semanas') },
                  { days: 30, label: '1 ' + t('alerts.month', 'mes') },
                ].map(({ days, label }) => (
                  <Button
                    key={days}
                    size="xs"
                    variant="outline"
                    borderColor={colors.borderColor}
                    color={colors.textColor}
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      setScheduledDate(date.toISOString().split('T')[0]);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={2}>
            <Button
              variant="ghost"
              onClick={onClose}
              color={colors.textColor}
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleSubmit}
              loading={loading}
            >
              {t('alerts.create.submit', 'Crear Alerta')}
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default AlertCreateModal;
