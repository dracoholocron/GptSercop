package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserDeletedEvent extends DomainEvent {
    private Long userId;

    public UserDeletedEvent(Long userId, String performedBy) {
        super("USER_DELETED", performedBy);
        this.userId = userId;
    }
}
