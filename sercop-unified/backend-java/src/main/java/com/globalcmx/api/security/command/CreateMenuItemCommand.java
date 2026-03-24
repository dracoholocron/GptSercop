package com.globalcmx.api.security.command;

import java.util.List;

public record CreateMenuItemCommand(
    String code,
    Long parentId,
    String labelKey,
    String icon,
    String path,
    Integer displayOrder,
    Boolean isSection,
    List<String> permissionCodes,
    List<String> apiEndpointCodes
) {}
