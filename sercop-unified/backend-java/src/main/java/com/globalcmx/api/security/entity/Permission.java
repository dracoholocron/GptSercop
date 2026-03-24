package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Permission entity for granular access control.
 * Each permission represents a specific action that can be performed in the system.
 */
@Entity
@Table(name = "permission_read_model")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @Column(length = 50)
    private String code;  // e.g., CAN_CREATE_LC_IMPORT, CAN_APPROVE_OPERATION

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 50)
    private String module;  // e.g., LC_IMPORT, LC_EXPORT, GUARANTEE, SWIFT, SYSTEM

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @ManyToMany(mappedBy = "permissions")
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Permission that = (Permission) o;
        return code != null && code.equals(that.code);
    }

    @Override
    public int hashCode() {
        return code != null ? code.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "Permission{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", module='" + module + '\'' +
                '}';
    }
}
