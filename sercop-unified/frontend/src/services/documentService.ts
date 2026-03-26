/**
 * Document Management Service
 * Handles all document-related API operations
 */

import { get, post, del } from '../utils/apiClient';
import { API_V1_URL } from '../config/api.config';
import type {
  Document,
  DocumentCategory,
  DocumentType,
  DocumentVersion,
  DocumentAccessLog,
  UploadDocumentCommand,
  DocumentFilter,
  DocumentApiResponse,
  UploadProgress,
  FileIconType,
  FileValidationResult,
} from '../types/documents';

const DOCUMENTS_URL = `${API_V1_URL}/documents`;

class DocumentService {
  // ==================== Document CRUD ====================

  /**
   * Upload a new document with progress tracking
   */
  async uploadDocument(
    command: UploadDocumentCommand,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', command.file);

    if (command.operationId) formData.append('operationId', command.operationId);
    if (command.eventId) formData.append('eventId', command.eventId);
    if (command.alertId) formData.append('alertId', command.alertId);
    formData.append('categoryCode', command.categoryCode);
    if (command.subcategoryCode) formData.append('subcategoryCode', command.subcategoryCode);
    formData.append('documentTypeCode', command.documentTypeCode);
    if (command.tags && command.tags.length > 0) {
      command.tags.forEach(tag => formData.append('tags', tag));
    }
    if (command.accessLevel) formData.append('accessLevel', command.accessLevel);
    if (command.changeNotes) formData.append('changeNotes', command.changeNotes);

    try {
      onProgress?.({
        fileName: command.file.name,
        progress: 0,
        status: 'uploading',
      });

      const token = localStorage.getItem('globalcmx_token');
      const response = await fetch(DOCUMENTS_URL, {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      const result: DocumentApiResponse<Document> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error uploading document');
      }

      onProgress?.({
        documentId: result.data?.documentId,
        fileName: command.file.name,
        progress: 100,
        status: 'completed',
      });

      return result.data!;
    } catch (error) {
      onProgress?.({
        fileName: command.file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document> {
    const response = await get(`${DOCUMENTS_URL}/${documentId}`);
    const result: DocumentApiResponse<Document> = await response.json();

    if (!response.ok || !result.data) {
      throw new Error(result.message || 'Document not found');
    }

    return result.data;
  }

  /**
   * Get documents with filters
   */
  async getDocuments(filter?: DocumentFilter): Promise<Document[]> {
    const params = new URLSearchParams();

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const url = params.toString()
      ? `${DOCUMENTS_URL}?${params}`
      : DOCUMENTS_URL;

    const response = await get(url);
    const result: DocumentApiResponse<Document[]> = await response.json();

    return result.data || [];
  }

  /**
   * Get documents for a specific operation
   */
  async getDocumentsByOperation(operationId: string): Promise<Document[]> {
    return this.getDocuments({ operationId });
  }

  /**
   * Get documents for a specific event
   */
  async getDocumentsByEvent(eventId: string): Promise<Document[]> {
    return this.getDocuments({ eventId });
  }

  /**
   * Get documents for a specific alert
   */
  async getDocumentsByAlert(alertId: string): Promise<Document[]> {
    const response = await get(`${DOCUMENTS_URL}/by-alert/${alertId}`);
    const result: DocumentApiResponse<Document[]> = await response.json();

    return result.data || [];
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string): Promise<void> {
    const response = await del(`${DOCUMENTS_URL}/${documentId}`);

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Error deleting document');
    }
  }

  /**
   * Restore deleted document
   */
  async restoreDocument(documentId: string): Promise<Document> {
    const response = await post(`${DOCUMENTS_URL}/${documentId}/restore`, {});
    const result: DocumentApiResponse<Document> = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error restoring document');
    }

    return result.data!;
  }

  /**
   * Get download URL for a document
   */
  getDownloadUrl(documentId: string): string {
    return `${DOCUMENTS_URL}/${documentId}/download`;
  }

  /**
   * Get preview URL for a document
   */
  getPreviewUrl(documentId: string): string {
    return `${DOCUMENTS_URL}/${documentId}/preview`;
  }

  /**
   * Download document as blob
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    const token = localStorage.getItem('globalcmx_token');
    const response = await fetch(`${DOCUMENTS_URL}/${documentId}/download`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Error downloading document');
    }

    return response.blob();
  }

  // ==================== Version Management ====================

  /**
   * Get all versions of a document
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const response = await get(`${DOCUMENTS_URL}/${documentId}/versions`);
    const result: DocumentApiResponse<DocumentVersion[]> = await response.json();

    return result.data || [];
  }

  /**
   * Upload new version of a document
   */
  async uploadNewVersion(
    documentId: string,
    file: File,
    changeNotes?: string
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeNotes) formData.append('changeNotes', changeNotes);

    const token = localStorage.getItem('globalcmx_token');
    const response = await fetch(`${DOCUMENTS_URL}/${documentId}/versions`, {
      method: 'POST',
      body: formData,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    const result: DocumentApiResponse<Document> = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error uploading new version');
    }

    return result.data!;
  }

  // ==================== Audit Log ====================

  /**
   * Get audit log for a document
   */
  async getAuditLog(documentId: string): Promise<DocumentAccessLog[]> {
    const response = await get(`${DOCUMENTS_URL}/${documentId}/audit-log`);
    const result: DocumentApiResponse<DocumentAccessLog[]> = await response.json();

    return result.data || [];
  }

  // ==================== Categories & Types ====================

  /**
   * Get all categories (with hierarchy)
   */
  async getCategories(): Promise<DocumentCategory[]> {
    const response = await get(`${DOCUMENTS_URL}/categories`);
    if (!response.ok) {
      // Node API may not expose document catalogs in compare mode.
      return [];
    }
    const result: DocumentApiResponse<DocumentCategory[]> = await response.json();
    return result.data || [];
  }

  /**
   * Get document types, optionally filtered by category
   */
  async getDocumentTypes(categoryCode?: string): Promise<DocumentType[]> {
    const url = categoryCode
      ? `${DOCUMENTS_URL}/types?categoryCode=${categoryCode}`
      : `${DOCUMENTS_URL}/types`;

    const response = await get(url);
    if (!response.ok) {
      // Node API may not expose document catalogs in compare mode.
      return [];
    }
    const result: DocumentApiResponse<DocumentType[]> = await response.json();
    return result.data || [];
  }

  // ==================== Utility Methods ====================

  /**
   * Validate file before upload
   */
  validateFile(file: File, documentType?: DocumentType): FileValidationResult {
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB default
    const maxSize = documentType?.maxFileSizeMb
      ? documentType.maxFileSizeMb * 1024 * 1024
      : MAX_SIZE;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `El archivo excede el tamaño máximo permitido (${Math.round(maxSize / 1024 / 1024)} MB)`,
      };
    }

    if (documentType?.allowedMimeTypes && documentType.allowedMimeTypes.length > 0) {
      if (!documentType.allowedMimeTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipo de archivo ${file.type} no permitido para este tipo de documento`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon type based on MIME type
   */
  getFileIconType(mimeType: string): FileIconType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.includes('xml')) return 'xml';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'file';
  }

  /**
   * Check if file can be previewed in browser
   */
  canPreview(mimeType: string): boolean {
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'text/plain',
      'text/html',
    ];
    return previewableTypes.includes(mimeType);
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Get category name in current language
   */
  getCategoryName(category: DocumentCategory, language: string = 'es'): string {
    return language === 'en' ? category.nameEn : category.nameEs;
  }

  /**
   * Get document type name in current language
   */
  getTypeName(type: DocumentType, language: string = 'es'): string {
    return language === 'en' ? type.nameEn : type.nameEs;
  }
}

export const documentService = new DocumentService();
export default documentService;
