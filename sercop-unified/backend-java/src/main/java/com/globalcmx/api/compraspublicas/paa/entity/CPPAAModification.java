package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_paa_modification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAModification {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paa_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPPAA paa;

    @Column(name = "modification_number", nullable = false)
    private Integer modificationNumber;

    @Column(name = "modification_date")
    private LocalDate modificationDate;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "items_added", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String itemsAdded;

    @Column(name = "items_modified", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String itemsModified;

    @Column(name = "items_removed", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String itemsRemoved;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
