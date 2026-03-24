package com.globalcmx.api.document.storage;

import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.nio.file.*;
import java.time.Duration;

/**
 * Local filesystem storage implementation.
 * Used for development and testing, or for on-premise deployments.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "documents.storage.provider", havingValue = "LOCAL", matchIfMissing = true)
public class LocalStorageService implements CloudStorageService {

    private final StorageProperties storageProperties;

    private String basePath;

    @PostConstruct
    public void init() {
        this.basePath = storageProperties.getLocal().getPath();
        // Resolve ${user.home} if present
        if (basePath.contains("${user.home}")) {
            basePath = basePath.replace("${user.home}", System.getProperty("user.home"));
        }
        try {
            Path path = Paths.get(basePath);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                log.info("Created document storage directory: {}", basePath);
            }
            log.info("LocalStorageService initialized with path: {}", basePath);
        } catch (IOException e) {
            log.error("Failed to create document storage directory: {}", basePath, e);
        }
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.LOCAL;
    }

    @Override
    public String upload(InputStream inputStream, String path, String contentType, long fileSize) {
        try {
            Path fullPath = Paths.get(basePath, path);

            // Create parent directories if they don't exist
            Path parentDir = fullPath.getParent();
            if (parentDir != null && !Files.exists(parentDir)) {
                Files.createDirectories(parentDir);
            }

            // Copy the input stream to the file
            Files.copy(inputStream, fullPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Uploaded file to local storage: {}", fullPath);
            return fullPath.toString();
        } catch (IOException e) {
            log.error("Failed to upload file to local storage: {}", path, e);
            throw new RuntimeException("Failed to upload file to local storage", e);
        }
    }

    @Override
    public InputStream download(String path) {
        try {
            Path fullPath = resolvePath(path);
            if (!Files.exists(fullPath)) {
                throw new FileNotFoundException("File not found: " + path);
            }
            return new BufferedInputStream(Files.newInputStream(fullPath));
        } catch (IOException e) {
            log.error("Failed to download file from local storage: {}", path, e);
            throw new RuntimeException("Failed to download file from local storage", e);
        }
    }

    @Override
    public boolean delete(String path) {
        try {
            Path fullPath = resolvePath(path);
            boolean deleted = Files.deleteIfExists(fullPath);
            if (deleted) {
                log.info("Deleted file from local storage: {}", fullPath);
            }
            return deleted;
        } catch (IOException e) {
            log.error("Failed to delete file from local storage: {}", path, e);
            return false;
        }
    }

    @Override
    public boolean exists(String path) {
        Path fullPath = resolvePath(path);
        return Files.exists(fullPath);
    }

    @Override
    public String getPresignedUrl(String path, Duration expiration) {
        // Local storage doesn't support pre-signed URLs
        // Return null to indicate the file should be served through the API
        return null;
    }

    @Override
    public long getFileSize(String path) {
        try {
            Path fullPath = resolvePath(path);
            if (Files.exists(fullPath)) {
                return Files.size(fullPath);
            }
            return -1;
        } catch (IOException e) {
            log.error("Failed to get file size: {}", path, e);
            return -1;
        }
    }

    @Override
    public boolean copy(String sourcePath, String destinationPath) {
        try {
            Path source = resolvePath(sourcePath);
            Path destination = resolvePath(destinationPath);

            // Create parent directories if needed
            Path parentDir = destination.getParent();
            if (parentDir != null && !Files.exists(parentDir)) {
                Files.createDirectories(parentDir);
            }

            Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            log.info("Copied file from {} to {}", source, destination);
            return true;
        } catch (IOException e) {
            log.error("Failed to copy file from {} to {}", sourcePath, destinationPath, e);
            return false;
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            Path path = Paths.get(basePath);
            return Files.exists(path) && Files.isWritable(path);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Resolve a path, handling both relative and absolute paths.
     */
    private Path resolvePath(String path) {
        Path p = Paths.get(path);
        if (p.isAbsolute()) {
            return p;
        }
        return Paths.get(basePath, path);
    }
}
