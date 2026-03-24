package com.globalcmx.api.security.command;

import java.util.List;

public record UpdateMenuItemCommand(
    Long id,
    String code,
    Long parentId,
    String labelKey,
    String icon,
    String path,
    Integer displayOrder,
    Boolean isSection,
    Boolean isActive,
    List<String> permissionCodes,
    List<String> apiEndpointCodes
) {}
