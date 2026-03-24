package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_api_auth_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "apiConfig")
@EqualsAndHashCode(exclude = "apiConfig")
public class ExternalApiAuthConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_config_id", nullable = false)
    private ExternalApiConfigReadModel apiConfig;

    @Column(name = "auth_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private AuthType authType;

    @Column(name = "api_key_name", length = 100)
    private String apiKeyName;

    @Column(name = "api_key_value_encrypted", columnDefinition = "TEXT")
    private String apiKeyValueEncrypted;

    @Column(name = "api_key_location", length = 20)
    @Enumerated(EnumType.STRING)
    private ApiKeyLocation apiKeyLocation;

    @Column(length = 255)
    private String username;

    @Column(name = "password_encrypted", columnDefinition = "TEXT")
    private String passwordEncrypted;

    @Column(name = "static_token_encrypted", columnDefinition = "TEXT")
    private String staticTokenEncrypted;

    @Column(name = "oauth2_token_url", length = 500)
    private String oauth2TokenUrl;

    @Column(name = "oauth2_client_id", length = 255)
    private String oauth2ClientId;

    @Column(name = "oauth2_client_secret_encrypted", columnDefinition = "TEXT")
    private String oauth2ClientSecretEncrypted;

    @Column(name = "oauth2_scope", length = 500)
    private String oauth2Scope;

    @Column(name = "oauth2_audience", length = 255)
    private String oauth2Audience;

    @Column(name = "oauth2_auth_url", length = 500)
    private String oauth2AuthUrl;

    @Column(name = "oauth2_redirect_uri", length = 500)
    private String oauth2RedirectUri;

    @Column(name = "oauth2_state", length = 255)
    private String oauth2State;

    @Column(name = "jwt_secret_encrypted", columnDefinition = "TEXT")
    private String jwtSecretEncrypted;

    @Column(name = "jwt_algorithm", length = 20)
    private String jwtAlgorithm;

    @Column(name = "jwt_issuer", length = 255)
    private String jwtIssuer;

    @Column(name = "jwt_audience", length = 255)
    private String jwtAudience;

    @Column(name = "jwt_expiration_seconds")
    private Integer jwtExpirationSeconds;

    @Column(name = "jwt_claims_template", columnDefinition = "TEXT")
    private String jwtClaimsTemplate;

    @Column(name = "mtls_cert_path", length = 500)
    private String mtlsCertPath;

    @Column(name = "mtls_key_path", length = 500)
    private String mtlsKeyPath;

    @Column(name = "mtls_ca_cert_path", length = 500)
    private String mtlsCaCertPath;

    @Column(name = "mtls_key_password_encrypted", columnDefinition = "TEXT")
    private String mtlsKeyPasswordEncrypted;

    @Column(name = "custom_headers_json", columnDefinition = "TEXT")
    private String customHeadersJson;

    @Column
    private Boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (active == null) active = true;
        if (apiKeyLocation == null) apiKeyLocation = ApiKeyLocation.HEADER;
        if (jwtAlgorithm == null) jwtAlgorithm = "HS256";
        if (jwtExpirationSeconds == null) jwtExpirationSeconds = 3600;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum AuthType {
        NONE, API_KEY, BASIC_AUTH, BEARER_TOKEN,
        OAUTH2_CLIENT_CREDENTIALS, OAUTH2_AUTHORIZATION_CODE,
        JWT, MTLS, CUSTOM_HEADER
    }

    public enum ApiKeyLocation {
        HEADER, QUERY_PARAM
    }
}
