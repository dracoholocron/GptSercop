package com.globalcmx.api.clientportal.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for client requests with all necessary information for frontend display.
 */
public class ClientRequestDTO {

    private String id;
    private String clientId;
    private String clientName;
    private String clientIdentification;

    private String productType;
    private String productTypeLabel;
    private String productIcon;
    private String productColor;

    private String requestNumber;

    private String status;
    private String statusLabel;
    private String statusColor;
    private String statusIcon;
    private String statusDetail;

    private Integer currentStep;
    private Integer totalSteps;
    private Integer completionPercentage;

    private String operationId;
    private String operationReference;
    private String draftId;

    private BigDecimal amount;
    private String currency;
    private String amountFormatted;

    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime expiresAt;

    private Integer daysSinceCreation;
    private Integer daysInReview;

    private String assignedToUserId;
    private String assignedToUserName;
    private String assignedToAvatarUrl;

    private String approvedByUserName;
    private String rejectionReason;

    private Integer slaHours;
    private LocalDateTime slaDeadline;
    private Boolean slaBreached;
    private Integer slaRemainingHours;
    private String slaStatus;

    private String priority;
    private String priorityLabel;
    private String priorityColor;

    private String summaryLine1;
    private String summaryLine2;

    private Integer documentCount;
    private Integer pendingDocumentCount;
    private Integer commentCount;
    private Integer unreadCommentCount;

    private LocalDateTime lastActivityAt;
    private String lastActivityBy;
    private String lastActivityDescription;

    private Map<String, Object> customData;

    // Internal processing workflow
    private String internalProcessingStage;
    private String internalProcessingStageLabel;
    private String internalProcessingStageColor;
    private String internalProcessingStageIcon;
    private LocalDateTime internalProcessingStartedAt;

    // Permissions for current user
    private Boolean canEdit;
    private Boolean canSubmit;
    private Boolean canCancel;
    private Boolean canComment;
    private Boolean canViewDocuments;
    private Boolean canUploadDocuments;

    // Constructors
    public ClientRequestDTO() {}

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

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public String getProductTypeLabel() {
        return productTypeLabel;
    }

    public void setProductTypeLabel(String productTypeLabel) {
        this.productTypeLabel = productTypeLabel;
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

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
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

    public String getStatusDetail() {
        return statusDetail;
    }

    public void setStatusDetail(String statusDetail) {
        this.statusDetail = statusDetail;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
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

    public String getPriorityLabel() {
        return priorityLabel;
    }

    public void setPriorityLabel(String priorityLabel) {
        this.priorityLabel = priorityLabel;
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

    public Map<String, Object> getCustomData() {
        return customData;
    }

    public void setCustomData(Map<String, Object> customData) {
        this.customData = customData;
    }

    public Boolean getCanEdit() {
        return canEdit;
    }

    public void setCanEdit(Boolean canEdit) {
        this.canEdit = canEdit;
    }

    public Boolean getCanSubmit() {
        return canSubmit;
    }

    public void setCanSubmit(Boolean canSubmit) {
        this.canSubmit = canSubmit;
    }

    public Boolean getCanCancel() {
        return canCancel;
    }

    public void setCanCancel(Boolean canCancel) {
        this.canCancel = canCancel;
    }

    public Boolean getCanComment() {
        return canComment;
    }

    public void setCanComment(Boolean canComment) {
        this.canComment = canComment;
    }

    public Boolean getCanViewDocuments() {
        return canViewDocuments;
    }

    public void setCanViewDocuments(Boolean canViewDocuments) {
        this.canViewDocuments = canViewDocuments;
    }

    public Boolean getCanUploadDocuments() {
        return canUploadDocuments;
    }

    public void setCanUploadDocuments(Boolean canUploadDocuments) {
        this.canUploadDocuments = canUploadDocuments;
    }

    public String getInternalProcessingStage() {
        return internalProcessingStage;
    }

    public void setInternalProcessingStage(String internalProcessingStage) {
        this.internalProcessingStage = internalProcessingStage;
    }

    public String getInternalProcessingStageLabel() {
        return internalProcessingStageLabel;
    }

    public void setInternalProcessingStageLabel(String internalProcessingStageLabel) {
        this.internalProcessingStageLabel = internalProcessingStageLabel;
    }

    public String getInternalProcessingStageColor() {
        return internalProcessingStageColor;
    }

    public void setInternalProcessingStageColor(String internalProcessingStageColor) {
        this.internalProcessingStageColor = internalProcessingStageColor;
    }

    public String getInternalProcessingStageIcon() {
        return internalProcessingStageIcon;
    }

    public void setInternalProcessingStageIcon(String internalProcessingStageIcon) {
        this.internalProcessingStageIcon = internalProcessingStageIcon;
    }

    public LocalDateTime getInternalProcessingStartedAt() {
        return internalProcessingStartedAt;
    }

    public void setInternalProcessingStartedAt(LocalDateTime internalProcessingStartedAt) {
        this.internalProcessingStartedAt = internalProcessingStartedAt;
    }
}
