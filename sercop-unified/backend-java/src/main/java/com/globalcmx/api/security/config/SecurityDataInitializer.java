package com.globalcmx.api.security.config;

import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Inicializador de datos de seguridad: Roles y Usuarios.
 * Se ejecuta al iniciar la aplicación en perfiles que no sean prod.
 */
@Component
@Profile("!prod")
@RequiredArgsConstructor
@Slf4j
@Order(1)  // Se ejecuta antes que CxTestDataInitializer
public class SecurityDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("=".repeat(80));
        log.info("Inicializando datos de seguridad (Roles y Usuarios)...");
        log.info("=".repeat(80));

        try {
            crearRoles();
            crearUsuarios();

            log.info("=".repeat(80));
            log.info("Datos de seguridad inicializados correctamente");
            log.info("=".repeat(80));

        } catch (Exception e) {
            log.error("Error al inicializar datos de seguridad", e);
        }
    }

    private void crearRoles() {
        log.info("Creando roles...");

        // Verificar si ya existen roles
        if (roleRepository.count() > 0) {
            log.info("Los roles ya existen. Omitiendo creación.");
            return;
        }

        Role roleUser = Role.builder()
                .name("ROLE_USER")
                .description("Usuario estándar del sistema")
                .build();

        Role roleAdmin = Role.builder()
                .name("ROLE_ADMIN")
                .description("Administrador del sistema con acceso completo")
                .build();

        Role roleManager = Role.builder()
                .name("ROLE_MANAGER")
                .description("Gerente con permisos de gestión")
                .build();

        roleRepository.save(roleUser);
        roleRepository.save(roleAdmin);
        roleRepository.save(roleManager);

        log.info("✓ Creados 3 roles: ROLE_USER, ROLE_ADMIN, ROLE_MANAGER");
    }

    private void crearUsuarios() {
        log.info("Creando usuarios de prueba...");

        // Verificar si ya existen usuarios
        if (userRepository.count() > 0) {
            log.info("Los usuarios ya existen. Omitiendo creación.");
            return;
        }

        Role roleUser = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("ROLE_USER no encontrado"));
        Role roleAdmin = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("ROLE_ADMIN no encontrado"));

        // Usuario administrador
        User admin = User.builder()
                .username("admin")
                .email("admin@globalcmx.com")
                .password(passwordEncoder.encode("admin123"))
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();

        admin.addRole(roleAdmin);
        admin.addRole(roleUser);
        userRepository.save(admin);

        // Usuario estándar
        User user = User.builder()
                .username("user")
                .email("user@globalcmx.com")
                .password(passwordEncoder.encode("user123"))
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();

        user.addRole(roleUser);
        userRepository.save(user);

        log.info("✓ Creados 2 usuarios:");
        log.info("  - admin / admin123 (ROLE_ADMIN, ROLE_USER)");
        log.info("  - user / user123 (ROLE_USER)");
    }
}
