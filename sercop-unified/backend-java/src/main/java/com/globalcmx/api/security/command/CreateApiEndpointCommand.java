package com.globalcmx.api.security.command;

import java.util.List;

public record CreateApiEndpointCommand(
    String code,
    String httpMethod,
    String urlPattern,
    String description,
    String module,
    Boolean isPublic,
    List<String> permissionCodes
) {}
