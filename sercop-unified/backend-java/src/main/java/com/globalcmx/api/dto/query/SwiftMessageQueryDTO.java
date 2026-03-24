package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for SWIFT message queries (CQRS read side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftMessageQueryDTO {

    private Long id;
    private String messageId;
    private String messageType;
    private String direction;
    private String operationId;
    private String operationType;
    private String senderBic;
    private String receiverBic;
    private String swiftContent;

    // Extracted fields
    private String field20Reference;
    private String field21RelatedRef;
    private String currency;
    private BigDecimal amount;
    private LocalDate valueDate;

    private String status;

    // ACK/NAK tracking
    private Boolean ackReceived;
    private String ackContent;
    private LocalDateTime ackReceivedAt;

    // Response tracking
    private Boolean expectsResponse;
    private String expectedResponseType;
    private LocalDate responseDueDate;
    private Boolean responseReceived;
    private String responseMessageId;

    // Event link
    private String triggeredByEvent;
    private String generatesEvent;

    // Audit
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime receivedAt;
    private LocalDateTime processedAt;
    private String processedBy;
    private Integer version;
}
