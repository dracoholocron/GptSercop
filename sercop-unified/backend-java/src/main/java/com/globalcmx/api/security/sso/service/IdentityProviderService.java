package com.globalcmx.api.security.sso.service;

import com.globalcmx.api.security.audit.SecurityAuditService;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import com.globalcmx.api.security.jwt.JwtTokenProvider;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.config.IdentityProviderProperties;
import com.globalcmx.api.security.sso.dto.OAuth2UserInfo;
import com.globalcmx.api.security.sso.dto.ProviderInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Main service for Identity Provider operations.
 * Handles SSO authentication, JIT provisioning, and provider management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdentityProviderService {

    private final IdentityProviderProperties properties;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OAuth2UserInfoMapper userInfoMapper;
    private final GroupSyncService groupSyncService;
    private final SecurityAuditService auditService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get list of enabled identity providers with default base URL.
     */
    public List<ProviderInfo> getEnabledProviders() {
        return getEnabledProviders(null);
    }

    /**
     * Get list of enabled identity providers with dynamic callback URLs.
     * @param baseUrl The base URL to use for callbacks (auto-detected from request if null)
     */
    public List<ProviderInfo> getEnabledProviders(String baseUrl) {
        List<ProviderInfo> providers = new ArrayList<>();
        String defaultProvider = properties.getDefaultProvider();

        // Local authentication
        if (properties.isLocalAuthEnabled()) {
            providers.add(ProviderInfo.builder()
                    .id(IdentityProvider.LOCAL.getCode())
                    .name(IdentityProvider.LOCAL.getDisplayName())
                    .icon(IdentityProvider.LOCAL.getIcon())
                    .authorizationUrl(null)
                    .isDefault("LOCAL".equals(defaultProvider))
                    .build());
        }

        // Auth0
        if (properties.getAuth0().isEnabled()) {
            String callbackUrl = properties.buildCallbackUrl(baseUrl, "auth0");
            String authUrl = String.format(
                    "https://%s/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email",
                    properties.getAuth0().getDomain(),
                    properties.getAuth0().getClientId(),
                    callbackUrl
            );
            providers.add(ProviderInfo.from(
                    IdentityProvider.AUTH0,
                    authUrl,
                    "AUTH0".equals(defaultProvider)
            ));
        }

        // Azure AD
        if (properties.getAzureAd().isEnabled()) {
            String callbackUrl = properties.buildCallbackUrl(baseUrl, "azure");
            String authUrl = String.format(
                    "https://login.microsoftonline.com/%s/oauth2/v2.0/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email",
                    properties.getAzureAd().getTenantId(),
                    properties.getAzureAd().getClientId(),
                    callbackUrl
            );
            providers.add(ProviderInfo.from(
                    IdentityProvider.AZURE_AD,
                    authUrl,
                    "AZURE_AD".equals(defaultProvider)
            ));
        }

        // Google
        if (properties.getGoogle().isEnabled()) {
            String callbackUrl = properties.buildCallbackUrl(baseUrl, "google");
            String authUrl = String.format(
                    "https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email",
                    properties.getGoogle().getClientId(),
                    callbackUrl
            );
            if (properties.getGoogle().getHostedDomain() != null) {
                authUrl += "&hd=" + properties.getGoogle().getHostedDomain();
            }
            providers.add(ProviderInfo.from(
                    IdentityProvider.GOOGLE,
                    authUrl,
                    "GOOGLE".equals(defaultProvider)
            ));
        }

        // Cognito
        if (properties.getCognito().isEnabled()) {
            String callbackUrl = properties.buildCallbackUrl(baseUrl, "cognito");
            String authUrl = String.format(
                    "https://%s.auth.%s.amazoncognito.com/oauth2/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email",
                    properties.getCognito().getDomain(),
                    properties.getCognito().getRegion(),
                    properties.getCognito().getClientId(),
                    callbackUrl
            );
            providers.add(ProviderInfo.from(
                    IdentityProvider.COGNITO,
                    authUrl,
                    "COGNITO".equals(defaultProvider)
            ));
        }

        // Okta
        if (properties.getOkta().isEnabled()) {
            String callbackUrl = properties.buildCallbackUrl(baseUrl, "okta");
            String authServerId = properties.getOkta().getAuthorizationServerId();
            String authUrl = String.format(
                    "https://%s/oauth2/%s/v1/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email groups",
                    properties.getOkta().getDomain(),
                    authServerId != null ? authServerId : "default",
                    properties.getOkta().getClientId(),
                    callbackUrl
            );
            providers.add(ProviderInfo.from(
                    IdentityProvider.OKTA,
                    authUrl,
                    "OKTA".equals(defaultProvider)
            ));
        }

        return providers;
    }

    /**
     * Handle OAuth2 callback and return JWT token.
     */
    @Transactional
    public AuthResult handleOAuth2Callback(IdentityProvider provider, Map<String, Object> claims) {
        log.info("Processing OAuth2 callback for provider: {}", provider);

        try {
            // Map claims to user info
            OAuth2UserInfo userInfo = userInfoMapper.map(provider, claims);

            if (userInfo.getEmail() == null) {
                log.error("No email in OAuth2 claims for provider: {}", provider);
                auditService.logSsoLoginFailure(null, provider.getCode(), "No email in claims");
                return AuthResult.failure("Email not provided by identity provider");
            }

            // Find or provision user - try email first (preferred for SSO), then username
            Optional<User> existingUser = userRepository.findByEmail(userInfo.getEmail())
                    .or(() -> userRepository.findByUsername(userInfo.getEmail()));
            User user;
            boolean isNewUser = false;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                // Verify provider matches (security check)
                if (user.getIdentityProvider() != null &&
                    !user.getIdentityProvider().equals(provider.getCode()) &&
                    !user.getIdentityProvider().equals(IdentityProvider.LOCAL.getCode())) {
                    log.warn("User {} trying to login with different provider. Expected: {}, Got: {}",
                            userInfo.getEmail(), user.getIdentityProvider(), provider.getCode());
                    auditService.logSsoLoginFailure(userInfo.getEmail(), provider.getCode(),
                            "Provider mismatch");
                    return AuthResult.failure("Account exists with different identity provider");
                }
                // Update SSO info
                updateUserFromSso(user, userInfo);
            } else {
                // JIT Provisioning
                if (!properties.isJitProvisioningEnabled()) {
                    log.warn("JIT provisioning disabled. User not found: {}", userInfo.getEmail());
                    auditService.logSsoLoginFailure(userInfo.getEmail(), provider.getCode(),
                            "JIT provisioning disabled");
                    return AuthResult.failure("User not provisioned. Contact administrator.");
                }
                user = provisionUser(userInfo);
                isNewUser = true;
            }

            // Sync groups/roles
            if (userInfo.getGroups() != null && !userInfo.getGroups().isEmpty()) {
                groupSyncService.syncGroups(user, provider, userInfo.getGroups());
            }

            // Generate JWT
            String token = jwtTokenProvider.generateTokenFromUsername(user.getUsername());

            // Audit log
            auditService.logSsoLoginSuccess(user.getUsername(), provider.getCode(), isNewUser);

            log.info("SSO login successful for user: {} via {}", user.getUsername(), provider);
            return AuthResult.success(token, user, isNewUser);

        } catch (Exception e) {
            log.error("SSO callback processing failed for provider: {}", provider, e);
            auditService.logSsoLoginFailure(null, provider.getCode(), e.getMessage());
            return AuthResult.failure("Authentication failed: " + e.getMessage());
        }
    }

    /**
     * Provision a new user from SSO (JIT).
     */
    @Transactional
    public User provisionUser(OAuth2UserInfo userInfo) {
        log.info("Provisioning new user via JIT: {}", userInfo.getEmail());

        // Get default role
        Role defaultRole = roleRepository.findByName(properties.getJitDefaultRole())
                .orElseGet(() -> roleRepository.findByName("ROLE_USER")
                        .orElseThrow(() -> new IllegalStateException("Default role not found")));

        User user = User.builder()
                .username(userInfo.getEmail())
                .email(userInfo.getEmail())
                .name(userInfo.getDisplayName())
                .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString())) // SSO users get random password
                .enabled(false)
                .approvalStatus(UserApprovalStatus.PENDING)
                .approvalRequestedAt(Instant.now())
                .identityProvider(userInfo.getProvider().getCode())
                .externalId(userInfo.getExternalId())
                .avatarUrl(userInfo.getAvatarUrl())
                .lastSsoLogin(Instant.now())
                .roles(new HashSet<>(Collections.singleton(defaultRole)))
                .build();

        User saved = userRepository.save(user);

        // Audit log
        auditService.logUserCreated(saved.getUsername(), "JIT_PROVISIONING",
                userInfo.getProvider().getCode());

        log.info("User provisioned via JIT: {}", saved.getUsername());
        return saved;
    }

    /**
     * Update existing user with SSO information.
     */
    private void updateUserFromSso(User user, OAuth2UserInfo userInfo) {
        user.setIdentityProvider(userInfo.getProvider().getCode());
        user.setExternalId(userInfo.getExternalId());
        user.setLastSsoLogin(Instant.now());

        // Update avatar if provided
        if (userInfo.getAvatarUrl() != null) {
            user.setAvatarUrl(userInfo.getAvatarUrl());
        }

        // Update name if provided
        if (userInfo.getDisplayName() != null) {
            user.setName(userInfo.getDisplayName());
        }

        userRepository.save(user);
    }

    /**
     * Check if a provider is enabled.
     */
    public boolean isProviderEnabled(IdentityProvider provider) {
        return switch (provider) {
            case LOCAL -> properties.isLocalAuthEnabled();
            case AUTH0 -> properties.getAuth0().isEnabled();
            case AZURE_AD -> properties.getAzureAd().isEnabled();
            case GOOGLE -> properties.getGoogle().isEnabled();
            case COGNITO -> properties.getCognito().isEnabled();
            case OKTA -> properties.getOkta().isEnabled();
        };
    }

    /**
     * Get the default provider.
     */
    public IdentityProvider getDefaultProvider() {
        return IdentityProvider.fromCode(properties.getDefaultProvider());
    }

    /**
     * Result of authentication attempt.
     */
    public record AuthResult(
            boolean success,
            String token,
            User user,
            boolean newUser,
            String error
    ) {
        public static AuthResult success(String token, User user, boolean newUser) {
            return new AuthResult(true, token, user, newUser, null);
        }

        public static AuthResult failure(String error) {
            return new AuthResult(false, null, null, false, error);
        }
    }
}
