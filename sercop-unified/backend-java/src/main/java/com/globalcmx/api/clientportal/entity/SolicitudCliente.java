package com.globalcmx.api.clientportal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a client request (solicitud) for trade finance products.
 * Uses Spanish naming for compatibility with existing client portal services.
 */
@Entity
@Table(name = "solicitud_cliente")
public class SolicitudCliente {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "cliente_id", nullable = false, columnDefinition = "CHAR(36)")
    private String clienteId;

    @Column(name = "cliente_name", nullable = false, length = 200)
    private String clienteName;

    @Column(name = "producto_type", nullable = false, length = 50)
    private String productoType;

    @Column(name = "producto_subtype", length = 50)
    private String productoSubtype;

    @Column(name = "request_number", nullable = false, length = 30)
    private String requestNumber;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "DRAFT";

    @Column(name = "estado_detalle", length = 100)
    private String estadoDetalle;

    @Column(name = "current_step")
    private Integer currentStep = 1;

    @Column(name = "total_steps")
    private Integer totalSteps = 1;

    @Column(name = "completion_percentage")
    private Integer completionPercentage = 0;

    @Column(name = "operation_id", columnDefinition = "CHAR(36)")
    private String operationId;

    @Column(name = "operation_reference", length = 30)
    private String operationReference;

    @Column(name = "monto", precision = 18, scale = 2)
    private BigDecimal monto;

    @Column(name = "moneda", length = 3)
    private String moneda;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_ultima_modificacion")
    private LocalDateTime fechaUltimaModificacion;

    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio;

    @Column(name = "fecha_inicio_revision")
    private LocalDateTime fechaInicioRevision;

    @Column(name = "fecha_aprobacion")
    private LocalDateTime fechaAprobacion;

    @Column(name = "fecha_rechazo")
    private LocalDateTime fechaRechazo;

    @Column(name = "fecha_expiracion")
    private LocalDateTime fechaExpiracion;

    @Column(name = "assigned_to_user_id", columnDefinition = "CHAR(36)")
    private String assignedToUserId;

    @Column(name = "assigned_to_user_name", length = 100)
    private String assignedToUserName;

    @Column(name = "aprobado_por_user_id", columnDefinition = "CHAR(36)")
    private String aprobadoPorUserId;

    @Column(name = "aprobado_por_user_name", length = 100)
    private String aprobadoPorUserName;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;

    @Column(name = "sla_breached")
    private Boolean slaBreached = false;

    @Column(name = "priority", length = 20)
    private String priority = "NORMAL";

    @Column(name = "source_channel", length = 30)
    private String sourceChannel = "PORTAL";

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "custom_data", columnDefinition = "JSON")
    private String customData;

    @Version
    @Column(name = "version")
    private Integer version = 1;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    // Constructors
    public SolicitudCliente() {
        this.fechaCreacion = LocalDateTime.now();
    }

    public SolicitudCliente(String clienteId, String clienteName, String productoType) {
        this();
        this.clienteId = clienteId;
        this.clienteName = clienteName;
        this.productoType = productoType;
    }

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

    public String getProductoType() {
        return productoType;
    }

    public void setProductoType(String productoType) {
        this.productoType = productoType;
    }

    public String getProductoSubtype() {
        return productoSubtype;
    }

    public void setProductoSubtype(String productoSubtype) {
        this.productoSubtype = productoSubtype;
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

    // Spanish-named aliases for compatibility
    public String getOperacionId() {
        return operationId;
    }

    public void setOperacionId(String operacionId) {
        this.operationId = operacionId;
    }

    public String getOperacionReference() {
        return operationReference;
    }

    public void setOperacionReference(String operacionReference) {
        this.operationReference = operacionReference;
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

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaUltimaModificacion() {
        return fechaUltimaModificacion;
    }

    public void setFechaUltimaModificacion(LocalDateTime fechaUltimaModificacion) {
        this.fechaUltimaModificacion = fechaUltimaModificacion;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public LocalDateTime getFechaInicioRevision() {
        return fechaInicioRevision;
    }

    public void setFechaInicioRevision(LocalDateTime fechaInicioRevision) {
        this.fechaInicioRevision = fechaInicioRevision;
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

    public LocalDateTime getFechaExpiracion() {
        return fechaExpiracion;
    }

    public void setFechaExpiracion(LocalDateTime fechaExpiracion) {
        this.fechaExpiracion = fechaExpiracion;
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

    public String getAprobadoPorUserId() {
        return aprobadoPorUserId;
    }

    public void setAprobadoPorUserId(String aprobadoPorUserId) {
        this.aprobadoPorUserId = aprobadoPorUserId;
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

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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

    public String getCustomData() {
        return customData;
    }

    public void setCustomData(String customData) {
        this.customData = customData;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
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

    // Business methods
    public boolean isDraft() {
        return "DRAFT".equals(estado);
    }

    public boolean isSubmitted() {
        return "SUBMITTED".equals(estado);
    }

    public boolean isInReview() {
        return "IN_REVIEW".equals(estado);
    }

    public boolean isPendingDocuments() {
        return "PENDING_DOCUMENTS".equals(estado);
    }

    public boolean isApproved() {
        return "APPROVED".equals(estado);
    }

    public boolean isRejected() {
        return "REJECTED".equals(estado);
    }

    public boolean isCancelled() {
        return "CANCELLED".equals(estado);
    }

    public boolean isFinalState() {
        return isApproved() || isRejected() || isCancelled();
    }

    public boolean canBeEdited() {
        return isDraft() || isPendingDocuments();
    }

    public boolean canBeCancelled() {
        return isDraft() || isSubmitted() || isPendingDocuments();
    }
}
