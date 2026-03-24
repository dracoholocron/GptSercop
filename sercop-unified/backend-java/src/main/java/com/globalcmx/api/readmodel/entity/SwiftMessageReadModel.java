package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read model for SWIFT messages (sent and received).
 * Tracks all SWIFT communications related to operations.
 */
@Entity
@Table(name = "swift_message_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftMessageReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", length = 50, unique = true, nullable = false)
    private String messageId;

    @Column(name = "message_type", length = 10, nullable = false)
    private String messageType;

    @Column(name = "direction", length = 10, nullable = false)
    private String direction;

    @Column(name = "operation_id", length = 50)
    private String operationId;

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "sender_bic", length = 11, nullable = false)
    private String senderBic;

    @Column(name = "receiver_bic", length = 11, nullable = false)
    private String receiverBic;

    @Column(name = "swift_content", columnDefinition = "TEXT", nullable = false)
    private String swiftContent;

    // Extracted fields for queries
    @Column(name = "field_20_reference", length = 35)
    private String field20Reference;

    @Column(name = "field_21_related_ref", length = 35)
    private String field21RelatedRef;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "value_date")
    private LocalDate valueDate;

    @Column(name = "status", length = 30, nullable = false)
    private String status;

    // ACK/NAK tracking
    @Column(name = "ack_received")
    @Builder.Default
    private Boolean ackReceived = false;

    @Column(name = "ack_content", columnDefinition = "TEXT")
    private String ackContent;

    @Column(name = "ack_received_at")
    private LocalDateTime ackReceivedAt;

    // Response tracking
    @Column(name = "expects_response")
    @Builder.Default
    private Boolean expectsResponse = false;

    @Column(name = "expected_response_type", length = 10)
    private String expectedResponseType;

    @Column(name = "response_due_date")
    private LocalDate responseDueDate;

    @Column(name = "response_received")
    @Builder.Default
    private Boolean responseReceived = false;

    @Column(name = "response_message_id", length = 50)
    private String responseMessageId;

    // Event link
    @Column(name = "triggered_by_event", length = 50)
    private String triggeredByEvent;

    @Column(name = "generates_event", length = 50)
    private String generatesEvent;

    // Audit
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

    @Version
    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
