# Floci Local AWS Explorer (Spring Boot + React + S3)

A full-stack, cloud-native project to learn and experiment with **AWS Services locally using Floci** — a fast, free, open-source local AWS emulator built with Quarkus Native.

---

## 🌟 What is Floci?
[Floci](https://github.com/floci-io/floci) is a native-compiled local cloud emulator. Key advantages:
- **Instant startup (~24ms)**: Boots up hundreds of times faster than traditional heavy emulators.
- **Tiny footprint (~13MB idle memory)**: Runs easily on any laptop without fan noise or high RAM usage.
- **100% Free & Open Source**: No cloud accounts, credit cards, or paid feature paywalls.
- **Drop-in AWS Compatibility**: Interacts seamlessly with AWS SDKs and the AWS CLI on port `4566`.

---

## 🏗️ Architecture

```
   ┌───────────────────────────────────────────────┐
   │ React.js Frontend (Vite + Modern UI)          │ http://localhost:5173
   │  - User Registration & Login (JWT)            │
   │  - Drag & Drop Upload Zone                    │
   │  - Image Previews & S3 Object Gallery         │
   └──────────────────────┬────────────────────────┘
                          │ REST API + JWT
                          ▼
   ┌───────────────────────────────────────────────┐
   │ Spring Boot Backend (Java 21, Spring Boot 3)  │ http://localhost:8080
   │  - Spring Security (Stateless JWT Auth)       │
   │  - S3StorageService (AWS SDK for Java v2)     │
   │  - Automatic S3 Bucket Provisioning           │
   │  - Embedded H2 Database for User & Metadata   │
   └──────────────────────┬────────────────────────┘
                          │ AWS S3 API (Endpoint: http://localhost:4566)
                          ▼
   ┌───────────────────────────────────────────────┐
   │ Floci AWS Emulator Container                  │ http://localhost:4566
   │  - Emulates AWS S3 (Bucket: floci-uploads)    │
   └───────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Step 1: Start the Floci AWS Emulator
You can start Floci using Docker or Docker Compose:

```bash
# Using Docker Compose (Recommended)
cd /home/basavaraj/Music/Iranna/floci-aws-app
docker compose up -d

# OR using Docker CLI directly:
docker run -d --name floci-aws -p 4566:4566 floci/floci:latest
```

Verify Floci is running:
```bash
curl http://localhost:4566
```
*(You will receive an XML response from Floci's S3 service confirming it is ready!)*

---

### Step 2: Start the Spring Boot Backend
Open a terminal and run:

```bash
cd /home/basavaraj/Music/Iranna/floci-aws-app/backend
mvn spring-boot:run
```
*(On startup, the backend automatically checks and creates the S3 bucket `floci-uploads` in Floci if it doesn't already exist).*

- Backend API: `http://localhost:8080`
- H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:flocidb`, Username: `sa`, Password: empty)

---

### Step 3: Start the React Frontend
In a new terminal, run:

```bash
cd /home/basavaraj/Music/Iranna/floci-aws-app/frontend
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

1. Click **Register** or **Sign In** to create a test user.
2. Drag & drop an image (PNG/JPG) or file (PDF/TXT/ZIP).
3. See your file stored directly in Floci S3 and displayed in your gallery!

---

## 🛠️ Testing with AWS CLI

You can use the official `aws` CLI to inspect what is happening inside Floci directly:

```bash
# List all buckets in Floci
aws s3 ls --endpoint-url=http://localhost:4566

# List files inside the bucket
aws s3 ls s3://floci-uploads/ --endpoint-url=http://localhost:4566

# Upload a test file directly from terminal to Floci
echo "Hello from AWS CLI and Floci!" > sample.txt
aws s3 cp sample.txt s3://floci-uploads/ --endpoint-url=http://localhost:4566

# Download a file from Floci
aws s3 cp s3://floci-uploads/sample.txt ./downloaded-sample.txt --endpoint-url=http://localhost:4566
```

---

## ⚙️ How AWS S3 is Configured in Spring Boot

In `com.example.flociapp.config.AwsS3Config`:

```java
@Bean
public S3Client s3Client() {
    return S3Client.builder()
            .endpointOverride(URI.create("http://localhost:4566"))
            .region(Region.US_EAST_1)
            .credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create("test", "test")))
            .forcePathStyle(true) // Required for local S3 emulators
            .build();
}
```
Key notes:
1. `endpointOverride(...)` points traffic to Floci on port `4566`.
2. `forcePathStyle(true)` routes requests as `http://localhost:4566/bucket/key` instead of DNS virtual-host style `http://bucket.localhost:4566/key`.
3. `BucketInitializer` executes on startup to auto-create `floci-uploads`.
