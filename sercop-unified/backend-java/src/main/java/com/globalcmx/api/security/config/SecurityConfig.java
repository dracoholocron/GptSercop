package com.globalcmx.api.security.config;

import com.globalcmx.api.security.filter.ApiPermissionFilter;
import com.globalcmx.api.security.filter.ClientPortalSecurityFilter;
import com.globalcmx.api.security.filter.ScheduleAccessFilter;
import com.globalcmx.api.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Configuración de Spring Security.
 * Incluye autenticación JWT y validación de permisos por API endpoint.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ClientPortalSecurityFilter clientPortalSecurityFilter;
    private final ApiPermissionFilter apiPermissionFilter;
    private final ScheduleAccessFilter scheduleAccessFilter;
    private final UserDetailsService userDetailsService;

    @Value("${security.public-endpoints:/auth/**,/actuator/health,/actuator/health/**}")
    private String publicEndpoints;

    @Value("${security.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${security.cors.allowed-origin-patterns:}")
    private String allowedOriginPatterns;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        // Patrones para redes LAN (192.168.*, 10.*, 172.16-31.*, 100.*)
        if (allowedOriginPatterns != null && !allowedOriginPatterns.isEmpty()) {
            configuration.setAllowedOriginPatterns(Arrays.asList(allowedOriginPatterns.split(",")));
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "Accept", "Origin",
            "X-Requested-With", "X-User-Timezone", "Cache-Control",
            "X-Client-Id", "X-User-Id", "X-User-Name"
        ));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Parsear los endpoints públicos desde la configuración
        String[] publicEndpointPatterns = publicEndpoints.split(",");

        http
                // Configurar CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Deshabilitar CSRF (usamos JWT stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // Configurar autorización de requests
                .authorizeHttpRequests(auth -> {
                    // Agregar todos los endpoints públicos configurados
                    for (String pattern : publicEndpointPatterns) {
                        auth.requestMatchers(pattern.trim()).permitAll();
                    }

                    // Todos los demás endpoints requieren autenticación
                    // Los permisos específicos se validan en ApiPermissionFilter
                    auth.anyRequest().authenticated();
                })

                // Stateless session (no guardar sesión en servidor)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Provider de autenticación
                .authenticationProvider(authenticationProvider())

                // Agregar filtro JWT antes del filtro de username/password
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Agregar filtro de seguridad del portal de clientes después del filtro JWT
                // Este filtro valida que usuarios CLIENT solo accedan a /client-portal/**
                // y que el X-Client-Id coincida con su clienteId
                .addFilterAfter(clientPortalSecurityFilter, JwtAuthenticationFilter.class)

                // Agregar filtro de permisos de API después del filtro de portal de clientes
                .addFilterAfter(apiPermissionFilter, ClientPortalSecurityFilter.class)

                // Agregar filtro de horarios después del filtro de permisos
                .addFilterAfter(scheduleAccessFilter, ApiPermissionFilter.class);

        return http.build();
    }
}
