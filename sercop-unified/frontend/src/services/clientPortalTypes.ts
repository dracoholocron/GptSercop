// Client Portal Types

export interface ClientRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientIdentification?: string;
  productType: string;
  productTypeLabel?: string;
  productIcon?: string;
  productColor?: string;
  requestNumber: string;
  status: string;
  statusLabel?: string;
  statusColor?: string;
  statusIcon?: string;
  statusDetail?: string;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  operationId?: string;
  operationReference?: string;
  draftId?: string;
  amount?: number;
  currency?: string;
  amountFormatted?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  daysSinceCreation?: number;
  daysInReview?: number;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedToAvatarUrl?: string;
  approvedByUserName?: string;
  rejectionReason?: string;
  slaHours?: number;
  slaDeadline?: string;
  slaBreached?: boolean;
  slaRemainingHours?: number;
  slaStatus?: 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'BREACHED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  priorityLabel?: string;
  priorityColor?: string;
  summaryLine1?: string;
  summaryLine2?: string;
  documentCount?: number;
  pendingDocumentCount?: number;
  commentCount?: number;
  unreadCommentCount?: number;
  lastActivityAt?: string;
  lastActivityBy?: string;
  lastActivityDescription?: string;
  customData?: Record<string, unknown>;
  // Internal processing workflow
  internalProcessingStage?: string;
  internalProcessingStageLabel?: string;
  internalProcessingStageColor?: string;
  internalProcessingStageIcon?: string;
  internalProcessingStartedAt?: string;
  canEdit?: boolean;
  canSubmit?: boolean;
  canCancel?: boolean;
  canComment?: boolean;
  canViewDocuments?: boolean;
  canUploadDocuments?: boolean;
}

export interface CreateClientRequestDTO {
  productType: string;
  productSubtype?: string;
  amount?: number;
  currency?: string;
  priority?: string;
  customData?: Record<string, unknown>;
}

