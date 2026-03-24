package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Read model for product type configuration.
 * Centralizes the mapping between product types and their corresponding UI views/wizards.
 */
@Entity
@Table(name = "product_type_config", indexes = {
        @Index(name = "idx_product_type_config_active", columnList = "active"),
        @Index(name = "idx_product_type_config_category", columnList = "category")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTypeConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_type", nullable = false, unique = true, length = 50)
    private String productType;

    @Column(name = "base_url", nullable = false, length = 100)
    private String baseUrl;

    @Column(name = "wizard_url", nullable = false, length = 150)
    private String wizardUrl;

    @Column(name = "view_mode_title_key", nullable = false, length = 100)
    private String viewModeTitleKey;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "swift_message_type", length = 10)
    private String swiftMessageType;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "account_prefix", length = 50)
    private String accountPrefix;

    @Column(name = "id_prefix", length = 5)
    private String idPrefix;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    /**
     * Accounting nature for pending balance calculation.
     * DEBIT: pendingBalance = SUM(debits) - SUM(credits) (default for LC, Guarantees)
     * CREDIT: pendingBalance = SUM(credits) - SUM(debits) (for Collections)
     */
    @Column(name = "accounting_nature", nullable = false, length = 10)
    @Builder.Default
    private String accountingNature = "DEBIT";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (active == null) {
            active = true;
        }
        if (displayOrder == null) {
            displayOrder = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
