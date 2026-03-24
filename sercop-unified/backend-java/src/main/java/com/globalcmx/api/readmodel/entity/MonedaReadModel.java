package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "currency_read_model", indexes = {
        @Index(name = "idx_code", columnList = "code")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonedaReadModel {

    @Id
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 3)
    private String codigo;

    @Column(name = "name", nullable = false, length = 100)
    private String nombre;

    @Column(name = "symbol", length = 10)
    private String simbolo;

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

    @Column(nullable = false)
    private Long version;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
