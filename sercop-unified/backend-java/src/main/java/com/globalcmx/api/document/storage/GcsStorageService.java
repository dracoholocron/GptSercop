package com.globalcmx.api.document.storage;

import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.storage.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.channels.Channels;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Google Cloud Storage implementation.
 * Supports Workload Identity and service account credentials.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "documents.storage.gcs.enabled", havingValue = "true")
public class GcsStorageService implements CloudStorageService {

    private final StorageProperties storageProperties;
    private Storage storage;
    private String bucketName;
    private String projectId;
    private boolean canGenerateSignedUrls;

    public GcsStorageService(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public void init() throws IOException {
        StorageProperties.GcsProperties gcsProps = storageProperties.getGcs();
        this.bucketName = gcsProps.getBucket();
        this.projectId = gcsProps.getProjectId();
        this.canGenerateSignedUrls = false;

        if (gcsProps.isUseWorkloadIdentity()) {
            // Use GKE Workload Identity or default credentials
            this.storage = StorageOptions.newBuilder()
                    .setProjectId(projectId)
                    .build()
                    .getService();
            log.info("GcsStorageService initialized for bucket: {} using Workload Identity", bucketName);
        } else if (gcsProps.getCredentialsFile() != null && !gcsProps.getCredentialsFile().isEmpty()) {
            // Use service account credentials file
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                    new FileInputStream(gcsProps.getCredentialsFile())
            );
            this.storage = StorageOptions.newBuilder()
                    .setProjectId(projectId)
                    .setCredentials(credentials)
                    .build()
                    .getService();

            // Check if credentials support signing
            if (credentials instanceof ServiceAccountCredentials) {
                this.canGenerateSignedUrls = true;
            }
            log.info("GcsStorageService initialized for bucket: {} using credentials file", bucketName);
        } else {
            throw new IllegalStateException("No valid GCS credentials configured");
        }

        // Verify bucket exists
        Bucket bucket = storage.get(bucketName);
        if (bucket == null) {
            log.warn("GCS bucket {} does not exist or is not accessible", bucketName);
        }
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.GCS;
    }

    @Override
    public String upload(InputStream inputStream, String path, String contentType, long fileSize) {
        try {
            BlobId blobId = BlobId.of(bucketName, path);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType)
                    .build();

            byte[] content = inputStream.readAllBytes();
            storage.create(blobInfo, content);

            String fullPath = String.format("gs://%s/%s", bucketName, path);
            log.info("Uploaded file to GCS: {}", fullPath);
            return fullPath;
        } catch (StorageException | IOException e) {
            log.error("Failed to upload file to GCS: {}", path, e);
            throw new RuntimeException("Failed to upload file to GCS", e);
        }
    }

    @Override
    public InputStream download(String path) {
        try {
            String objectName = extractObjectName(path);
            BlobId blobId = BlobId.of(bucketName, objectName);
            Blob blob = storage.get(blobId);

            if (blob == null || !blob.exists()) {
                throw new RuntimeException("File not found in GCS: " + path);
            }

            return Channels.newInputStream(blob.reader());
        } catch (StorageException e) {
            log.error("Failed to download file from GCS: {}", path, e);
            throw new RuntimeException("Failed to download file from GCS", e);
        }
    }

    @Override
    public boolean delete(String path) {
        try {
            String objectName = extractObjectName(path);
            BlobId blobId = BlobId.of(bucketName, objectName);

            boolean deleted = storage.delete(blobId);
            if (deleted) {
                log.info("Deleted file from GCS: gs://{}/{}", bucketName, objectName);
            }
            return deleted;
        } catch (StorageException e) {
            log.error("Failed to delete file from GCS: {}", path, e);
            return false;
        }
    }

    @Override
    public boolean exists(String path) {
        try {
            String objectName = extractObjectName(path);
            BlobId blobId = BlobId.of(bucketName, objectName);
            Blob blob = storage.get(blobId);
            return blob != null && blob.exists();
        } catch (StorageException e) {
            log.error("Failed to check if file exists in GCS: {}", path, e);
            return false;
        }
    }

    @Override
    public String getPresignedUrl(String path, Duration expiration) {
        if (!canGenerateSignedUrls) {
            log.warn("Cannot generate signed URLs with Workload Identity. Use service account credentials file.");
            return null;
        }

        try {
            String objectName = extractObjectName(path);
            BlobId blobId = BlobId.of(bucketName, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).build();

            URL signedUrl = storage.signUrl(
                    blobInfo,
                    expiration.toMinutes(),
                    TimeUnit.MINUTES,
                    Storage.SignUrlOption.withV4Signature()
            );

            return signedUrl.toString();
        } catch (Exception e) {
            log.error("Failed to generate signed URL for GCS: {}", path, e);
            return null;
        }
    }

    @Override
    public long getFileSize(String path) {
        try {
            String objectName = extractObjectName(path);
            BlobId blobId = BlobId.of(bucketName, objectName);
            Blob blob = storage.get(blobId);

            if (blob == null || !blob.exists()) {
                return -1;
            }

            return blob.getSize();
        } catch (StorageException e) {
            log.error("Failed to get file size from GCS: {}", path, e);
            return -1;
        }
    }

    @Override
    public boolean copy(String sourcePath, String destinationPath) {
        try {
            String sourceObject = extractObjectName(sourcePath);
            String destObject = extractObjectName(destinationPath);

            BlobId sourceBlob = BlobId.of(bucketName, sourceObject);
            BlobId destBlob = BlobId.of(bucketName, destObject);

            Storage.CopyRequest copyRequest = Storage.CopyRequest.newBuilder()
                    .setSource(sourceBlob)
                    .setTarget(destBlob)
                    .build();

            storage.copy(copyRequest);
            log.info("Copied file in GCS from {} to {}", sourceObject, destObject);
            return true;
        } catch (StorageException e) {
            log.error("Failed to copy file in GCS from {} to {}", sourcePath, destinationPath, e);
            return false;
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            Bucket bucket = storage.get(bucketName);
            return bucket != null && bucket.exists();
        } catch (Exception e) {
            log.warn("GCS storage is not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract the object name from a path that may include the gs:// prefix.
     */
    private String extractObjectName(String path) {
        if (path.startsWith("gs://")) {
            // Format: gs://bucket/object
            String withoutPrefix = path.substring(5);
            int slashIndex = withoutPrefix.indexOf('/');
            if (slashIndex > 0) {
                return withoutPrefix.substring(slashIndex + 1);
            }
        }
        return path;
    }
}
