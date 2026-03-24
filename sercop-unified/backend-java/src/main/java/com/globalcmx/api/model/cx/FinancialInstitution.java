package com.globalcmx.api.model.cx;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "financial_institution_readmodel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialInstitution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String codigo;

    @Column(name = "name", nullable = false, length = 200)
    private String nombre;

    @Column(name = "swift_code", length = 11)
    private String swiftCode;

    @Column(name = "country", length = 3)
    private String pais;

    @Column(name = "city", length = 100)
    private String ciudad;

    @Column(name = "address", columnDefinition = "TEXT")
    private String direccion;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private TipoInstitucion tipo;

    @Column(length = 10)
    private String rating;

    @Column(name = "is_correspondent")
    private Boolean esCorresponsal;

    @Column(name = "active")
    private Boolean activo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (activo == null) {
            activo = true;
        }
        if (esCorresponsal == null) {
            esCorresponsal = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TipoInstitucion {
        BANCO_COMERCIAL,
        BANCO_CORRESPONSAL,
        BANCO_CENTRAL,
        INSTITUCION_FINANCIERA
    }
}
