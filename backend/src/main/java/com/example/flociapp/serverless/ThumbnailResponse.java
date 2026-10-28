package com.example.flociapp.serverless;

public record ThumbnailResponse(
        String originalS3Key,
        String thumbnailS3Key,
        String originalDimensions,
        String thumbnailDimensions,
        long originalSizeBytes,
        long thumbnailSizeBytes,
        String executionMode, // "IN_APP_SPRING_BOOT" or "AWS_LAMBDA"
        long executionTimeMs,
        String message,
        boolean success
) {}
