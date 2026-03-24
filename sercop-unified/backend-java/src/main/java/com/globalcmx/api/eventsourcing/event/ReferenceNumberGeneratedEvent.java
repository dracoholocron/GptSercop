package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ReferenceNumberGeneratedEvent extends DomainEvent {
    private Long configId;
    private String referenceNumber;
    private String productCode;
    private String countryCode;
    private String agencyCode;
    private String yearCode;
    private Long sequenceNumber;
    private String entityType;
    private String entityId;
    private String clientId;

    public ReferenceNumberGeneratedEvent(
            Long configId,
            String referenceNumber,
            String productCode,
            String countryCode,
            String agencyCode,
            String yearCode,
            Long sequenceNumber,
            String entityType,
            String entityId,
            String clientId,
            String performedBy) {
        super("REFERENCE_NUMBER_GENERATED", performedBy);
        this.configId = configId;
        this.referenceNumber = referenceNumber;
        this.productCode = productCode;
        this.countryCode = countryCode;
        this.agencyCode = agencyCode;
        this.yearCode = yearCode;
        this.sequenceNumber = sequenceNumber;
        this.entityType = entityType;
        this.entityId = entityId;
        this.clientId = clientId;
    }
}
