package com.globalcmx.api.security.mfa.service;

import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.mfa.idp.IdpMfaSyncService;
import com.globalcmx.api.security.sso.IdentityProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for synchronizing MFA policies across all identity providers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MfaPolicySyncService {

    private final List<IdpMfaSyncService> idpSyncServices;

    /**
     * Sync MFA configuration to all enabled IdPs.
     *
     * @param enabledMethods Set of enabled MFA methods
     * @param policy MFA policy (disabled, optional, required, risk-based)
     * @return Map of provider -> success status
     */
    public Map<String, Boolean> syncToAllProviders(Set<MfaMethod> enabledMethods, String policy) {
        Map<String, Boolean> results = new LinkedHashMap<>();

        for (IdpMfaSyncService syncService : idpSyncServices) {
            String providerName = syncService.getProvider().getCode();

            if (!syncService.isEnabled()) {
                log.debug("Skipping {} - not enabled", providerName);
                results.put(providerName, null); // null = skipped
                continue;
            }

            try {
                boolean success = syncService.syncMfaPolicy(enabledMethods, policy);
                results.put(providerName, success);
                log.info("MFA policy sync to {}: {}", providerName, success ? "SUCCESS" : "FAILED");
            } catch (Exception e) {
                log.error("Failed to sync MFA policy to {}", providerName, e);
                results.put(providerName, false);
            }
        }

        return results;
    }

    /**
     * Get current MFA configuration status for all IdPs.
     */
    public Map<String, Object> getCurrentConfig() {
        Map<String, Object> config = new LinkedHashMap<>();

        // List all providers and their status
        List<Map<String, Object>> providers = new ArrayList<>();
        for (IdpMfaSyncService syncService : idpSyncServices) {
            Map<String, Object> providerInfo = new LinkedHashMap<>();
            providerInfo.put("provider", syncService.getProvider().getCode());
            providerInfo.put("displayName", syncService.getProvider().getDisplayName());
            providerInfo.put("enabled", syncService.isEnabled());
            providerInfo.put("supportedMethods", syncService.getSupportedMethods().stream()
                .map(MfaMethod::getCode)
                .collect(Collectors.toList()));
            providers.add(providerInfo);
        }

        config.put("providers", providers);

        // List all available MFA methods
        List<Map<String, Object>> methods = Arrays.stream(MfaMethod.values())
            .map(m -> {
                Map<String, Object> method = new LinkedHashMap<>();
                method.put("code", m.getCode());
                method.put("displayName", m.getDisplayName());
                method.put("description", m.getDescription());
                method.put("supportsIdpSync", m.isSupportsIdpSync());
                return method;
            })
            .collect(Collectors.toList());

        config.put("methods", methods);

        // List available policies
        config.put("policies", List.of(
            Map.of("code", "disabled", "displayName", "Deshabilitado", "description", "MFA completamente deshabilitado"),
            Map.of("code", "optional", "displayName", "Opcional", "description", "Usuarios pueden habilitar MFA voluntariamente"),
            Map.of("code", "required", "displayName", "Requerido", "description", "MFA obligatorio para todos los usuarios"),
            Map.of("code", "risk-based", "displayName", "Basado en Riesgo", "description", "MFA requerido según puntuación de riesgo")
        ));

        return config;
    }

    /**
     * Get sync service for a specific provider.
     */
    public Optional<IdpMfaSyncService> getServiceForProvider(IdentityProvider provider) {
        return idpSyncServices.stream()
            .filter(s -> s.getProvider() == provider)
            .findFirst();
    }

    /**
     * Check if any IdP sync is available.
     */
    public boolean hasEnabledProviders() {
        return idpSyncServices.stream().anyMatch(IdpMfaSyncService::isEnabled);
    }

    /**
     * Get list of enabled providers.
     */
    public List<IdentityProvider> getEnabledProviders() {
        return idpSyncServices.stream()
            .filter(IdpMfaSyncService::isEnabled)
            .map(IdpMfaSyncService::getProvider)
            .collect(Collectors.toList());
    }
}
