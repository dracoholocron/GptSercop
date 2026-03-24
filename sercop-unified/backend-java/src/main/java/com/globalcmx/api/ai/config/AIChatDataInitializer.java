package com.globalcmx.api.ai.config;

import com.globalcmx.api.security.entity.MenuItem;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.repository.MenuItemRepository;
import com.globalcmx.api.security.repository.PermissionRepository;
import com.globalcmx.api.security.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

/**
 * Inicializador de datos para AI Chat CMX.
 * 
 * Este componente se ejecuta al iniciar la aplicación y asegura que:
 * - El permiso CAN_USE_AI_CHAT existe
 * - El permiso está asignado a los roles necesarios (ROLE_ADMIN, ROLE_MANAGER, ROLE_USER)
 * - La sección SECTION_AI existe en el menú
 * - El item de menú AI_CHAT_CMX existe y está correctamente configurado
 * - El permiso está asociado al item de menú
 * 
 * Este inicializador es idempotente: puede ejecutarse múltiples veces sin problemas.
 * Funciona independientemente de si Flyway está habilitado o no.
 * 
 * @Order(200) - Se ejecuta después de SecurityDataInitializer (@Order(1)) y CxTestDataInitializer (@Order(100))
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(200)
public class AIChatDataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("=".repeat(80));
        log.info("Inicializando datos de AI Chat CMX...");
        log.info("=".repeat(80));

        try {
            // Paso 1: Asegurar que el permiso existe
            Permission permission = ensurePermissionExists();
            
            // Paso 2: Asignar permiso a roles
            assignPermissionToRoles(permission);
            
            // Paso 3: Asegurar que la sección SECTION_AI existe
            MenuItem aiSection = ensureAISectionExists();
            
            // Paso 4: Crear/actualizar el item de menú Chat CMX
            MenuItem chatMenuItem = ensureChatMenuItemExists(aiSection);
            
            // Paso 5: Asociar permiso al item de menú
            associatePermissionToMenuItem(chatMenuItem, permission);

            log.info("=".repeat(80));
            log.info("✓ Datos de AI Chat CMX inicializados correctamente");
            log.info("  - Permiso: CAN_USE_AI_CHAT");
            log.info("  - Item de menú: AI_CHAT_CMX");
            log.info("  - Ruta: /ai-analysis/chat");
            log.info("=".repeat(80));

        } catch (Exception e) {
            log.error("Error al inicializar datos de AI Chat CMX", e);
            // No lanzamos la excepción para que la aplicación pueda iniciar
            // Los datos se pueden crear manualmente si es necesario
        }
    }

    /**
     * Asegura que el permiso CAN_USE_AI_CHAT existe.
     * Si no existe, lo crea.
     */
    private Permission ensurePermissionExists() {
        log.info("Verificando permiso CAN_USE_AI_CHAT...");
        
        Optional<Permission> existing = permissionRepository.findByCode("CAN_USE_AI_CHAT");
        if (existing.isPresent()) {
            log.info("  ✓ Permiso CAN_USE_AI_CHAT ya existe");
            return existing.get();
        }

        log.info("  → Creando permiso CAN_USE_AI_CHAT...");
        Permission permission = Permission.builder()
                .code("CAN_USE_AI_CHAT")
                .name("Usar Chat IA")
                .description("Permite usar el chat con IA (Chat CMX)")
                .module("AI")
                .createdAt(Instant.now())
                .build();

        permission = permissionRepository.save(permission);
        log.info("  ✓ Permiso CAN_USE_AI_CHAT creado");
        return permission;
    }

    /**
     * Asigna el permiso a los roles necesarios: ROLE_ADMIN, ROLE_MANAGER, ROLE_USER
     */
    private void assignPermissionToRoles(Permission permission) {
        log.info("Asignando permiso a roles...");
        
        Set<String> rolesToAssign = Set.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER");
        
        for (String roleName : rolesToAssign) {
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isEmpty()) {
                log.warn("  ⚠ Rol {} no encontrado, omitiendo asignación", roleName);
                continue;
            }

            Role role = roleOpt.get();
            if (role.hasPermission(permission.getCode())) {
                log.info("  ✓ Rol {} ya tiene el permiso", roleName);
                continue;
            }

            log.info("  → Asignando permiso a rol {}...", roleName);
            if (role.getPermissions() == null) {
                role.setPermissions(new HashSet<>());
            }
            role.getPermissions().add(permission);
            roleRepository.save(role);
            log.info("  ✓ Permiso asignado a rol {}", roleName);
        }
    }

    /**
     * Asegura que la sección SECTION_AI existe en el menú.
     * Si no existe, la crea.
     */
    private MenuItem ensureAISectionExists() {
        log.info("Verificando sección SECTION_AI...");
        
        Optional<MenuItem> existing = menuItemRepository.findByCode("SECTION_AI");
        if (existing.isPresent()) {
            log.info("  ✓ Sección SECTION_AI ya existe");
            return existing.get();
        }

        log.info("  → Creando sección SECTION_AI...");
        MenuItem section = new MenuItem();
        section.setCode("SECTION_AI");
        section.setLabelKey("menu.section.ai");
        section.setIcon(null);
        section.setPath(null);
        section.setParent(null);
        section.setDisplayOrder(80);
        section.setIsSection(true);
        section.setIsActive(true);
        section.setCreatedBy("SYSTEM");
        section.setCreatedAt(Instant.now());

        section = menuItemRepository.save(section);
        log.info("  ✓ Sección SECTION_AI creada");
        return section;
    }

    /**
     * Asegura que el item de menú AI_CHAT_CMX existe.
     * Si no existe, lo crea. Si existe, lo actualiza para asegurar que esté correctamente configurado.
     */
    private MenuItem ensureChatMenuItemExists(MenuItem aiSection) {
        log.info("Verificando item de menú AI_CHAT_CMX...");
        
        Optional<MenuItem> existing = menuItemRepository.findByCode("AI_CHAT_CMX");
        if (existing.isPresent()) {
            MenuItem item = existing.get();
            // Actualizar para asegurar que esté correctamente configurado
            boolean needsUpdate = false;
            
            if (!aiSection.getId().equals(item.getParent() != null ? item.getParent().getId() : null)) {
                item.setParent(aiSection);
                needsUpdate = true;
            }
            if (!"menu.ai.chat".equals(item.getLabelKey())) {
                item.setLabelKey("menu.ai.chat");
                needsUpdate = true;
            }
            if (!"FiMessageSquare".equals(item.getIcon())) {
                item.setIcon("FiMessageSquare");
                needsUpdate = true;
            }
            if (!"/ai-analysis/chat".equals(item.getPath())) {
                item.setPath("/ai-analysis/chat");
                needsUpdate = true;
            }
            if (item.getDisplayOrder() == null || !item.getDisplayOrder().equals(10)) {
                item.setDisplayOrder(10);
                needsUpdate = true;
            }
            if (item.getIsActive() == null || !item.getIsActive()) {
                item.setIsActive(true);
                needsUpdate = true;
            }

            if (needsUpdate) {
                log.info("  → Actualizando item de menú AI_CHAT_CMX...");
                item.setUpdatedAt(Instant.now());
                item.setUpdatedBy("SYSTEM");
                item = menuItemRepository.save(item);
                log.info("  ✓ Item de menú AI_CHAT_CMX actualizado");
            } else {
                log.info("  ✓ Item de menú AI_CHAT_CMX ya existe y está correctamente configurado");
            }
            return item;
        }

        log.info("  → Creando item de menú AI_CHAT_CMX...");
        MenuItem menuItem = new MenuItem();
        menuItem.setCode("AI_CHAT_CMX");
        menuItem.setLabelKey("menu.ai.chat");
        menuItem.setIcon("FiMessageSquare");
        menuItem.setPath("/ai-analysis/chat");
        menuItem.setParent(aiSection);
        menuItem.setDisplayOrder(10);
        menuItem.setIsSection(false);
        menuItem.setIsActive(true);
        menuItem.setCreatedBy("SYSTEM");
        menuItem.setCreatedAt(Instant.now());

        menuItem = menuItemRepository.save(menuItem);
        log.info("  ✓ Item de menú AI_CHAT_CMX creado");
        return menuItem;
    }

    /**
     * Asocia el permiso CAN_USE_AI_CHAT al item de menú.
     */
    private void associatePermissionToMenuItem(MenuItem menuItem, Permission permission) {
        log.info("Asociando permiso al item de menú...");
        
        if (menuItem.getRequiredPermissions() == null) {
            menuItem.setRequiredPermissions(new HashSet<>());
        }

        boolean alreadyAssociated = menuItem.getRequiredPermissions().stream()
                .anyMatch(p -> p.getCode().equals(permission.getCode()));

        if (alreadyAssociated) {
            log.info("  ✓ Permiso ya está asociado al item de menú");
            return;
        }

        log.info("  → Asociando permiso CAN_USE_AI_CHAT al item de menú...");
        menuItem.getRequiredPermissions().add(permission);
        menuItem.setUpdatedAt(Instant.now());
        menuItem.setUpdatedBy("SYSTEM");
        menuItemRepository.save(menuItem);
        log.info("  ✓ Permiso asociado al item de menú");
    }
}





