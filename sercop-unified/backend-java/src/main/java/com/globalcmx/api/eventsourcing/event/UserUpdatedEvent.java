package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserUpdatedEvent extends DomainEvent {
    private Long userId;
    private String email;
    private Boolean enabled;
    private Boolean accountNonExpired;
    private Boolean accountNonLocked;
    private Boolean credentialsNonExpired;
    private List<Long> roleIds;

    public UserUpdatedEvent(Long userId, String email, Boolean enabled, Boolean accountNonExpired,
                           Boolean accountNonLocked, Boolean credentialsNonExpired, List<Long> roleIds, String performedBy) {
        super("USER_UPDATED", performedBy);
        this.userId = userId;
        this.email = email;
        this.enabled = enabled;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.roleIds = roleIds;
    }
}
