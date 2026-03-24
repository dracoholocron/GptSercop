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
  Badge,
  Box,
  Separator,
  Input,
  Textarea,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCheck,
  FiClock,
  FiCalendar,
  FiUser,
  FiX,
  FiRefreshCw,
  FiList,
  FiPlay,
  FiEdit3,
  FiUserPlus,
  FiTag,
  FiPaperclip,
  FiUpload,
  FiFile,
  FiFileText,
  FiImage,
  FiTrash2,
  FiDownload,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../ui/toaster';
import {
  completeAlert,
  rescheduleAlert,
  snoozeAlert,
  cancelAlert,
  getAlertHistory,
  startAlert,
  updateAlertProgress,
  reassignAlert,
  updateAlertTags,
  getTags,
} from '../../services/alertService';
import { getUsers } from '../../services/userService';
import { documentService } from '../../services/documentService';
import type { AlertResponse, AlertHistoryEntry, AlertTag } from '../../services/alertService';
import type { Document } from '../../types/documents';

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: AlertResponse;
  onUpdate: () => void;
}

type ActionMode = 'view' | 'reschedule' | 'complete' | 'history' | 'progress' | 'reassign' | 'editTags';

interface UserOption {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const AlertDetailModal = ({
  isOpen,
  onClose,
  alert,
  onUpdate,
}: AlertDetailModalProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [actionMode, setActionMode] = useState<ActionMode>('view');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [newDate, setNewDate] = useState(alert.scheduledDate);
  const [newTime, setNewTime] = useState(alert.scheduledTime || '');
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [reassignReason, setReassignReason] = useState('');
  const [availableTags, setAvailableTags] = useState<AlertTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(alert.tags || []);

  // Attachments state
  const [attachments, setAttachments] = useState<Document[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    setLoading(true);
    try {
      await startAlert(alert.alertId, { notes: notes || undefined });
      toaster.success({
        title: t('alerts.started', 'Tarea iniciada'),
        description: t('alerts.startedDesc', 'Estado cambiado a En Progreso'),
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Attachments ====================
  const loadAttachments = useCallback(async () => {
    setLoadingAttachments(true);
    try {
      const docs = await documentService.getDocumentsByAlert(alert.alertId);
      setAttachments(docs);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setLoadingAttachments(false);
    }
  }, [alert.alertId]);

  useEffect(() => {
    if (isOpen) {
      loadAttachments();
    }
  }, [isOpen, loadAttachments]);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return FiImage;
    if (mimeType === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesSelected = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toaster.error({
          title: t('documents.errors.fileTooLarge', 'Archivo muy grande'),
          description: `${file.name} - Max 50 MB`,
        });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    setUploadingFiles(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of validFiles) {
      try {
        await documentService.uploadDocument({
          file,
          alertId: alert.alertId,
          categoryCode: 'OTHER',
          documentTypeCode: 'OTHER',
        });
        successCount++;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toaster.success({
        title: t('alerts.filesUploaded', 'Archivos subidos'),
        description: `${successCount} ${t('alerts.filesUploadedDesc', 'archivo(s) subido(s) correctamente')}`,
      });
      await loadAttachments();
    }
    if (failCount > 0) {
      toaster.error({
        title: t('alerts.filesUploadError', 'Error al subir archivos'),
        description: `${failCount} ${t('alerts.filesFailedDesc', 'archivo(s) fallaron')}`,
      });
    }
    setUploadingFiles(false);
  }, [alert.alertId, loadAttachments, t]);

  const handleDropFiles = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentService.downloadDocument(doc.documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFileName || doc.documentId;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toaster.error({ title: t('alerts.error', 'Error'), description: t('alerts.downloadError', 'Error downloading document') });
    }
  };

  const handleUpdateProgress = async () => {
    if (!notes.trim()) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: t('alerts.progressNotesRequired', 'Las notas de progreso son requeridas'),
      });
      return;
    }
    setLoading(true);
    try {
      await updateAlertProgress(alert.alertId, { notes });
      toaster.success({
        title: t('alerts.progressUpdated', 'Progreso actualizado'),
        description: t('alerts.commentAdded', 'Comentario agregado al historial'),
      });
      setNotes('');
      setActionMode('view');
      // Reload history in background (without switching to history view)
      loadHistory(false);
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeAlert(alert.alertId, { notes });
      toaster.success({
        title: t('alerts.completed', 'Alerta completada'),
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    setLoading(true);
    try {
      await rescheduleAlert(alert.alertId, {
        newDate,
        newTime: newTime || undefined,
        notes,
      });
      toaster.success({
        title: t('alerts.rescheduled', 'Alerta reprogramada'),
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (days: number) => {
    setLoading(true);
    try {
      await snoozeAlert(alert.alertId, days);
      toaster.info({
        title: t('alerts.snoozed', 'Alerta pospuesta'),
        description: `${days} ${t('alerts.days', 'días')}`,
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelAlert(alert.alertId, notes || undefined);
      toaster.warning({
        title: t('alerts.cancelled', 'Alerta cancelada'),
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (showHistoryView = true) => {
    try {
      const data = await getAlertHistory(alert.alertId);
      setHistory(data);
      if (showHistoryView) {
        setActionMode('history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadUsersForReassign = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setSelectedUser('');
      setReassignReason('');
      setActionMode('reassign');
    } catch (error) {
      console.error('Error loading users:', error);
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: t('alerts.errorLoadingUsers', 'Error al cargar usuarios'),
      });
    }
  };

  const loadTagsForEdit = async () => {
    try {
      const data = await getTags(true);
      setAvailableTags(data);
      setSelectedTags(alert.tags || []);
      setActionMode('editTags');
    } catch (error) {
      console.error('Error loading tags:', error);
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: t('alerts.errorLoadingTags', 'Error al cargar etiquetas'),
      });
    }
  };

  const handleSaveTags = async () => {
    setLoading(true);
    try {
      await updateAlertTags(alert.alertId, selectedTags);
      toaster.success({
        title: t('alerts.tagsUpdated', 'Etiquetas actualizadas'),
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const moveTagUp = (index: number) => {
    if (index === 0) return;
    setSelectedTags(prev => {
      const newTags = [...prev];
      [newTags[index - 1], newTags[index]] = [newTags[index], newTags[index - 1]];
      return newTags;
    });
  };

  const moveTagDown = (index: number) => {
    if (index >= selectedTags.length - 1) return;
    setSelectedTags(prev => {
      const newTags = [...prev];
      [newTags[index], newTags[index + 1]] = [newTags[index + 1], newTags[index]];
      return newTags;
    });
  };

  const handleReassign = async () => {
    if (!selectedUser) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: t('alerts.selectUser', 'Seleccione un usuario'),
      });
      return;
    }
    setLoading(true);
    try {
      const user = users.find(u => u.username === selectedUser);
      await reassignAlert(alert.alertId, {
        newUserId: selectedUser,
        newUserName: user ? `${user.firstName} ${user.lastName}` : undefined,
        reason: reassignReason || undefined,
      });
      toaster.success({
        title: t('alerts.reassigned', 'Alerta reasignada'),
        description: t('alerts.reassignedDesc', 'La alerta fue reasignada exitosamente'),
      });
      onUpdate();
    } catch (error) {
      toaster.error({
        title: t('alerts.error', 'Error'),
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES');
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
        width={{ base: "95vw", md: "700px" }}
      >
        <DialogHeader flexShrink={0}>
          <DialogTitle color={colors.textColor}>
            <HStack gap={2}>
              {alert.overdue && (
                <Badge colorPalette="red">{t('alerts.overdue', 'Vencida')}</Badge>
              )}
              <Text fontSize="md">{alert.title}</Text>
            </HStack>
          </DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger color={colors.textColor} />

        <HStack align="stretch" flex={1} overflow="hidden" gap={0}>
        {/* Side Action Bar - always visible */}
        {actionMode === 'view' && alert.status !== 'COMPLETED' && alert.status !== 'CANCELLED' && (
          <VStack
            flexShrink={0}
            w="56px"
            py={3}
            gap={2}
            align="center"
            borderRightWidth={1}
            borderColor={colors.borderColor}
            bg={colors.bgColor}
          >
            {alert.status === 'PENDING' && (
              <IconButton
                aria-label={t('alerts.start', 'Iniciar')}
                size="sm"
                colorPalette="blue"
                onClick={handleStart}
                loading={loading}
                title={t('alerts.start', 'Iniciar')}
                borderRadius="lg"
              >
                <FiPlay />
              </IconButton>
            )}
            <IconButton
              aria-label={t('alerts.complete', 'Completar')}
              size="sm"
              colorPalette="green"
              onClick={() => setActionMode('complete')}
              title={t('alerts.complete', 'Completar')}
              borderRadius="lg"
            >
              <FiCheck />
            </IconButton>
            <Separator borderColor={colors.borderColor} w="70%" />
            <IconButton
              aria-label={t('alerts.addComment', 'Comentar')}
              size="sm"
              variant="ghost"
              onClick={() => { setNotes(''); setActionMode('progress'); }}
              color="blue.500"
              title={t('alerts.addComment', 'Comentar')}
              borderRadius="lg"
            >
              <FiEdit3 />
            </IconButton>
            <IconButton
              aria-label={t('alerts.reschedule', 'Reprogramar')}
              size="sm"
              variant="ghost"
              onClick={() => setActionMode('reschedule')}
              color={colors.textColor}
              title={t('alerts.reschedule', 'Reprogramar')}
              borderRadius="lg"
            >
              <FiCalendar />
            </IconButton>
            <IconButton
              aria-label={t('alerts.reassign', 'Reasignar')}
              size="sm"
              variant="ghost"
              onClick={loadUsersForReassign}
              color="purple.500"
              title={t('alerts.reassign', 'Reasignar')}
              borderRadius="lg"
            >
              <FiUserPlus />
            </IconButton>
            <IconButton
              aria-label={t('alerts.history', 'Historial')}
              size="sm"
              variant="ghost"
              onClick={loadHistory}
              color={colors.textColor}
              title={t('alerts.history', 'Historial')}
              borderRadius="lg"
            >
              <FiList />
            </IconButton>
            <Box flex={1} />
            <IconButton
              aria-label={t('alerts.cancel', 'Cancelar alerta')}
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={handleCancel}
              loading={loading}
              title={t('alerts.cancel', 'Cancelar alerta')}
              borderRadius="lg"
            >
              <FiX />
            </IconButton>
          </VStack>
        )}

        <DialogBody overflowY="auto" flex={1}>
          {actionMode === 'view' && (
            <VStack align="stretch" gap={4}>
              {/* Status Workflow Indicator */}
              <Box
                p={4}
                borderRadius="lg"
                bg={colors.bgColor}
                borderWidth={1}
                borderColor={colors.borderColor}
              >
                <HStack justify="space-between" align="center">
                  {/* PENDING Step */}
                  <VStack gap={1}>
                    <Box
                      w={10}
                      h={10}
                      borderRadius="full"
                      bg={alert.status === 'PENDING' ? 'orange.400' :
                          alert.status === 'IN_PROGRESS' || alert.status === 'COMPLETED' ? 'green.400' : 'gray.300'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontWeight="bold"
                      fontSize="lg"
                    >
                      {alert.status === 'PENDING' ? <FiClock /> : <FiCheck />}
                    </Box>
                    <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                      {t('alerts.pending', 'Pendiente')}
                    </Text>
                  </VStack>

                  {/* Connector Line 1 */}
                  <Box
                    flex={1}
                    h={1}
                    mx={2}
                    bg={alert.status === 'IN_PROGRESS' || alert.status === 'COMPLETED' ? 'green.400' : 'gray.300'}
                    borderRadius="full"
                  />

                  {/* IN_PROGRESS Step */}
                  <VStack gap={1}>
                    <Box
                      w={10}
                      h={10}
                      borderRadius="full"
                      bg={alert.status === 'IN_PROGRESS' ? 'blue.400' :
                          alert.status === 'COMPLETED' ? 'green.400' : 'gray.300'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontWeight="bold"
                      fontSize="lg"
                    >
                      {alert.status === 'COMPLETED' ? <FiCheck /> : <FiPlay />}
                    </Box>
                    <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                      {t('alerts.inProgress', 'En Progreso')}
                    </Text>
                  </VStack>

                  {/* Connector Line 2 */}
                  <Box
                    flex={1}
                    h={1}
                    mx={2}
                    bg={alert.status === 'COMPLETED' ? 'green.400' : 'gray.300'}
                    borderRadius="full"
                  />

                  {/* COMPLETED Step */}
                  <VStack gap={1}>
                    <Box
                      w={10}
                      h={10}
                      borderRadius="full"
                      bg={alert.status === 'COMPLETED' ? 'green.400' : 'gray.300'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontWeight="bold"
                      fontSize="lg"
                    >
                      <FiCheck />
                    </Box>
                    <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                      {t('alerts.completedStatus', 'Completada')}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* Priority and Type */}
              <HStack gap={2} flexWrap="wrap">
                <Badge
                  colorPalette={
                    alert.priority === 'URGENT'
                      ? 'red'
                      : alert.priority === 'HIGH'
                        ? 'orange'
                        : 'gray'
                  }
                >
                  {alert.priority}
                </Badge>
                <Badge colorPalette="purple">{alert.alertTypeLabel || alert.alertType}</Badge>
              </HStack>

              {/* Tags */}
              <Box>
                <HStack gap={1} mb={2} justify="space-between">
                  <HStack gap={1}>
                    <FiTag color={colors.textColorSecondary} size={14} />
                    <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary}>
                      {t('alerts.tags', 'Etiquetas')}
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={loadTagsForEdit}
                    color={colors.primaryColor}
                  >
                    <FiEdit3 size={12} style={{ marginRight: 4 }} />
                    {t('alerts.editTags', 'Editar')}
                  </Button>
                </HStack>
                {alert.tags && alert.tags.length > 0 ? (
                  <HStack gap={2} flexWrap="wrap">
                    {alert.tagDetails?.map((tag, index) => (
                      <Badge
                        key={tag.name}
                        px={2}
                        py={1}
                        borderRadius="md"
                        bg={tag.color}
                        color="white"
                        fontSize="xs"
                      >
                        {index + 1}. {tag.nameEs || tag.name}
                      </Badge>
                    )) || alert.tags.map((tag, index) => (
                      <Badge key={tag} colorPalette="blue" fontSize="xs">
                        {index + 1}. {tag}
                      </Badge>
                    ))}
                  </HStack>
                ) : (
                  <Text fontSize="sm" color={colors.textColorSecondary} fontStyle="italic">
                    {t('alerts.noTags', 'Sin etiquetas')}
                  </Text>
                )}
              </Box>

              {/* Description */}
              {alert.description && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary} mb={1}>
                    {t('alerts.description', 'Descripción')}
                  </Text>
                  <Text color={colors.textColor}>{alert.description}</Text>
                </Box>
              )}

              <Separator borderColor={colors.borderColor} />

              {/* Details */}
              <VStack align="stretch" gap={2}>
                <HStack>
                  <FiCalendar color={colors.textColorSecondary} />
                  <Text fontSize="sm" color={colors.textColorSecondary}>
                    {t('alerts.scheduledDate', 'Fecha')}:
                  </Text>
                  <Text fontSize="sm" color={colors.textColor}>
                    {formatDate(alert.scheduledDate)}
                  </Text>
                </HStack>

                {alert.scheduledTime && (
                  <HStack>
                    <FiClock color={colors.textColorSecondary} />
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t('alerts.time', 'Hora')}:
                    </Text>
                    <Text fontSize="sm" color={colors.textColor}>
                      {alert.scheduledTime.substring(0, 5)}
                    </Text>
                  </HStack>
                )}

                {alert.clientName && (
                  <HStack>
                    <FiUser color={colors.textColorSecondary} />
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t('alerts.client', 'Cliente')}:
                    </Text>
                    <Text fontSize="sm" color={colors.textColor}>
                      {alert.clientName}
                    </Text>
                  </HStack>
                )}

                {alert.rescheduleCount && alert.rescheduleCount > 0 && (
                  <HStack>
                    <FiRefreshCw color={colors.textColorSecondary} />
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t('alerts.rescheduleCount', 'Reprogramada')}:
                    </Text>
                    <Text fontSize="sm" color={colors.textColor}>
                      {alert.rescheduleCount} {t('alerts.times', 'veces')}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Processing Notes - Show current progress */}
              {alert.processingNotes && (
                <>
                  <Separator borderColor={colors.borderColor} />
                  <Box
                    p={3}
                    borderRadius="md"
                    bg={colors.bgColor}
                    borderWidth={1}
                    borderColor={colors.borderColor}
                  >
                    <HStack gap={2} mb={2}>
                      <FiEdit3 color="#3b82f6" size={14} />
                      <Text fontSize="xs" fontWeight="semibold" color="blue.600">
                        {t('alerts.currentProgress', 'Progreso Actual')}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color={colors.textColor}>
                      {alert.processingNotes}
                    </Text>
                    {alert.processedAt && (
                      <Text fontSize="xs" color={colors.textColorSecondary} mt={2}>
                        {t('alerts.lastUpdated', 'Última actualización')}: {formatDateTime(alert.processedAt)}
                        {alert.processedBy && ` - ${alert.processedBy}`}
                      </Text>
                    )}
                  </Box>
                </>
              )}

              <Separator borderColor={colors.borderColor} />

              {/* Quick Actions */}
              {alert.status !== 'COMPLETED' && alert.status !== 'CANCELLED' && (
                <VStack align="stretch" gap={2}>
                  <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary}>
                    {t('alerts.quickSnooze', 'Posponer rápido')}
                  </Text>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {[1, 3, 7, 14, 30].map((days) => (
                      <Button
                        key={days}
                        size="xs"
                        variant="outline"
                        borderColor={colors.borderColor}
                        color={colors.textColor}
                        onClick={() => handleSnooze(days)}
                        loading={loading}
                        px={3}
                        minW="auto"
                      >
                        +{days}d
                      </Button>
                    ))}
                  </Box>
                </VStack>
              )}

              <Separator borderColor={colors.borderColor} />

              {/* Attachments Section */}
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <FiPaperclip color={colors.textColorSecondary} size={14} />
                    <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary}>
                      {t('alerts.attachments', 'Archivos adjuntos')}
                    </Text>
                    {attachments.length > 0 && (
                      <Badge colorPalette="blue" size="sm">{attachments.length}</Badge>
                    )}
                  </HStack>
                  {alert.status !== 'COMPLETED' && alert.status !== 'CANCELLED' && (
                    <Button
                      size="xs"
                      variant="ghost"
                      color={colors.primaryColor}
                      onClick={() => fileInputRef.current?.click()}
                      loading={uploadingFiles}
                    >
                      <FiUpload size={12} style={{ marginRight: 4 }} />
                      {t('alerts.addFiles', 'Adjuntar')}
                    </Button>
                  )}
                </HStack>

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

                {/* Drop zone */}
                {alert.status !== 'COMPLETED' && alert.status !== 'CANCELLED' && (
                  <Box
                    border="2px dashed"
                    borderColor={isDragging ? 'blue.400' : colors.borderColor}
                    borderRadius="lg"
                    p={4}
                    textAlign="center"
                    bg={isDragging ? (colors.cardBg === 'gray.800' ? 'blue.900' : 'blue.50') : 'transparent'}
                    transition="all 0.2s"
                    cursor="pointer"
                    onDrop={handleDropFiles}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onClick={() => fileInputRef.current?.click()}
                    _hover={{ borderColor: 'blue.400' }}
                  >
                    {uploadingFiles ? (
                      <HStack justify="center" gap={2}>
                        <Spinner size="sm" />
                        <Text fontSize="sm" color={colors.textColorSecondary}>
                          {t('alerts.uploadingFiles', 'Subiendo archivos...')}
                        </Text>
                      </HStack>
                    ) : (
                      <VStack gap={1}>
                        <FiUpload size={18} color="var(--chakra-colors-blue-400)" />
                        <Text fontSize="xs" color={colors.textColorSecondary}>
                          {t('alerts.dropFilesHere', 'Arrastra archivos aquí o haz clic para seleccionar')}
                        </Text>
                      </VStack>
                    )}
                  </Box>
                )}

                {/* Existing attachments list */}
                {loadingAttachments ? (
                  <HStack justify="center" py={2}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t('alerts.loadingAttachments', 'Cargando adjuntos...')}
                    </Text>
                  </HStack>
                ) : attachments.length > 0 ? (
                  <VStack align="stretch" gap={2}>
                    {attachments.map((doc) => {
                      const FileIcon = getFileIcon(doc.mimeType);
                      return (
                        <HStack
                          key={doc.documentId}
                          p={2}
                          borderRadius="md"
                          bg={colors.bgColor}
                          borderWidth={1}
                          borderColor={colors.borderColor}
                          justify="space-between"
                        >
                          <HStack flex={1} overflow="hidden">
                            <FileIcon size={16} color={colors.textColorSecondary} />
                            <VStack align="start" gap={0} flex={1} overflow="hidden">
                              <Text fontSize="xs" fontWeight="medium" color={colors.textColor} truncate>
                                {doc.originalFileName}
                              </Text>
                              <Text fontSize="2xs" color={colors.textColorSecondary}>
                                {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                              </Text>
                            </VStack>
                          </HStack>
                          <IconButton
                            aria-label="Download"
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                          >
                            <FiDownload size={14} />
                          </IconButton>
                        </HStack>
                      );
                    })}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color={colors.textColorSecondary} fontStyle="italic" textAlign="center" py={1}>
                    {t('alerts.noAttachments', 'Sin archivos adjuntos')}
                  </Text>
                )}
              </VStack>
            </VStack>
          )}

          {actionMode === 'reschedule' && (
            <VStack align="stretch" gap={4}>
              <Text fontWeight="semibold" color={colors.textColor}>
                {t('alerts.rescheduleAlert', 'Reprogramar alerta')}
              </Text>

              <Box>
                <Text fontSize="sm" color={colors.textColorSecondary} mb={1}>
                  {t('alerts.newDate', 'Nueva fecha')}
                </Text>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" color={colors.textColorSecondary} mb={1}>
                  {t('alerts.newTime', 'Nueva hora')} ({t('common.optional', 'opcional')})
                </Text>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" color={colors.textColorSecondary} mb={1}>
                  {t('alerts.notes', 'Notas')} ({t('common.optional', 'opcional')})
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('alerts.rescheduleNotes', 'Razón del cambio...')}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>
            </VStack>
          )}

          {actionMode === 'complete' && (
            <VStack align="stretch" gap={4}>
              <Text fontWeight="semibold" color={colors.textColor}>
                {t('alerts.completeAlert', 'Marcar como completada')}
              </Text>

              <Box>
                <Text fontSize="sm" color={colors.textColorSecondary} mb={1}>
                  {t('alerts.completionNotes', 'Notas de finalización')} (
                  {t('common.optional', 'opcional')})
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('alerts.completionNotesPlaceholder', 'Detalles de la acción realizada...')}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>
            </VStack>
          )}

          {actionMode === 'progress' && (
            <VStack align="stretch" gap={4}>
              <Box
                p={4}
                borderRadius="lg"
                bg={colors.bgColor}
                borderWidth={1}
                borderColor={colors.borderColor}
              >
                <HStack gap={2} mb={2}>
                  <FiEdit3 color="#3b82f6" size={20} />
                  <Text fontWeight="bold" color={colors.textColor} fontSize="lg">
                    {t('alerts.updateProgress', 'Actualizar Progreso')}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('alerts.progressDescription', 'Registra el avance de esta tarea. Puedes agregar notas sobre lo que has realizado.')}
                </Text>
              </Box>

              {/* Current Status Indicator */}
              <HStack
                p={3}
                borderRadius="md"
                bg={colors.bgColor}
                borderWidth={1}
                borderColor={colors.borderColor}
              >
                <Box
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={alert.status === 'IN_PROGRESS' ? 'blue.400' : 'gray.400'}
                />
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('alerts.currentStatus', 'Estado actual')}:
                </Text>
                <Badge colorPalette={alert.status === 'IN_PROGRESS' ? 'blue' : 'gray'}>
                  {alert.status === 'IN_PROGRESS'
                    ? t('alerts.inProgress', 'En Progreso')
                    : alert.status}
                </Badge>
              </HStack>

              <Box>
                <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary} mb={2}>
                  {t('alerts.progressNotes', 'Notas de progreso')} *
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('alerts.progressNotesPlaceholder', 'Describe el avance realizado, actividades completadas, próximos pasos...')}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                  minH="120px"
                  _placeholder={{ color: colors.textColorSecondary }}
                />
              </Box>

              {/* Processing Notes History Preview */}
              {alert.processingNotes && (
                <Box
                  p={3}
                  borderRadius="md"
                  bg={colors.bgColor}
                  borderWidth={1}
                  borderColor={colors.borderColor}
                >
                  <Text fontSize="xs" fontWeight="semibold" color={colors.textColorSecondary} mb={1}>
                    {t('alerts.lastUpdate', 'Última actualización')}:
                  </Text>
                  <Text fontSize="sm" color={colors.textColor}>
                    {alert.processingNotes}
                  </Text>
                </Box>
              )}
            </VStack>
          )}

          {actionMode === 'history' && (
            <VStack align="stretch" gap={3}>
              <Text fontWeight="semibold" color={colors.textColor}>
                {t('alerts.history', 'Historial de cambios')}
              </Text>

              {history.length === 0 ? (
                <Text color={colors.textColorSecondary} fontStyle="italic">
                  {t('alerts.noHistory', 'Sin historial disponible')}
                </Text>
              ) : (
                history.map((entry) => (
                  <Box
                    key={entry.historyId}
                    p={3}
                    borderRadius="md"
                    bg={colors.bgColor}
                    borderWidth={1}
                    borderColor={colors.borderColor}
                  >
                    <HStack justify="space-between" mb={1}>
                      <Badge colorPalette="blue">{entry.actionType}</Badge>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {formatDateTime(entry.createdAt)}
                      </Text>
                    </HStack>
                    {entry.notes && (
                      <Text fontSize="sm" color={colors.textColor}>
                        {entry.notes}
                      </Text>
                    )}
                    <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
                      {t('alerts.by', 'Por')}: {entry.createdBy}
                    </Text>
                  </Box>
                ))
              )}
            </VStack>
          )}

          {actionMode === 'reassign' && (
            <VStack align="stretch" gap={4}>
              <Box
                p={4}
                borderRadius="lg"
                bg={colors.bgColor}
                borderWidth={1}
                borderColor={colors.borderColor}
              >
                <HStack gap={2} mb={2}>
                  <FiUserPlus color="#9333ea" size={20} />
                  <Text fontWeight="bold" color={colors.textColor} fontSize="lg">
                    {t('alerts.reassignAlert', 'Reasignar Alerta')}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('alerts.reassignDescription', 'Seleccione el usuario al que desea reasignar esta alerta.')}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary} mb={2}>
                  {t('alerts.selectNewUser', 'Seleccionar nuevo usuario')} *
                </Text>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.borderColor}`,
                    backgroundColor: colors.bgColor,
                    color: colors.textColor,
                    fontSize: '14px',
                  }}
                >
                  <option value="">{t('alerts.selectUser', 'Seleccione un usuario...')}</option>
                  {users.map((user) => (
                    <option key={user.username} value={user.username}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary} mb={2}>
                  {t('alerts.reassignReason', 'Razón (opcional)')}
                </Text>
                <Textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder={t('alerts.reassignReasonPlaceholder', 'Indique el motivo de la reasignación...')}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                  minH="80px"
                  _placeholder={{ color: colors.textColorSecondary }}
                />
              </Box>
            </VStack>
          )}

          {actionMode === 'editTags' && (
            <VStack align="stretch" gap={4}>
              <Box
                p={4}
                borderRadius="lg"
                bg={colors.bgColor}
                borderWidth={1}
                borderColor={colors.borderColor}
              >
                <HStack gap={2} mb={2}>
                  <FiTag color="#10b981" size={20} />
                  <Text fontWeight="bold" color={colors.textColor} fontSize="lg">
                    {t('alerts.editTagsTitle', 'Editar Etiquetas')}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('alerts.editTagsDescription', 'Selecciona las etiquetas y ordénalas. El orden determina la jerarquía en el Gantt.')}
                </Text>
              </Box>

              {/* Selected tags with order */}
              {selectedTags.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary} mb={2}>
                    {t('alerts.selectedTags', 'Etiquetas seleccionadas')} ({selectedTags.length})
                  </Text>
                  <VStack align="stretch" gap={1}>
                    {selectedTags.map((tagName, index) => {
                      const tagDetail = availableTags.find(t => t.name === tagName);
                      return (
                        <HStack
                          key={tagName}
                          p={2}
                          borderRadius="md"
                          bg={colors.bgColor}
                          borderWidth={1}
                          borderColor={colors.borderColor}
                          justify="space-between"
                        >
                          <HStack>
                            <Text fontSize="sm" color={colors.textColorSecondary} fontWeight="bold" w={6}>
                              {index + 1}.
                            </Text>
                            <Box
                              w={3}
                              h={3}
                              borderRadius="sm"
                              bg={tagDetail?.color || '#6B7280'}
                            />
                            <Text fontSize="sm" color={colors.textColor}>
                              {tagDetail?.nameEs || tagName}
                            </Text>
                          </HStack>
                          <HStack gap={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => moveTagUp(index)}
                              disabled={index === 0}
                              p={1}
                              minW="auto"
                            >
                              ↑
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => moveTagDown(index)}
                              disabled={index >= selectedTags.length - 1}
                              p={1}
                              minW="auto"
                            >
                              ↓
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => toggleTag(tagName)}
                              p={1}
                              minW="auto"
                            >
                              ×
                            </Button>
                          </HStack>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>
              )}

              {/* Available tags to add */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary} mb={2}>
                  {t('alerts.availableTags', 'Etiquetas disponibles')}
                </Text>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {availableTags
                    .filter(tag => !selectedTags.includes(tag.name))
                    .map((tag) => (
                      <Badge
                        key={tag.name}
                        px={2}
                        py={1}
                        borderRadius="md"
                        bg={tag.color}
                        color="white"
                        fontSize="xs"
                        cursor="pointer"
                        onClick={() => toggleTag(tag.name)}
                        _hover={{ opacity: 0.8 }}
                      >
                        + {tag.nameEs || tag.name}
                      </Badge>
                    ))}
                </Box>
              </Box>
            </VStack>
          )}
        </DialogBody>
        </HStack>

        {/* Footer — only shown for sub-action modes (not view) */}
        {actionMode !== 'view' && (
          <DialogFooter
            p={0}
            borderTopWidth={1}
            borderColor={colors.borderColor}
            flexShrink={0}
          >
            <HStack width="100%" p={3} justify="space-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setNotes(''); setActionMode('view'); }}
                color={colors.textColor}
              >
                {t('common.back', 'Volver')}
              </Button>

              {actionMode === 'reschedule' && (
                <Button size="sm" colorPalette="blue" onClick={handleReschedule} loading={loading}>
                  <FiCalendar style={{ marginRight: 6 }} />
                  {t('alerts.confirmReschedule', 'Confirmar')}
                </Button>
              )}
              {actionMode === 'complete' && (
                <Button size="sm" colorPalette="green" onClick={handleComplete} loading={loading}>
                  <FiCheck style={{ marginRight: 6 }} />
                  {t('alerts.confirmComplete', 'Confirmar')}
                </Button>
              )}
              {actionMode === 'progress' && (
                <Button size="sm" colorPalette="blue" onClick={handleUpdateProgress} loading={loading} disabled={!notes.trim()}>
                  <FiEdit3 style={{ marginRight: 6 }} />
                  {t('alerts.saveProgress', 'Guardar')}
                </Button>
              )}
              {actionMode === 'reassign' && (
                <Button size="sm" colorPalette="purple" onClick={handleReassign} loading={loading} disabled={!selectedUser}>
                  <FiUserPlus style={{ marginRight: 6 }} />
                  {t('alerts.confirmReassign', 'Reasignar')}
                </Button>
              )}
              {actionMode === 'editTags' && (
                <Button size="sm" colorPalette="green" onClick={handleSaveTags} loading={loading}>
                  <FiTag style={{ marginRight: 6 }} />
                  {t('alerts.saveTags', 'Guardar')}
                </Button>
              )}
            </HStack>
          </DialogFooter>
        )}

        {/* Minimal footer for completed/cancelled alerts or view mode with sidebar */}
        {actionMode === 'view' && (alert.status === 'COMPLETED' || alert.status === 'CANCELLED') && (
          <DialogFooter
            p={0}
            borderTopWidth={1}
            borderColor={colors.borderColor}
            flexShrink={0}
          >
            <HStack width="100%" p={2} justify="center">
              <Button
                size="sm"
                variant="ghost"
                onClick={loadHistory}
                color={colors.textColor}
              >
                <FiList style={{ marginRight: 6 }} />
                {t('alerts.history', 'Historial')}
              </Button>
            </HStack>
          </DialogFooter>
        )}
      </DialogContent>
    </DialogRoot>
  );
};

export default AlertDetailModal;
