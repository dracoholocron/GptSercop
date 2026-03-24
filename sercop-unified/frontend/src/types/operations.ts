/**
 * TypeScript types for Operations and SWIFT Messages (CQRS)
 */

// ==================== Operation Types ====================

export interface Operation {
  id: number;
  operationId: string;
  originalDraftId?: string;
  productType: ProductType;
  messageType: string;
  reference: string;
  stage: OperationStage;
  status: OperationStatus;
  creationMode?: string;
  swiftMessage: string;

  // Metadata
  currency?: string;
  amount?: number;
  pendingBalance?: number;  // Saldo pendiente calculado desde GLE
  issueDate?: string;
  expiryDate?: string;

  // Parties
  applicantId?: number;
  applicantName?: string;
  beneficiaryId?: number;
  beneficiaryName?: string;
  issuingBankId?: number;
  issuingBankBic?: string;
  advisingBankId?: number;
  advisingBankBic?: string;

  // Counters
  amendmentCount: number;
  messageCount: number;

  // Alerts
  hasAlerts?: boolean;
  alertCount?: number;

  // Response tracking
  awaitingResponse: boolean;
  awaitingMessageType?: string;
  responseDueDate?: string;

  // Source client request (for operations created from client portal)
  sourceClientRequestId?: string;

  // Audit
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  version: number;
}

export type ProductType = string;

export type OperationStage =
  | 'ISSUED'
  | 'ADVISED'
  | 'CONFIRMED'
  | 'AMENDED'
  | 'UTILIZED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED';

export type OperationStatus =
  | 'ACTIVE'
  | 'PENDING_RESPONSE'
  | 'PENDING_DOCUMENTS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED';

// ==================== SWIFT Message Types ====================

export interface SwiftMessage {
  id: number;
  messageId: string;
  messageType: string;
  direction: MessageDirection;
  operationId?: string;
  operationType?: string;
  senderBic: string;
  receiverBic: string;
  swiftContent: string;

  // Extracted fields
  field20Reference?: string;
  field21RelatedRef?: string;
  currency?: string;
  amount?: number;
  valueDate?: string;

  status: MessageStatus;

  // ACK/NAK tracking
  ackReceived: boolean;
  ackContent?: string;
  ackReceivedAt?: string;

  // Response tracking
  expectsResponse: boolean;
  expectedResponseType?: string;
  responseDueDate?: string;
  responseReceived: boolean;
  responseMessageId?: string;

  // Event link
  triggeredByEvent?: string;
  generatesEvent?: string;

  // Audit
  createdBy?: string;
  createdAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  processedAt?: string;
  processedBy?: string;
  version: number;
}

export type MessageDirection = 'OUTBOUND' | 'INBOUND';

export type MessageStatus =
  | 'DRAFT'
  | 'SENT'
  | 'DELIVERED'
  | 'RECEIVED'
  | 'PROCESSED'
  | 'FAILED';

// ==================== Event Types ====================

export interface OperationEventLog {
  id: number;
  eventId: string;
  operationId: string;
  operationType: string;
  eventCode: string;
  eventSequence: number;

  // SWIFT message link
  swiftMessageId?: string;
  swiftMessageType?: string;
  messageDirection?: string;

  // State transition
  previousStage?: string;
  newStage?: string;
  previousStatus?: string;
  newStatus?: string;

  // Event data
  eventData?: Record<string, unknown>;

  // User comments
  comments?: string;

  // Operation snapshot - key operation fields at event time (JSON)
  operationSnapshot?: Record<string, string>;

  // Operation snapshot - individual columns
  reference?: string;
  swiftMessage?: string;
  currency?: string;
  amount?: number;
  issueDate?: string;
  expiryDate?: string;
  applicantId?: number;
  applicantName?: string;
  beneficiaryId?: number;
  beneficiaryName?: string;
  issuingBankId?: number;
  issuingBankBic?: string;
  advisingBankId?: number;
  advisingBankBic?: string;
  amendmentCount?: number;

  // Audit
  executedBy?: string;
  executedAt?: string;

  // Enriched fields from config
  eventName?: string;
  eventDescription?: string;
  icon?: string;
  color?: string;
}

export interface EventTypeConfig {
  id: number;
  eventCode: string;
  operationType: string;
  language: string;
  eventName: string;
  eventDescription?: string;
  helpText?: string;

  // SWIFT messages
  outboundMessageType?: string;
  inboundMessageType?: string;

  // Flow rules
  validFromStages?: string[];
  validFromStatuses?: string[];
  resultingStage?: string;
  resultingStatus?: string;

  // UI
  icon?: string;
  color?: string;
  displayOrder: number;

  // Message direction - clarifies who sends/receives
  messageSender?: string;      // ISSUING_BANK, ADVISING_BANK, BENEFICIARY, etc.
  messageReceiver?: string;    // ISSUING_BANK, ADVISING_BANK, BENEFICIARY, etc.
  ourRole?: string;            // SENDER or RECEIVER (GlobalCMX's role)
  requiresSwiftMessage?: boolean;
  eventCategory?: string;      // ISSUANCE, ADVICE, AMENDMENT, DOCUMENTS, PAYMENT, CLAIM, CLOSURE

