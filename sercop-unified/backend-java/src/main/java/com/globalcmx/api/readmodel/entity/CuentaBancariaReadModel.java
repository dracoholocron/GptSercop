package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "bank_account_read_model", indexes = {
        @Index(name = "idx_bank_account_identification", columnList = "account_identification"),
        @Index(name = "idx_bank_account_number", columnList = "account_number"),
        @Index(name = "idx_bank_account_participant", columnList = "participant_identification"),
        @Index(name = "idx_bank_account_type", columnList = "type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuentaBancariaReadModel {
    @Id
    private Long id;

    @Column(name = "participant_identification", nullable = false)
    private String identificacionParticipante;

    @Column(name = "participant_first_names", nullable = false)
    private String nombresParticipante;

    @Column(name = "participant_last_names", nullable = false)
    private String apellidosParticipante;

    @Column(name = "account_number", nullable = false)
    private String numeroCuenta;

    @Column(name = "account_identification", nullable = false, unique = true)
    private String identificacionCuenta;

    @Column(name = "type", nullable = false)
    private String tipo;

    @Column(name = "active", nullable = false)
    private Boolean activo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
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
