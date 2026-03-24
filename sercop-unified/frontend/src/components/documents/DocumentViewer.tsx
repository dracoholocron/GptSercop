/**
 * DocumentViewer - Professional, collapsible document viewer component
 *
 * A reusable component for displaying documents in a compact, space-efficient manner.
 * Supports multiple view modes: chips, list, and grid.
 * Can be used across the entire system for consistent document visualization.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Flex,
  Grid,
  Collapsible,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiEye,
  FiFile,
  FiImage,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiList,
  FiSearch,
  FiX,
  FiPaperclip,
  FiPackage,
  FiCode,
  FiArchive,
  FiFilm,
  FiMusic,
  FiExternalLink,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { openDocumentWithAuth, downloadDocumentWithAuth } from '../../utils/documentUtils';

// Simplified document interface for flexibility
export interface DocumentItem {
  documentId: string;
  originalFileName: string;
  mimeType?: string;
  fileSize?: number;
  formattedFileSize?: string;
  categoryCode?: string;
  documentTypeCode?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  previewUrl?: string;
  downloadUrl?: string;
  version?: number;
}

export type ViewMode = 'chips' | 'list' | 'grid';

interface DocumentViewerProps {
  /** Array of documents to display */
  documents: DocumentItem[];
  /** Title to show in the header */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Whether the viewer starts expanded or collapsed */
  defaultExpanded?: boolean;
  /** Initial view mode */
  defaultViewMode?: ViewMode;
  /** Show search functionality */
  showSearch?: boolean;
  /** Show view mode toggle */
  showViewModeToggle?: boolean;
  /** Maximum items to show in collapsed chips view */
  maxChipsVisible?: number;
  /** Color scheme for the header */
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
  /** Whether to show the expand/collapse toggle */
  collapsible?: boolean;
  /** Callback when a document is clicked for preview */
  onPreview?: (doc: DocumentItem) => void;
  /** Callback when a document is downloaded */
  onDownload?: (doc: DocumentItem) => void;
  /** Compact mode for embedding in tight spaces */
  compact?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
}

// Render file icon based on mime type
const renderFileIcon = (mimeType?: string, size: number = 16) => {
  if (!mimeType) return <FiFile size={size} />;
  if (mimeType.startsWith('image/')) return <FiImage size={size} />;
  if (mimeType === 'application/pdf') return <FiFileText size={size} />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FiFileText size={size} />;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FiGrid size={size} />;
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('rar')) return <FiArchive size={size} />;
  if (mimeType.includes('xml') || mimeType.includes('json')) return <FiCode size={size} />;
  if (mimeType.startsWith('video/')) return <FiFilm size={size} />;
  if (mimeType.startsWith('audio/')) return <FiMusic size={size} />;
  return <FiFile size={size} />;
};

// File type color mapping
const getFileColor = (mimeType?: string): string => {
  if (!mimeType) return 'gray';
  if (mimeType.startsWith('image/')) return 'purple';
  if (mimeType === 'application/pdf') return 'red';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'blue';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'green';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'orange';
  if (mimeType.includes('xml') || mimeType.includes('json')) return 'cyan';
  return 'gray';
};

// Color scheme configurations
const colorSchemes = {
  blue: {
    bg: 'blue.50',
    bgDark: 'blue.900',
    border: 'blue.300',
    borderDark: 'blue.600',
    text: 'blue.700',
    textDark: 'blue.200',
    icon: 'blue.500',
  },
  green: {
    bg: 'green.50',
    bgDark: 'green.900',
    border: 'green.300',
    borderDark: 'green.600',
    text: 'green.700',
    textDark: 'green.200',
    icon: 'green.500',
  },
  purple: {
    bg: 'purple.50',
    bgDark: 'purple.900',
    border: 'purple.300',
    borderDark: 'purple.600',
    text: 'purple.700',
    textDark: 'purple.200',
    icon: 'purple.500',
  },
  orange: {
    bg: 'orange.50',
    bgDark: 'orange.900',
    border: 'orange.300',
    borderDark: 'orange.600',
    text: 'orange.700',
    textDark: 'orange.200',
    icon: 'orange.500',
  },
  gray: {
    bg: 'gray.50',
    bgDark: 'gray.800',
    border: 'gray.200',
    borderDark: 'gray.600',
    text: 'gray.700',
    textDark: 'gray.200',
    icon: 'gray.500',
  },
};

