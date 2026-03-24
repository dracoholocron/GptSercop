package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "swift_message_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensajeSwiftReadModel {
    @Id
    private Long id;

    @Column(name = "operation_type", length = 50)
    private String operacionTipo;

    @Column(name = "operation_id")
    private Long operacionId;

    @Column(name = "message_type", nullable = false, length = 10)
    private String tipoMensaje;

    @Column(name = "direction", nullable = false, length = 20)
    private String direccion;

    @Column(name = "bic_sender", length = 11)
    private String bicSender;

    @Column(name = "bic_receiver", length = 11)
    private String bicReceiver;

    @Column(name = "reference", length = 50)
    private String referencia;

    @Column(name = "swift_content", nullable = false, columnDefinition = "TEXT")
    private String contenidoSwift;

    @Column(name = "send_date")
    private LocalDateTime fechaEnvio;

    @Column(name = "reception_date")
    private LocalDateTime fechaRecepcion;

    @Column(name = "status", nullable = false, length = 20)
    private String estado;

    @Column(name = "related_message_id")
    private Long mensajeRelacionadoId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "aggregate_id", length = 100)
    private String aggregateId;

    @Version
    private Long version;
}
