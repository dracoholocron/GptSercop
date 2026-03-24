package com.globalcmx.api.document.storage;

import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;

/**
 * AWS S3 storage implementation.
 * Supports IAM roles (instance credentials) and explicit credentials.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "documents.storage.s3.enabled", havingValue = "true")
public class S3StorageService implements CloudStorageService {

    private final StorageProperties storageProperties;
    private S3Client s3Client;
    private S3Presigner s3Presigner;
    private String bucket;

    public S3StorageService(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public void init() {
        StorageProperties.S3Properties s3Props = storageProperties.getS3();
        this.bucket = s3Props.getBucket();
        Region region = Region.of(s3Props.getRegion());

        // Check for custom endpoint (MinIO, LocalStack, etc.)
        URI endpointUri = null;
        if (s3Props.getEndpoint() != null && !s3Props.getEndpoint().isEmpty()) {
            endpointUri = URI.create(s3Props.getEndpoint());
            log.info("Using custom S3 endpoint: {}", s3Props.getEndpoint());
        }

        if (s3Props.isUseInstanceCredentials()) {
            // Use IAM role credentials (EC2/EKS)
            var clientBuilder = S3Client.builder()
                    .region(region)
                    .credentialsProvider(DefaultCredentialsProvider.create());
            var presignerBuilder = S3Presigner.builder()
                    .region(region)
                    .credentialsProvider(DefaultCredentialsProvider.create());

            if (endpointUri != null) {
                clientBuilder.endpointOverride(endpointUri).forcePathStyle(true);
                presignerBuilder.endpointOverride(endpointUri);
            }

            this.s3Client = clientBuilder.build();
            this.s3Presigner = presignerBuilder.build();
            log.info("S3StorageService initialized for bucket: {} using IAM role credentials", bucket);
        } else {
            // Use explicit credentials
            AwsBasicCredentials credentials = AwsBasicCredentials.create(
                    s3Props.getAccessKeyId(),
                    s3Props.getSecretAccessKey()
            );
            var clientBuilder = S3Client.builder()
                    .region(region)
                    .credentialsProvider(StaticCredentialsProvider.create(credentials));
            var presignerBuilder = S3Presigner.builder()
                    .region(region)
                    .credentialsProvider(StaticCredentialsProvider.create(credentials));

            if (endpointUri != null) {
                clientBuilder.endpointOverride(endpointUri).forcePathStyle(true);
                presignerBuilder.endpointOverride(endpointUri);
            }

            this.s3Client = clientBuilder.build();
            this.s3Presigner = presignerBuilder.build();
            log.info("S3StorageService initialized for bucket: {} using static credentials", bucket);
        }
    }

    @PreDestroy
    public void cleanup() {
        if (s3Client != null) {
            s3Client.close();
        }
        if (s3Presigner != null) {
            s3Presigner.close();
        }
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.S3;
    }

    @Override
    public String upload(InputStream inputStream, String path, String contentType, long fileSize) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(path)
                    .contentType(contentType)
                    .contentLength(fileSize)
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, fileSize));
            log.info("Uploaded file to S3: s3://{}/{}", bucket, path);
            return "s3://" + bucket + "/" + path;
        } catch (S3Exception e) {
            log.error("Failed to upload file to S3: {}", path, e);
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    @Override
    public InputStream download(String path) {
        try {
            String key = extractKey(path);
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            return s3Client.getObject(request);
        } catch (NoSuchKeyException e) {
            log.error("File not found in S3: {}", path);
            throw new RuntimeException("File not found in S3: " + path, e);
        } catch (S3Exception e) {
            log.error("Failed to download file from S3: {}", path, e);
            throw new RuntimeException("Failed to download file from S3", e);
        }
    }

    @Override
    public boolean delete(String path) {
        try {
            String key = extractKey(path);
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.info("Deleted file from S3: s3://{}/{}", bucket, key);
            return true;
        } catch (S3Exception e) {
            log.error("Failed to delete file from S3: {}", path, e);
            return false;
        }
    }

    @Override
    public boolean exists(String path) {
        try {
            String key = extractKey(path);
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            s3Client.headObject(request);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.error("Failed to check if file exists in S3: {}", path, e);
            return false;
        }
    }

    @Override
    public String getPresignedUrl(String path, Duration expiration) {
        try {
            String key = extractKey(path);
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (S3Exception e) {
            log.error("Failed to generate presigned URL for S3: {}", path, e);
            return null;
        }
    }

    @Override
    public long getFileSize(String path) {
        try {
            String key = extractKey(path);
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            HeadObjectResponse response = s3Client.headObject(request);
            return response.contentLength();
        } catch (NoSuchKeyException e) {
            return -1;
        } catch (S3Exception e) {
            log.error("Failed to get file size from S3: {}", path, e);
            return -1;
        }
    }

    @Override
    public boolean copy(String sourcePath, String destinationPath) {
        try {
            String sourceKey = extractKey(sourcePath);
            String destKey = extractKey(destinationPath);

            CopyObjectRequest request = CopyObjectRequest.builder()
                    .sourceBucket(bucket)
                    .sourceKey(sourceKey)
                    .destinationBucket(bucket)
                    .destinationKey(destKey)
                    .build();

            s3Client.copyObject(request);
            log.info("Copied file in S3 from {} to {}", sourceKey, destKey);
            return true;
        } catch (S3Exception e) {
            log.error("Failed to copy file in S3 from {} to {}", sourcePath, destinationPath, e);
            return false;
        }
    }

    @Override
    public boolean isAvailable() {
        try {
            HeadBucketRequest request = HeadBucketRequest.builder()
                    .bucket(bucket)
                    .build();
            s3Client.headBucket(request);
            return true;
        } catch (Exception e) {
            log.warn("S3 storage is not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract the S3 key from a path that may include the s3:// prefix.
     */
    private String extractKey(String path) {
        if (path.startsWith("s3://")) {
            // Format: s3://bucket/key
            String withoutPrefix = path.substring(5);
            int slashIndex = withoutPrefix.indexOf('/');
            if (slashIndex > 0) {
                return withoutPrefix.substring(slashIndex + 1);
            }
        }
        return path;
    }
}
