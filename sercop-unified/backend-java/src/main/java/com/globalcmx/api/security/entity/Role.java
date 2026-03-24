package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Entidad Role para autorización basada en roles.
 * Roles disponibles: ROLE_USER, ROLE_OPERATOR, ROLE_MANAGER, ROLE_ADMIN
 */
@Entity
@Table(name = "role_read_model")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    @ManyToMany(mappedBy = "roles")
    @Builder.Default
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private Set<User> users = new HashSet<>();

    /**
     * Relación con permisos - Un rol puede tener múltiples permisos
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permission_read_model",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_code")
    )
    @Builder.Default
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private Set<Permission> permissions = new HashSet<>();

    /**
     * Helper method to get all permission codes for this role
     */
    public Set<String> getPermissionCodes() {
        return permissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
    }

    /**
     * Check if this role has a specific permission
     */
    public boolean hasPermission(String permissionCode) {
        return permissions.stream()
                .anyMatch(p -> p.getCode().equals(permissionCode));
    }

    /**
     * Enum para nombres de roles predefinidos.
     */
    public enum RoleName {
        ROLE_USER("Usuario estándar con permisos de solo lectura"),
        ROLE_OPERATOR("Operador con permisos de creación y edición"),
        ROLE_MANAGER("Gerente con permisos de aprobación"),
        ROLE_ADMIN("Administrador con permisos completos");

        private final String description;

        RoleName(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
