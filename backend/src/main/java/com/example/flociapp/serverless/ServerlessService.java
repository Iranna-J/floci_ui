package com.example.flociapp.serverless;

import com.example.flociapp.config.LambdaInitializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.HashMap;
import java.util.Map;

@Service
public class ServerlessService {

    private static final Logger log = LoggerFactory.getLogger(ServerlessService.class);

    private final S3Client s3Client;
    private final LambdaClient lambdaClient;
    private final ImageThumbnailFunction thumbnailFunction;
    private final ObjectMapper objectMapper;

    @Value("${aws.s3.bucket:floci-uploads}")
    private String bucketName;

    public ServerlessService(S3Client s3Client,
                             LambdaClient lambdaClient,
                             ImageThumbnailFunction thumbnailFunction,
                             ObjectMapper objectMapper) {
        this.s3Client = s3Client;
        this.lambdaClient = lambdaClient;
        this.thumbnailFunction = thumbnailFunction;
        this.objectMapper = objectMapper;
    }

    /**
     * Step 1: Execute thumbnail logic directly inside the Spring Boot app (In-App).
     */
    public ThumbnailResponse executeInApp(ThumbnailRequest request) {
        long startTime = System.currentTimeMillis();
        String originalKey = request.s3Key();

        try {
            log.info("Fetching original image from S3: bucket='{}', key='{}'", bucketName, originalKey);
            ResponseBytes<GetObjectResponse> s3Bytes = s3Client.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucketName).key(originalKey).build()
            );

            byte[] originalData = s3Bytes.asByteArray();
            long originalSize = originalData.length;

            // Execute the isolated thumbnail transformation function
            ImageThumbnailFunction.ExecutionResult result = thumbnailFunction.apply(
                    originalData,
                    request.getEffectiveWidth(),
                    request.getEffectiveHeight()
            );

            if (!result.success()) {
                long elapsed = System.currentTimeMillis() - startTime;
                return new ThumbnailResponse(
                        originalKey,
                        null,
                        result.originalDimensions(),
                        "N/A",
                        originalSize,
                        0,
                        "IN_APP_SPRING_BOOT",
                        elapsed,
                        "Transformation failed: " + result.error(),
                        false
                );
            }

            // Save the resulting thumbnail in S3 under 'thumbnails/' folder
            String thumbKey = "thumbnails/thumb_" + originalKey;
            if (!thumbKey.endsWith(".png")) {
                thumbKey = thumbKey + ".png";
            }

            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(thumbKey)
                    .contentType("image/png")
                    .contentLength((long) result.thumbnailBytes().length)
                    .build(), RequestBody.fromBytes(result.thumbnailBytes()));

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("In-App Function executed in {}ms for '{}'", elapsed, originalKey);

            return new ThumbnailResponse(
                    originalKey,
                    thumbKey,
                    result.originalDimensions(),
                    result.thumbnailDimensions(),
                    originalSize,
                    result.thumbnailBytes().length,
                    "IN_APP_SPRING_BOOT",
                    elapsed,
                    "Thumbnail generated successfully via Spring Boot In-App function",
                    true
            );

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.error("Failed in-app execution for key '{}': {}", originalKey, e.getMessage(), e);
            return new ThumbnailResponse(
                    originalKey,
                    null,
                    "N/A",
                    "N/A",
                    0,
                    0,
                    "IN_APP_SPRING_BOOT",
                    elapsed,
                    "Error: " + e.getMessage(),
                    false
            );
        }
    }

    /**
     * Step 2: Execute thumbnail logic inside Java 21 AWS Lambda Container via Floci!
     * 
     * Reuses the EXACT ImageThumbnailFunction logic compiled into the Java Lambda!
     */
    public ThumbnailResponse executeViaLambda(ThumbnailRequest request) {
        long startTime = System.currentTimeMillis();
        String originalKey = request.s3Key();

        try {
            log.info("Fetching original image from S3 for Java Lambda execution: key='{}'", originalKey);
            ResponseBytes<GetObjectResponse> s3Bytes = s3Client.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucketName).key(originalKey).build()
            );

            byte[] originalData = s3Bytes.asByteArray();
            String base64Image = java.util.Base64.getEncoder().encodeToString(originalData);

            log.info("Invoking Java 21 AWS Lambda function '{}' in Floci...", LambdaInitializer.FUNCTION_NAME);

            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("s3Key", originalKey);
            payloadMap.put("targetWidth", request.getEffectiveWidth());
            payloadMap.put("targetHeight", request.getEffectiveHeight());
            payloadMap.put("imageBase64", base64Image);

            String jsonPayload = objectMapper.writeValueAsString(payloadMap);

            InvokeResponse invokeResponse = lambdaClient.invoke(InvokeRequest.builder()
                    .functionName(LambdaInitializer.FUNCTION_NAME)
                    .payload(SdkBytes.fromUtf8String(jsonPayload))
                    .build());

            long totalElapsed = System.currentTimeMillis() - startTime;
            String responseStr = invokeResponse.payload().asUtf8String();
            log.info("Java 21 AWS Lambda returned status {}: {}", invokeResponse.statusCode(), responseStr);

            JsonNode node = objectMapper.readTree(responseStr);
            boolean success = node.path("success").asBoolean(false);
            String message = node.path("message").asText("Processed by Java 21 AWS Lambda");
            String origDims = node.path("originalDimensions").asText("N/A");
            String thumbDims = node.path("thumbnailDimensions").asText("N/A");
            long origSize = node.path("originalSizeBytes").asLong(originalData.length);
            long thumbSize = node.path("thumbnailSizeBytes").asLong(0);
            String thumbBase64 = node.path("thumbnailBase64").asText(null);

            String thumbKey = null;
            if (success && thumbBase64 != null) {
                byte[] thumbBytes = java.util.Base64.getDecoder().decode(thumbBase64);
                thumbKey = "thumbnails/thumb_" + originalKey;
                if (!thumbKey.endsWith(".png")) {
                    thumbKey += ".png";
                }

                s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(thumbKey)
                        .contentType("image/png")
                        .contentLength((long) thumbBytes.length)
                        .build(), RequestBody.fromBytes(thumbBytes));
            }

            return new ThumbnailResponse(
                    originalKey,
                    thumbKey,
                    origDims,
                    thumbDims,
                    origSize,
                    thumbSize,
                    "AWS_LAMBDA_JAVA_21",
                    totalElapsed,
                    message,
                    success
            );

        } catch (Exception e) {
            long totalElapsed = System.currentTimeMillis() - startTime;
            log.error("Failed Java Lambda execution for key '{}': {}", originalKey, e.getMessage(), e);
            return new ThumbnailResponse(
                    originalKey,
                    null,
                    "N/A",
                    "N/A",
                    0,
                    0,
                    "AWS_LAMBDA_JAVA_21",
                    totalElapsed,
                    "Java Lambda Execution Error: " + e.getMessage(),
                    false
            );
        }
    }

    public ResponseInputStream<GetObjectResponse> getThumbnailStream(String thumbnailKey) {
        return s3Client.getObject(GetObjectRequest.builder().bucket(bucketName).key(thumbnailKey).build());
    }
}