export const DocumentViewer = ({
  documents,
  title,
  subtitle,
  defaultExpanded = false,
  defaultViewMode = 'chips',
  showSearch = true,
  showViewModeToggle = true,
  maxChipsVisible = 5,
  colorScheme = 'blue',
  collapsible = true,
  onPreview,
  onDownload,
  compact = false,
  emptyMessage,
}: DocumentViewerProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);

  const scheme = colorSchemes[colorScheme];

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(doc =>
      doc.originalFileName.toLowerCase().includes(query) ||
      doc.categoryCode?.toLowerCase().includes(query) ||
      doc.documentTypeCode?.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Format file size
  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Truncate filename
  const truncateFileName = useCallback((name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const ext = name.lastIndexOf('.');
    if (ext === -1) return name.slice(0, maxLength - 3) + '...';
    const extension = name.slice(ext);
    const baseName = name.slice(0, ext);
    const truncatedBase = baseName.slice(0, maxLength - extension.length - 3);
    return `${truncatedBase}...${extension}`;
  }, []);

  // Handle document actions
  const handlePreview = useCallback((doc: DocumentItem) => {
    if (onPreview) {
      onPreview(doc);
    } else if (doc.previewUrl) {
      openDocumentWithAuth(doc.previewUrl);
    }
  }, [onPreview]);

  const handleDownload = useCallback((doc: DocumentItem) => {
    if (onDownload) {
      onDownload(doc);
    } else if (doc.downloadUrl) {
      downloadDocumentWithAuth(doc.downloadUrl, doc.fileName || doc.name);
    }
  }, [onDownload]);

  if (documents.length === 0) {
    return (
      <Box
        p={3}
        bg={isDark ? 'gray.800' : 'gray.50'}
        borderRadius="lg"
        border="1px dashed"
        borderColor={isDark ? 'gray.600' : 'gray.300'}
      >
        <HStack justify="center" color={colors.textColorSecondary}>
          <FiPaperclip />
          <Text fontSize="sm">{emptyMessage || t('documents.noDocuments', 'No hay documentos')}</Text>
        </HStack>
      </Box>
    );
  }

  // Document chip component for compact view
  const DocumentChip = ({ doc }: { doc: DocumentItem }) => {
    const fileColor = getFileColor(doc.mimeType);
    const tooltipText = `${doc.originalFileName} - ${doc.formattedFileSize || formatFileSize(doc.fileSize)}${doc.categoryCode ? ` (${doc.categoryCode})` : ''}`;

    // Use native HTML span with inline styles to avoid Chakra component issues
    const bgColor = isDark ? 'rgba(66, 153, 225, 0.3)' : 'rgba(66, 153, 225, 0.15)';
    const textColor = isDark ? '#90CDF4' : '#2B6CB0';

    return (
      <span
        title={tooltipText}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontSize: '12px',
          backgroundColor: bgColor,
          color: textColor,
          transition: 'all 0.2s',
        }}
        onClick={() => handlePreview(doc)}
      >
        {renderFileIcon(doc.mimeType, 12)}
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {truncateFileName(doc.originalFileName, 15)}
        </span>
      </span>
    );
  };

  // Document list item component - using native HTML to avoid Chakra v3 issues
  const DocumentListItem = ({ doc }: { doc: DocumentItem }) => {
    const bgColor = isDark ? '#2D3748' : '#FFFFFF';
    const borderColor = isDark ? '#4A5568' : '#E2E8F0';
    const hoverBg = isDark ? '#374151' : '#F7FAFC';

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: compact ? '8px' : '12px',
          backgroundColor: bgColor,
          borderRadius: '6px',
          border: `1px solid ${borderColor}`,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: isDark ? 'rgba(66, 153, 225, 0.3)' : 'rgba(66, 153, 225, 0.15)',
              borderRadius: '6px',
              color: '#4299E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderFileIcon(doc.mimeType, compact ? 14 : 18)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: compact ? '12px' : '14px',
                fontWeight: 500,
                color: colors.textColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={doc.originalFileName}
            >
              {doc.originalFileName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: colors.textColorSecondary }}>
                {doc.formattedFileSize || formatFileSize(doc.fileSize)}
              </span>
              {doc.categoryCode && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${borderColor}`,
                    color: colors.textColorSecondary,
                  }}
                >
                  {doc.categoryCode}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            title={t('documents.preview', 'Vista previa')}
            onClick={() => handlePreview(doc)}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.textColorSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiEye size={14} />
          </button>
          <button
            title={t('documents.download', 'Descargar')}
            onClick={() => handleDownload(doc)}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#4299E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiDownload size={14} />
          </button>
        </div>
      </div>
    );
  };

  // Document grid item component - using native HTML to avoid Chakra v3 issues
  const DocumentGridItem = ({ doc }: { doc: DocumentItem }) => {
    const bgColor = isDark ? '#2D3748' : '#FFFFFF';
    const borderColor = isDark ? '#4A5568' : '#E2E8F0';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: bgColor,
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => handlePreview(doc)}
      >
        <div
          style={{
            padding: '12px',
            backgroundColor: isDark ? 'rgba(66, 153, 225, 0.3)' : 'rgba(66, 153, 225, 0.15)',
            borderRadius: '8px',
            color: '#4299E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderFileIcon(doc.mimeType, 28)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: colors.textColor,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100px',
            }}
            title={doc.originalFileName}
          >
            {truncateFileName(doc.originalFileName, 18)}
          </div>
          <div style={{ fontSize: '10px', color: colors.textColorSecondary }}>
            {doc.formattedFileSize || formatFileSize(doc.fileSize)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            title="Preview"
            onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.textColorSecondary,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FiExternalLink size={12} />
          </button>
          <button
            title="Download"
            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#4299E1',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FiDownload size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Chips visible in collapsed state
  const visibleChips = showAllChips ? filteredDocuments : filteredDocuments.slice(0, maxChipsVisible);
  const hiddenCount = filteredDocuments.length - maxChipsVisible;

  return (
    <Box
      borderRadius="lg"
      border="1px solid"
      borderColor={isDark ? scheme.borderDark : scheme.border}
      bg={isDark ? scheme.bgDark : scheme.bg}
      overflow="hidden"
    >
      {/* Header */}
      <HStack
        p={compact ? 2 : 3}
        justify="space-between"
        cursor={collapsible ? 'pointer' : 'default'}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        _hover={collapsible ? { bg: isDark ? 'whiteAlpha.100' : 'blackAlpha.50' } : undefined}
        transition="background 0.2s"
      >
        <HStack flex={1}>
          <Box color={scheme.icon}>
            <FiPaperclip size={18} />
          </Box>
          <VStack align="start" gap={0}>
            <HStack>
              <Text
                fontWeight="semibold"
                fontSize={compact ? 'sm' : 'md'}
                color={isDark ? scheme.textDark : scheme.text}
              >
                {title || t('documents.title', 'Documentos')}
              </Text>
              <span
                style={{
                  backgroundColor: '#3182CE',
                  color: 'white',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  padding: '2px 8px',
                  fontWeight: 500,
                }}
              >
                {documents.length}
              </span>
            </HStack>
            {subtitle && (
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {subtitle}
              </Text>
            )}
          </VStack>
        </HStack>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
          {showViewModeToggle && isExpanded && (
            <>
              <button
                title={t('documents.viewChips', 'Vista compacta')}
                onClick={() => setViewMode('chips')}
                style={{
                  padding: '6px',
                  background: viewMode === 'chips' ? '#3182CE' : 'transparent',
                  color: viewMode === 'chips' ? 'white' : colors.textColorSecondary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiPackage size={14} />
              </button>
              <button
                title={t('documents.viewList', 'Vista lista')}
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px',
                  background: viewMode === 'list' ? '#3182CE' : 'transparent',
                  color: viewMode === 'list' ? 'white' : colors.textColorSecondary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiList size={14} />
              </button>
              <button
                title={t('documents.viewGrid', 'Vista cuadrícula')}
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px',
                  background: viewMode === 'grid' ? '#3182CE' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : colors.textColorSecondary,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiGrid size={14} />
              </button>
            </>
          )}
          {collapsible && (
            <button
              title={isExpanded ? 'Collapse' : 'Expand'}
              style={{
                padding: '6px',
                background: 'transparent',
                color: colors.textColorSecondary,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>
          )}
        </div>
      </HStack>

      {/* Collapsed chips preview */}
      {!isExpanded && (
        <Box px={compact ? 2 : 3} pb={compact ? 2 : 3}>
          <Flex gap={2} flexWrap="wrap" align="center">
            {visibleChips.map((doc) => (
              <DocumentChip key={doc.documentId} doc={doc} />
            ))}
            {!showAllChips && hiddenCount > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  border: '1px solid #3182CE',
                  color: '#3182CE',
                  fontSize: '12px',
                }}
                onClick={() => setShowAllChips(true)}
              >
                +{hiddenCount} {t('common.more', 'más')}
              </span>
            )}
            {showAllChips && hiddenCount > 0 && (
              <Box
                as="span"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                px={2}
                py={1}
                borderRadius="full"
                cursor="pointer"
                border="1px solid"
                borderColor={isDark ? 'gray.600' : 'gray.300'}
                color={colors.textColorSecondary}
                fontSize="xs"
                onClick={() => setShowAllChips(false)}
                _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
              >
                <FiChevronUp size={12} />
              </Box>
            )}
          </Flex>
        </Box>
      )}

      {/* Expanded content */}
      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          <VStack align="stretch" gap={3} p={compact ? 2 : 3} pt={0}>
            {/* Search bar */}
            {showSearch && documents.length > 3 && (
              <HStack>
                <Box position="relative" flex={1}>
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color={colors.textColorSecondary}>
                    <FiSearch size={14} />
                  </Box>
                  <Input
                    placeholder={t('documents.searchPlaceholder', 'Buscar documentos...')}
                    size="sm"
                    pl={9}
                    pr={searchQuery ? 8 : 3}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg={isDark ? 'gray.700' : 'white'}
                  />
                  {searchQuery && (
                    <Box
                      position="absolute"
                      right={2}
                      top="50%"
                      transform="translateY(-50%)"
                      cursor="pointer"
                      onClick={() => setSearchQuery('')}
                    >
                      <FiX size={14} />
                    </Box>
                  )}
                </Box>
              </HStack>
            )}

            {/* Document list */}
            {viewMode === 'chips' && (
              <Flex gap={2} flexWrap="wrap">
                {filteredDocuments.map((doc) => (
                  <DocumentChip key={doc.documentId} doc={doc} />
                ))}
              </Flex>
            )}

            {viewMode === 'list' && (
              <VStack align="stretch" gap={2} maxH="300px" overflowY="auto">
                {filteredDocuments.map((doc) => (
                  <DocumentListItem key={doc.documentId} doc={doc} />
                ))}
              </VStack>
            )}

            {viewMode === 'grid' && (
              <Grid
                templateColumns="repeat(auto-fill, minmax(120px, 1fr))"
                gap={3}
                maxH="300px"
                overflowY="auto"
              >
                {filteredDocuments.map((doc) => (
                  <DocumentGridItem key={doc.documentId} doc={doc} />
                ))}
              </Grid>
            )}

            {/* No results message */}
            {searchQuery && filteredDocuments.length === 0 && (
              <Box textAlign="center" py={4} color={colors.textColorSecondary}>
                <Text fontSize="sm">
                  {t('documents.noResults', 'No se encontraron documentos')}
                </Text>
              </Box>
            )}
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export default DocumentViewer;
