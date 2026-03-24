package com.globalcmx.api.externalapi.dto.query;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthConfigResponse {

    private Long id;
    private String authType;

    private String apiKeyName;
    private String apiKeyValueMasked;
    private String apiKeyLocation;

    private String username;
    private Boolean hasPassword;

    private Boolean hasStaticToken;

    private String oauth2TokenUrl;
    private String oauth2ClientId;
    private Boolean hasOauth2ClientSecret;
    private String oauth2Scope;
    private String oauth2Audience;

    private String oauth2AuthUrl;
    private String oauth2RedirectUri;

    private Boolean hasJwtSecret;
    private String jwtAlgorithm;
    private String jwtIssuer;
    private String jwtAudience;
    private Integer jwtExpirationSeconds;
    private String jwtClaimsTemplate;

    private String mtlsCertPath;
    private String mtlsKeyPath;
    private String mtlsCaCertPath;
    private Boolean hasMtlsKeyPassword;

    private String customHeadersJson;

    private Boolean active;
}
