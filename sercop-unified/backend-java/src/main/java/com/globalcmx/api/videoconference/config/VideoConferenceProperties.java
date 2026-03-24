package com.globalcmx.api.videoconference.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for video conference integration.
 * Supports multiple providers: Google Meet, Microsoft Teams, and Jitsi.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "videoconference")
public class VideoConferenceProperties {

    /**
     * Enable/disable video conference feature globally
     */
    private boolean enabled = true;

    /**
     * Default video conference provider
     */
    private String defaultProvider = "googlemeet";

    /**
     * Google Meet configuration
     */
    private GoogleMeetConfig googlemeet = new GoogleMeetConfig();

    /**
     * Microsoft Teams configuration
     */
    private TeamsConfig teams = new TeamsConfig();

    /**
     * Jitsi configuration
     */
    private JitsiConfig jitsi = new JitsiConfig();

    @Data
    public static class GoogleMeetConfig {
        private boolean enabled = true;
        private String clientId;
        private String clientSecret;
        private String redirectUri;
        private String[] scopes = {
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
        };
    }

    @Data
    public static class TeamsConfig {
        private boolean enabled = false;
        private String tenantId;
        private String clientId;
        private String clientSecret;
        private String redirectUri;
        private String[] scopes = {
            "https://graph.microsoft.com/OnlineMeetings.ReadWrite",
            "https://graph.microsoft.com/Calendars.ReadWrite",
            "https://graph.microsoft.com/User.Read",
            "offline_access"
        };
    }

    @Data
    public static class JitsiConfig {
        private boolean enabled = false;
        private String serverUrl = "https://meet.jit.si";
        private String appId;
        private String appSecret;
    }
}
