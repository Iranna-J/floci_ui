package com.example.flociapp.serverless;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler for Image Thumbnail Resizing (Pure Java 21)
 *
 * Utilizes the EXACT SAME ImageThumbnailFunction class from Step 1!
 */
public class ThumbnailLambdaHandler {

    private final ImageThumbnailFunction thumbnailFunction = new ImageThumbnailFunction();

    public Map<String, Object> handleRequest(Map<String, Object> input) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();

        try {
            String s3Key = (String) input.get("s3Key");
            int targetWidth = input.containsKey("targetWidth") ? ((Number) input.get("targetWidth")).intValue() : 150;
            int targetHeight = input.containsKey("targetHeight") ? ((Number) input.get("targetHeight")).intValue() : 150;
            String base64Image = (String) input.get("imageBase64");

            if (base64Image == null || base64Image.isEmpty()) {
                response.put("success", false);
                response.put("message", "Missing imageBase64 in Lambda event payload");
                response.put("executionMode", "AWS_LAMBDA_JAVA_21");
                response.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return response;
            }

            byte[] originalBytes = Base64.getDecoder().decode(base64Image);
            long originalSize = originalBytes.length;

            // Execute the EXACT same Java logic written in Step 1!
            ImageThumbnailFunction.ExecutionResult result = thumbnailFunction.apply(originalBytes, targetWidth, targetHeight);

            long elapsed = System.currentTimeMillis() - startTime;

            if (!result.success()) {
                response.put("success", false);
                response.put("message", "Java Lambda transformation failed: " + result.error());
                response.put("executionMode", "AWS_LAMBDA_JAVA_21");
                response.put("executionTimeMs", elapsed);
                return response;
            }

            String thumbnailBase64 = Base64.getEncoder().encodeToString(result.thumbnailBytes());

            response.put("originalS3Key", s3Key);
            response.put("originalDimensions", result.originalDimensions());
            response.put("thumbnailDimensions", result.thumbnailDimensions());
            response.put("originalSizeBytes", originalSize);
            response.put("thumbnailSizeBytes", (long) result.thumbnailBytes().length);
            response.put("thumbnailBase64", thumbnailBase64);
            response.put("executionMode", "AWS_LAMBDA_JAVA_21");
            response.put("executionTimeMs", elapsed);
            response.put("message", "Thumbnail generated successfully via Java 21 AWS Lambda Container (reusing ImageThumbnailFunction.java)");
            response.put("success", true);
            return response;

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            response.put("success", false);
            response.put("message", "Java Lambda Exception: " + e.getMessage());
            response.put("executionMode", "AWS_LAMBDA_JAVA_21");
            response.put("executionTimeMs", elapsed);
            return response;
        }
    }
}
