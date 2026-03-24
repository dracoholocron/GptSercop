package com.globalcmx.api.readmodel.entity;

import com.globalcmx.api.readmodel.enums.FinancialInstitutionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "financial_institution_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialInstitutionReadModel {
    @Id
    private Long id;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(name = "name", nullable = false, length = 200)
    private String nombre;

    @Column(name = "swift_code", length = 11)
    private String swiftCode;

    @Column(name = "country", length = 100)
    private String pais;

    @Column(name = "city", length = 100)
    private String ciudad;

    @Column(name = "address", columnDefinition = "TEXT")
    private String direccion;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private FinancialInstitutionType tipo;

    @Column(name = "rating", length = 10)
    private String rating;

    @Column(name = "is_correspondent")
    private Boolean esCorresponsal;

    @Column(name = "active", nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "aggregate_id", length = 100)
    private String aggregateId;

    @Version
    private Long version;
}
