package com.globalcmx.api.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

/**
 * Proveedor de tokens JWT para autenticación.
 * Genera, valida y parsea tokens JWT.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 horas por defecto
    private long jwtExpirationMs;

    private static final long MAX_EXPIRED_TOKEN_AGE_MS = 5 * 60 * 1000; // 5 minutes

    @PostConstruct
    public void validateConfiguration() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET environment variable is required but not set. "
                    + "Application cannot start without a valid JWT secret.");
        }
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes (256 bits) for HS256. "
                    + "Current key is " + keyBytes.length + " bytes.");
        }
    }

    /**
     * Generar clave secreta desde el secret string.
     * Usa HS256 que requiere al menos 256 bits (32 bytes).
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        // Si la clave es demasiado pequeña, usar HS256 en lugar de HS384
        // HS256 requiere al menos 256 bits (32 bytes)
        if (keyBytes.length < 32) {
            log.warn("JWT secret key is too small ({} bytes). Using HS256. For HS384, key must be at least 48 bytes.", keyBytes.length);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generar token JWT desde el objeto Authentication.
     */
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateTokenFromUsername(userDetails.getUsername());
    }

    /**
     * Generar token JWT desde username.
     */
    public String generateTokenFromUsername(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256) // Forzar HS256 para consistencia
                .compact();
    }

    /**
     * Generar token JWT de corta vida para widgets embebidos.
     * TTL de 15 minutos, con claim scope=widget y lista de widgets permitidos.
     */
    public String generateWidgetToken(String username, List<String> widgets, long ttlMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + ttlMs);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .claim("scope", "widget")
                .claim("widgets", widgets)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Obtener el scope de un token JWT (ej: "widget").
     * Retorna null si el token no tiene scope.
     */
    public String getTokenScope(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.get("scope", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Obtener username desde el token JWT.
     */
    public String getUsernameFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.getSubject();
        } catch (Exception e) {
            log.error("Error obteniendo username del token: {}", e.getMessage());
            throw new RuntimeException("Error parsing JWT token", e);
        }
    }

    /**
     * Obtener username desde un token JWT expirado.
     * Permite extraer el subject incluso si el token ya expiró.
     */
    public String getUsernameFromExpiredToken(String token) {
        try {
            return getUsernameFromToken(token);
        } catch (Exception e) {
            // Para tokens expirados, intentar capturar ExpiredJwtException
            try {
                Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            } catch (ExpiredJwtException ex) {
                // Only allow refresh of tokens expired within the last 5 minutes
                Date expiration = ex.getClaims().getExpiration();
                long elapsedSinceExpiry = System.currentTimeMillis() - expiration.getTime();
                if (elapsedSinceExpiry > MAX_EXPIRED_TOKEN_AGE_MS) {
                    log.warn("Token expired {} ms ago (max allowed: {} ms). Refresh denied for user: {}",
                            elapsedSinceExpiry, MAX_EXPIRED_TOKEN_AGE_MS, ex.getClaims().getSubject());
                    throw new RuntimeException("Token expired too long ago for refresh");
                }
                return ex.getClaims().getSubject();
            }
            throw e;
        }
    }

    /**
     * Validar token JWT.
     * Maneja tokens con diferentes algoritmos (HS256, HS384) de manera flexible.
     */
    public boolean validateToken(String authToken) {
        try {
            // Intentar validar con la clave estándar
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;

        } catch (io.jsonwebtoken.security.SecurityException e) {
            log.error("Error de seguridad validando token JWT: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Token JWT inválido: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string está vacío: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Error validando token JWT: {} - Tipo: {}", e.getMessage(), e.getClass().getSimpleName());
        }

        return false;
    }
}
