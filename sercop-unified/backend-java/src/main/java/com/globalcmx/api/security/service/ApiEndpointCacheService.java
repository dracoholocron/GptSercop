package com.globalcmx.api.security.service;

import com.globalcmx.api.security.entity.ApiEndpoint;
import com.globalcmx.api.security.repository.ApiEndpointRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.AntPathMatcher;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service that caches API endpoint configurations for fast permission checking.
 * The cache is refreshed periodically and on demand when endpoints are modified.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApiEndpointCacheService {

    private final ApiEndpointRepository apiEndpointRepository;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // Cache of all active endpoints with their permissions
    private volatile List<ApiEndpoint> cachedEndpoints = new CopyOnWriteArrayList<>();
    
    // Cache for URL pattern matches (method:url -> endpoint)
    private final Map<String, Optional<ApiEndpoint>> matchCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        refreshCache();
    }

    /**
     * Refresh the cache from database.
     * Called on startup and periodically.
     */
    @Scheduled(fixedRateString = "${security.api-cache.refresh-rate-ms:300000}") // Default: 5 minutes
    public void refreshCache() {
        try {
            log.debug("Refreshing API endpoint cache...");
            List<ApiEndpoint> endpoints = apiEndpointRepository.findAllWithPermissions();
            cachedEndpoints = new CopyOnWriteArrayList<>(endpoints);
            matchCache.clear(); // Clear match cache when data changes
            log.info("API endpoint cache refreshed with {} endpoints", endpoints.size());
        } catch (Exception e) {
            log.error("Error refreshing API endpoint cache: {}", e.getMessage());
        }
    }

    /**
     * Invalidate the cache.
     * Should be called when API endpoints are created, updated, or deleted.
     */
    public void invalidateCache() {
        matchCache.clear();
        refreshCache();
    }

    /**
     * Find a matching endpoint for the given HTTP method and URL.
     * Uses caching to improve performance.
     */
    public Optional<ApiEndpoint> findMatchingEndpoint(String httpMethod, String requestUri) {
        String cacheKey = httpMethod.toUpperCase() + ":" + requestUri;

        // Check match cache first
        if (matchCache.containsKey(cacheKey)) {
            return matchCache.get(cacheKey);
        }

        // Find matching endpoint
        Optional<ApiEndpoint> result = cachedEndpoints.stream()
                .filter(e -> e.getHttpMethod().equalsIgnoreCase(httpMethod))
                .filter(e -> matchesPattern(e.getUrlPattern(), requestUri))
                .findFirst();

        // Debug logging for AI Chat endpoints - Always log at INFO level
        if (requestUri != null && requestUri.contains("/ai/chat")) {
            log.warn("=== AI CHAT DEBUG: Finding endpoint for {} {} - Found: {} ===", httpMethod, requestUri, result.isPresent());
            if (result.isEmpty()) {
                List<String> matchingMethods = cachedEndpoints.stream()
                        .filter(e -> e.getHttpMethod().equalsIgnoreCase(httpMethod))
                        .map(ApiEndpoint::getUrlPattern)
                        .toList();
                log.warn("No matching endpoint found for {} {}. Cached endpoints with method {}: {}", 
                    httpMethod, requestUri, httpMethod, matchingMethods);
                
                // Try to find exact match
                Optional<ApiEndpoint> exactMatch = cachedEndpoints.stream()
                        .filter(e -> e.getHttpMethod().equalsIgnoreCase(httpMethod))
                        .filter(e -> e.getUrlPattern().equals(requestUri))
                        .findFirst();
                if (exactMatch.isPresent()) {
                    log.warn("Found exact match but pattern matching failed: pattern={}, url={}", 
                        exactMatch.get().getUrlPattern(), requestUri);
                }
            } else {
                log.info("Found matching endpoint: {} - Pattern: {}", result.get().getCode(), result.get().getUrlPattern());
            }
        }

        // Cache the result (even if empty, to avoid repeated searches)
        // Limit cache size to prevent memory issues
        if (matchCache.size() < 10000) {
            matchCache.put(cacheKey, result);
        }

        return result;
    }

    /**
     * Check if a URL matches a pattern using Ant-style matching.
     */
    private boolean matchesPattern(String pattern, String url) {
        if (pattern == null || url == null) {
            return false;
        }
        boolean matches = pathMatcher.match(pattern, url);
        // Debug logging for AI Chat endpoints
        if (url != null && url.contains("/ai/chat")) {
            log.warn("Pattern matching: pattern='{}' url='{}' result={}", pattern, url, matches);
        }
        return matches;
    }

    /**
     * Get all cached endpoints.
     */
    public List<ApiEndpoint> getAllCachedEndpoints() {
        return cachedEndpoints;
    }
}
