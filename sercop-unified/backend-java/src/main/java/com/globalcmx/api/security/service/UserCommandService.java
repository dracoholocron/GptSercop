package com.globalcmx.api.security.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.aggregate.UserAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.*;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.security.dto.CreateUserRequest;
import com.globalcmx.api.security.dto.UpdateUserRequest;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCommandService {

    private final EventStoreService eventStoreService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public User createUser(CreateUserRequest command) {
        log.info("Creating new User with Event Sourcing - username: {}", command.getUsername());

        // Validate unique username
        if (userRepository.existsByUsername(command.getUsername())) {
            throw new IllegalArgumentException("El username ya existe: " + command.getUsername());
        }

        // Validate unique email
        if (userRepository.existsByEmail(command.getEmail())) {
            throw new IllegalArgumentException("El email ya existe: " + command.getEmail());
        }

        // Generate new ID
        Long userId = System.currentTimeMillis(); // Simple ID generation
        String aggregateId = "USER-" + userId;

        // Create aggregate and handle command
        UserAggregate aggregate = new UserAggregate();
        aggregate.handle(command, userId);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "USER",
                    domainEvent.getEventType(),
                    domainEvent,
                    "system" // TODO: Get current user from security context
            );
        }

        aggregate.markEventsAsCommitted();

        // Create actual user entity in security database
        User user = User.builder()
                .id(userId)
                .username(command.getUsername())
                .email(command.getEmail())
                .password(passwordEncoder.encode(command.getPassword()))
                .enabled(command.getEnabled() != null ? command.getEnabled() : true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .createdAt(Instant.now())
                .userType(command.getUserType() != null ? command.getUserType() : "INTERNAL")
                .clienteId(command.getClienteId())
                .build();

        // Assign roles
        if (command.getRoleIds() != null && !command.getRoleIds().isEmpty()) {
            Set<Role> roles = command.getRoleIds().stream()
                    .map(roleId -> roleRepository.findById(roleId)
                            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + roleId)))
                    .collect(Collectors.toSet());

            roles.forEach(user::addRole);
        } else {
            // Assign default USER role
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Rol ROLE_USER no encontrado"));
            user.addRole(userRole);
        }

        User savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {} using Event Sourcing", userId);

        return savedUser;
    }

    public User updateUser(Long id, UpdateUserRequest command) {
        log.info("Updating User with Event Sourcing - ID: {}", id);

        String aggregateId = "USER-" + id;

        // Check if user exists in database first
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

        UserAggregate aggregate;
        if (events.isEmpty()) {
            // Legacy user - create initial aggregate from existing user
            log.warn("No events found for user {}. Creating initial event from existing user state.", id);
            aggregate = new UserAggregate();

            // Create synthetic USER_CREATED event for legacy users
            CreateUserRequest createRequest = new CreateUserRequest();
            createRequest.setUsername(existingUser.getUsername());
            createRequest.setEmail(existingUser.getEmail());
            createRequest.setEnabled(existingUser.getEnabled());
            createRequest.setRoleIds(existingUser.getRoles().stream()
                    .map(role -> role.getId())
                    .collect(Collectors.toList()));

            aggregate.handle(createRequest, id);

            // Save the initial event
            for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
                eventStoreService.saveEvent(
                        aggregateId,
                        "USER",
                        domainEvent.getEventType(),
                        domainEvent,
                        "system-migration"
                );
            }
            aggregate.markEventsAsCommitted();
        } else {
            // Normal case - reconstruct from events
            aggregate = reconstructAggregateFromEvents(events);
        }

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "USER",
                    domainEvent.getEventType(),
                    domainEvent,
                    "system" // TODO: Get current user from security context
            );
        }

        aggregate.markEventsAsCommitted();

        // Update actual user entity in security database
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        // Update email if changed
        if (command.getEmail() != null && !command.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(command.getEmail())) {
                throw new IllegalArgumentException("El email ya existe");
            }
            user.setEmail(command.getEmail());
        }

        // Update password if provided
        if (command.getPassword() != null && !command.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(command.getPassword()));
        }

        // Update status fields
        if (command.getEnabled() != null) {
            user.setEnabled(command.getEnabled());
        }
        if (command.getAccountNonExpired() != null) {
            user.setAccountNonExpired(command.getAccountNonExpired());
        }
        if (command.getAccountNonLocked() != null) {
            user.setAccountNonLocked(command.getAccountNonLocked());
        }
        if (command.getCredentialsNonExpired() != null) {
            user.setCredentialsNonExpired(command.getCredentialsNonExpired());
        }

        // Update roles
        if (command.getRoleIds() != null) {
            user.getRoles().clear();

            Set<Role> roles = command.getRoleIds().stream()
                    .map(roleId -> roleRepository.findById(roleId)
                            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + roleId)))
                    .collect(Collectors.toSet());

            roles.forEach(user::addRole);
        }

        // Update Client Portal fields
        if (command.getUserType() != null) {
            user.setUserType(command.getUserType());
        }
        if (command.getClienteId() != null) {
            user.setClienteId(command.getClienteId().isEmpty() ? null : command.getClienteId());
        }

        user.setUpdatedAt(Instant.now());
        User updatedUser = userRepository.save(user);

        log.info("User updated successfully with ID: {}", id);

        return updatedUser;
    }

    public void deleteUser(Long id, boolean soft, String deletedBy) {
        log.info("Deleting User with Event Sourcing - ID: {}, soft: {}", id, soft);

        String aggregateId = "USER-" + id;

        // Check if user exists in database first
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

        UserAggregate aggregate;
        if (events.isEmpty()) {
            // Legacy user - create initial aggregate from existing user
            log.warn("No events found for user {}. Creating initial event from existing user state.", id);
            aggregate = new UserAggregate();

            // Create synthetic USER_CREATED event for legacy users
            CreateUserRequest createRequest = new CreateUserRequest();
            createRequest.setUsername(existingUser.getUsername());
            createRequest.setEmail(existingUser.getEmail());
            createRequest.setEnabled(existingUser.getEnabled());
            createRequest.setRoleIds(existingUser.getRoles().stream()
                    .map(role -> role.getId())
                    .collect(Collectors.toList()));

            aggregate.handle(createRequest, id);

            // Save the initial event
            for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
                eventStoreService.saveEvent(
                        aggregateId,
                        "USER",
                        domainEvent.getEventType(),
                        domainEvent,
                        "system-migration"
                );
            }
            aggregate.markEventsAsCommitted();
        } else {
            // Normal case - reconstruct from events
            aggregate = reconstructAggregateFromEvents(events);
        }

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "USER",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );
        }

        aggregate.markEventsAsCommitted();

        // Update actual user entity
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        if (soft) {
            // Soft delete: disable user
            user.setEnabled(false);
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);
            log.info("User disabled (soft delete): {}", user.getUsername());
        } else {
            // Hard delete: remove permanently
            userRepository.delete(user);
            log.info("User deleted permanently: {}", user.getUsername());
        }

        log.info("User deleted successfully with ID: {}", id);
    }

    private UserAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        UserAggregate aggregate = new UserAggregate();

        for (EventStoreEntity eventEntity : events) {
            try {
                DomainEvent domainEvent = deserializeDomainEvent(eventEntity);
                aggregate.loadFromHistory(List.of(domainEvent));
            } catch (Exception e) {
                log.error("Error deserializing event: {}", eventEntity.getEventId(), e);
                throw new RuntimeException("Failed to reconstruct aggregate", e);
            }
        }

        return aggregate;
    }

    private DomainEvent deserializeDomainEvent(EventStoreEntity eventEntity) throws Exception {
        String eventType = eventEntity.getEventType();

        return switch (eventType) {
            case "USER_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), UserCreatedEvent.class);
            case "USER_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), UserUpdatedEvent.class);
            case "USER_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), UserDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }
}
