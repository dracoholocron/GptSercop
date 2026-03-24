package com.globalcmx.api.externalapi.dto.command;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthConfigCommand {

    @NotNull(message = "El tipo de autenticacion es requerido")
    private String authType;

    private String apiKeyName;
    private String apiKeyValue;
    private String apiKeyLocation;

    private String username;
    private String password;

    private String staticToken;

    private String oauth2TokenUrl;
    private String oauth2ClientId;
    private String oauth2ClientSecret;
    private String oauth2Scope;
    private String oauth2Audience;

    private String oauth2AuthUrl;
    private String oauth2RedirectUri;

    private String jwtSecret;
    private String jwtAlgorithm;
    private String jwtIssuer;
    private String jwtAudience;
    private Integer jwtExpirationSeconds;
    private String jwtClaimsTemplate;

    private String mtlsCertPath;
    private String mtlsKeyPath;
    private String mtlsCaCertPath;
    private String mtlsKeyPassword;

    private String customHeadersJson;
}
