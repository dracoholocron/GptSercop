/**
 * Document Management System Types
 * TypeScript interfaces for the document management system
 */

// Storage providers supported by the system
export type StorageProvider = 'S3' | 'AZURE' | 'GCS' | 'LOCAL' | 'CUSTOM';

// Access levels for document security
export type DocumentAccessLevel = 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL';

// Aggregate types for document associations
export type DocumentAggregateType = 'OPERATION' | 'EVENT' | 'ALERT';

// Document actions for audit logging
export type DocumentAction = 'VIEW' | 'DOWNLOAD' | 'UPLOAD' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'VERSION' | 'SHARE';

/**
 * Main Document interface
 */
export interface Document {
  documentId: string;
  operationId?: string;
  eventId?: string;

  // File metadata
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  formattedFileSize?: string;

  // Classification
  categoryCode: string;
  categoryName?: string;
  subcategoryCode?: string;
  subcategoryName?: string;
  documentTypeCode: string;
  documentTypeName?: string;
  tags: string[];

  // Version control
  version: number;
  previousVersionId?: string;
  isLatest: boolean;
  changeNotes?: string;

  // Security
  accessLevel: DocumentAccessLevel;
  virusScanPassed?: boolean;
  virusScanAt?: string;

  // Audit
  uploadedBy: string;
  uploadedAt: string;
  modifiedBy?: string;
  modifiedAt?: string;

  // URLs for access
  downloadUrl?: string;
  previewUrl?: string;
}

/**
 * Document Category for hierarchical classification
 */
export interface DocumentCategory {
  categoryId: string;
  code: string;
  parentCategoryId?: string;
  nameEs: string;
  nameEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  children?: DocumentCategory[];
}

/**
 * Document Type within a category
 */
export interface DocumentType {
  typeId: string;
  code: string;
  categoryCode: string;
  nameEs: string;
  nameEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  allowedMimeTypes: string[];
  maxFileSizeMb: number;
  requiresApproval: boolean;
  isActive: boolean;
}

/**
 * Document Version for version history
 */
export interface DocumentVersion {
  documentId: string;
  version: number;
  originalFileName: string;
  fileSize: number;
  formattedFileSize?: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  changeNotes?: string;
  isLatest: boolean;
  downloadUrl?: string;
}

/**
 * Document Access Log entry for audit
 */
export interface DocumentAccessLog {
  logId: string;
  documentId: string;
  userId: string;
  userName?: string;
  action: DocumentAction;
  ipAddress?: string;
  userAgent?: string;
  accessedAt: string;
  details?: Record<string, unknown>;
}

/**
 * Upload Document Command
 */
export interface UploadDocumentCommand {
  file: File;
  operationId?: string;
  eventId?: string;
  alertId?: string;
  categoryCode: string;
  subcategoryCode?: string;
  documentTypeCode: string;
  tags?: string[];
  accessLevel?: DocumentAccessLevel;
  changeNotes?: string;
}

/**
 * Update Document Command
 */
export interface UpdateDocumentCommand {
  categoryCode?: string;
  subcategoryCode?: string;
  documentTypeCode?: string;
  tags?: string[];
  accessLevel?: DocumentAccessLevel;
}

/**
 * Document Filter for search/query
 */
export interface DocumentFilter {
  operationId?: string;
  eventId?: string;
  categoryCode?: string;
  subcategoryCode?: string;
  documentTypeCode?: string;
  tags?: string[];
  uploadedBy?: string;
  mimeType?: string;
  fromDate?: string;
  toDate?: string;
  includeDeleted?: boolean;
  searchText?: string;
}

/**
 * Document Statistics
 */
export interface DocumentStatistics {
  totalDocuments: number;
  totalSize: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byStorageProvider: Record<StorageProvider, number>;
  recentUploads: number;
}

/**
 * Category/Type creation commands
 */
export interface CreateDocumentCategoryCommand {
  code: string;
  parentCategoryId?: string;
  nameEs: string;
  nameEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  icon?: string;
  displayOrder?: number;
}

export interface CreateDocumentTypeCommand {
  code: string;
  categoryCode: string;
  nameEs: string;
  nameEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  allowedMimeTypes: string[];
  maxFileSizeMb?: number;
  requiresApproval?: boolean;
}

/**
 * API Response wrapper
 */
export interface DocumentApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
}

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  documentId?: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * File icon types for display
 */
export type FileIconType = 'pdf' | 'word' | 'excel' | 'image' | 'xml' | 'text' | 'archive' | 'file';
