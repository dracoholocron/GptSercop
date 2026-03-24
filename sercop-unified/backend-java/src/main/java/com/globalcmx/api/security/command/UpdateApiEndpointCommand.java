package com.globalcmx.api.security.command;

import java.util.List;

public record UpdateApiEndpointCommand(
    Long id,
    String code,
    String httpMethod,
    String urlPattern,
    String description,
    String module,
    Boolean isPublic,
    Boolean isActive,
    List<String> permissionCodes
) {}
