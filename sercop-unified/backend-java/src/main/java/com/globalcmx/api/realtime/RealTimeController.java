package com.globalcmx.api.realtime;

import com.globalcmx.api.realtime.azure.AzureSignalRNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for real-time notification endpoints.
 *
 * Provides:
 * - Negotiation endpoint for SignalR clients
 * - Connection status endpoints
 */
@Slf4j
@RestController
@RequestMapping("/realtime")
@RequiredArgsConstructor
@Tag(name = "Real-Time Notifications", description = "Endpoints for real-time notification system")
public class RealTimeController {

    private final RealTimeNotificationService notificationService;
    private final RealTimeProperties properties;

    /**
     * Get real-time service status and configuration.
     */
    @GetMapping("/status")
    @Operation(summary = "Get real-time service status",
        description = "Returns the current status and configuration of the real-time notification service")
    public ResponseEntity<RealTimeStatusResponse> getStatus() {
        return ResponseEntity.ok(new RealTimeStatusResponse(
            notificationService.isEnabled(),
            notificationService.getProviderName(),
            notificationService.getConnectedUserCount()
        ));
    }

    /**
     * SignalR negotiation endpoint.
     * Returns connection info for Azure SignalR clients.
     */
    @PostMapping("/negotiate")
    @Operation(summary = "Negotiate SignalR connection",
        description = "Returns Azure SignalR connection information for the authenticated user")
    public ResponseEntity<SignalRConnectionInfo> negotiate(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("SignalR: Negotiate endpoint called");

        if (userDetails == null) {
            log.warn("SignalR: Negotiate called without authentication");
            return ResponseEntity.status(401).build();
        }

        // Check if SignalR is the active provider
        if (!"SignalR".equals(notificationService.getProviderName())) {
            log.warn("Negotiate called but SignalR is not the active provider (current: {})",
                notificationService.getProviderName());
            return ResponseEntity.status(503).build();
        }

        String userId = userDetails.getUsername();

        // Generate SignalR connection info
        RealTimeProperties.SignalRProperties signalr = properties.getSignalr();
        String connectionString = signalr.getConnectionString();

        if (connectionString == null || connectionString.isEmpty()) {
            log.error("SignalR connection string not configured");
            return ResponseEntity.status(503).build();
        }

        // Parse connection string
        Map<String, String> parsed = parseConnectionString(connectionString);
        String endpoint = parsed.get("Endpoint");
        String accessKey = parsed.get("AccessKey");

        if (endpoint == null || accessKey == null) {
            log.error("Invalid SignalR connection string format");
            return ResponseEntity.status(503).build();
        }

        // Build hub URL
        String hubName = signalr.getHubName();
        String hubUrl = String.format("%s/client/?hub=%s", endpoint, hubName);

        // Generate access token for the user
        String accessToken;
        try {
            accessToken = generateClientAccessToken(endpoint, hubName, userId, accessKey,
                signalr.getTokenExpirationMinutes());
        } catch (Exception e) {
            log.error("Failed to generate SignalR access token: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }

        // Register user connection
        if (notificationService instanceof AzureSignalRNotificationService signalRService) {
            signalRService.registerUserConnection(userId);
        }

        log.info("SignalR: Negotiation successful for user={}, hubUrl={}", userId, hubUrl);

        return ResponseEntity.ok(new SignalRConnectionInfo(hubUrl, accessToken));
    }

    /**
     * Check if specific users are connected (uses Azure SignalR API).
     */
    @PostMapping("/connected")
    @Operation(summary = "Check users connection status",
        description = "Returns which users from the provided list are currently connected (real-time check via Azure SignalR)")
    public ResponseEntity<ConnectedUsersResponse> checkConnectedUsers(
            @RequestBody CheckConnectedRequest request) {

        Map<String, Boolean> connectionStatus = new HashMap<>();
        List<String> connectedUsers = new ArrayList<>();

        for (String userId : request.userIds()) {
            boolean isConnected = notificationService.isUserConnected(userId);
            connectionStatus.put(userId, isConnected);
            if (isConnected) {
                connectedUsers.add(userId);
            }
        }

        return ResponseEntity.ok(new ConnectedUsersResponse(connectedUsers, connectedUsers.size(), connectionStatus));
    }

    /**
     * Check if a single user is connected.
     */
    @GetMapping("/connected/{userId}")
    @Operation(summary = "Check single user connection status",
        description = "Returns whether a specific user is currently connected (real-time check via Azure SignalR)")
    public ResponseEntity<UserConnectionStatus> checkUserConnected(@PathVariable String userId) {
        boolean isConnected = notificationService.isUserConnected(userId);
        return ResponseEntity.ok(new UserConnectionStatus(userId, isConnected));
    }

    private String generateClientAccessToken(String endpoint, String hubName, String userId,
                                              String accessKey, int expirationMinutes) throws Exception {
        long now = Instant.now().getEpochSecond();
        long expirationTime = now + (expirationMinutes * 60L);

        // For Serverless mode, audience must be the full client URL with hub
        String audience = String.format("%s/client/?hub=%s", endpoint, hubName);

        log.info("SignalR: Generating token for user={}, audience={}, hub={}", userId, audience, hubName);

        // Compute key ID exactly as Microsoft does: first 32 chars of Base64(SHA256(UTF8(accessKey)))
        String kid = computeKeyId(accessKey);
        log.info("SignalR: Using kid={}", kid);

        // JWT Header with kid
        String headerJson = String.format("{\"alg\":\"HS256\",\"typ\":\"JWT\",\"kid\":\"%s\"}", kid);
        String header = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));

        // JWT Payload with user claim for SignalR (including iat - issued at)
        String payloadJson = String.format(
            "{\"aud\":\"%s\",\"iat\":%d,\"exp\":%d,\"sub\":\"%s\",\"nameid\":\"%s\"}",
            audience, now, expirationTime, userId, userId
        );
        String payload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

        // Sign
        String signature = sign(header + "." + payload, accessKey);

        String token = header + "." + payload + "." + signature;
        log.debug("SignalR: Generated token (first 50 chars): {}", token.substring(0, Math.min(50, token.length())));

        return token;
    }

    private String sign(String data, String accessKey) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        // Azure SignalR uses the access key string as UTF-8 bytes (NOT Base64 decoded)
        byte[] keyBytes = accessKey.getBytes(StandardCharsets.UTF_8);
        mac.init(new SecretKeySpec(keyBytes, "HmacSHA256"));
        byte[] signatureBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
    }

    private String computeKeyId(String accessKey) throws Exception {
        // Compute kid exactly as Microsoft: first 32 chars of Base64(SHA256(UTF8(accessKey)))
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(accessKey.getBytes(StandardCharsets.UTF_8));
        String base64Hash = Base64.getEncoder().encodeToString(hash);
        return base64Hash.substring(0, Math.min(32, base64Hash.length()));
    }

    private Map<String, String> parseConnectionString(String connectionString) {
        Map<String, String> result = new HashMap<>();
        for (String part : connectionString.split(";")) {
            String[] keyValue = part.split("=", 2);
            if (keyValue.length == 2) {
                result.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return result;
    }

    // DTOs
    public record RealTimeStatusResponse(boolean enabled, String provider, int connectedUsers) {}

    public record SignalRConnectionInfo(String url, String accessToken) {}

    public record CheckConnectedRequest(List<String> userIds) {}

    public record ConnectedUsersResponse(
        List<String> connectedUserIds,
        int count,
        Map<String, Boolean> connectionStatus
    ) {}

    public record UserConnectionStatus(String userId, boolean connected) {}
}
