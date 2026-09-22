# Floci AWS Learning Project (Spring Boot + React)

A full-stack project designed to learn **AWS Cloud services locally using Floci** — a fast, free, open-source local AWS emulator.

---

## 🌟 What is Floci?
[Floci](https://github.com/floci-io/floci) is a lightweight, native-compiled (Quarkus Native) local AWS emulator:
- **Instant startup (~24ms)**: Boots up in milliseconds.
- **Tiny footprint (~13MB idle memory)**: Extremely low RAM usage.
- **100% Free & Open Source**: No cloud bills, AWS account, or credit cards required.
- **Drop-in AWS Compatibility**: Speaks real AWS wire protocols (DynamoDB, S3, RDS, SQS) on port `4566`.

---

## 🏗️ Project Architecture

```
 ┌──────────────────────────────────────────────┐
 │ React Frontend (Vite + Modern UI)            │ http://localhost:5173
 │  - User Registration & Login Forms           │
 │  - JWT Auth State & Dashboard                │
 └──────────────────────┬───────────────────────┘
                        │ REST API (JSON + JWT)
                        ▼
 ┌──────────────────────────────────────────────┐
 │ Spring Boot Backend (Java 21, Spring Boot 3) │ http://localhost:8080
 │  - Spring Security (Stateless JWT Auth)      │
 │  - BCrypt Password Hashing                   │
 │  - AWS SDK for Java v2 (DynamoDbEnhanced)    │
 └──────────────────────┬───────────────────────┘
                        │ AWS DynamoDB Protocol (Port 4566)
                        ▼
 ┌──────────────────────────────────────────────┐
 │ Floci AWS Emulator Container                 │ http://localhost:4566
 │  - Service: AWS DynamoDB (NoSQL)             │
 │  - Table: "Users" (Key: username)            │
 │  - Storage: Persistent Disk (./floci-data)   │
 └──────────────────────────────────────────────┘
```

---

## 🚀 How to Run the Project

### 1. Start the Floci AWS Emulator
In the project root directory:

```bash
docker compose up -d
```

Verify Floci is healthy on port `4566`:
```bash
curl http://localhost:4566
```

---

### 2. Start the Spring Boot Backend
In a new terminal:

```bash
cd backend
mvn spring-boot:run
```

- Backend API: `http://localhost:8080`
- Database: Connected to **AWS DynamoDB** running in Floci.
- *On startup, Spring Boot automatically verifies and creates the `Users` table in Floci if it does not exist.*

---

### 3. Start the React Frontend
In a new terminal:

```bash
cd frontend
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

---

## 💾 Permanent Disk Persistence (`./floci-data`)

All DynamoDB data is configured to **persist permanently to your local disk** using Docker volumes in `docker-compose.yml`:

- **Path**: `./floci-data/`
- **Files**:
  - `dynamodb-tables.json`: Table definitions (e.g., `Users` table schema).
  - `dynamodb-items.json`: User items, hashed passwords, and emails.
- **Behavior**: You can restart your machine or stop the Docker container anytime—when Floci restarts, it automatically reloads all tables and user data from this folder.

---

## 🔍 How to View and Inspect Database Data

### Method 1: Visual Web Dashboard (Recommended)
Run the dedicated DynamoDB visual dashboard in your terminal:

```bash
DYNAMO_ENDPOINT=http://localhost:4566 npx -y dynamodb-admin
```

Then open your browser to:
👉 **`http://localhost:8001`**

- Click on the **`Users`** table to view, edit, search, and delete rows in a spreadsheet-like GUI.

### Method 2: Direct Terminal Query (`curl` + `jq`)
To scan all registered users directly from your terminal:

```bash
curl -s -X POST http://localhost:4566/ \
  -H "X-Amz-Target: DynamoDB_20120810.Scan" \
  -H "Content-Type: application/x-amz-json-1.0" \
  -d '{"TableName": "Users"}' | jq .
```

To fetch a single user by username:

```bash
curl -s -X POST http://localhost:4566/ \
  -H "X-Amz-Target: DynamoDB_20120810.GetItem" \
  -H "Content-Type: application/x-amz-json-1.0" \
  -d '{"TableName": "Users", "Key": {"username": {"S": "iranna"}}}' | jq .
```

---

## 📝 Multi-Table DynamoDB Architecture Example (`Notes` Table)

To see how to add any new table to DynamoDB and connect it via Spring Boot, we implemented a sample `Notes` table:

1. **Entity**: [`Note.java`](backend/src/main/java/com/example/flociapp/entity/Note.java) annotated with `@DynamoDbBean` and `@DynamoDbPartitionKey`.
2. **Repository**: [`NoteRepository.java`](backend/src/main/java/com/example/flociapp/repository/NoteRepository.java) using `DynamoDbTable<Note>`.
3. **Table Initializer**: [`DynamoDbTableInitializer.java`](backend/src/main/java/com/example/flociapp/config/DynamoDbTableInitializer.java) auto-provisions `Notes` on startup.
4. **REST Endpoints**:
   - `POST /api/notes`: Saves a note `{ "content": "Hello DynamoDB!" }`.
   - `GET /api/notes`: Lists all notes.
   - `DELETE /api/notes/{id}`: Deletes a note by ID.

---

## 🗺️ Step-by-Step Learning Roadmap

1. **Step 1 (Complete)**: Clean baseline Full-Stack project (Spring Boot 3 + Java 21 + React Vite + JWT Auth).
2. **Step 2 (Complete)**: Floci AWS Emulator setup with **AWS DynamoDB**, permanent disk persistence (`./floci-data`), and visual table inspection.
3. **Step 3 (Next)**: Add **AWS S3** to Floci for uploading, streaming, and managing images and files.
