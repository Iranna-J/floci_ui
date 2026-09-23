# Floci AWS Learning Project (Spring Boot + React + PostgreSQL)

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
 └───────────┬──────────────────────┬───────────┘
             │                      │
             │ PostgreSQL (5432)    │ AWS S3 (4566)
             ▼                      ▼
 ┌────────────────────────┐  ┌────────────────────────┐
 │ PostgreSQL 15 Database │  │ Floci AWS Emulator     │
 │ - DB: floci_ui         │  │ - S3 Bucket Storage    │
 │ - User: floci_ui       │  │ - Port: 4566           │
 │ - Port: 5432           │  └────────────────────────┘
 └────────────────────────┘
```

---

## 🚀 How to Run the Project

### 1. Start Docker Containers (PostgreSQL & Floci)
In the project root directory:

```bash
docker compose up -d
```

This starts:
- **`floci-postgres`**: PostgreSQL database on port `5432` (DB: `floci_ui`, User: `floci_ui`, Password: `1100`).
- **`floci-aws`**: Floci local AWS emulator on port `4566`.

---

### 2. Start the Spring Boot Backend
In a new terminal:

```bash
cd backend
mvn spring-boot:run
```

- Backend API: `http://localhost:8080`
- Database: Connected to **PostgreSQL** (`jdbc:postgresql://localhost:5432/floci_ui`).
- Hibernate automatically creates and updates the `users` table.

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

## 🔍 Inspecting the Database

Connect to PostgreSQL directly using `psql`:

```bash
PGPASSWORD=1100 psql -h localhost -p 5432 -U floci_ui -d floci_ui
```

Query registered users:
```sql
SELECT id, username, email, role, created_at FROM users;
```

---

## 🗺️ Step-by-Step Learning Roadmap

1. **Step 1 (Complete)**: Clean baseline Full-Stack project (Spring Boot 3 + Java 21 + React Vite + PostgreSQL + JWT Auth).
2. **Step 2 (Next)**: Add **AWS S3** in Floci for uploading, viewing, and managing images and files.
