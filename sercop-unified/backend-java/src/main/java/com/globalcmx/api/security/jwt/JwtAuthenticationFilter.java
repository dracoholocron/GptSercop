package com.globalcmx.api.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro JWT para interceptar requests y validar tokens.
 * Se ejecuta en cada request antes de llegar al controller.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extraer JWT token del header Authorization
            String jwt = parseJwt(request);

            if (jwt != null && tokenProvider.validateToken(jwt)) {
                // Obtener username del token
                String username = tokenProvider.getUsernameFromToken(jwt);

                // Cargar detalles del usuario
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Crear objeto Authentication
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Establecer autenticación en el contexto de seguridad
                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Marcar widget tokens para que ApiPermissionFilter aplique restricciones
                String scope = tokenProvider.getTokenScope(jwt);
                if ("widget".equals(scope)) {
                    request.setAttribute("WIDGET_SCOPE", Boolean.TRUE);
                    log.debug("Widget token detectado para usuario: {}", username);
                }

                log.debug("Usuario autenticado: {}", username);
            }

        } catch (Exception e) {
            log.error("No se pudo establecer autenticación de usuario: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extraer token JWT del header Authorization.
     * Formato esperado: "Bearer <token>"
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7); // Eliminar "Bearer " prefix
        }

        return null;
    }
}
