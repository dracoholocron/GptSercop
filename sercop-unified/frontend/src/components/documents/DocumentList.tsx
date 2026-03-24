/**
 * DocumentList - Display and manage documents for an operation or event
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  IconButton,
  Input,
  Spinner,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiFile,
  FiImage,
  FiFileText,
  FiClock,
  FiUser,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { documentService } from '../../services/documentService';
import { openDocumentWithAuth } from '../../utils/documentUtils';
import type { Document } from '../../types/documents';

interface DocumentListProps {
  operationId?: string;
  eventId?: string;
  showFilters?: boolean;
  onDocumentClick?: (document: Document) => void;
  onRefresh?: () => void;
  compact?: boolean;
}

export const DocumentList = ({
  operationId,
  eventId,
  showFilters = true,
  onDocumentClick,
  onRefresh,
  compact = false,
}: DocumentListProps) => {
  const { t, i18n } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!operationId && !eventId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const docs = await documentService.getDocuments({
        operationId,
        eventId,
        searchText: searchText || undefined,
      });
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading documents');
    } finally {
      setLoading(false);
    }
  }, [operationId, eventId, searchText]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleRefresh = () => {
    loadDocuments();
    onRefresh?.();
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentService.downloadDocument(doc.documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const handlePreview = (doc: Document) => {
    if (documentService.canPreview(doc.mimeType)) {
      const url = documentService.getPreviewUrl(doc.documentId);
      openDocumentWithAuth(url);
    } else {
      handleDownload(doc);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(t('documents.confirmDelete'))) return;

    try {
      await documentService.deleteDocument(doc.documentId);
      setDocuments(prev => prev.filter(d => d.documentId !== doc.documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FiImage;
    if (mimeType === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={2} color={colors.textColorSecondary}>
          {t('documents.loading')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="red.500">{error}</Text>
        <Button size="sm" mt={2} onClick={handleRefresh}>
          {t('common.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      {/* Header with search */}
      {showFilters && (
        <HStack justify="space-between" wrap="wrap" gap={2}>
          <HStack flex={1} minW="200px" maxW="400px">
            <Input
              placeholder={t('documents.searchPlaceholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="sm"
            />
            <IconButton
              aria-label="Search"
              size="sm"
              onClick={() => loadDocuments()}
            >
              <FiSearch />
            </IconButton>
          </HStack>
          <IconButton
            aria-label="Refresh"
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
          >
            <FiRefreshCw />
          </IconButton>
        </HStack>
      )}

      {/* Document count */}
      <Text fontSize="sm" color={colors.textColorSecondary}>
        {t('documents.totalCount', { count: documents.length })}
      </Text>

      {/* Document list */}
      {documents.length === 0 ? (
        <Box textAlign="center" py={8} color={colors.textColorSecondary}>
          <FiFile size={32} style={{ margin: '0 auto' }} />
          <Text mt={2}>{t('documents.noDocuments')}</Text>
        </Box>
      ) : (
        <VStack gap={2} align="stretch">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.mimeType);
            return (
              <Box
                key={doc.documentId}
                p={compact ? 2 : 3}
                bg={colors.cardBg}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={colors.borderColor}
                _hover={{ borderColor: 'blue.400', cursor: onDocumentClick ? 'pointer' : 'default' }}
                onClick={() => onDocumentClick?.(doc)}
              >
                <HStack justify="space-between" wrap="wrap" gap={2}>
                  <HStack flex={1} minW="200px">
                    <Box p={2} bg={isDark ? 'gray.700' : 'gray.100'} borderRadius="md">
                      <FileIcon size={20} color="var(--chakra-colors-blue-500)" />
                    </Box>
                    <VStack align="start" gap={0} flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={colors.textColor}
                        noOfLines={1}
                      >
                        {doc.originalFileName}
                      </Text>
                      <HStack gap={2} wrap="wrap">
                        <Text fontSize="xs" color={colors.textColorSecondary}>
                          {doc.formattedFileSize || documentService.formatFileSize(doc.fileSize)}
                        </Text>
                        <Badge size="sm" colorPalette="blue">
                          v{doc.version}
                        </Badge>
                        {doc.categoryCode && (
                          <Badge size="sm" variant="outline">
                            {doc.categoryCode}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>

                  {/* Metadata */}
                  {!compact && (
                    <HStack gap={4} color={colors.textColorSecondary} fontSize="xs">
                      <HStack gap={1}>
                        <FiUser size={12} />
                        <Text>{doc.uploadedBy}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <FiClock size={12} />
                        <Text>{formatDate(doc.uploadedAt)}</Text>
                      </HStack>
                    </HStack>
                  )}

                  {/* Actions */}
                  <HStack gap={1} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      aria-label="Preview"
                      size="xs"
                      variant="ghost"
                      onClick={() => handlePreview(doc)}
                      title={t('documents.preview')}
                    >
                      <FiEye />
                    </IconButton>
                    <IconButton
                      aria-label="Download"
                      size="xs"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                      title={t('documents.download')}
                    >
                      <FiDownload />
                    </IconButton>
                    <IconButton
                      aria-label="Delete"
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleDelete(doc)}
                      title={t('documents.delete')}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </HStack>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
};

export default DocumentList;