export interface ClientOperation {
  operationId: string;
  reference: string;
  productType: string;
  productTypeLabel?: string;
  stage: string;
  stageLabel?: string;
  status: string;
  statusLabel?: string;
  currency?: string;
  amount?: number;
  issueDate?: string;
  expiryDate?: string;
  beneficiaryName?: string;
  issuingBankBic?: string;
  advisingBankBic?: string;
  createdAt: string;
  // Applicant info (for corporation users viewing multiple companies)
  applicantId?: number;
  applicantName?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ClientStats {
  totalRequests: number;
  draftRequests: number;
  submittedRequests: number;
  inReviewRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export interface BackofficeStats {
  pendingTotal: number;
  myAssigned: number;
  slaAtRisk: number;
  slaBreached: number;
}

export interface ClientCompanyInfo {
  id: number;
  identificacion: string;
  tipo: string;
  tipoReferencia?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  agencia?: string;
  ejecutivoAsignado?: string;
  ejecutivoId?: string;
  correoEjecutivo?: string;
  // Hierarchy fields
  hierarchyType?: string;
  hierarchyLevel?: number;
  parentId?: number;
  isCorporation?: boolean;
  hasChildren?: boolean;
}

export interface AccessibleCompany {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos?: string;
  displayName: string;
  hierarchyType: string;
  hierarchyLevel: number;
  parentId?: number;
}

export interface AccessibleCompaniesResponse {
  hasMultipleCompanies: boolean;
  companies: AccessibleCompany[];
  totalCount: number;
}

export interface CompanyHierarchyNode {
  id: number;
  identificacion: string;
  nombres: string;
  displayName: string;
  hierarchyType: string;
  hierarchyLevel: number;
  children?: CompanyHierarchyNode[];
}

export interface CompanyHierarchyResponse {
  tree: CompanyHierarchyNode;
  ancestorPath: AccessibleCompany[];
}

export interface SearchParams {
  productType?: string;
  status?: string;
  search?: string;
  assignedToUserId?: string;
  clientId?: string;
  companyId?: number;
  internalProcessingStage?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ==========================================
// Post-Issuance Event Types
// ==========================================

/**
 * Form field configuration from database
 */
export interface FormFieldConfig {
  name: string;
  labelEs: string;
  labelEn: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  required?: boolean;
  placeholderEs?: string;
  placeholderEn?: string;
  rows?: number;
  useOperationAmountAsPlaceholder?: boolean;
  options?: Array<{ value: string; labelEs: string; labelEn: string }>;
}

/**
 * Available event configuration for an operation
 */
export interface AvailableEvent {
  eventCode: string;
  eventName: string;
  eventDescription?: string;
  helpText?: string;
  eventCategory: string;
  icon?: string;
  color?: string;
  requiresApproval: boolean;
  approvalLevels: number;
  isReversible: boolean;
  generatesNotification: boolean;
  requiresSwiftMessage: boolean;
  outboundMessageType?: string;
  resultingStage?: string;
  resultingStatus?: string;
  displayOrder: number;
  formFieldsConfig?: FormFieldConfig[];
}

/**
 * Event request data for creating a post-issuance event
 */
export interface EventRequestDTO {
  operationId: string;
  eventCode: string;
  requestedChanges?: Record<string, unknown>;
  justification?: string;
  newExpiryDate?: string;
  newAmount?: number;
  cancellationReason?: string;
  paymentAmount?: number;
  debitAccountNumber?: string;
  attachmentIds?: string[];
}

/**
 * Event request response
 */
export interface EventRequestResponse {
  requestId: string;
  operationId: string;
  eventCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED';
  createdAt: string;
  message: string;
}

/**
 * Operation event history entry
 */
export interface OperationEventLog {
  eventId: string;
  eventCode: string;
  eventSequence?: number;
  comments?: string;
  executedAt: string;
  executedBy?: string;
  swiftMessageType?: string;
  swiftMessageId?: string;
  previousStage?: string;
  newStage?: string;
  previousStatus?: string;
  newStatus?: string;
}

/**
 * Event request for the current client (post-issuance events like amendments, renewals, etc.)
 */
export interface MyEventRequest {
  requestId: string;
  operationId: string;
  eventCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  statusLabel?: string;
  justification?: string;
  requestedChanges?: Record<string, unknown>;
  newAmount?: number;
  newExpiryDate?: string;
  cancellationReason?: string;
  paymentAmount?: number;
  debitAccountNumber?: string;
  attachmentIds?: string[];
  requestedBy?: string;
  requestedByName?: string;
  requestedAt: string;
  processedBy?: string;
  processedByName?: string;
  processedAt?: string;
  rejectionReason?: string;
  // Event config info
  eventName?: string;
  eventDescription?: string;
  eventIcon?: string;
  eventColor?: string;
  requiresApproval?: boolean;
  approvalLevels?: number;
  currentApprovalLevel?: number;
  // Operation reference (added for display)
  operationReference?: string;
}

/**
 * Extended client operation with additional details for detail view
 */
export interface ClientOperationDetail extends ClientOperation {
  // Additional operation details
  applicantAddress?: string;
  applicantCountry?: string;
  beneficiaryAddress?: string;
  beneficiaryCountry?: string;
  beneficiaryBankName?: string;
  beneficiaryBankBic?: string;

  // Payment terms (for LCs)
  paymentTerms?: string;
  paymentDays?: number;
  incoterm?: string;

  // Shipping (for LCs and Collections)
  portOfLoading?: string;
  portOfDischarge?: string;
  latestShipmentDate?: string;
  goodsDescription?: string;

  // Guarantee specific
  guaranteeType?: string;
  guaranteePurpose?: string;

  // Event history
  eventHistory?: OperationEventLog[];

  // Available post-issuance actions
  availableEvents?: AvailableEvent[];

  // Document count
  documentCount?: number;

  // Custom data from operation
  customData?: Record<string, unknown>;
}
