package com.example.flociapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.*;

import java.io.InputStream;

@Component
public class LambdaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LambdaInitializer.class);
    public static final String FUNCTION_NAME = "floci-thumbnail-function";

    private final LambdaClient lambdaClient;

    public LambdaInitializer(LambdaClient lambdaClient) {
        this.lambdaClient = lambdaClient;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("Checking if Java 21 AWS Lambda function '{}' exists in Floci...", FUNCTION_NAME);
            try {
                GetFunctionResponse getResp = lambdaClient.getFunction(GetFunctionRequest.builder()
                        .functionName(FUNCTION_NAME)
                        .build());

                // If existing function is python, replace with Java 21 implementation
                if (getResp.configuration().runtime() != software.amazon.awssdk.services.lambda.model.Runtime.JAVA21) {
                    log.info("Upgrading function '{}' from {} to Java 21...", FUNCTION_NAME, getResp.configuration().runtime());
                    lambdaClient.deleteFunction(DeleteFunctionRequest.builder().functionName(FUNCTION_NAME).build());
                    deployLambdaFunction();
                } else {
                    log.info("Java 21 Lambda function '{}' is active and ready (Memory: {}MB).",
                            FUNCTION_NAME,
                            getResp.configuration().memorySize());
                }
            } catch (ResourceNotFoundException e) {
                deployLambdaFunction();
            }
        } catch (Exception e) {
            log.warn("Could not check/initialize Lambda function '{}': {}", FUNCTION_NAME, e.getMessage());
        }
    }

    public void deployLambdaFunction() {
        try {
            log.info("Deploying Java 21 Lambda function '{}' to Floci...", FUNCTION_NAME);
            ClassPathResource resource = new ClassPathResource("lambda-java-thumbnail.jar");
            byte[] jarBytes;
            try (InputStream is = resource.getInputStream()) {
                jarBytes = is.readAllBytes();
            }

            CreateFunctionResponse response = lambdaClient.createFunction(CreateFunctionRequest.builder()
                    .functionName(FUNCTION_NAME)
                    .runtime(software.amazon.awssdk.services.lambda.model.Runtime.JAVA21)
                    .role("arn:aws:iam::000000000000:role/lambda-role")
                    .handler("com.example.flociapp.serverless.ThumbnailLambdaHandler::handleRequest")
                    .code(FunctionCode.builder().zipFile(SdkBytes.fromByteArray(jarBytes)).build())
                    .timeout(60)
                    .memorySize(512)
                    .description("Pure Java 21 AWS Lambda Thumbnail Resizer (Reusing ImageThumbnailFunction)")
                    .build());

            log.info("Java 21 Lambda function '{}' successfully deployed to Floci! ARN: {}", FUNCTION_NAME, response.functionArn());
        } catch (Exception e) {
            log.error("Failed to deploy Java Lambda function '{}': {}", FUNCTION_NAME, e.getMessage(), e);
        }
    }
}
