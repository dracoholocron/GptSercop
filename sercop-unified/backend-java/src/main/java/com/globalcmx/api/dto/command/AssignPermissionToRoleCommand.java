package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command to assign a permission to a role.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignPermissionToRoleCommand {

    @NotNull(message = "Role ID is required")
    private Long roleId;

    @NotBlank(message = "Permission code is required")
    private String permissionCode;
}
