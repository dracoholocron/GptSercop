package com.globalcmx.api.clientportal.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Read model entity for client requests.
 * This is optimized for querying and display, containing pre-computed fields.
 * Following CQRS pattern - this is the read side projection.
 */
@Entity
@Table(name = "client_request_readmodel")
public class ClientRequestReadModel {

    @Id
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "client_id", nullable = false, columnDefinition = "CHAR(36)")
    private String clientId;

    @Column(name = "client_name", nullable = false, length = 200)
    private String clientName;

    @Column(name = "client_identification", length = 50)
    private String clientIdentification;

    @Column(name = "client_contact_name", length = 200)
    private String clientContactName;

    @Column(name = "client_contact_email", length = 100)
    private String clientContactEmail;

    @Column(name = "product_type", nullable = false, length = 50)
    private String productType;

    @Column(name = "product_type_label_key", nullable = false, length = 100)
    private String productTypeLabelKey;

    @Column(name = "product_subtype", length = 50)
    private String productSubtype;

    @Column(name = "product_icon", length = 50)
    private String productIcon;

    @Column(name = "product_color", length = 30)
    private String productColor;

    @Column(name = "request_number", nullable = false, length = 30)
    private String requestNumber;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "status_label_key", nullable = false, length = 100)
    private String statusLabelKey;

    @Column(name = "status_color", nullable = false, length = 30)
    private String statusColor;

    @Column(name = "status_icon", length = 50)
    private String statusIcon;

    @Column(name = "current_step")
    private Integer currentStep;

    @Column(name = "total_steps")
    private Integer totalSteps;

    @Column(name = "completion_percentage")
    private Integer completionPercentage;

    @Column(name = "operation_id", columnDefinition = "CHAR(36)")
    private String operationId;

    @Column(name = "operation_reference", length = 30)
    private String operationReference;

    @Column(name = "draft_id", length = 100)
    private String draftId;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "amount_formatted", length = 50)
    private String amountFormatted;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "days_since_creation")
    private Integer daysSinceCreation;

    @Column(name = "days_in_review")
    private Integer daysInReview;

    @Column(name = "assigned_to_user_id", columnDefinition = "CHAR(36)")
    private String assignedToUserId;

    @Column(name = "assigned_to_user_name", length = 100)
    private String assignedToUserName;

    @Column(name = "assigned_to_avatar_url", length = 500)
    private String assignedToAvatarUrl;

    @Column(name = "approved_by_user_name", length = 100)
    private String approvedByUserName;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;

    @Column(name = "sla_breached")
    private Boolean slaBreached;

    @Column(name = "sla_remaining_hours")
    private Integer slaRemainingHours;

    @Column(name = "sla_status", length = 20)
    private String slaStatus;

    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "priority_label_key", length = 100)
    private String priorityLabelKey;

    @Column(name = "priority_color", length = 30)
    private String priorityColor;

    @Column(name = "summary_line1", length = 200)
    private String summaryLine1;

    @Column(name = "summary_line2", length = 200)
    private String summaryLine2;

    @Column(name = "document_count")
    private Integer documentCount;

    @Column(name = "pending_document_count")
    private Integer pendingDocumentCount;

    @Column(name = "comment_count")
    private Integer commentCount;

    @Column(name = "unread_comment_count")
    private Integer unreadCommentCount;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "last_activity_by", length = 100)
    private String lastActivityBy;

    @Column(name = "last_activity_description", length = 200)
    private String lastActivityDescription;

    @Column(name = "search_text", columnDefinition = "TEXT")
    private String searchText;

    @Column(name = "read_model_created_at", nullable = false)
    private LocalDateTime readModelCreatedAt;

    @Column(name = "read_model_updated_at")
    private LocalDateTime readModelUpdatedAt;

    // Internal processing workflow tracking
    @Column(name = "internal_processing_stage", length = 50)
    private String internalProcessingStage;

    @Column(name = "internal_processing_started_at")
    private LocalDateTime internalProcessingStartedAt;

    // Additional fields for write operations (consolidated from client_request table)
    @Column(name = "custom_data", columnDefinition = "JSON")
    private String customData;

    @Column(name = "status_detail", length = 500)
    private String statusDetail;

    @Column(name = "approved_by_user_id", columnDefinition = "CHAR(36)")
    private String approvedByUserId;

    @Column(name = "review_started_at")
    private LocalDateTime reviewStartedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "source_channel", length = 30)
    private String sourceChannel;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "version")
    private Integer version;

    // Constructors
    public ClientRequestReadModel() {
    }

    public ClientRequestReadModel(String clientId, String clientName, String productType) {
        this.id = java.util.UUID.randomUUID().toString();
        this.clientId = clientId;
        this.clientName = clientName;
        this.productType = productType;
        this.productTypeLabelKey = "product." + productType.toLowerCase() + ".name";
        this.status = "DRAFT";
        this.statusLabelKey = "request.status.draft";
        this.statusColor = "gray";
        this.createdAt = LocalDateTime.now();
        this.readModelCreatedAt = LocalDateTime.now();
        this.sourceChannel = "PORTAL";
        this.version = 1;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getClientIdentification() {
        return clientIdentification;
    }

    public void setClientIdentification(String clientIdentification) {
        this.clientIdentification = clientIdentification;
    }

    public String getClientContactName() {
        return clientContactName;
    }

    public void setClientContactName(String clientContactName) {
        this.clientContactName = clientContactName;
    }

    public String getClientContactEmail() {
        return clientContactEmail;
    }

    public void setClientContactEmail(String clientContactEmail) {
        this.clientContactEmail = clientContactEmail;
    }

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public String getProductTypeLabelKey() {
        return productTypeLabelKey;
    }

    public void setProductTypeLabelKey(String productTypeLabelKey) {
        this.productTypeLabelKey = productTypeLabelKey;
    }

    public String getProductSubtype() {
        return productSubtype;
    }

    public void setProductSubtype(String productSubtype) {
        this.productSubtype = productSubtype;
    }

    public String getProductIcon() {
        return productIcon;
    }

    public void setProductIcon(String productIcon) {
        this.productIcon = productIcon;
    }

    public String getProductColor() {
        return productColor;
    }

    public void setProductColor(String productColor) {
        this.productColor = productColor;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusLabelKey() {
        return statusLabelKey;
    }

    public void setStatusLabelKey(String statusLabelKey) {
        this.statusLabelKey = statusLabelKey;
    }

    public String getStatusColor() {
        return statusColor;
    }

    public void setStatusColor(String statusColor) {
        this.statusColor = statusColor;
    }

    public String getStatusIcon() {
        return statusIcon;
    }

    public void setStatusIcon(String statusIcon) {
        this.statusIcon = statusIcon;
    }

    public Integer getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(Integer currentStep) {
        this.currentStep = currentStep;
    }

    public Integer getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(Integer totalSteps) {
        this.totalSteps = totalSteps;
    }

    public Integer getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public String getOperationId() {
        return operationId;
    }

    public void setOperationId(String operationId) {
        this.operationId = operationId;
    }

    public String getOperationReference() {
        return operationReference;
    }

    public void setOperationReference(String operationReference) {
        this.operationReference = operationReference;
    }

    public String getDraftId() {
        return draftId;
    }

    public void setDraftId(String draftId) {
        this.draftId = draftId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getAmountFormatted() {
        return amountFormatted;
    }

    public void setAmountFormatted(String amountFormatted) {
        this.amountFormatted = amountFormatted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Integer getDaysSinceCreation() {
        return daysSinceCreation;
    }

    public void setDaysSinceCreation(Integer daysSinceCreation) {
        this.daysSinceCreation = daysSinceCreation;
    }

    public Integer getDaysInReview() {
        return daysInReview;
    }

    public void setDaysInReview(Integer daysInReview) {
        this.daysInReview = daysInReview;
    }

    public String getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(String assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public String getAssignedToUserName() {
        return assignedToUserName;
    }

    public void setAssignedToUserName(String assignedToUserName) {
        this.assignedToUserName = assignedToUserName;
    }

    public String getAssignedToAvatarUrl() {
        return assignedToAvatarUrl;
    }

    public void setAssignedToAvatarUrl(String assignedToAvatarUrl) {
        this.assignedToAvatarUrl = assignedToAvatarUrl;
    }

    public String getApprovedByUserName() {
        return approvedByUserName;
    }

    public void setApprovedByUserName(String approvedByUserName) {
        this.approvedByUserName = approvedByUserName;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Integer getSlaHours() {
        return slaHours;
    }

    public void setSlaHours(Integer slaHours) {
        this.slaHours = slaHours;
    }

    public LocalDateTime getSlaDeadline() {
        return slaDeadline;
    }

    public void setSlaDeadline(LocalDateTime slaDeadline) {
        this.slaDeadline = slaDeadline;
    }

    public Boolean getSlaBreached() {
        return slaBreached;
    }

    public void setSlaBreached(Boolean slaBreached) {
        this.slaBreached = slaBreached;
    }

    public Integer getSlaRemainingHours() {
        return slaRemainingHours;
    }

    public void setSlaRemainingHours(Integer slaRemainingHours) {
        this.slaRemainingHours = slaRemainingHours;
    }

    public String getSlaStatus() {
        return slaStatus;
    }

    public void setSlaStatus(String slaStatus) {
        this.slaStatus = slaStatus;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getPriorityLabelKey() {
        return priorityLabelKey;
    }

    public void setPriorityLabelKey(String priorityLabelKey) {
        this.priorityLabelKey = priorityLabelKey;
    }

    public String getPriorityColor() {
        return priorityColor;
    }

    public void setPriorityColor(String priorityColor) {
        this.priorityColor = priorityColor;
    }

    public String getSummaryLine1() {
        return summaryLine1;
    }

    public void setSummaryLine1(String summaryLine1) {
        this.summaryLine1 = summaryLine1;
    }

    public String getSummaryLine2() {
        return summaryLine2;
    }

    public void setSummaryLine2(String summaryLine2) {
        this.summaryLine2 = summaryLine2;
    }

    public Integer getDocumentCount() {
        return documentCount;
    }

    public void setDocumentCount(Integer documentCount) {
        this.documentCount = documentCount;
    }

    public Integer getPendingDocumentCount() {
        return pendingDocumentCount;
    }

    public void setPendingDocumentCount(Integer pendingDocumentCount) {
        this.pendingDocumentCount = pendingDocumentCount;
    }

    public Integer getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
    }

    public Integer getUnreadCommentCount() {
        return unreadCommentCount;
    }

    public void setUnreadCommentCount(Integer unreadCommentCount) {
        this.unreadCommentCount = unreadCommentCount;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }

    public String getLastActivityBy() {
        return lastActivityBy;
    }

    public void setLastActivityBy(String lastActivityBy) {
        this.lastActivityBy = lastActivityBy;
    }

    public String getLastActivityDescription() {
        return lastActivityDescription;
    }

    public void setLastActivityDescription(String lastActivityDescription) {
        this.lastActivityDescription = lastActivityDescription;
    }

    public String getSearchText() {
        return searchText;
    }

    public void setSearchText(String searchText) {
        this.searchText = searchText;
    }

    public LocalDateTime getReadModelCreatedAt() {
        return readModelCreatedAt;
    }

    public void setReadModelCreatedAt(LocalDateTime readModelCreatedAt) {
        this.readModelCreatedAt = readModelCreatedAt;
    }

    public LocalDateTime getReadModelUpdatedAt() {
        return readModelUpdatedAt;
    }

    public void setReadModelUpdatedAt(LocalDateTime readModelUpdatedAt) {
        this.readModelUpdatedAt = readModelUpdatedAt;
    }

    public String getInternalProcessingStage() {
        return internalProcessingStage;
    }

    public void setInternalProcessingStage(String internalProcessingStage) {
        this.internalProcessingStage = internalProcessingStage;
    }

    public LocalDateTime getInternalProcessingStartedAt() {
        return internalProcessingStartedAt;
    }

    public void setInternalProcessingStartedAt(LocalDateTime internalProcessingStartedAt) {
        this.internalProcessingStartedAt = internalProcessingStartedAt;
    }

    public String getCustomData() {
        return customData;
    }

    public void setCustomData(String customData) {
        this.customData = customData;
    }

    public String getStatusDetail() {
        return statusDetail;
    }

    public void setStatusDetail(String statusDetail) {
        this.statusDetail = statusDetail;
    }

    public String getApprovedByUserId() {
        return approvedByUserId;
    }

    public void setApprovedByUserId(String approvedByUserId) {
        this.approvedByUserId = approvedByUserId;
    }

    public LocalDateTime getReviewStartedAt() {
        return reviewStartedAt;
    }

    public void setReviewStartedAt(LocalDateTime reviewStartedAt) {
        this.reviewStartedAt = reviewStartedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getSourceChannel() {
        return sourceChannel;
    }

    public void setSourceChannel(String sourceChannel) {
        this.sourceChannel = sourceChannel;
    }

    public String getSourceIp() {
        return sourceIp;
    }

    public void setSourceIp(String sourceIp) {
        this.sourceIp = sourceIp;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    // Business methods
    public boolean isDraft() {
        return "DRAFT".equals(status);
    }

    public boolean isSubmitted() {
        return "SUBMITTED".equals(status);
    }

    public boolean isInReview() {
        return "IN_REVIEW".equals(status);
    }

    public boolean isApproved() {
        return "APPROVED".equals(status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(status);
    }

    public boolean isFinalState() {
        return isApproved() || isRejected() || "CANCELLED".equals(status);
    }

    public boolean isPendingDocuments() {
        return "PENDING_DOCUMENTS".equals(status);
    }

    public boolean canBeEdited() {
        return isDraft() || isPendingDocuments();
    }

    public boolean canBeCancelled() {
        return isDraft() || isSubmitted() || isPendingDocuments();
    }

    public boolean isCancelled() {
        return "CANCELLED".equals(status);
    }
}
