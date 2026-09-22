# Floci AWS Learning Project (Spring Boot + React)

A full-stack project designed to learn **AWS Cloud services locally using Floci** — a fast, free, open-source local AWS emulator.

---

## 🌟 What is Floci?
[Floci](https://github.com/floci-io/floci) is a lightweight, native-compiled (Quarkus Native) local AWS emulator:
- **Instant startup (~24ms)**: Boots up in milliseconds.
- **Tiny footprint (~13MB idle memory)**: Very low RAM usage.
- **100% Free & Open Source**: No cloud bills, AWS account, or credit card required.
- **Drop-in AWS Compatibility**: Runs AWS services (DynamoDB, S3, RDS, SQS) on port `4566`.

---

## 🏗️ Project Architecture & Current State

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
 │  - Spring Data JPA Repository                │
 └──────────────────────┬───────────────────────┘
                        │ JDBC (Port 5432)
                        ▼
 ┌──────────────────────────────────────────────┐
 │ PostgreSQL Database                          │ localhost:5432
 │  - Database: floci_ui                        │
 │  - User: floci_ui / Password: 1100           │
 └──────────────────────────────────────────────┘
```

---

## 🚀 How to Run the Project

### 1. Start the Floci AWS Emulator
Inside the project root:

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
- Database: Connected to PostgreSQL `floci_ui`

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

## 🗺️ Step-by-Step Learning Roadmap

1. **Step 1 (Complete)**: Clean baseline project with user registration, login, and database persistence.
2. **Step 2 (In Progress)**: Run Floci with Docker Compose and verify local AWS cloud services (port `4566`).
3. **Step 3**: Store database data in AWS (Integrate AWS DynamoDB).
4. **Step 4**: Add AWS S3 for uploading and storing images and files.
