package com.globalcmx.api.ai.service;

import com.globalcmx.api.ai.entity.AIContext;
import com.globalcmx.api.ai.repository.AIContextRepository;
import com.globalcmx.api.ai.repository.AIContextRoleMappingRepository;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar contextos de IA.
 * Proporciona métodos para obtener contextos disponibles según los roles del usuario.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class AIContextService {

    private final AIContextRepository contextRepository;
    private final AIContextRoleMappingRepository roleMappingRepository;
    private final UserRepository userRepository;

    /**
     * Obtener todos los contextos habilitados disponibles para el usuario actual
     */
    public List<AIContext> getAvailableContexts() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            log.warn("No authenticated user found");
            return List.of();
        }

        // Obtener roles del usuario
        List<String> roles = currentUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());

        log.debug("Getting available contexts for user {} with roles: {}", 
                  currentUser.getUsername(), roles);

        // Si el usuario es ADMIN, devolver todos los contextos habilitados
        if (roles.contains("ROLE_ADMIN")) {
            return contextRepository.findByEnabledTrueOrderByDisplayOrderAsc();
        }

        // Para otros roles, obtener contextos permitidos según mapeo
        List<AIContext> availableContexts = roles.stream()
                .flatMap(role -> roleMappingRepository.findEnabledContextsByRole(role).stream())
                .distinct()
                .sorted((a, b) -> Integer.compare(
                    a.getDisplayOrder() != null ? a.getDisplayOrder() : 0,
                    b.getDisplayOrder() != null ? b.getDisplayOrder() : 0))
                .collect(Collectors.toList());

        return availableContexts;
    }

    /**
     * Obtener contexto por código
     */
    public AIContext getContextByCode(String code) {
        return contextRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Context not found: " + code));
    }

    /**
     * Verificar si el usuario actual tiene acceso a un contexto
     */
    public boolean hasAccessToContext(Long contextId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }

        List<String> roles = currentUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());

        // ADMIN tiene acceso a todo
        if (roles.contains("ROLE_ADMIN")) {
            return true;
        }

        // Verificar acceso por rol
        return roles.stream()
                .anyMatch(role -> roleMappingRepository.hasAccess(contextId, role));
    }

    /**
     * Obtener usuario actual del contexto de seguridad
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }
}


