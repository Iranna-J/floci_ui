package com.example.flociapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Component
public class BucketInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BucketInitializer.class);

    private final S3Client s3Client;

    @Value("${aws.s3.bucket:floci-uploads}")
    private String bucketName;

    public BucketInitializer(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("Checking if S3 bucket '{}' exists in Floci...", bucketName);
            try {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
                log.info("S3 bucket '{}' already exists.", bucketName);
            } catch (NoSuchBucketException e) {
                createBucket();
            } catch (S3Exception e) {
                if (e.statusCode() == 404) {
                    createBucket();
                } else {
                    log.error("S3 error when checking bucket '{}': {}", bucketName, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to initialize S3 bucket '{}': {}", bucketName, e.getMessage(), e);
        }
    }

    private void createBucket() {
        log.info("Creating S3 bucket '{}' in Floci...", bucketName);
        s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
        log.info("S3 bucket '{}' created successfully!", bucketName);
    }
}
