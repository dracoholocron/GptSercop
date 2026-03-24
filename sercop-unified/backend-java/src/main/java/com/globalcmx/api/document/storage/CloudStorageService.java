package com.globalcmx.api.document.storage;

import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;

import java.io.InputStream;
import java.time.Duration;

/**
 * Interface for cloud storage operations.
 * Implementations provide storage for AWS S3, Azure Blob, GCP Cloud Storage, Local filesystem, or Custom API.
 */
public interface CloudStorageService {

    /**
     * Get the storage provider type this service handles.
     */
    StorageProvider getProvider();

    /**
     * Upload a file to storage.
     *
     * @param inputStream The file content
     * @param path The destination path (without provider prefix)
     * @param contentType The MIME type of the file
     * @param fileSize The size of the file in bytes
     * @return The full storage path where the file was saved
     */
    String upload(InputStream inputStream, String path, String contentType, long fileSize);

    /**
     * Download a file from storage.
     *
     * @param path The file path in storage
     * @return An InputStream to read the file content
     */
    InputStream download(String path);

    /**
     * Delete a file from storage.
     *
     * @param path The file path to delete
     * @return true if deletion was successful
     */
    boolean delete(String path);

    /**
     * Check if a file exists in storage.
     *
     * @param path The file path to check
     * @return true if the file exists
     */
    boolean exists(String path);

    /**
     * Get a pre-signed/temporary URL for direct access to the file.
     * Useful for downloads and previews without going through the backend.
     *
     * @param path The file path
     * @param expiration How long the URL should be valid
     * @return A pre-signed URL or null if not supported
     */
    String getPresignedUrl(String path, Duration expiration);

    /**
     * Get the file size in bytes.
     *
     * @param path The file path
     * @return The file size or -1 if not found
     */
    long getFileSize(String path);

    /**
     * Copy a file within the storage.
     *
     * @param sourcePath Source file path
     * @param destinationPath Destination file path
     * @return true if copy was successful
     */
    boolean copy(String sourcePath, String destinationPath);

    /**
     * Move a file within the storage.
     *
     * @param sourcePath Source file path
     * @param destinationPath Destination file path
     * @return true if move was successful
     */
    default boolean move(String sourcePath, String destinationPath) {
        if (copy(sourcePath, destinationPath)) {
            return delete(sourcePath);
        }
        return false;
    }

    /**
     * Check if this storage service is available and properly configured.
     *
     * @return true if the service is ready to use
     */
    boolean isAvailable();
}
