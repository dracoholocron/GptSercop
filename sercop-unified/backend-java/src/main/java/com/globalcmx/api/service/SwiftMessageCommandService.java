package com.globalcmx.api.service;

import com.globalcmx.api.dto.command.SendSwiftMessageCommand;
import com.globalcmx.api.dto.command.ReceiveSwiftMessageCommand;
import com.globalcmx.api.dto.query.SwiftMessageQueryDTO;
import com.globalcmx.api.readmodel.entity.SwiftMessageReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.OperationEventLogReadModel;
import com.globalcmx.api.readmodel.repository.SwiftMessageReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationEventLogReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftResponseConfigReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Command service for SWIFT messages (CQRS write side).
 * Handles sending, receiving, and processing messages.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwiftMessageCommandService {

    private final SwiftMessageReadModelRepository messageRepository;
    private final OperationReadModelRepository operationRepository;
    private final OperationEventLogReadModelRepository eventLogRepository;
    private final SwiftResponseConfigReadModelRepository responseConfigRepository;

    /**
     * Records an outbound SWIFT message.
     * Uses REQUIRES_NEW to run in isolated transaction.
     * NOTE: Operation updates (message count, awaiting response) are handled separately
     * after this method returns to avoid optimistic locking conflicts.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SwiftMessageQueryDTO sendMessage(SendSwiftMessageCommand command) {
        log.info("Sending SWIFT message type: {} for operation: {}",
                command.getMessageType(), command.getOperationId());

        // Check if message already exists to prevent duplicates
        if (command.getOperationId() != null && command.getTriggeredByEvent() != null) {
            var existingMessage = messageRepository.findByOperationIdAndMessageTypeAndTriggeredByEvent(
                    command.getOperationId(),
                    command.getMessageType(),
                    command.getTriggeredByEvent());
            if (existingMessage.isPresent()) {
                log.info("SWIFT message already exists for operation {} with event {}, returning existing message: {}",
                        command.getOperationId(), command.getTriggeredByEvent(), existingMessage.get().getMessageId());
                return toDTO(existingMessage.get());
            }
        }

        // Get operation type if linked (read-only, just for building message)
        String operationType = null;
        if (command.getOperationId() != null) {
            operationType = operationRepository.findByOperationId(command.getOperationId())
                    .map(OperationReadModel::getProductType).orElse(null);
        }

        // Create message record
        String messageId = generateMessageId(command.getMessageType());

        SwiftMessageReadModel message = SwiftMessageReadModel.builder()
                .messageId(messageId)
                .messageType(command.getMessageType())
                .direction("OUTBOUND")
                .operationId(command.getOperationId())
                .operationType(operationType)
                .senderBic(command.getSenderBic())
                .receiverBic(command.getReceiverBic())
                .swiftContent(command.getSwiftContent())
                .field20Reference(command.getField20Reference())
                .field21RelatedRef(command.getField21RelatedRef())
                .currency(command.getCurrency())
                .amount(command.getAmount())
                .valueDate(command.getValueDate())
                .status("SENT")
                .triggeredByEvent(command.getTriggeredByEvent())
                .createdBy(command.getCreatedBy())
                .createdAt(LocalDateTime.now())
                .sentAt(LocalDateTime.now())
                .build();

        // Check if response is expected (just set message fields, don't update operation)
        if (operationType != null && command.getOperationId() != null) {
            var responseConfigOpt = responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                    command.getMessageType(), operationType, "en");
            if (responseConfigOpt.isPresent()) {
                var config = responseConfigOpt.get();
                message.setExpectsResponse(true);
                message.setExpectedResponseType(config.getExpectedResponseType());
                message.setResponseDueDate(LocalDate.now().plusDays(config.getExpectedResponseDays()));
            }
        }

        message = messageRepository.save(message);

        log.info("SWIFT message sent: {}", messageId);
        return toDTO(message);
    }

    /**
     * Records an inbound SWIFT message.
     */
    @Transactional
    public SwiftMessageQueryDTO receiveMessage(ReceiveSwiftMessageCommand command) {
        log.info("Receiving SWIFT message type: {} for operation: {}",
                command.getMessageType(), command.getOperationId());

        String operationType = null;
        if (command.getOperationId() != null) {
            operationType = operationRepository.findByOperationId(command.getOperationId())
                    .map(OperationReadModel::getProductType).orElse(null);
        }

        // Create message record
        String messageId = generateMessageId(command.getMessageType());

        SwiftMessageReadModel message = SwiftMessageReadModel.builder()
                .messageId(messageId)
                .messageType(command.getMessageType())
                .direction("INBOUND")
                .operationId(command.getOperationId())
                .operationType(operationType)
                .senderBic(command.getSenderBic())
                .receiverBic(command.getReceiverBic())
                .swiftContent(command.getSwiftContent())
                .field20Reference(command.getField20Reference())
                .field21RelatedRef(command.getField21RelatedRef())
                .currency(command.getCurrency())
                .amount(command.getAmount())
                .valueDate(command.getValueDate())
                .status("RECEIVED")
                .createdAt(LocalDateTime.now())
                .receivedAt(LocalDateTime.now())
                .build();

        message = messageRepository.save(message);

        // If this is responding to a previous message
        if (command.getRespondingToMessageId() != null) {
            messageRepository.findByMessageId(command.getRespondingToMessageId())
                    .ifPresent(originalMessage -> {
                        originalMessage.setResponseReceived(true);
                        originalMessage.setResponseMessageId(messageId);
                        messageRepository.save(originalMessage);

                        // Update operation
                        if (originalMessage.getOperationId() != null) {
                            operationRepository.findByOperationId(originalMessage.getOperationId())
                                    .ifPresent(op -> {
                                        if (op.getAwaitingResponse() &&
                                                command.getMessageType().equals(op.getAwaitingMessageType())) {
                                            op.setAwaitingResponse(false);
                                            op.setAwaitingMessageType(null);
                                            op.setResponseDueDate(null);
                                            operationRepository.save(op);
                                        }
                                    });
                        }
                    });
        }

        // Update operation message count
        if (command.getOperationId() != null) {
            operationRepository.findByOperationId(command.getOperationId())
                    .ifPresent(op -> {
                        op.setMessageCount(op.getMessageCount() + 1);
                        operationRepository.save(op);
                    });
        }

        log.info("SWIFT message received: {}", messageId);
        return toDTO(message);
    }

    /**
     * Records ACK reception for a message.
     */
    @Transactional
    public void recordAck(String messageId, String ackContent) {
        log.info("Recording ACK for message: {}", messageId);

        messageRepository.findByMessageId(messageId)
                .ifPresent(message -> {
                    message.setAckReceived(true);
                    message.setAckContent(ackContent);
                    message.setAckReceivedAt(LocalDateTime.now());
                    message.setStatus("DELIVERED");
                    message.setDeliveredAt(LocalDateTime.now());
                    messageRepository.save(message);
                });
    }

    /**
     * Marks a message as processed.
     */
    @Transactional
    public void markProcessed(String messageId, String processedBy) {
        log.info("Marking message as processed: {}", messageId);

        messageRepository.findByMessageId(messageId)
                .ifPresent(message -> {
                    message.setStatus("PROCESSED");
                    message.setProcessedAt(LocalDateTime.now());
                    message.setProcessedBy(processedBy);
                    messageRepository.save(message);
                });
    }

    private String generateMessageId(String messageType) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        return String.format("MSG-%s-%s", messageType, timestamp.substring(timestamp.length() - 8));
    }

    private SwiftMessageQueryDTO toDTO(SwiftMessageReadModel entity) {
        return SwiftMessageQueryDTO.builder()
                .id(entity.getId())
                .messageId(entity.getMessageId())
                .messageType(entity.getMessageType())
                .direction(entity.getDirection())
                .operationId(entity.getOperationId())
                .operationType(entity.getOperationType())
                .senderBic(entity.getSenderBic())
                .receiverBic(entity.getReceiverBic())
                .swiftContent(entity.getSwiftContent())
                .field20Reference(entity.getField20Reference())
                .field21RelatedRef(entity.getField21RelatedRef())
                .currency(entity.getCurrency())
                .amount(entity.getAmount())
                .valueDate(entity.getValueDate())
                .status(entity.getStatus())
                .ackReceived(entity.getAckReceived())
                .ackContent(entity.getAckContent())
                .ackReceivedAt(entity.getAckReceivedAt())
                .expectsResponse(entity.getExpectsResponse())
                .expectedResponseType(entity.getExpectedResponseType())
                .responseDueDate(entity.getResponseDueDate())
                .responseReceived(entity.getResponseReceived())
                .responseMessageId(entity.getResponseMessageId())
                .triggeredByEvent(entity.getTriggeredByEvent())
                .generatesEvent(entity.getGeneratesEvent())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .sentAt(entity.getSentAt())
                .deliveredAt(entity.getDeliveredAt())
                .receivedAt(entity.getReceivedAt())
                .processedAt(entity.getProcessedAt())
                .processedBy(entity.getProcessedBy())
                .version(entity.getVersion())
                .build();
    }
}
