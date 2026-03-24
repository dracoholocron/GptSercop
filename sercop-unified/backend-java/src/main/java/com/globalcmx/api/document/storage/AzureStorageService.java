package com.globalcmx.api.document.storage;

import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobProperties;
import com.azure.storage.blob.models.BlobStorageException;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import com.azure.storage.common.StorageSharedKeyCredential;
import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.OffsetDateTime;

/**
 * Azure Blob Storage implementation.
 * Supports Managed Identity and connection string authentication.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "documents.storage.azure.enabled", havingValue = "true")
public class AzureStorageService implements CloudStorageService {

    private final StorageProperties storageProperties;
    private BlobServiceClient blobServiceClient;
    private BlobContainerClient containerClient;
    private String containerName;
    private String accountName;
    private boolean canGenerateSas;

    public AzureStorageService(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public void init() {
        StorageProperties.AzureProperties azureProps = storageProperties.getAzure();
        this.containerName = azureProps.getContainer();
        this.accountName = azureProps.getAccountName();
        this.canGenerateSas = false;

        if (azureProps.isUseManagedIdentity()) {
            // Use Azure Managed Identity (AKS/Azure VM)
            String endpoint = String.format("https://%s.blob.core.windows.net", accountName);
            this.blobServiceClient = new BlobServiceClientBuilder()
                    .endpoint(endpoint)
                    .credential(new DefaultAzureCredentialBuilder().build())
                    .buildClient();
            log.info("AzureStorageService initialized for container: {} using Managed Identity", containerName);
        } else if (azureProps.getConnectionString() != null && !azureProps.getConnectionString().isEmpty()) {
            // Use connection string
            this.blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(azureProps.getConnectionString())
                    .buildClient();
            this.canGenerateSas = true;
            log.info("AzureStorageService initialized for container: {} using connection string", containerName);
        } else if (azureProps.getAccountKey() != null && !azureProps.getAccountKey().isEmpty()) {
            // Use account key
            String endpoint = String.format("https://%s.blob.core.windows.net", accountName);
            StorageSharedKeyCredential credential = new StorageSharedKeyCredential(
                    accountName,
                    azureProps.getAccountKey()
            );
            this.blobServiceClient = new BlobServiceClientBuilder()
                    .endpoint(endpoint)
                    .credential(credential)
                    .buildClient();
            this.canGenerateSas = true;
            log.info("AzureStorageService initialized for container: {} using account key", containerName);
        } else {
            throw new IllegalStateException("No valid Azure credentials configured");
        }

        this.containerClient = blobServiceClient.getBlobContainerClient(containerName);

        // Create container if it doesn't exist
        if (!containerClient.exists()) {
            containerClient.create();
            log.info("Created Azure Blob container: {}", containerName);
        }
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.AZURE;
    }

    @Override
    public String upload(InputStream inputStream, String path, String contentType, long fileSize) {
        try {
            BlobClient blobClient = containerClient.getBlobClient(path);

            BlobHttpHeaders headers = new BlobHttpHeaders()
                    .setContentType(contentType);

            blobClient.upload(inputStream, fileSize, true);
            blobClient.setHttpHeaders(headers);

            String fullPath = String.format("azure://%s/%s/%s", accountName, containerName, path);
            log.info("Uploaded file to Azure Blob: {}", fullPath);
            return fullPath;
        } catch (BlobStorageException e) {
            log.error("Failed to upload file to Azure Blob: {}", path, e);
            throw new RuntimeException("Failed to upload file to Azure Blob", e);
        }
    }

    @Override
    public InputStream download(String path) {
        try {
            String blobName = extractBlobName(path);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (!blobClient.exists()) {
                throw new RuntimeException("File not found in Azure Blob: " + path);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            blobClient.downloadStream(outputStream);
            return new ByteArrayInputStream(outputStream.toByteArray());
        } catch (BlobStorageException e) {
            log.error("Failed to download file from Azure Blob: {}", path, e);
            throw new RuntimeException("Failed to download file from Azure Blob", e);
        }
    }

    @Override
    public boolean delete(String path) {
        try {
            String blobName = extractBlobName(path);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (blobClient.exists()) {
                blobClient.delete();
                log.info("Deleted file from Azure Blob: {}", path);
                return true;
            }
            return false;
        } catch (BlobStorageException e) {
            log.error("Failed to delete file from Azure Blob: {}", path, e);
            return false;
        }
    }

    @Override
    public boolean exists(String path) {
        try {
            String blobName = extractBlobName(path);
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            return blobClient.exists();
        } catch (BlobStorageException e) {
            log.error("Failed to check if file exists in Azure Blob: {}", path, e);
            return false;
        }
    }

    @Override
    public String getPresignedUrl(String path, Duration expiration) {
        if (!canGenerateSas) {
            log.warn("Cannot generate SAS token with Managed Identity. Use connection string or account key.");
            return null;
        }

        try {
            String blobName = extractBlobName(path);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            BlobSasPermission permissions = new BlobSasPermission().setReadPermission(true);
            OffsetDateTime expiryTime = OffsetDateTime.now().plus(expiration);

            BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(expiryTime, permissions);
            String sasToken = blobClient.generateSas(sasValues);

            return blobClient.getBlobUrl() + "?" + sasToken;
        } catch (Exception e) {
            log.error("Failed to generate SAS token for Azure Blob: {}", path, e);
            return null;
        }
    }

    @Override
    public long getFileSize(String path) {
        try {
            String blobName = extractBlobName(path);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (!blobClient.exists()) {
                return -1;
            }

            BlobProperties properties = blobClient.getProperties();
            return properties.getBlobSize();
        } catch (BlobStorageException e) {
            log.error("Failed to get file size from Azure Blob: {}", path, e);
            return -1;
        }
    }

    @Override
    public boolean copy(String sourcePath, String destinationPath) {
        try {
            String sourceBlobName = extractBlobName(sourcePath);
            String destBlobName = extractBlobName(destinationPath);

            BlobClient sourceClient = containerClient.getBlobClient(sourceBlobName);
            BlobClient destClient = containerClient.getBlobClient(destBlobName);

            destClient.copyFromUrl(sourceClient.getBlobUrl());
            log.info("Copied file in Azure Blob from {} to {}", sourceBlobName, destBlobName);
            return true;
        } catch (BlobStorageException e) {
            log.error("Failed to copy file in Azure Blob from {} to {}", sourcePath, destinationPath, e);
            return false;
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            return containerClient.exists();
        } catch (Exception e) {
            log.warn("Azure Blob storage is not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract the blob name from a path that may include the azure:// prefix.
     */
    private String extractBlobName(String path) {
        if (path.startsWith("azure://")) {
            // Format: azure://account/container/blob
            String withoutPrefix = path.substring(8);
            int firstSlash = withoutPrefix.indexOf('/');
            if (firstSlash > 0) {
                int secondSlash = withoutPrefix.indexOf('/', firstSlash + 1);
                if (secondSlash > 0) {
                    return withoutPrefix.substring(secondSlash + 1);
                }
            }
        }
        return path;
    }
}
