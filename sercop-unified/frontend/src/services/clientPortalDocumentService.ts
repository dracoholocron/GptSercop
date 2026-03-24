/**
 * Client Portal Document Service
 *
 * This service provides document upload functionality for client portal users.
 * Files are uploaded to the active storage repository configured in the backend
 * (LOCAL, S3, Azure, GCS).
 *
 * SECURITY: Uploaded documents are marked as RESTRICTED by default.
 */

import { apiClient as api } from '../config/api.client';

// Types
export interface UploadedDocument {
  documentId: string;
  fileName: string;
  fileSize: number;
  formattedFileSize: string;
  mimeType: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  fileName?: string;
  fileSize?: number;
  formattedFileSize?: string;
  mimeType?: string;
  downloadUrl?: string;
  previewUrl?: string;
  message?: string;
}

/**
 * Service for handling document uploads in the client portal.
 * Uses the /client-portal/documents/* endpoints.
 */
const clientPortalDocumentService = {
  /**
   * Upload a file to the server storage repository.
   *
   * @param file The file to upload
   * @param options Optional parameters
   * @returns Upload response with document metadata
   */
  async uploadFile(
    file: File,
    options?: {
      draftId?: string;
      fieldCode?: string;
      operationId?: string;
      categoryCode?: string;
      documentTypeCode?: string;
    }
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (options?.draftId) {
        formData.append('draftId', options.draftId);
      }
      if (options?.fieldCode) {
        formData.append('fieldCode', options.fieldCode);
      }
      if (options?.operationId) {
        formData.append('operationId', options.operationId);
      }
      if (options?.categoryCode) {
        formData.append('categoryCode', options.categoryCode);
      }
      if (options?.documentTypeCode) {
        formData.append('documentTypeCode', options.documentTypeCode);
      }

      // Use the simple upload endpoint that returns essential info
      // Note: Don't set Content-Type header - browser will set it with boundary for FormData
      const response = await api.post<UploadResponse>(
        '/client-portal/documents/upload-simple',
        formData
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Get document metadata by ID.
   *
   * @param documentId The document ID
   * @returns Document metadata
   */
  async getDocument(documentId: string): Promise<UploadedDocument | null> {
    try {
      interface ApiDocumentResponse {
        success: boolean;
        data?: UploadedDocument;
        message?: string;
      }

      const response = await api.get<ApiDocumentResponse>(`/client-portal/documents/${documentId}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  },

  /**
   * Convert an uploaded document response to a storage string for custom_data.
   * This creates a JSON string that can be stored in the custom field value.
   *
   * @param uploadResponse The response from uploadFile
   * @returns JSON string to store in custom_data
   */
  toStorageString(uploadResponse: UploadResponse): string {
    return JSON.stringify({
      documentId: uploadResponse.documentId,
      name: uploadResponse.fileName,
      size: uploadResponse.fileSize,
      type: uploadResponse.mimeType,
      downloadUrl: uploadResponse.downloadUrl,
      previewUrl: uploadResponse.previewUrl,
    });
  },

  /**
   * Parse a storage string back to document info.
   *
   * @param storageString The JSON string from custom_data
   * @returns Parsed document info or null if invalid
   */
  parseStorageString(storageString: string): {
    documentId?: string;
    name: string;
    size?: number;
    type?: string;
    downloadUrl?: string;
    previewUrl?: string;
    data?: string; // For backward compatibility with base64
  } | null {
    if (!storageString) return null;

    try {
      return JSON.parse(storageString);
    } catch {
      return null;
    }
  },

  /**
   * Check if a storage string represents a server-stored document
   * (has documentId) vs a base64 embedded document.
   *
   * @param storageString The JSON string from custom_data
   * @returns true if stored on server, false if base64
   */
  isServerStored(storageString: string): boolean {
    const parsed = this.parseStorageString(storageString);
    return parsed?.documentId != null;
  },
};

export default clientPortalDocumentService;
