/**
 * Document Management Components
 * Export all document-related components
 */

export { DocumentUploader } from './DocumentUploader';
export { DocumentCategorySelector } from './DocumentCategorySelector';
export { DocumentList } from './DocumentList';
export { DocumentViewer } from './DocumentViewer';
export { DocumentPresentationPanel } from './DocumentPresentationPanel';
export type { DocumentItem, ViewMode } from './DocumentViewer';

// Re-export types for convenience
export type {
  Document,
  DocumentCategory,
  DocumentType,
  DocumentVersion,
  DocumentAccessLog,
  UploadDocumentCommand,
  DocumentFilter,
  UploadProgress,
} from '../../types/documents';