  // Initial event configuration - for flows with multiple entry points
  isInitialEvent?: boolean;    // True if this event can start a flow
  initialEventRole?: string;   // ISSUING_BANK, ADVISING_BANK, etc. - which bank role uses this as entry point

  // Client portal configuration
  isClientRequestable?: boolean; // True if clients can request this event through the portal
  eventSource?: string;          // BACKOFFICE, CLIENT_PORTAL, CLIENT_AND_BACKOFFICE

  // Form type for event execution UI
  formType?: 'SWIFT_FORM' | 'DOCUMENT_UPLOAD' | 'NONE';

  // Flags
  isActive: boolean;
  requiresApproval: boolean;
  approvalLevels: number;
  isReversible: boolean;
  generatesNotification: boolean;

  // Permissions
  allowedRoles?: string[];

  // Audit
  createdAt?: string;
  modifiedAt?: string;
  version: number;
}

export interface EventFlowConfig {
  id: number;
  operationType: string;
  fromEventCode?: string;
  fromStage?: string;
  toEventCode: string;
  conditions?: Record<string, unknown>;
  isRequired: boolean;
  isOptional: boolean;
  sequenceOrder: number;
  language: string;
  transitionLabel?: string;
  transitionHelp?: string;
  isActive: boolean;

  // Enriched fields
  toEventName?: string;
  toEventDescription?: string;
  toEventHelpText?: string;
  toEventIcon?: string;
  toEventColor?: string;
}

export interface SwiftResponseConfig {
  id: number;
  sentMessageType: string;
  operationType: string;
  expectedResponseType: string;
  responseEventCode?: string;
  expectedResponseDays: number;
  alertAfterDays: number;
  escalateAfterDays: number;
  language: string;
  responseDescription?: string;
  timeoutMessage?: string;
  isActive: boolean;
}

// ==================== Command Types ====================

export interface ApproveOperationCommand {
  draftId: string;
  approvedBy: string;
  comments?: string;
}

export interface ExecuteEventCommand {
  operationId: string;
  eventCode: string;
  executedBy: string;
  eventData?: Record<string, unknown>;
  swiftMessage?: string;
  comments?: string;
}

export interface SendSwiftMessageCommand {
  operationId?: string;
  messageType: string;
  senderBic: string;
  receiverBic: string;
  swiftContent: string;
  field20Reference?: string;
  field21RelatedRef?: string;
  currency?: string;
  amount?: number;
  valueDate?: string;
  triggeredByEvent?: string;
  createdBy: string;
}

export interface ReceiveSwiftMessageCommand {
  operationId?: string;
  messageType: string;
  senderBic: string;
  receiverBic: string;
  swiftContent: string;
  field20Reference?: string;
  field21RelatedRef?: string;
  currency?: string;
  amount?: number;
  valueDate?: string;
  respondingToMessageId?: string;
  processedBy: string;
}

// ==================== Filter Types ====================

export interface OperationFilter {
  productType?: ProductType;
  stage?: OperationStage;
  status?: OperationStatus;
  reference?: string;
  applicantId?: number;
  beneficiaryId?: number;
  applicantName?: string;
  beneficiaryName?: string;
  currency?: string;
}

export interface FieldHistoryItem {
  value: any;
  applicantName?: string;
  reference?: string;
  createdAt?: string;
}

export interface SwiftMessageFilter {
  operationId?: string;
  operationType?: string;
  messageType?: string;
  direction?: MessageDirection;
  status?: MessageStatus;
  senderBic?: string;
  receiverBic?: string;
}

// ==================== Summary Types ====================

export interface OperationSummary {
  productType: ProductType;
  totalCount: number;
  activeCount: number;
  awaitingResponseCount: number;
  expiringSoonCount: number;
}

export interface MessageSummary {
  totalOutbound: number;
  totalInbound: number;
  pendingResponses: number;
  pendingAck: number;
}

// ==================== Alert Types ====================

export type AlertType = 'DANGER' | 'WARNING' | 'INFO' | 'SUCCESS';

export interface OperationAlert {
  type: AlertType;
  code: string;
  icon?: string;
  params?: Record<string, string | number>;
}

export interface OperationAnalysisSummary {
  operationId: string;
  reference: string;
  productType: ProductType;
  messageType: string;
  stage: string;
  status: string;
  amounts: {
    currency?: string;
    originalAmount?: number;
    currentAmount?: number;
    utilizedAmount?: number;
    availableAmount?: number;
    utilizationPercentage?: number;
  };
  dates: {
    issueDate?: string;
    originalExpiryDate?: string;
    currentExpiryDate?: string;
    latestShipmentDate?: string;
    daysToExpiry?: number;
    expired: boolean;
  };
  parties: {
    applicantName?: string;
    applicantAddress?: string;
    beneficiaryName?: string;
    beneficiaryAddress?: string;
    issuingBankName?: string;
    issuingBankBic?: string;
    advisingBankName?: string;
    advisingBankBic?: string;
    confirmingBankName?: string;
    confirmingBankBic?: string;
  };
  alerts: OperationAlert[];
  totalMessages: number;
  totalAmendments: number;
  lastUpdated?: string;
}

