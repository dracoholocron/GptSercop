package com.globalcmx.api.customfields.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Stores custom field values for operations.
 * Data is stored as JSON for flexibility.
 */
@Entity
@Table(name = "operation_custom_data_readmodel", indexes = {
    @Index(name = "idx_operation_type", columnList = "operation_type"),
    @Index(name = "idx_custom_created_at", columnList = "created_at")
},
uniqueConstraints = {
    @UniqueConstraint(name = "uk_operation", columnNames = {"operation_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationCustomData {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    /**
     * Reference to the operation
     */
    @Column(name = "operation_id", nullable = false, columnDefinition = "CHAR(36)")
    private String operationId;

    /**
     * Operation type (LC_IMPORT, LC_EXPORT, GUARANTEE, etc.)
     */
    @Column(name = "operation_type", nullable = false, length = 30)
    private String operationType;

    /**
     * All custom field values as JSON.
     * Structure: {
     *   "FIELD_CODE": "value",
     *   "SECTION_CODE": [
     *     { "FIELD1": "value1", "FIELD2": "value2" },
     *     { "FIELD1": "value3", "FIELD2": "value4" }
     *   ]
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_data", nullable = false, columnDefinition = "json")
    private String customData;

    /**
     * Version for optimistic locking
     */
    @Version
    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    // ==================== Audit ====================

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
