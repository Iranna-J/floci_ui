package com.example.flociapp.serverless;

public record ThumbnailRequest(
        String s3Key,
        String fileName,
        Integer targetWidth,
        Integer targetHeight
) {
    public int getEffectiveWidth() {
        return (targetWidth != null && targetWidth > 10 && targetWidth <= 800) ? targetWidth : 150;
    }

    public int getEffectiveHeight() {
        return (targetHeight != null && targetHeight > 10 && targetHeight <= 800) ? targetHeight : 150;
    }
}
