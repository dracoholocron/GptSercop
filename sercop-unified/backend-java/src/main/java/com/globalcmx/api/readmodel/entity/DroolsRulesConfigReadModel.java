package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "drools_rules_config_read_model", indexes = {
        @Index(name = "idx_rule_type_active", columnList = "rule_type, is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DroolsRulesConfigReadModel {

    @Id
    private Long id;

    @Column(name = "rule_type", nullable = false, length = 50)
    private String ruleType;

    @Lob
    @Column(name = "drl_content", nullable = false, columnDefinition = "LONGTEXT")
    private String drlContent;

    @Column(name = "source_file_name", length = 255)
    private String sourceFileName;

    @Lob
    @Column(name = "source_file_content", columnDefinition = "LONGBLOB")
    private byte[] sourceFileContent;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "version")
    private Integer version;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
