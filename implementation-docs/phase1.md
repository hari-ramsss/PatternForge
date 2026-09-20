# Phase 1 Implementation Plan: Foundational Infrastructure & Sandbox

This document details the complete engineering specification and step-by-step implementation plan for **Phase 1: Foundational Infrastructure & Coding Sandbox**. It serves as a technical checklist for developers setting up the core repository, database layers, and compiler sandbox environments.

---

## 1. Scope & Goals

### In-Scope
* **Relational Database & ORM:** PostgreSQL schema initialized via Prisma, supporting users, profiles, problems, starter codes, test cases, and submissions.
* **Authentication:** Secure email/password login and registration routes returning JWT auth tokens.
* **Workspace Editor:** Monaco Editor wrapped as a Next.js component, loading default starter code templates, tracking selections in Zustand, and syncing drafts.
* **Isolated Code Execution:** Dockerized execution environment running self-hosted **Judge0 CE**, linked to the NestJS backend via a private Docker network segment.
* **BullMQ Compilation Pipeline:** Redis-backed BullMQ task queue orchestrating asynchronous execution tasks.

### Out-of-Scope (Deferred to Later Phases)
* Onboarding quiz wizards, thinking-first gate lockouts (Pattern/Observation), SSE execution streams, spaced-repetition cards, visual debuggers, and company-specific arena mock layouts.

---

## 2. Database Schema (Prisma Definitions)

The database layer will be modeled using Prisma for PostgreSQL. Implement the following entities in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

enum VerdictStatus {
  ACCEPTED
  WRONG_ANSWER
  TIME_LIMIT_EXCEEDED
  MEMORY_LIMIT_EXCEEDED
  COMPILATION_ERROR
  RUNTIME_ERROR
  PENDING
}

model User {
  id            String        @id @default(uuid())
  email         String        @unique
  passwordHash  String
  role          Role          @default(USER)
  createdAt     DateTime      @default(now())
  profile       UserProfile?
  sessions      LearningSession[]
  drafts        CodeDraft[]
  submissions   Submission[]

  @@map("users")
}

