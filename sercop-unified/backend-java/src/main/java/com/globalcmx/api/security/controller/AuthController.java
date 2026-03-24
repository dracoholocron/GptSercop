package com.globalcmx.api.security.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.metrics.BusinessMetrics;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import com.globalcmx.api.security.audit.SecurityAuditService;
import com.globalcmx.api.security.dto.AuthResponse;
import com.globalcmx.api.security.dto.LoginRequest;
import com.globalcmx.api.security.dto.RegisterRequest;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.jwt.JwtTokenProvider;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.schedule.dto.ScheduleAccessResult;
import com.globalcmx.api.security.schedule.dto.ScheduleStatusDTO;
import com.globalcmx.api.security.schedule.entity.AccessResult;
import com.globalcmx.api.security.schedule.service.SystemScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controlador de autenticación.
 * Endpoints: /api/auth/login, /api/auth/register
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final BusinessMetrics businessMetrics;
    private final SecurityAuditService securityAuditService;
    private final SystemScheduleService scheduleService;
    private final ParticipanteReadModelRepository participantRepository;

    /**
     * Login - Autenticar usuario y generar token JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest loginRequest,
            @RequestHeader(value = "X-User-Timezone", required = false) String headerTimezone,
            @RequestParam(value = "timezone", required = false) String queryTimezone) {
        // Preferir query parameter sobre header para evitar problemas de CORS
        String userTimezone = queryTimezone != null ? queryTimezone : headerTimezone;
        try {
            // Autenticar usuario con username y password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Obtener detalles del usuario
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Validar acceso por horario
            ScheduleAccessResult scheduleResult = scheduleService.evaluateAccess(user, userTimezone);
            if (scheduleResult.getResult() == AccessResult.DENIED) {
                log.warn("Login denied for user {} due to schedule restrictions: {}",
                        user.getUsername(), scheduleResult.getReason());

                // Registrar evento de auditoría - Login denegado por horario
                securityAuditService.logLoginFailure(user.getUsername(),
                        "Schedule access denied: " + scheduleResult.getReason());

                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.builder()
                                .success(false)
                                .message("Acceso denegado por restricción de horario")
                                .data(java.util.Map.of(
                                        "error", "SCHEDULE_ACCESS_DENIED",
                                        "reason", scheduleResult.getReason() != null ? scheduleResult.getReason() : "schedule.error.outside_operation_hours",
                                        "level", scheduleResult.getLevelApplied() != null ? scheduleResult.getLevelApplied().name() : "GLOBAL",
                                        "nextAccessTime", scheduleResult.getAllowedStart() != null ? scheduleResult.getAllowedStart().toString() : ""
                                ))
                                .build());
            }

            // Establecer autenticación en el contexto
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generar token JWT
            String jwt = jwtTokenProvider.generateToken(authentication);

            // Extraer roles
            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList());

            // Obtener estado del horario para incluir en respuesta
            ScheduleStatusDTO scheduleStatus = scheduleService.getScheduleStatus(user, userTimezone);

            // Construir respuesta
            AuthResponse authResponse = new AuthResponse(
                    jwt,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    roles
            );
            authResponse.setScheduleStatus(scheduleStatus);

            // Set client portal fields if CLIENT user
            authResponse.setUserType(user.getUserType());
            if ("CLIENT".equals(user.getUserType()) && user.getClienteId() != null) {
                authResponse.setParticipantId(user.getClienteId());
                // Fetch participant name
                try {
                    Long participantId = Long.parseLong(user.getClienteId());
                    participantRepository.findById(participantId)
                            .ifPresent(p -> authResponse.setParticipantName(
                                    p.getNombres() + (p.getApellidos() != null ? " " + p.getApellidos() : "")
                            ));
                } catch (NumberFormatException e) {
                    log.warn("Invalid participant ID format for user {}: {}", user.getUsername(), user.getClienteId());
                }
            }

            // Registrar métrica de login
            String primaryRole = roles.isEmpty() ? "NONE" : roles.get(0);
            businessMetrics.recordUserLogin(user.getUsername(), primaryRole);

            // Registrar evento de auditoría - Login exitoso
            securityAuditService.logLoginSuccess(user.getUsername(), "LOCAL");

            log.info("Login exitoso para usuario: {}", user.getUsername());

            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            log.error("Error en login: {}", e.getMessage());

            // Registrar evento de auditoría - Login fallido
            securityAuditService.logLoginFailure(loginRequest.getUsername(), e.getMessage());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Credenciales inválidas"));
        }
    }

    /**
     * Register - Registrar nuevo usuario.
     */
    @PostMapping("/register")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Validar que username no exista
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("El username ya está en uso"));
            }

            // Validar que email no exista
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("El email ya está en uso"));
            }

            // Crear nuevo usuario
            User user = User.builder()
                    .username(registerRequest.getUsername())
                    .email(registerRequest.getEmail())
                    .password(passwordEncoder.encode(registerRequest.getPassword()))
                    .enabled(true)
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .build();

            // Asignar rol ROLE_USER por defecto
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Rol ROLE_USER no encontrado"));

            user.addRole(userRole);

            // Guardar usuario
            userRepository.save(user);

            log.info("Usuario registrado exitosamente: {}", user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Usuario registrado exitosamente", null));

        } catch (Exception e) {
            log.error("Error en registro: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al registrar usuario: " + e.getMessage()));
        }
    }

    /**
     * Refresh - Renovar token JWT (incluso si está expirado recientemente).
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtTokenProvider.getUsernameFromExpiredToken(token);

            User user = userRepository.findByUsername(username)
                .orElse(null);
            if (user == null || !Boolean.TRUE.equals(user.getEnabled())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("User not found or disabled"));
            }

            String newToken = jwtTokenProvider.generateTokenFromUsername(username);
            return ResponseEntity.ok(Map.of("token", newToken));
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Unable to refresh token"));
        }
    }

    private static final long WIDGET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos

    /**
     * Mapa de widget name -> permiso requerido.
     * El usuario debe tener el permiso asignado a su rol para obtener un widget token.
     */
    private static final Map<String, String> WIDGET_PERMISSION_MAP = Map.of(
            "business-dashboard", "CAN_EMBED_DASHBOARD",
            "commissions-dashboard", "CAN_EMBED_COMMISSIONS",
            "alerts", "CAN_EMBED_ALERTS"
    );

    /**
     * Generar token JWT de corta vida para widgets embebidos.
     * Requiere JWT valido en header Authorization Y permisos CAN_EMBED_* en el rol del usuario.
     * Registrado en auditoria via SecurityAuditService.
     */
    @PostMapping("/widget-token")
    public ResponseEntity<?> generateWidgetToken(@RequestBody Map<String, Object> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("No autenticado"));
        }

        String username = authentication.getName();

        @SuppressWarnings("unchecked")
        List<String> requestedWidgets = (List<String>) request.getOrDefault("widgets", List.of());

        if (requestedWidgets.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Debe especificar al menos un widget"));
        }

        // Obtener permisos del usuario autenticado
        java.util.Set<String> userPermissions = authentication.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.toSet());

        // Validar que cada widget solicitado tiene permiso asignado al usuario
        for (String widget : requestedWidgets) {
            String requiredPermission = WIDGET_PERMISSION_MAP.get(widget);
            if (requiredPermission == null) {
                log.warn("Widget token denegado para {}: widget '{}' no existe", username, widget);
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Widget no reconocido: " + widget));
            }
            if (!userPermissions.contains(requiredPermission)) {
                log.warn("Widget token denegado para {}: sin permiso {} para widget '{}'",
                        username, requiredPermission, widget);
                securityAuditService.logLoginFailure(username,
                        "Widget token denied: missing permission " + requiredPermission);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(
                                "Sin permiso para embeber widget: " + widget +
                                ". Requiere permiso: " + requiredPermission));
            }
        }

        String widgetToken = jwtTokenProvider.generateWidgetToken(username, requestedWidgets, WIDGET_TOKEN_TTL_MS);

        log.info("Widget token generado para usuario: {}, widgets: {}", username, requestedWidgets);
        securityAuditService.logLoginSuccess(username, "WIDGET_TOKEN:" + String.join(",", requestedWidgets));

        return ResponseEntity.ok(Map.of(
                "token", widgetToken,
                "expiresIn", WIDGET_TOKEN_TTL_MS / 1000
        ));
    }

    /**
     * Obtener usuario autenticado actual.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList());

            AuthResponse response = AuthResponse.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .roles(roles)
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error obteniendo usuario actual: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("No autenticado"));
        }
    }

}
