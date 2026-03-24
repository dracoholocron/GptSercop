package com.globalcmx.api.videoconference.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO containing the list of available video conference providers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProvidersListResponse {

    /**
     * Whether video conferencing is enabled globally
     */
    private boolean enabled;

    /**
     * Default provider code
     */
    private String defaultProvider;

    /**
     * List of available providers with their status
     */
    private List<ProviderStatus> providers;
}
