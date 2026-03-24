package com.globalcmx.api.document.storage;

import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Factory for obtaining the appropriate CloudStorageService based on configuration.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CloudStorageFactory {

    private final List<CloudStorageService> storageServices;
    private final StorageProperties storageProperties;

    private Map<StorageProvider, CloudStorageService> serviceMap;

    /**
     * Get the default storage service based on configuration.
     */
    public CloudStorageService getDefaultStorage() {
        return getStorage(StorageProvider.valueOf(storageProperties.getProvider().toUpperCase()));
    }

    /**
     * Get a storage service by provider type.
     */
    public CloudStorageService getStorage(StorageProvider provider) {
        if (serviceMap == null) {
            initializeServiceMap();
        }

        CloudStorageService service = serviceMap.get(provider);
        if (service == null) {
            log.warn("No storage service found for provider: {}. Falling back to LOCAL.", provider);
            service = serviceMap.get(StorageProvider.LOCAL);
        }

        if (service == null) {
            throw new IllegalStateException("No storage service available. At least LOCAL storage must be configured.");
        }

        return service;
    }

    /**
     * Check if a storage provider is available.
     */
    public boolean isProviderAvailable(StorageProvider provider) {
        try {
            CloudStorageService service = getStorage(provider);
            return service != null && service.isAvailable();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get the default storage provider type.
     */
    public StorageProvider getDefaultProvider() {
        return StorageProvider.valueOf(storageProperties.getProvider().toUpperCase());
    }

    /**
     * Get all available storage providers.
     */
    public List<StorageProvider> getAvailableProviders() {
        if (serviceMap == null) {
            initializeServiceMap();
        }
        return serviceMap.entrySet().stream()
                .filter(entry -> entry.getValue().isAvailable())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private synchronized void initializeServiceMap() {
        if (serviceMap == null) {
            serviceMap = storageServices.stream()
                    .collect(Collectors.toMap(
                            CloudStorageService::getProvider,
                            Function.identity(),
                            (existing, replacement) -> {
                                log.warn("Duplicate storage service for provider: {}. Using first found.",
                                        existing.getProvider());
                                return existing;
                            }
                    ));
            log.info("Initialized storage services: {}", serviceMap.keySet());
        }
    }
}
