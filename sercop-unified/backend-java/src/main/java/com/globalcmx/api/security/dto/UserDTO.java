package com.globalcmx.api.security.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String name;
    private Boolean enabled;
    private Boolean accountNonExpired;
    private Boolean accountNonLocked;
    private Boolean credentialsNonExpired;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLogin;
    private List<RoleDTO> roles;
    private String identityProvider;
    private String externalId;
    private String avatarUrl;
    private Instant lastSsoLogin;
    private String approvalStatus;
    private Instant approvalRequestedAt;
    private Instant approvedAt;
    private String approvedBy;
    private String rejectionReason;

    // Client Portal fields
    private String userType;
    private String clienteId;
    private String participantName; // For display purposes
}
