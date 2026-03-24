package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad User para autenticación y autorización.
 * Almacenada en la base de datos ReadModel (MySQL).
 */
@Entity
@Table(name = "user_read_model", uniqueConstraints = {
    @UniqueConstraint(columnNames = "username"),
    @UniqueConstraint(columnNames = "email")
},
indexes = {
    @Index(name = "idx_users_external_id", columnList = "identity_provider, external_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 100)
    private String name;

    @Column(length = 255)
    private String password;  // BCrypt hash (null for SSO-only users)

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean accountNonExpired = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean accountNonLocked = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean credentialsNonExpired = true;

    // SSO Fields
    @Column(name = "identity_provider", length = 20)
    @Builder.Default
    private String identityProvider = "LOCAL";

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "last_sso_login")
    private Instant lastSsoLogin;

    // MFA Fields
    @Column(name = "mfa_enabled")
    @Builder.Default
    private Boolean mfaEnabled = false;

    @Column(name = "mfa_enforced")
    @Builder.Default
    private Boolean mfaEnforced = false;

    @Column(name = "mfa_grace_period_until")
    private Instant mfaGracePeriodUntil;

    @Column(name = "last_mfa_verified_at")
    private Instant lastMfaVerifiedAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_role_read_model",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private Set<Role> roles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "last_login")
    private Instant lastLogin;

    // Client Portal Fields
    @Column(name = "user_type", length = 20)
    @Builder.Default
    private String userType = "INTERNAL";

    @Column(name = "cliente_id", length = 36)
    private String clienteId;

    @Column(name = "is_primary_contact")
    @Builder.Default
    private Boolean isPrimaryContact = false;

    @Column(name = "cargo", length = 100)
    private String cargo;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "preferred_language", length = 5)
    @Builder.Default
    private String preferredLanguage = "en";

    // Approval Workflow Fields
    @Column(name = "approval_status", length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserApprovalStatus approvalStatus = UserApprovalStatus.APPROVED;

    @Column(name = "approval_requested_at")
    private Instant approvalRequestedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Helper methods
    public void addRole(Role role) {
        this.roles.add(role);
    }

    public void removeRole(Role role) {
        this.roles.remove(role);
    }
}
