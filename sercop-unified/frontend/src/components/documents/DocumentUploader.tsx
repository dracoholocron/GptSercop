/**
 * DocumentUploader - Reusable document upload component
 * Features: Drag & drop, file validation, category selection, progress tracking
 */

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  IconButton,
  Textarea,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiFile,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiImage,
  FiFileText,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { documentService } from '../../services/documentService';
import { DocumentCategorySelector } from './DocumentCategorySelector';
import type {
  DocumentCategory,
  DocumentType,
  UploadDocumentCommand,
  UploadProgress,
  DocumentAccessLevel,
} from '../../types/documents';

interface DocumentUploaderProps {
  operationId?: string;
  eventId?: string;
  categories: DocumentCategory[];
  documentTypes: DocumentType[];
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  compact?: boolean;
}

interface FileToUpload {
  id: string;
  file: File;
  categoryCode: string;
  subcategoryCode?: string;
  documentTypeCode: string;
  tags: string[];
  accessLevel: DocumentAccessLevel;
  changeNotes: string;
  progress: UploadProgress | null;
}

export const DocumentUploader = ({
  operationId,
  eventId,
  categories,
  documentTypes,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  compact = false,
}: DocumentUploaderProps) => {
  const { t, i18n } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Default classification
  const [defaultCategory, setDefaultCategory] = useState('');
  const [defaultDocumentType, setDefaultDocumentType] = useState('');
  const [defaultChangeNotes, setDefaultChangeNotes] = useState('');

  const selectedDocType = documentTypes.find(dt => dt.code === defaultDocumentType);
  const maxFileSizeBytes = selectedDocType?.maxFileSizeMb
    ? selectedDocType.maxFileSizeMb * 1024 * 1024
    : 50 * 1024 * 1024; // 50 MB default

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSizeBytes) {
      const maxMb = Math.round(maxFileSizeBytes / (1024 * 1024));
      return { valid: false, error: t('documents.errors.fileTooLarge', { max: `${maxMb} MB` }) };
    }

    // Validate MIME type against the selected document type
    if (selectedDocType?.allowedMimeTypes && selectedDocType.allowedMimeTypes.length > 0) {
      if (!selectedDocType.allowedMimeTypes.includes(file.type)) {
        const allowedExts = selectedDocType.allowedMimeTypes
          .map(mime => {
            const map: Record<string, string> = {
              'application/pdf': 'PDF',
              'image/jpeg': 'JPEG',
              'image/png': 'PNG',
              'image/gif': 'GIF',
              'application/msword': 'DOC',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
              'application/vnd.ms-excel': 'XLS',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
              'text/plain': 'TXT',
              'message/rfc822': 'EML',
            };
            return map[mime] || mime;
          })
          .join(', ');
        return {
          valid: false,
          error: t('documents.errors.fileTypeNotAllowed', {
            type: file.name.split('.').pop()?.toUpperCase() || file.type,
            allowed: allowedExts,
            defaultValue: `Tipo de archivo .${file.name.split('.').pop()} no permitido. Tipos aceptados: ${allowedExts}`,
          }),
        };
      }
    }

    return { valid: true };
  }, [t, maxFileSizeBytes, selectedDocType]);

  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: FileToUpload[] = [];

    for (let i = 0; i < Math.min(files.length, maxFiles - filesToUpload.length); i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (validation.valid) {
        newFiles.push({
          id: `${Date.now()}-${i}`,
          file,
          categoryCode: defaultCategory,
          subcategoryCode: undefined,
          documentTypeCode: defaultDocumentType,
          tags: [],
          accessLevel: 'RESTRICTED',
          changeNotes: defaultChangeNotes,
          progress: null,
        });
      } else {
        onUploadError?.(validation.error || 'Invalid file');
      }
    }

    setFilesToUpload(prev => [...prev, ...newFiles]);
  }, [filesToUpload.length, maxFiles, defaultCategory, defaultDocumentType, defaultChangeNotes, validateFile, onUploadError]);

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

  const removeFile = useCallback((id: string) => {
    setFilesToUpload(prev => prev.filter(f => f.id !== id));
  }, []);

  const uploadFiles = async () => {
    if (!defaultCategory || !defaultDocumentType) {
      onUploadError?.(t('documents.errors.classificationRequired'));
      return;
    }

    setUploading(true);

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileToUpload = filesToUpload[i];

      // Skip already completed
      if (fileToUpload.progress?.status === 'completed') continue;

      try {
        const command: UploadDocumentCommand = {
          file: fileToUpload.file,
          operationId,
          eventId,
          categoryCode: defaultCategory,
          subcategoryCode: fileToUpload.subcategoryCode,
          documentTypeCode: defaultDocumentType,
          tags: fileToUpload.tags,
          accessLevel: fileToUpload.accessLevel,
          changeNotes: defaultChangeNotes || undefined,
        };

        const doc = await documentService.uploadDocument(command, (progress) => {
          setFilesToUpload(prev => prev.map(f =>
            f.id === fileToUpload.id ? { ...f, progress } : f
          ));
        });

        onUploadComplete?.(doc.documentId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setFilesToUpload(prev => prev.map(f =>
          f.id === fileToUpload.id
            ? { ...f, progress: { fileName: f.file.name, progress: 0, status: 'error', error: errorMessage } }
            : f
        ));
        onUploadError?.(errorMessage);
      }
    }

    // Clear completed uploads
    setFilesToUpload(prev => prev.filter(f => f.progress?.status !== 'completed'));
    setUploading(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FiImage;
    if (mimeType === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  return (
    <VStack gap={4} align="stretch">
      {/* Drop Zone */}
      <Box
        border="2px dashed"
        borderColor={isDragging ? 'blue.500' : colors.borderColor}
        borderRadius="xl"
        p={compact ? 4 : 8}
        textAlign="center"
        bg={isDragging ? (isDark ? 'blue.900' : 'blue.50') : 'transparent'}
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
          onChange={(e) => handleFilesSelected(e.target.files)}
          accept={selectedDocType?.allowedMimeTypes?.length ? selectedDocType.allowedMimeTypes.join(',') : '*/*'}
        />

        <VStack gap={2}>
          <Box p={3} bg={isDark ? 'gray.700' : 'gray.100'} borderRadius="full">
            <FiUpload size={24} color="var(--chakra-colors-blue-500)" />
          </Box>
          <Text fontWeight="medium" color={colors.textColor}>
            {t('documents.dropFilesHere')}
          </Text>
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {t('documents.orClickToSelect')}
          </Text>
          <Text fontSize="xs" color={colors.textColorSecondary}>
            {t('documents.maxFileSize', { size: `${selectedDocType?.maxFileSizeMb || 50} MB` })}
          </Text>
          {selectedDocType?.allowedMimeTypes && selectedDocType.allowedMimeTypes.length > 0 && (
            <Text fontSize="xs" color={colors.textColorSecondary}>
              {t('documents.allowedTypes', {
                defaultValue: 'Tipos permitidos: {{types}}',
                types: selectedDocType.allowedMimeTypes.map(mime => {
                  const map: Record<string, string> = {
                    'application/pdf': 'PDF',
                    'image/jpeg': 'JPEG',
                    'image/png': 'PNG',
                    'image/gif': 'GIF',
                    'application/msword': 'DOC',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
                    'application/vnd.ms-excel': 'XLS',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
                    'text/plain': 'TXT',
                    'message/rfc822': 'EML',
                  };
                  return map[mime] || mime;
                }).join(', '),
              })}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Classification Selection */}
      {!compact && (
        <Box p={4} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
          <Text fontWeight="medium" mb={3} color={colors.textColor}>
            {t('documents.classification')}
          </Text>
          <VStack gap={3} align="stretch">
            <DocumentCategorySelector
              categories={categories}
              documentTypes={documentTypes}
              selectedCategory={defaultCategory}
              selectedDocumentType={defaultDocumentType}
              onCategoryChange={setDefaultCategory}
              onDocumentTypeChange={setDefaultDocumentType}
              language={lang}
            />
            <Textarea
              placeholder={t('documents.changeNotesPlaceholder')}
              value={defaultChangeNotes}
              onChange={(e) => setDefaultChangeNotes(e.target.value)}
              size="sm"
              rows={2}
            />
          </VStack>
        </Box>
      )}

      {/* Files Queue */}
      {filesToUpload.length > 0 && (
        <VStack gap={2} align="stretch">
          <Text fontWeight="medium" color={colors.textColor}>
            {t('documents.filesToUpload', { count: filesToUpload.length })}
          </Text>

          {filesToUpload.map((fileToUpload) => {
            const FileIcon = getFileIcon(fileToUpload.file.type);
            return (
              <Box
                key={fileToUpload.id}
                p={3}
                bg={colors.cardBg}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={colors.borderColor}
              >
                <HStack justify="space-between" mb={fileToUpload.progress ? 2 : 0}>
                  <HStack>
                    <FileIcon size={20} color={colors.textColorSecondary} />
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                        {fileToUpload.file.name}
                      </Text>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {documentService.formatFileSize(fileToUpload.file.size)}
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack>
                    {fileToUpload.progress?.status === 'completed' && (
                      <Badge colorPalette="green">
                        <FiCheck /> {t('common.completed')}
                      </Badge>
                    )}
                    {fileToUpload.progress?.status === 'error' && (
                      <Badge colorPalette="red">
                        <FiAlertCircle /> {t('common.error')}
                      </Badge>
                    )}
                    <IconButton
                      aria-label="Remove"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(fileToUpload.id)}
                      disabled={uploading}
                    >
                      <FiX />
                    </IconButton>
                  </HStack>
                </HStack>

                {fileToUpload.progress && fileToUpload.progress.status === 'uploading' && (
                  <Progress.Root value={fileToUpload.progress.progress} size="sm" colorPalette="blue">
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                )}

                {fileToUpload.progress?.status === 'error' && fileToUpload.progress.error && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {fileToUpload.progress.error}
                  </Text>
                )}
              </Box>
            );
          })}

          <Button
            colorPalette="blue"
            onClick={uploadFiles}
            loading={uploading}
            disabled={filesToUpload.length === 0 || !defaultCategory || !defaultDocumentType}
          >
            <HStack>
              <FiUpload />
              <Text>{t('documents.uploadAll')}</Text>
            </HStack>
          </Button>
        </VStack>
      )}
    </VStack>
  );
};

export default DocumentUploader;