model UserProfile {
  id                 String   @id @default(uuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  targetCompanies    String[] // e.g., ["Google", "Amazon"]
  preferredLanguage  String   @default("python") // python, java, cpp, javascript
  daysToInterview    Int      @default(90)
  createdAt          DateTime @default(now())

  @@map("user_profiles")
}

model Problem {
  id             String              @id @default(uuid())
  title          String
  description    String              @db.Text
  difficulty     String              // EASY, MEDIUM, HARD
  timeLimit      Float               @default(2.0) // in seconds
  memoryLimit    Int                 @default(256) // in megabytes
  optimalTime    String              // e.g. "O(N)"
  optimalSpace   String              // e.g. "O(1)"
  createdAt      DateTime            @default(now())
  examples       ProblemExample[]
  constraints    ProblemConstraint[]
  starterCodes   StarterCode[]
  testCases      TestCase[]
  sessions       LearningSession[]
  drafts         CodeDraft[]
  submissions    Submission[]

  @@map("problems")
}

model ProblemExample {
  id          String   @id @default(uuid())
  problemId   String
  problem     Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  input       String   @db.Text
  output      String   @db.Text
  explanation String?  @db.Text

  @@map("problem_examples")
}

model ProblemConstraint {
  id          String   @id @default(uuid())
  problemId   String
  problem     Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  statement   String   @db.Text

  @@map("problem_constraints")
}

model StarterCode {
  id          String   @id @default(uuid())
  problemId   String
  problem     Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  language    String   // python, java, cpp, javascript
  boilerplate String   @db.Text

  @@unique([problemId, language])
  @@map("starter_codes")
}

model TestCase {
  id          String   @id @default(uuid())
  problemId   String
  problem     Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  input       String   @db.Text
  expected    String   @db.Text
  isPublic    Boolean  @default(false) // True if visible as sample tests

  @@map("test_cases")
}

model CodeDraft {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problemId   String
  problem     Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  language    String
  code        String   @db.Text
  updatedAt   DateTime @updatedAt

  @@unique([userId, problemId, language])
  @@map("code_drafts")
}

model Submission {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  problemId     String
  problem       Problem       @relation(fields: [problemId], references: [id], onDelete: Cascade)
  code          String        @db.Text
  language      String
  status        VerdictStatus @default(PENDING)
  judgeToken    String?       // Token returned from Judge0 sandbox
  runtime       Float?        // Execution time in seconds
  memory        Int?          // Memory usage in KB
  stdout        String?       @db.Text
  stderr        String?       @db.Text
  createdAt     DateTime      @default(now())

  @@map("submissions")
}

// Temporary shell model to link dependencies
model LearningSession {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problemId String
  problem   Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@map("learning_sessions")
}
```

---

## 3. Core API Endpoints

### 3.1 Authentication
* **`POST /api/auth/register`**
  * *Request Body:* `email`, `password`, `targetCompanies` (array), `preferredLanguage`, `daysToInterview`.
  * *Backend logic:* Salt-hash password, create `User` + `UserProfile` records, issue JWT session token.
* **`POST /api/auth/login`**
  * *Request Body:* `email`, `password`.
  * *Backend logic:* Verify hash, issue JWT.

### 3.2 Problem Controller
* **`GET /api/problems`**
  * *Response:* Array of problems containing `id`, `title`, `difficulty`, `optimalTime`.
* **`GET /api/problems/:id`**
  * *Response:* Unified problem payload containing Markdown description details, `examples`, `constraints`, and `starterCodes` boilerplates.

### 3.3 Editor State Sync
* **`POST /api/playground/autosave`** (Protected)
  * *Request Body:* `problemId`, `language`, `code`.
  * *Backend logic:* Write code string to temporary **Redis key-value store** (`draft:userId:problemId:language`). Flush variables to Postgres `code_drafts` table on a 10s batched cron trigger or when receiving unmount hooks.
* **`GET /api/playground/draft/:problemId`** (Protected)
  * *Query Params:* `language`.
  * *Backend logic:* Query Redis draft cache; fall back to PostgreSQL `code_drafts` table if missing. If empty, return standard template from `starter_codes`.

### 3.4 Sandbox Executions
* **`POST /api/playground/execute`** (Protected)
  * *Request Body:* `problemId`, `language`, `code`, `isSubmit` (boolean).
  * *Backend logic:* Rate-limit validation (max 5 requests/min). Max payload 64KB check. Enqueue task in BullMQ (`compile-queue`) and return transaction `submissionId`.

---

## 4. Frontend Monaco Workspace Setup

### Editor Store Boundary (`useEditorStore`)
Implement a client-side Zustand store tracking:
```typescript
interface EditorState {
  code: string;
  language: string;
  isCompiling: boolean;
  verdict: any | null;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setVerdict: (verdict: any) => void;
}
```

### Monaco Customization Details
* Disable editor minimaps (`minimap: { enabled: false }`).
* Set font constraints: `fontFamily: "Fira Code, JetBrains Mono, monospace"`, `fontSize: 14`, `lineHeight: 22`.
* Inject theme stylesheets matching the design system (`#1E1E1C` charcoal-sepia overlays in dark mode).

### Debounced Autosave Lifecycle Hooks
Implement in the workspace component wrapper:
1. Monaco editor code changes update Zustand state `code`.
2. A React `useEffect` runs a debounced function writing the active buffer string to browser `localStorage` every **2000ms** of user typing inactivity.
3. A secondary background interval sends `POST /api/playground/autosave` to update the backend Redis draft cache every **10 seconds** or when the component unmounts.

---

## 5. Docker Compose & Sandbox Architecture

To prevent execution abuse, Judge0 CE and backend services run on isolated container networks.

### Container Topology Configuration (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: patternforge_db
      POSTGRES_PASSWORD: postgres_secure_pass
    ports:
      - "5432:5432"
    networks:
      - app-net

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-net

  backend:
    build: ./backend
    environment:
      DATABASE_URL: "postgresql://postgres:postgres_secure_pass@postgres:5432/patternforge_db?schema=public"
      REDIS_URL: "redis://redis:6379"
      JUDGE0_URL: "http://judge0:8000"
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    networks:
      - app-net

  judge0:
    image: judge0/judge0:latest
    volumes:
      - ./judge0.conf:/etc/judge0.conf
    ports:
      - "8000:8000"
    networks:
      - app-net
      - sandbox-net
    depends_on:
      - judge0-redis

  judge0-redis:
    image: redis:7-alpine
    networks:
      - sandbox-net

networks:
  app-net:
    driver: bridge
  sandbox-net:
    driver: bridge
    internal: true # Disables network access inside execution container
```

### Sandbox Resource Capabilities
Configure in the Judge0 environment configs:
* **CPU Limit:** Hard cap of 0.5 CPU shares.
* **Memory Limit:** Capped at 256MB per compile process.
* **Wall Time:** Maximum execution duration capped at 5.0 seconds.
* **Output Limit:** stdout stream capped at 1MB to prevent disk exhaustion.

---

## 6. Asynchronous Compile Worker Lifecycle (BullMQ)

Compilation runs are processed asynchronously in the backend background thread.

```text
  [Client Submit] 
         │
         ▼
  [NestJS Controller] ────► 1. Rate-limit validation & size checks
         │
         ▼
  [BullMQ Queue] ────────► 2. Enqueue compilation job (`submissions-queue`)
         │
         ▼
  [BullMQ Worker] ───────► 3. Package code + test inputs
         │                4. Post payload to Judge0 private endpoint
         │
         ▼
  [Redis PubSub] ────────► 5. Listen for Judge0 execution completion callback
         │
         ▼
  [Prisma DB Update] ────► 6. Write results to `submissions` & `verdicts`
         │
         ▼
  [Client View] ─────────► 7. Poll or stream completion details to client
```

### Worker Step Actions
1. **Fetch inputs:** Worker queries `test_cases` matching `problemId`.
2. **Build payload:** Worker packages instructions, target compiler IDs (e.g. Python = 71, C++ = 54), test case strings, memory limits, and wall-time limits.
3. **Submit to Sandbox:** Worker dispatches request to `POST http://judge0:8000/submissions?base64_encoded=false&wait=false`.
4. **Queue Listeners:** Worker listens for sandbox task status signals from Redis.
5. **Persist verdicts:** Once finished, the worker retrieves the compilation outputs, parses resource execution limits, and writes updates directly to the database.

---

## 7. Phase 1 Verification Checklist

Execute the following test sequences to verify the integrity of the sandbox environment:

* [ ] **Auth Signups:** Verify that posting details to `/api/auth/register` creates matching User and UserProfile database records, returning signed JWT headers.
* [ ] **Catalogs Fetching:** Confirm `GET /api/problems/:id` serves correct starter templates matching requested languages.
* [ ] **Local Draft Caches:** Verify typing text in Monaco updates browser `localStorage` and writes update commands to Redis cache buffers.
* [ ] **Sandbox Compile Validation:** Trigger compile request with a syntax error program (e.g., missing semicolons). Confirm backend isolates executions, returns `COMPILATION_ERROR` verdict status, and updates stderr outputs.
* [ ] **Execution Limits Enforcement:** Submit a loop code execution (e.g., `while True: pass`). Verify worker enforces time limitations, halts execution, and registers a `TIME_LIMIT_EXCEEDED` verdict.
* [ ] **Memory Bounds Enforcement:** Submit code allocating infinite buffers. Verify worker halts execution and returns a `MEMORY_LIMIT_EXCEEDED` verdict.
* [ ] **Sandbox Network Isolation:** Submit code attempting requests to public hosts (e.g., `curl google.com`). Verify network operations fail inside sandbox workers.
