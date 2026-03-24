package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for permission queries (Read operations).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionQueryDTO {

    private String code;
    private String name;
    private String description;
    private String module;
    private Instant createdAt;

    /**
     * Factory method from entity
     */
    public static PermissionQueryDTO from(com.globalcmx.api.security.entity.Permission permission) {
        return PermissionQueryDTO.builder()
                .code(permission.getCode())
                .name(permission.getName())
                .description(permission.getDescription())
                .module(permission.getModule())
                .createdAt(permission.getCreatedAt())
                .build();
    }
}
