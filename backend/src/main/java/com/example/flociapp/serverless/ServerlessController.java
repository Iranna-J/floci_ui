package com.example.flociapp.serverless;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

@RestController
@RequestMapping("/api/serverless")
public class ServerlessController {

    private static final Logger log = LoggerFactory.getLogger(ServerlessController.class);

    private final ServerlessService serverlessService;

    public ServerlessController(ServerlessService serverlessService) {
        this.serverlessService = serverlessService;
    }

    /**
     * Step 1: Execute the thumbnail resizing function directly inside the Spring Boot app.
     */
    @PostMapping("/thumbnail/in-app")
    public ResponseEntity<ThumbnailResponse> runInApp(@RequestBody ThumbnailRequest request) {
        log.info("Executing In-App Thumbnail Function for s3Key='{}'", request.s3Key());
        ThumbnailResponse response = serverlessService.executeInApp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Step 2: Execute the thumbnail resizing function via AWS Lambda in Floci.
     */
    @PostMapping("/thumbnail/lambda")
    public ResponseEntity<ThumbnailResponse> runViaLambda(@RequestBody ThumbnailRequest request) {
        log.info("Executing AWS Lambda Thumbnail Function for s3Key='{}'", request.s3Key());
        ThumbnailResponse response = serverlessService.executeViaLambda(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Stream the generated thumbnail from S3 for browser display.
     */
    @GetMapping("/thumbnail-view")
    public ResponseEntity<Resource> viewThumbnail(@RequestParam("key") String key) {
        ResponseInputStream<GetObjectResponse> stream = serverlessService.getThumbnailStream(key);
        InputStreamResource resource = new InputStreamResource(stream);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"thumbnail.png\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
    }
}
