package com.globalcmx.api.document.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Centralized configuration properties for all storage providers.
 * Supports LOCAL, S3, AZURE, and GCS storage backends.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "documents.storage")
public class StorageProperties {

    /**
     * Active storage provider: LOCAL, S3, AZURE, GCS
     */
    private String provider = "LOCAL";

    /**
     * Local filesystem storage configuration
     */
    private LocalProperties local = new LocalProperties();

    /**
     * AWS S3 storage configuration
     */
    private S3Properties s3 = new S3Properties();

    /**
     * Azure Blob Storage configuration
     */
    private AzureProperties azure = new AzureProperties();

    /**
     * Google Cloud Storage configuration
     */
    private GcsProperties gcs = new GcsProperties();

    @Data
    public static class LocalProperties {
        /**
         * Base path for local file storage
         */
        private String path = "${user.home}/globalcmx/documents";
    }

    @Data
    public static class S3Properties {
        /**
         * Enable S3 storage service
         */
        private boolean enabled = false;

        /**
         * S3 bucket name
         */
        private String bucket;

        /**
         * AWS region
         */
        private String region = "us-east-1";

        /**
         * Custom endpoint URL for S3-compatible storage (MinIO, LocalStack, etc.)
         * Leave empty for standard AWS S3
         */
        private String endpoint;

        /**
         * Use EC2/EKS instance credentials (IAM role)
         */
        private boolean useInstanceCredentials = true;

        /**
         * AWS Access Key ID (only if not using instance credentials)
         */
        private String accessKeyId;

        /**
         * AWS Secret Access Key (only if not using instance credentials)
         */
        private String secretAccessKey;

        /**
         * Default presigned URL expiration in minutes
         */
        private int presignedUrlExpirationMinutes = 60;
    }

    @Data
    public static class AzureProperties {
        /**
         * Enable Azure Blob storage service
         */
        private boolean enabled = false;

        /**
         * Azure Storage Account name
         */
        private String accountName;

        /**
         * Azure Blob container name
         */
        private String container = "documents";

        /**
         * Use Azure Managed Identity for authentication
         */
        private boolean useManagedIdentity = true;

        /**
         * Connection string (only if not using managed identity)
         */
        private String connectionString;

        /**
         * Account key (only if not using managed identity or connection string)
         */
        private String accountKey;

        /**
         * Default SAS token expiration in minutes
         */
        private int sasExpirationMinutes = 60;
    }

    @Data
    public static class GcsProperties {
        /**
         * Enable Google Cloud Storage service
         */
        private boolean enabled = false;

        /**
         * GCS bucket name
         */
        private String bucket;

        /**
         * GCP Project ID
         */
        private String projectId;

        /**
         * Use GKE Workload Identity for authentication
         */
        private boolean useWorkloadIdentity = true;

        /**
         * Path to service account credentials JSON file
         */
        private String credentialsFile;

        /**
         * Default signed URL expiration in minutes
         */
        private int signedUrlExpirationMinutes = 60;
    }
}
