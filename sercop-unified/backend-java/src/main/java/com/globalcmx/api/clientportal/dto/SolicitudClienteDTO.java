package com.globalcmx.api.clientportal.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for client requests with all necessary information for frontend display.
 */
public class SolicitudClienteDTO {

    private String id;
    private String clienteId;
    private String clienteName;
    private String clienteIdentification;

    private String productoType;
    private String productoTypeLabel;
    private String productoIcon;
    private String productoColor;

    private String requestNumber;

    private String estado;
    private String estadoLabel;
    private String estadoColor;
    private String estadoIcon;
    private String estadoDetalle;

    private Integer currentStep;
    private Integer totalSteps;
    private Integer completionPercentage;

    private String operacionId;
    private String operacionReference;

    private BigDecimal monto;
    private String moneda;
    private String montoFormatted;

    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaEnvio;
    private LocalDateTime fechaAprobacion;
    private LocalDateTime fechaRechazo;
    private LocalDateTime fechaVencimiento;

    private Integer diasDesdeCreacion;
    private Integer diasEnRevision;

    private String assignedToUserId;
    private String assignedToUserName;
    private String assignedToAvatarUrl;

    private String aprobadoPorUserName;
    private String motivoRechazo;

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

    // Permissions for current user
    private Boolean canEdit;
    private Boolean canSubmit;
    private Boolean canCancel;
    private Boolean canComment;
    private Boolean canViewDocuments;
    private Boolean canUploadDocuments;

    // Constructors
    public SolicitudClienteDTO() {}

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClienteId() {
        return clienteId;
    }

    public void setClienteId(String clienteId) {
        this.clienteId = clienteId;
    }

    public String getClienteName() {
        return clienteName;
    }

    public void setClienteName(String clienteName) {
        this.clienteName = clienteName;
    }

    public String getClienteIdentification() {
        return clienteIdentification;
    }

    public void setClienteIdentification(String clienteIdentification) {
        this.clienteIdentification = clienteIdentification;
    }

    public String getProductoType() {
        return productoType;
    }

    public void setProductoType(String productoType) {
        this.productoType = productoType;
    }

    public String getProductoTypeLabel() {
        return productoTypeLabel;
    }

    public void setProductoTypeLabel(String productoTypeLabel) {
        this.productoTypeLabel = productoTypeLabel;
    }

    public String getProductoIcon() {
        return productoIcon;
    }

    public void setProductoIcon(String productoIcon) {
        this.productoIcon = productoIcon;
    }

    public String getProductoColor() {
        return productoColor;
    }

    public void setProductoColor(String productoColor) {
        this.productoColor = productoColor;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getEstadoLabel() {
        return estadoLabel;
    }

    public void setEstadoLabel(String estadoLabel) {
        this.estadoLabel = estadoLabel;
    }

    public String getEstadoColor() {
        return estadoColor;
    }

    public void setEstadoColor(String estadoColor) {
        this.estadoColor = estadoColor;
    }

    public String getEstadoIcon() {
        return estadoIcon;
    }

    public void setEstadoIcon(String estadoIcon) {
        this.estadoIcon = estadoIcon;
    }

    public String getEstadoDetalle() {
        return estadoDetalle;
    }

    public void setEstadoDetalle(String estadoDetalle) {
        this.estadoDetalle = estadoDetalle;
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

    public String getOperacionId() {
        return operacionId;
    }

    public void setOperacionId(String operacionId) {
        this.operacionId = operacionId;
    }

    public String getOperacionReference() {
        return operacionReference;
    }

    public void setOperacionReference(String operacionReference) {
        this.operacionReference = operacionReference;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public String getMontoFormatted() {
        return montoFormatted;
    }

    public void setMontoFormatted(String montoFormatted) {
        this.montoFormatted = montoFormatted;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public LocalDateTime getFechaAprobacion() {
        return fechaAprobacion;
    }

    public void setFechaAprobacion(LocalDateTime fechaAprobacion) {
        this.fechaAprobacion = fechaAprobacion;
    }

    public LocalDateTime getFechaRechazo() {
        return fechaRechazo;
    }

    public void setFechaRechazo(LocalDateTime fechaRechazo) {
        this.fechaRechazo = fechaRechazo;
    }

    public LocalDateTime getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDateTime fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public Integer getDiasDesdeCreacion() {
        return diasDesdeCreacion;
    }

    public void setDiasDesdeCreacion(Integer diasDesdeCreacion) {
        this.diasDesdeCreacion = diasDesdeCreacion;
    }

    public Integer getDiasEnRevision() {
        return diasEnRevision;
    }

    public void setDiasEnRevision(Integer diasEnRevision) {
        this.diasEnRevision = diasEnRevision;
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

    public String getAprobadoPorUserName() {
        return aprobadoPorUserName;
    }

    public void setAprobadoPorUserName(String aprobadoPorUserName) {
        this.aprobadoPorUserName = aprobadoPorUserName;
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public void setMotivoRechazo(String motivoRechazo) {
        this.motivoRechazo = motivoRechazo;
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
}
