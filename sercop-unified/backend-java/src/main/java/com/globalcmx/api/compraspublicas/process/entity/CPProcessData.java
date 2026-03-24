package com.globalcmx.api.compraspublicas.process.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_process_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPProcessData {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "process_id", nullable = false, unique = true, columnDefinition = "CHAR(36)")
    private String processId;

    @Column(name = "country_code", nullable = false, length = 3)
    @Builder.Default
    private String countryCode = "EC";

    @Column(name = "process_type", nullable = false, length = 30)
    private String processType;

    @Column(name = "process_code", length = 50)
    private String processCode;

    @Column(name = "entity_ruc", length = 20)
    private String entityRuc;

    @Column(name = "entity_name", length = 300)
    private String entityName;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "BORRADOR";

    @Column(name = "form_data", nullable = false, columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String formData;

    @Version
    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @Column(name = "created_at", updatable = false)
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
