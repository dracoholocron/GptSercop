package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.eventsourcing.event.*;
import com.globalcmx.api.security.dto.CreateUserRequest;
import com.globalcmx.api.security.dto.UpdateUserRequest;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Data
@Slf4j
public class UserAggregate {

    private Long userId;
    private String username;
    private String email;
    private Boolean enabled;
    private Boolean accountNonExpired;
    private Boolean accountNonLocked;
    private Boolean credentialsNonExpired;
    private List<Long> roleIds;
    private Long version;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public UserAggregate() {
        this.version = 0L;
    }

    public void handle(CreateUserRequest command, Long userId) {
        if (this.userId != null) {
            throw new IllegalStateException("Usuario ya existe");
        }

        UserCreatedEvent event = new UserCreatedEvent(
                userId,
                command.getUsername(),
                command.getEmail(),
                command.getEnabled() != null ? command.getEnabled() : true,
                command.getRoleIds(),
                "system" // TODO: Get current user from security context
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateUserRequest command) {
        if (this.userId == null) {
            throw new IllegalStateException("Usuario no existe");
        }

        UserUpdatedEvent event = new UserUpdatedEvent(
                this.userId,
                command.getEmail(),
                command.getEnabled(),
                command.getAccountNonExpired(),
                command.getAccountNonLocked(),
                command.getCredentialsNonExpired(),
                command.getRoleIds(),
                "system" // TODO: Get current user from security context
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String performedBy) {
        if (this.userId == null) {
            throw new IllegalStateException("Usuario no existe");
        }

        UserDeletedEvent event = new UserDeletedEvent(this.userId, performedBy);
        apply(event);
        uncommittedEvents.add(event);
    }

    public void apply(UserCreatedEvent event) {
        this.userId = event.getUserId();
        this.username = event.getUsername();
        this.email = event.getEmail();
        this.enabled = event.getEnabled();
        this.accountNonExpired = true;
        this.accountNonLocked = true;
        this.credentialsNonExpired = true;
        this.roleIds = event.getRoleIds();
        this.version++;
    }

    public void apply(UserUpdatedEvent event) {
        if (event.getEmail() != null) {
            this.email = event.getEmail();
        }
        if (event.getEnabled() != null) {
            this.enabled = event.getEnabled();
        }
        if (event.getAccountNonExpired() != null) {
            this.accountNonExpired = event.getAccountNonExpired();
        }
        if (event.getAccountNonLocked() != null) {
            this.accountNonLocked = event.getAccountNonLocked();
        }
        if (event.getCredentialsNonExpired() != null) {
            this.credentialsNonExpired = event.getCredentialsNonExpired();
        }
        if (event.getRoleIds() != null) {
            this.roleIds = event.getRoleIds();
        }
        this.version++;
    }

    public void apply(UserDeletedEvent event) {
        this.enabled = false;
        this.version++;
    }

    public List<DomainEvent> getUncommittedEvents() {
        return new ArrayList<>(uncommittedEvents);
    }

    public void markEventsAsCommitted() {
        uncommittedEvents.clear();
    }

    public void loadFromHistory(List<DomainEvent> history) {
        for (DomainEvent event : history) {
            applyEvent(event);
        }
    }

    private void applyEvent(DomainEvent event) {
        if (event instanceof UserCreatedEvent) {
            apply((UserCreatedEvent) event);
        } else if (event instanceof UserUpdatedEvent) {
            apply((UserUpdatedEvent) event);
        } else if (event instanceof UserDeletedEvent) {
            apply((UserDeletedEvent) event);
        }
    }
}
