package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entidad genérica para borradores de mensajes SWIFT.
 *
 * Esta entidad es transversal a todos los productos:
 * - LC Import (MT700)
 * - LC Export (MT710, MT720)
 * - Garantías (MT760)
 * - Mensajes libres (MT799)
 * - Standby LC, etc.
 *
 * El campo swift_message es la fuente de verdad.
 * Los campos de metadata son para facilitar búsquedas/filtrados.
 */
@Entity
@Table(name = "swift_draft_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftDraftReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Identificador único del borrador (formato: DRAFT-{PRODUCT}-{TIMESTAMP})
     * Ej: DRAFT-LC-IMP-1733123456789
     */
    @Column(name = "draft_id", length = 100, unique = true, nullable = false)
    private String draftId;

    /**
     * Tipo de mensaje SWIFT (MT700, MT710, MT720, MT760, MT799, etc.)
     */
    @Column(name = "message_type", length = 10, nullable = false)
    private String messageType;

    /**
     * Tipo de producto (LC_IMPORT, LC_EXPORT, GUARANTEE, STANDBY_LC, FREE_MESSAGE, etc.)
     */
    @Column(name = "product_type", length = 50, nullable = false)
    private String productType;

    /**
     * Referencia del documento (campo :20: del mensaje SWIFT)
     */
    @Column(name = "reference", length = 100)
    private String reference;

    /**
     * Estado del borrador (DRAFT, SUBMITTED, APPROVED, REJECTED)
     */
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "DRAFT";

    /**
     * Modo de creación del borrador (EXPERT, CLIENT, WIZARD)
     * Permite reabrir el borrador en el modo original
     */
    @Column(name = "mode", length = 20)
    @Builder.Default
    private String mode = "EXPERT";

    // ========================================
    // MENSAJE SWIFT - FUENTE DE VERDAD
    // ========================================

    /**
     * El mensaje SWIFT completo en formato texto.
     * Incluye todos los campos con sus tags (:20:, :31C:, :32B:, etc.)
     *
     * Ejemplo:
     * :20:LC-IMP-2024-00001
     * :31C:20241204
     * :32B:USD100000,00
     * :50:JUAN PEREZ
     * CALLE PRINCIPAL 123
     * QUITO
     * ECUADOR
     * ...
     */
    @Column(name = "swift_message", columnDefinition = "TEXT", nullable = false)
    private String swiftMessage;

    // ========================================
    // METADATA (campos para búsqueda/filtrado)
    // ========================================

    /**
     * Moneda (extraído de :32B:)
     */
    @Column(name = "currency", length = 3)
    private String currency;

    /**
     * Monto (extraído de :32B:)
     */
    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    /**
     * Fecha de emisión (extraído de :31C:)
     */
    @Column(name = "issue_date")
    private LocalDate issueDate;

    /**
     * Fecha de vencimiento (extraído de :31D:)
     */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    /**
     * ID del ordenante/solicitante (extraído de :50:)
     */
    @Column(name = "applicant_id")
    private Long applicantId;

    /**
     * ID del beneficiario (extraído de :59:)
     */
    @Column(name = "beneficiary_id")
    private Long beneficiaryId;

    /**
     * ID del banco emisor (extraído de :52A:)
     */
    @Column(name = "issuing_bank_id")
    private Long issuingBankId;

    /**
     * BIC del banco emisor (extraído de :52A:)
     */
    @Column(name = "issuing_bank_bic", length = 100)
    private String issuingBankBic;

    /**
     * ID del banco avisador (extraído de :57A:)
     */
    @Column(name = "advising_bank_id")
    private Long advisingBankId;

    /**
     * BIC del banco avisador (extraído de :57A:)
     */
    @Column(name = "advising_bank_bic", length = 100)
    private String advisingBankBic;

    // ========================================
    // CUSTOM FIELDS DATA
    // ========================================

    /**
     * Datos de campos personalizados en formato JSON.
     * Almacena los datos de secciones repetibles y campos custom adicionales.
     */
    @Column(name = "custom_data", columnDefinition = "TEXT")
    private String customData;

    // ========================================
    // REJECTION DATA
    // ========================================

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_comments", columnDefinition = "JSON")
    private Map<String, Object> fieldComments;

    // ========================================
    // AUDITORÍA
    // ========================================

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "creation_date")
    private LocalDateTime creationDate;

    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    @Column(name = "modification_date")
    private LocalDateTime modificationDate;

    /**
     * Control de versión optimista
     */
    @Version
    @Column(name = "version")
    @Builder.Default
    private Long version = 0L;

    @PrePersist
    protected void onCreate() {
        if (creationDate == null) {
            creationDate = LocalDateTime.now();
        }
        modificationDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modificationDate = LocalDateTime.now();
    }
}
