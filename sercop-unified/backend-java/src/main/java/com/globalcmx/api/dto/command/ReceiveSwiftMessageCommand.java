package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Command for processing a received SWIFT message.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiveSwiftMessageCommand {

    private String operationId;
    private String messageType;
    private String senderBic;
    private String receiverBic;
    private String swiftContent;
    private String field20Reference;
    private String field21RelatedRef;
    private String currency;
    private BigDecimal amount;
    private LocalDate valueDate;
    private String respondingToMessageId;
    private String processedBy;
}
