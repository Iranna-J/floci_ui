package com.example.flociapp.repository;

import com.example.flociapp.entity.FileRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRecordRepository extends JpaRepository<FileRecord, Long> {
    List<FileRecord> findByUploadedByOrderByUploadedAtDesc(String uploadedBy);
    List<FileRecord> findAllByOrderByUploadedAtDesc();
    Optional<FileRecord> findByS3Key(String s3Key);
}