// ==================== Admin Command Types ====================

export interface EventTypeConfigCommand {
  id?: number;
  eventCode: string;
  operationType: string;
  language: string;
  eventName: string;
  eventDescription?: string;
  helpText?: string;
  outboundMessageType?: string;
  inboundMessageType?: string;
  validFromStages?: string[];
  validFromStatuses?: string[];
  resultingStage?: string;
  resultingStatus?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  // Message direction fields
  messageSender?: string;
  messageReceiver?: string;
  ourRole?: string;
  requiresSwiftMessage?: boolean;
  eventCategory?: string;
  // Initial event configuration
  isInitialEvent?: boolean;
  initialEventRole?: string;
  // Client portal configuration
  isClientRequestable?: boolean;
  eventSource?: string;
  // Flags
  isActive: boolean;
  requiresApproval?: boolean;
  approvalLevels?: number;
  isReversible?: boolean;
  generatesNotification?: boolean;
  allowedRoles?: string[];
}

export interface EventFlowConfigCommand {
  id?: number;
  operationType: string;
  fromEventCode?: string;
  fromStage?: string;
  toEventCode: string;
  conditions?: Record<string, unknown>;
  isRequired: boolean;
  isOptional: boolean;
  sequenceOrder?: number;
  language?: string;
  transitionLabel?: string;
  transitionHelp?: string;
  isActive: boolean;
}

export interface SwiftResponseConfigCommand {
  id?: number;
  sentMessageType: string;
  operationType: string;
  expectedResponseType: string;
  responseEventCode?: string;
  expectedResponseDays?: number;
  alertAfterDays?: number;
  escalateAfterDays?: number;
  language?: string;
  responseDescription?: string;
  timeoutMessage?: string;
  isActive: boolean;
}

// ==================== Event Alert Template Types ====================

export interface EventAlertTemplate {
  id?: number;
  operationType: string;
  eventCode: string;
  alertType: string;
  requirementLevel: string;
  titleTemplate: string;
  descriptionTemplate?: string;
  defaultPriority: string;
  assignedRole?: string;
  dueDaysOffset: number;
  dueDateReference?: string;
  tags?: string;
  language: string;
  displayOrder: number;
  isActive: boolean;
  emailTemplateId?: number;
  documentTemplateId?: number;
  emailSubject?: string;
  emailRecipients?: string;
}

// ==================== Pending Approval Types ====================

export type ApprovalType = 'NEW_OPERATION' | 'OPERATION_EVENT';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PendingApproval {
  id: number;
  approvalId: string;
  approvalType: ApprovalType;
  status: ApprovalStatus;

  // Context
  operationId?: string;
  draftId?: string;
  productType: string;
  reference?: string;

  // Event details
  eventCode: string;
  eventName?: string;
  eventDescription?: string;
  messageType?: string;
  swiftMessage?: string;
  eventData?: Record<string, unknown>;
  submitterComments?: string;

  // Financial
  currency?: string;
  amount?: number;

  // Parties
  applicantName?: string;
  beneficiaryName?: string;

  // Submission
  submittedBy: string;
  submittedAt: string;

  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  rejectionReason?: string;
  fieldComments?: Record<string, { comment: string; commentedAt: string; commentedBy: string }>;

  // UI
  icon?: string;
  color?: string;
  priority: number;

  // Labels
  productTypeLabel?: string;
  approvalTypeLabel?: string;
  statusLabel?: string;

  // Risk evaluation data
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredRiskRules?: Array<{
    code: string;
    name: string;
    points: number;
    reason: string;
  }>;
  riskAction?: 'ALLOW' | 'NOTIFY_ADMIN' | 'MFA_REQUIRED' | 'STEP_UP_AUTH' | 'BLOCK';
  approvalInstructions?: string;
  riskTriggered?: boolean;

  // Multi-approver support
  requiredApprovers?: number;
  currentApprovalCount?: number;
  approvalHistory?: Array<{
    user: string;
    timestamp: string;
    comments?: string;
  }>;
}

export interface SubmitEventForApprovalCommand {
  operationId?: string;
  draftId?: string;
  eventCode: string;
  eventData?: Record<string, unknown>;
  comments?: string;
  submittedBy: string;
  priority?: number;
}

export interface ReviewApprovalCommand {
  approvalId: string;
  action: 'APPROVE' | 'REJECT';
  reviewedBy: string;
  comments?: string;
  rejectionReason?: string;
  fieldComments?: Record<string, { comment: string }>;
}

export interface PendingApprovalStatistics {
  totalPending: number;
  byType: Record<string, number>;
  byProductType: Record<string, number>;
}
