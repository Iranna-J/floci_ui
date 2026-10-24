package com.example.flociapp.controller;

import com.example.flociapp.entity.FileRecord;
import com.example.flociapp.service.S3StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    private final S3StorageService s3StorageService;

    public FileController(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User is not authenticated"));
        }

        try {
            String username = authentication.getName();
            FileRecord record = s3StorageService.uploadFile(file, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(record);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload file to S3: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error uploading file to S3: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during file upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "File upload failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<FileRecord>> listFiles(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        List<FileRecord> files = s3StorageService.listFiles(username);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        FileRecord record = s3StorageService.getFileRecord(id);
        ResponseInputStream<GetObjectResponse> stream = s3StorageService.getFileStream(record.getS3Key());
        InputStreamResource resource = new InputStreamResource(stream);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(record.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + record.getFileName() + "\"")
                .contentType(mediaType)
                .contentLength(record.getSize())
                .body(resource);
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<Resource> viewFile(@PathVariable Long id) {
        FileRecord record = s3StorageService.getFileRecord(id);
        ResponseInputStream<GetObjectResponse> stream = s3StorageService.getFileStream(record.getS3Key());
        InputStreamResource resource = new InputStreamResource(stream);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(record.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + record.getFileName() + "\"")
                .contentType(mediaType)
                .contentLength(record.getSize())
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User is not authenticated"));
        }

        try {
            s3StorageService.deleteFile(id, authentication.getName());
            return ResponseEntity.ok(Map.of("message", "File deleted successfully", "id", id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to delete file with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting file: " + e.getMessage()));
        }
    }
}
