# Floci AWS Learning Project (Spring Boot + React + AWS RDS PostgreSQL)

A full-stack project designed to learn **AWS Cloud services locally using Floci** — a fast, free, open-source local AWS emulator.

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
 │  - Spring Data JPA + Hibernate               │
 └──────────────────────┬───────────────────────┘
                        │ JDBC Connection (Port 7001)
                        ▼
 ┌──────────────────────────────────────────────┐
 │ Floci AWS Emulator Container                 │ http://localhost:4566
 │  - AWS Service: Amazon RDS PostgreSQL        │
 │  - RDS Proxy Port: 7001                      │
 │  - Database Name: floci_ui                   │
 │  - Master User: floci_ui / 1100              │
 │  - Engine: PostgreSQL 16                     │
 └──────────────────────────────────────────────┘
```

---

## 🚀 How to Run the Project

### 1. Start Floci AWS Emulator
In the project root directory:

```bash
docker compose up -d
```

### 2. Provision the AWS RDS PostgreSQL Database
Tell Floci to create the RDS instance:

```bash
curl -X POST http://localhost:4566/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=CreateDBInstance&DBInstanceIdentifier=floci-postgres&Engine=postgres&DBInstanceClass=db.t3.micro&AllocatedStorage=20&MasterUsername=floci_ui&MasterUserPassword=1100&DBName=floci_ui&Version=2014-10-31"
```

Floci automatically launches the PostgreSQL engine container and creates a transparent proxy on port **`7001`**.

---

### 3. Start the Spring Boot Backend
In a new terminal:

```bash
cd backend
mvn spring-boot:run
```

- Backend API: `http://localhost:8080`
- Database: Connected to **AWS RDS PostgreSQL** (`jdbc:postgresql://localhost:7001/floci_ui`).

---

### 4. Start the React Frontend
In a new terminal:

```bash
cd frontend
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

---

## 🔍 How to Inspect Your AWS RDS Database

### Option 1: Visual Web Dashboard in Browser (Recommended)
Open your browser at:
👉 **`http://localhost:8081`**

- Click on the **`users`** table in the left sidebar to view all registered users, columns, and data in a spreadsheet-like web GUI.

### Option 2: Query AWS RDS Cloud Metadata
```bash
curl -s -X POST http://localhost:4566/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=DescribeDBInstances&Version=2014-10-31" | grep -E "DBInstanceIdentifier|DBInstanceStatus|Engine|Port"
```

### Option 3: Connect directly via `psql` on Port 7001
```bash
PGPASSWORD=1100 psql -h localhost -p 7001 -U floci_ui -d floci_ui
```

Query registered users:
```sql
SELECT id, username, email, role, created_at FROM users;
```

---

## 🗺️ Step-by-Step Learning Roadmap

1. **Step 1 (Complete)**: Clean baseline Full-Stack project (Spring Boot 3 + Java 21 + React Vite + JWT Auth).
2. **Step 2 (Complete)**: **AWS RDS PostgreSQL** running inside Floci on proxy port `7001` with JPA Hibernate.
3. **Step 3 (Next)**: Add **AWS S3** in Floci for uploading, streaming, and managing images and files.
