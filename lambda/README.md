# AWS Lambda Function: `floci-thumbnail-function` (Pure Java 21)

This directory contains the Java source code for the **AWS Lambda function** deployed to Floci.

## 📂 Source Code Files
- [`ThumbnailLambdaHandler.java`](thumbnail-function/ThumbnailLambdaHandler.java): The AWS Lambda POJO handler (`handleRequest(Map<String, Object> input)`).
- [`ImageThumbnailFunction.java`](thumbnail-function/ImageThumbnailFunction.java): The **exact same** image transformation logic used in the Spring Boot backend (`Graphics2D` and `BufferedImage`).

## ⚡ Deployment & Runtime Details
- **Function Name**: `floci-thumbnail-function`
- **Runtime**: `Java 21` (`Runtime.JAVA21`)
- **Package**: `lambda-java-thumbnail.jar` (Clean 6.1 KB JAR containing compiled bytecode)
- **Container**: `public.ecr.aws/lambda/java:21` (Managed automatically by Floci)

## 🔄 Lifecycle: How It Reuses Your Java Code
```
1. Client selects image in Web UI (Port 5173) and clicks '⚡ Run via AWS Lambda'
2. Spring Boot (Port 8080) fetches original image bytes from S3
3. Invokes Floci Lambda via AWS SDK LambdaClient
4. Floci routes request to Docker container running Java 21 runtime
5. ThumbnailLambdaHandler receives the Base64 image
6. Directly executes ImageThumbnailFunction.apply(bytes, targetWidth, targetHeight)
7. Returns generated thumbnail Base64 and execution telemetry
8. Spring Boot saves the thumbnail to S3 (thumbnails/thumb_...)
9. Web UI updates side-by-side with execution metrics!
```
