/**
 * DocumentPresentationPanel - Reusable panel for document presentation flows
 *
 * Used in event execution (PRESENT_DOCS, RECEIVE_DOCS) and anywhere document
 * upload with requirements display is needed. Composes existing DocumentUploader
 * and DocumentList components.
 */

import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FiFileText, FiUploadCloud, FiFolder } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { DocumentUploader } from './DocumentUploader';
import { DocumentList } from './DocumentList';
import type { DocumentCategory, DocumentType } from '../../types/documents';

interface DocumentPresentationPanelProps {
  operationId: string;
  eventId?: string;
  documentRequirements?: string;
  categories: DocumentCategory[];
  documentTypes: DocumentType[];
  onDocumentsChanged?: (documentIds: string[]) => void;
  compact?: boolean;
  readOnly?: boolean;
  colorScheme?: 'blue' | 'purple' | 'green';
}

const schemeColors = {
  blue: { bg: 'blue.50', border: 'blue.200', text: 'blue.700', icon: 'blue.500', badge: 'blue' },
  purple: { bg: 'purple.50', border: 'purple.200', text: 'purple.700', icon: 'purple.500', badge: 'purple' },
  green: { bg: 'green.50', border: 'green.200', text: 'green.700', icon: 'green.500', badge: 'green' },
};

export const DocumentPresentationPanel = ({
  operationId,
  eventId,
  documentRequirements,
  categories,
  documentTypes,
  onDocumentsChanged,
  compact = false,
  readOnly = false,
  colorScheme = 'purple',
}: DocumentPresentationPanelProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const scheme = schemeColors[colorScheme];

  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<string[]>([]);
  const [documentsKey, setDocumentsKey] = useState(0);

  const handleUploadComplete = useCallback((documentId: string) => {
    setUploadedDocumentIds(prev => {
      const updated = [...prev, documentId];
      onDocumentsChanged?.(updated);
      return updated;
    });
    setDocumentsKey(prev => prev + 1);
  }, [onDocumentsChanged]);

  return (
    <VStack gap={4} align="stretch">
      {/* Document Requirements Section (46A) */}
      {documentRequirements && (
        <Box
          p={4}
          borderRadius="md"
          bg={isDark ? 'blue.900' : 'blue.50'}
          borderWidth="1px"
          borderColor={isDark ? 'blue.600' : 'blue.200'}
        >
          <HStack mb={2}>
            <Icon as={FiFileText} color={isDark ? 'blue.300' : 'blue.600'} />
            <Text fontWeight="semibold" fontSize="sm" color={isDark ? 'blue.200' : 'blue.800'}>
              {t('documents.requirements')}
            </Text>
            <Badge colorPalette="blue" size="sm">46A</Badge>
          </HStack>
          <Text
            fontSize="sm"
            color={isDark ? 'blue.100' : 'blue.700'}
            whiteSpace="pre-line"
            lineHeight="1.6"
          >
            {documentRequirements}
          </Text>
        </Box>
      )}

      {/* Upload Section */}
      {!readOnly && (
        <Box>
          <HStack mb={3}>
            <Icon as={FiUploadCloud} color={isDark ? scheme.icon : scheme.icon} />
            <Text fontWeight="semibold" fontSize="sm" color={colors.textColor}>
              {t('documents.uploadDocuments')}
            </Text>
            {uploadedDocumentIds.length > 0 && (
              <Badge colorPalette={scheme.badge} size="sm">
                {uploadedDocumentIds.length} {t('documents.uploaded')}
              </Badge>
            )}
          </HStack>
          <DocumentUploader
            operationId={operationId}
            eventId={eventId}
            categories={categories}
            documentTypes={documentTypes}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => console.error('Upload error:', error)}
            compact={compact}
          />
        </Box>
      )}

      {/* Documents List Section */}
      <Box>
        <HStack mb={3}>
          <Icon as={FiFolder} color={isDark ? scheme.icon : scheme.icon} />
          <Text fontWeight="semibold" fontSize="sm" color={colors.textColor}>
            {t('documents.operationDocuments')}
          </Text>
        </HStack>
        <DocumentList
          key={documentsKey}
          operationId={operationId}
          eventId={eventId}
          compact={compact}
          showFilters={!compact}
          onRefresh={() => setDocumentsKey(prev => prev + 1)}
        />
      </Box>
    </VStack>
  );
};

export default DocumentPresentationPanel;
