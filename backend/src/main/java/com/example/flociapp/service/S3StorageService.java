package com.example.flociapp.service;

import com.example.flociapp.entity.FileRecord;
import com.example.flociapp.repository.FileRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class S3StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;
    private final FileRecordRepository fileRecordRepository;

    @Value("${aws.s3.bucket:floci-uploads}")
    private String bucketName;

    public S3StorageService(S3Client s3Client, FileRecordRepository fileRecordRepository) {
        this.s3Client = s3Client;
        this.fileRecordRepository = fileRecordRepository;
    }

    @Transactional
    public FileRecord uploadFile(MultipartFile file, String username) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "file_" + System.currentTimeMillis();
        }

        // Clean file name to prevent directory traversal or malformed keys
        String cleanName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String s3Key = UUID.randomUUID().toString() + "_" + cleanName;
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        log.info("Uploading file '{}' (size: {} bytes, type: {}) to S3 bucket '{}' with key '{}'",
                originalFilename, file.getSize(), contentType, bucketName, s3Key);

        // Upload file binary to S3
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType)
                .contentLength(file.getSize())
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // Save file metadata to AWS RDS PostgreSQL
        FileRecord record = new FileRecord(originalFilename, s3Key, contentType, file.getSize(), username);
        FileRecord savedRecord = fileRecordRepository.save(record);

        log.info("File '{}' metadata successfully saved to database with ID: {}", originalFilename, savedRecord.getId());
        return savedRecord;
    }

    public ResponseInputStream<GetObjectResponse> getFileStream(String s3Key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();
        return s3Client.getObject(getRequest);
    }

    public ResponseBytes<GetObjectResponse> getFileBytes(String s3Key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();
        return s3Client.getObjectAsBytes(getRequest);
    }

    public FileRecord getFileRecord(Long id) {
        return fileRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("File with ID " + id + " not found"));
    }

    public List<FileRecord> listFiles(String username) {
        return fileRecordRepository.findByUploadedByOrderByUploadedAtDesc(username);
    }

    public List<FileRecord> listAllFiles() {
        return fileRecordRepository.findAllByOrderByUploadedAtDesc();
    }

    @Transactional
    public void deleteFile(Long id, String username) {
        FileRecord record = getFileRecord(id);

        // Security check: Only allow file owner to delete file
        if (!record.getUploadedBy().equalsIgnoreCase(username)) {
            throw new IllegalStateException("Unauthorized: You can only delete files uploaded by you");
        }

        log.info("Deleting file '{}' (ID: {}) from S3 bucket '{}'", record.getFileName(), id, bucketName);

        // Delete from S3
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(record.getS3Key())
                    .build());
        } catch (Exception e) {
            log.error("Failed to delete object from S3: {}", e.getMessage(), e);
        }

        // Delete metadata from AWS RDS PostgreSQL
        fileRecordRepository.delete(record);
        log.info("File record with ID: {} deleted from database", id);
    }
}
