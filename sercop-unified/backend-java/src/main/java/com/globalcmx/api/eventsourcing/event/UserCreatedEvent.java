package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserCreatedEvent extends DomainEvent {
    private Long userId;
    private String username;
    private String email;
    private Boolean enabled;
    private List<Long> roleIds;

    public UserCreatedEvent(Long userId, String username, String email, Boolean enabled, List<Long> roleIds, String performedBy) {
        super("USER_CREATED", performedBy);
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.enabled = enabled;
        this.roleIds = roleIds;
    }
}
