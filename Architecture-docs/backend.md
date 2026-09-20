# Backend Architecture - PatternForge AI

This document defines the backend system architecture, API boundaries, relational database schemas, background job pipelines, and AI orchestration mechanisms for **PatternForge AI**. It establishes how the backend services process cognitive signals, execute user code, manage learning roadmaps, and generate targeted feedback.

---

## 1. Modular Monolith Design (NestJS)

To maximize development velocity while maintaining strict domain boundaries, PatternForge is built as a **Modular Monolith** using **NestJS**. This architecture isolates features into self-contained modules, preventing tight coupling and facilitating eventual microservices decomposition if scaling demands split execution from reporting.

### Architectural Layering

Inside each NestJS module, code execution flows through structured layers with strict directional dependencies:

```text
+-----------------------------------------------------------------------------------+
|                              Client Web Application                               |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS (JSON REST / Server-Sent Events)
                                         v
+-----------------------------------------------------------------------------------+
|                            API Gateway & Routing Layer                            |
|       - Express Controllers, Route Mappings, Rate Limiters, JWT Guard Filters     |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Injected Service Calls
                                         v
+-----------------------------------------------------------------------------------+
|                            Business Logic Service Layer                           |
|       - Core Domain Logic, State Transitions, Transactional Boundaries            |
+-----------------------------------------------------------------------------------+
         |                                                 |
         | Direct ORM Queries                              | Async Job Dispatch
         v                                                 v
+----------------------------------+             +----------------------------------+
|      Data Access Layer (DAL)     |             |    Background Job Queue Layer    |
|   - Prisma ORM & PostgreSQL Client|             |   - BullMQ Producer & Redis Logs  |
+----------------------------------+             +----------------------------------+
```

1. **Routing Layer (Controllers):** Handles incoming HTTP requests, performs input validation using NestJS Pipes (utilizing `class-validator` and Zod schemas), and sanitizes outbound JSON payloads. It enforces cross-origin resource sharing (CORS) and authentication guards.
2. **Business Logic Layer (Services):** Implements core application logic. Services execute transaction boundaries, evaluate state transition rules, and interface with helper packages (such as mailers, AI model APIs, and execution gateways).
3. **Data Access Layer (Prisma ORM):** Connects to the PostgreSQL database. Repositories wrap raw Prisma clients to enforce strict query criteria, manage index usage, and handle database connection pooling.
4. **Async Processing Layer (BullMQ Consumers):** Operates out-of-band to run CPU-bound compilation tasks, AI prompt analysis, and weekly reporting routines. Workers poll Redis queues, run isolated tasks, and write results back to PostgreSQL.

---

## 2. Unified Data Architecture (PostgreSQL & Prisma)

The storage layout balances relational transactional integrity with the flexibility of semi-structured document storage. Relational tables manage identity, attempts, roadmaps, and metadata, while PostgreSQL `JSONB` fields hold AI assessments, compiler diagnostics, and dynamic prompt rubrics.

### Core Database Entities

The relational database schema is structured around 23 core entities:

```text
+------------------+       +------------------+       +------------------+
|       User       |------>|   UserProfile    |       |     Problem      |
|  (Auth & Role)   |       |  (Goals/Timeline)|       | (Title & Details)|
+------------------+       +------------------+       +------------------+
         |                                                     |
         v                                                     v
+------------------+       +------------------+       +------------------+
| LearningSession  |<=====>|   PatternGuess   |       |    TestCase      |
| (Session State)  |       | (Hypothesis/AI)  |       | (Sample/Edge/Adv)|
+------------------+       +------------------+       +------------------+
         |                          |                          |
         +------------+             |                          |
         |            |             v                          v
         v            v    +------------------+       +------------------+
+------------------+  |    |   Observation    |       |    Submission    |
|    Reflection    |  |    | (Pre-coding/AI)  |       | (Compiler Result)|
| (Metacognition)  |  |    +------------------+       +------------------+
+------------------+  |
                      v
             +------------------+
             |   PatternCard    |
             | (Spaced Repet.)  |
             +------------------+
```

1. **`users`:** Account credentials, email hashes, salt values, creation timestamps, and access roles (`USER`, `ADMIN`).
2. **`user_profiles`:** Track user goals, target timelines, target companies, preferred programming languages, and dynamic baseline levels computed by the diagnostic assessments.
3. **`problems`:** The canonical DSA catalogue. Stores titles, description markdown, constraints, difficulties, and expected optimal Big-O complexities.
4. **`problem_examples`:** Structured examples displaying inputs, expected outputs, and text explanations shown directly within problem side panels.
5. **`problem_constraints`:** Specific limits (e.g., $N \le 10^5$, positive values only) and associated algorithmic complexity implications used by the AI when grading user observations.
6. **`problem_topics`:** Topic indices (e.g., Arrays, Dynamic Programming, Graphs) linking problems to categories.
7. **`problem_patterns`:** Algorithmic patterns (e.g., Sliding Window, Two Pointers, Backtracking) associated with problem solutions.
8. **`starter_codes`:** Language-specific boilerplate templates containing imports, function headers, and return signatures served to the Monaco editor workspace.
9. **`test_cases`:** Central database of inputs and expected outputs. Flags distinguish between public sample cases, hidden system validation cases, edge cases, adversarial tests, and heavy stress-testing workloads.
10. **`learning_sessions`:** The central state machine record tracking a user's chronological path through a single problem, tracking phase changes and accumulated times.
11. **`session_events`:** Continuous audit logs capturing every user interaction (clicks, hint requests, code runs, keystroke pauses) to supply behavioral metrics to the analytical engine.
12. **`pattern_guesses`:** Tracks selected patterns, justifications, validation outcomes, AI evaluation logs, and attempts before the code editor unlocks.
13. **`observations`:** Stores user observations categorized by attributes (constraints, edge cases, properties) alongside AI completeness and depth scores.
14. **`code_drafts`:** Real-time autosaved keystroke buffers, storing drafts per session, user, and programming language.
15. **`submissions`:** Records of compile/run submissions, holding sandbox execution tokens, source code snapshots, compiler versions, and final status verdicts.
16. **`code_runs`:** Non-evaluative executions triggered by the user with custom input strings.
17. **`verdicts`:** Execution results mapping stdout, stderr, execution duration, peak memory footprint, and exit signals.
18. **`reflections`:** Metacognitive review logs storing the answers to post-problem prompts (e.g., missed triggers, key insights).
19. **`pattern_cards`:** Personal spaced repetition records defining review intervals, review histories, and decay metrics for solved patterns.
20. **`mistake_logs`:** Analytical error entries grouping failures by root causes (e.g., array index off-by-one, overflow, observation miss).
21. **`skill_scores`:** Six-dimensional ability levels mapping dynamic progress in pattern recognition, formula derivation, speed, accuracy, consistency, and optimization.
22. **`roadmap_items`:** Tailored weekly curriculums containing problem sets, reading blocks, and targeted practice sessions.
23. **`mentor_notes`:** Personalized advice, summary briefings, and action suggestions compiled periodically by the AI coaching engine.

### Database Indexing & Query Optimizations

To handle analytical reads without blocking transactional updates:
* **Composite Indexes:** Implemented on foreign key pairs (e.g., `(user_id, topic_id)`) to speed up roadmap calculations.
* **Partial Indexes:** Applied to telemetry and event tables (e.g., filtering for events of type `code_run_failed` or `phase_transition`) to prevent table scans on high-volume logs.
* **JSONB Indexing:** Utilizing GIN (Generalized Inverted Index) paths for structured AI responses (e.g., querying `observations.ai_scores->'depth'` or `submissions.verdict->'memory'`).

---

## 3. Module-by-Module Backend Specifications

### Module 1: AI Skill Assessment Engine

#### Core Responsibilities
* Orchestrates initial diagnostic testing to establish user baselines without manual self-reporting.
* Sequences a representative subset of problems spanning core DSA topics (linked lists, trees, graphs, DP).
* Records behavioral actions to build a multi-dimensional capability matrix.

#### API Boundaries
* `POST /api/assessment/start`: Instantiates a diagnostic session. Returns a list of sequential problem identifiers, session-specific tokens, and locked editor controls.
* `POST /api/assessment/submit-attempt`: Submits an individual assessment problem response. Captures thinking timers, total key counts, error counts, and final code.
* `GET /api/assessment/profile`: Returns the six-dimensional profile scoring (`Pattern Recognition`, `Observation Quality`, `Formula Discovery`, `Optimization`, `Speed under Accuracy`, `Consistency`).

#### Data Flow & Logic
1. User requests a diagnostic start; the engine queries `problems` flagged with `is_diagnostic = true`.
2. As the user moves through problems, the client posts background updates reporting time elapsed, observation submissions, and code compilations.
3. Upon final submission, the engine schedules an evaluation job in BullMQ.
4. The worker evaluates observations, compile/run metrics, and code quality, updating the user's `skill_scores` table.

---

### Module 2: Personalized Learning Engine

#### Core Responsibilities
* Dynamically manages user roadmaps, updating curriculum pathways weekly based on performance history.
* Balances three design forces: weakness remediation, strength extension, and target company timelines.

#### API Boundaries
* `GET /api/learning-path/current`: Retrieves active roadmap tasks, due dates, topic distributions, and progress benchmarks.
* `POST /api/learning-path/adjust`: Triggered by diagnostic updates or milestone events. Recalculates curriculum structures.

#### Data Flow & Logic
1. The service reads the user's current `skill_scores`, `user_profile` (target companies, target timelines), and `mistake_logs`.
2. Problems are queried from the catalogue using a weighting formula that prioritizes topics with low skill scores but high target company frequencies.
3. The engine creates `roadmap_items` records representing the next phase of work (e.g., 3 Graph BFS exercises, 1 Dynamic Programming transition-matrix drill).

---

### Module 3: Daily Adaptive Challenge System

#### Core Responsibilities
* Serves a daily set of four structured problems adjusted to fit the user's historical metrics and available time budget.
* Maintains a defined flow: Easy Warmup $\rightarrow$ Medium Pattern Recognition $\rightarrow$ Medium-Hard Optimization $\rightarrow$ Hard Stretch.

#### API Boundaries
* `GET /api/daily-challenges`: Fetches today's custom set. Returns problem scopes, time estimates, and locked states.
* `POST /api/daily-challenges/time-budget`: Adjusts problem counts (e.g., reducing set from 4 to 2 problems if the user reports only having 30 minutes).

#### Data Flow & Logic
1. At midnight, a scheduled worker evaluates each user profile and queries problems mapping to the 4 difficulty buckets.
2. The selection engine evaluates recent error categories: if a user failed multiple binary searches yesterday, the "Warmup" or "Medium Pattern" today is selected from binary search topics.
3. The challenges are stored under the `LearningSession` table with a `daily_challenge` marker.

---

### Module 4: Pattern Discovery Mode

#### Core Responsibilities
* Enforces pre-coding architectural analysis by locking editor interfaces until patterns are identified.
* Validates user-submitted justifications against correct schemas.

#### API Boundaries
* `GET /api/sessions/:id/pattern-discovery`: Retrieves the pattern choices metadata and historical guesses for the current session.
* `POST /api/sessions/:id/pattern-discovery/guess`: Accepts a pattern guess list and a text justification string. Returns a validation response containing verdict information.

#### Data Flow & Logic
1. Upon problem entry, the database state of the `LearningSession` is set to `PATTERN_DISCOVERY`. The API blocks requests to compile or submit code.
2. The user submits a pattern guess. If correct, the session status updates to `OBSERVATION_TRAINING`.
3. If incorrect, the engine logs the guess, increments the failure count, and returns targeted hints. After two failures, a direct clue pointing to problem elements is unlocked.

---

### Module 5: Observation Training System

#### Core Responsibilities
* Prompts users to identify and input problem properties, constraint implications, and edge cases before coding.
* Scores the completeness and quality of inputs using LLM schemas.

#### API Boundaries
* `GET /api/sessions/:id/observations`: Returns critical observation criteria, categories (Constraints, Edge Cases, Properties), and scoring.
* `POST /api/sessions/:id/observations/submit`: Accepts a list of observed properties. Returns AI-generated score reports.

#### Data Flow & Logic
1. During the `OBSERVATION_TRAINING` phase, the user submits observations as text fields.
2. The backend sends the text along with problem metadata to the AI Orchestrator.
3. The orchestrator returns a validated JSON response scoring the inputs on completeness, relevance, and depth.
4. If the cumulative score exceeds a defined threshold (e.g., 60/100), the session state transitions to `APPROACH_REASONING` and eventually unlocks the code editor.

---

### Module 6: Formula Discovery Trainer

#### Core Responsibilities
* Directs derivation drills that require users to construct recurrence relations and mathematical equations from raw behavior tables.

#### API Boundaries
* `GET /api/trainer/formulas/exercise/:id`: Fetches input/output value lists, variable definitions, and complexity requirements.
* `POST /api/trainer/formulas/verify`: Submits math expressions (represented in LaTeX or syntax trees) for algebraic equivalence checking.

#### Data Flow & Logic
1. The client requests a formula drill. The backend serves a problem dataset containing input parameters and generated values.
2. The user submits a formula expression.
3. The backend compiles the formula string into an AST (Abstract Syntax Tree), runs evaluations against sample ranges, and validates algebraic correctness.
4. Results are persisted to `skill_scores` under the `FormulaDiscovery` metric.

---

### Module 7: Pattern Recognition Gym

#### Core Responsibilities
* Presents abstract data arrays containing only input-output examples without verbal context, forcing pure pattern deduction.

#### API Boundaries
* `GET /api/gym/next`: Returns numerical sequence collections, input matrices, or text mappings, hiding the source problem definitions.
* `POST /api/gym/deduct`: Accepts pattern selections and structural descriptions. Returns accuracy scoring and verification reports.

#### Data Flow & Logic
1. The service pulls test inputs and results from the `test_cases` of a selected problem, stripping all names and descriptions.
2. The user identifies the operation class (e.g., "Sorts elements and returns index of target").
3. The backend runs validation checks, records the score, and logs the pattern to the user's recognition history.

---

### Module 8: Pattern Library

#### Core Responsibilities
* Aggregates personalized learning files into a searchable knowledge library.
* Powers the spaced-repetition scheduler using the SuperMemo-2 algorithm to surface cards before memory decay occurs.

#### API Boundaries
* `GET /api/pattern-library`: Searches, filters, and page-scrolls personal Pattern Cards.
* `POST /api/pattern-library/card/:id/review`: Accepts card recall ratings (0-5 scale) to reschedule upcoming review intervals.
* `GET /api/pattern-library/export`: Generates downloadable PDF summaries of compiled cards.

#### Data Flow & Logic
1. Solving a problem triggers card generation; information is extracted from session reflections, observations, and mistake logs.
2. The card is written to the `PatternCard` table with an initial interval of 1 day.
3. When the user completes a card review, the backend uses the recall score to compute the next interval and schedules `nextReviewAt` accordingly.

---

### Module 9: Interactive Coding Playground

#### Core Responsibilities
* Provides editing support, auto-saves draft iterations, maps language configurations, and measures resource runtimes.

#### API Boundaries
* `GET /api/playground/draft/:problemId`: Fetches active code drafts by programming language.
* `POST /api/playground/autosave`: Updates keystroke buffers for draft stability.
* `POST /api/playground/execute`: Triggers compilation checks against validation test cases.

#### Data Flow & Logic
1. The Monaco editor calls `autosave` every 10 seconds. Code drafts are cached in Redis temporary storage (e.g. `draft:userId:problemId`) and flushed in batches to the `code_drafts` table in PostgreSQL every 10 seconds or when the workspace editor panel loses focus to prevent transactional write locks.
2. Executing code triggers validation against sample cases. The backend maps the code and language ID to the sandbox payload, dispatches to the Judge0 gateway, and streams execution results to the client.

---

### Module 10: User Problem Import System

#### Core Responsibilities
* Parses raw text, URL pointers, images, or PDFs to import external coding problems into PatternForge formats.

#### API Boundaries
* `POST /api/import/file`: Accepts PDF document buffers or PNG/JPG image forms. Returns extraction logs and preview items.
* `POST /api/import/url`: Accepts URL targets. Returns scraped content blocks.
* `POST /api/import/confirm`: Commits structured data formats into problem catalogues.

#### Data Flow & Logic
1. The user uploads a file/URL. If a URL is submitted, the backend runs safety validation checks: parsing the destination address, blocking loopback/private IPs and cloud metadata routes, and checking domains against an allowlist (e.g., `leetcode.com`, `geeksforgeeks.org`) to mitigate Server-Side Request Forgery (SSRF) threats.
2. The AI uses OCR to extract text from screenshots or PDFs, identifies formatting boundaries (Constraints, Input, Examples), and constructs database-compatible structures.
3. The system runs the AI Test Case Generator to seed standard inputs and prompts the user to confirm the import details.

---

### Module 11: AI Test Case Generator

#### Core Responsibilities
* Automatically generates a diagnostic test suite for imported problems, ensuring correctness across extreme constraints.

#### API Boundaries
* `POST /api/problems/:id/generate-cases`: Triggers test case synthesis. Returns counts of generated inputs grouped by verification targets.

#### Data Flow & Logic
1. The generator receives the problem context (description, limits, types).
2. The system calls the LLM, prompting it to produce valid, extreme inputs (empty values, values close to integer limits, sorted layouts, duplicates).
3. The backend validates the inputs by running them through an optimal reference solution, storing successful iterations under the `TestCase` table.

---

### Module 12: Solution Path Analyzer

#### Core Responsibilities
* Compares completed code complexity against optimal baselines, highlighting coding bottlenecks and optimization steps.

#### API Boundaries
* `GET /api/sessions/:id/solution-analysis`: Fetches comparative diagrams, complexity profiles, and optimization advice.

#### Data Flow & Logic
1. When a submission passes all validation tests, the analyzer runs static analysis on the code abstract syntax trees (ASTs).
2. It compares the user's complexity with the metadata in `problems`.
3. The AI is used to pinpoint exact improvement points (e.g., redundant allocations inside loops) and drafts comparisons, saving them to the session's JSONB metadata.

---

### Module 13: Mistake Intelligence System

#### Core Responsibilities
* Categorizes coding errors, maps patterns of failure across sessions, and highlights systematic issues in weekly summaries.

#### API Boundaries
* `GET /api/analytics/mistakes`: Returns analytical breakdowns of error categories (e.g., edge case omissions, pattern mismatches).

#### Data Flow & Logic
1. Failed runs and incorrect pattern guesses write entries to the `MistakeLog` table.
2. A weekly cron job aggregates these records, identifying repeat patterns (e.g., failing tree problems due to missing leaf-node checks).
3. The system summarizes these findings into recommendations for the AI Mentor.

---

### Module 14: Adaptive Difficulty Engine

#### Core Responsibilities
* Adjusts difficulty parameters dynamically based on user response metrics to prevent user frustration or boredom.

#### API Boundaries
* `POST /api/difficulty/reassess`: Triggers dynamic changes in system difficulty scaling based on session logs.

#### Data Flow & Logic
1. The engine registers performance metrics (e.g., solve speeds, help requests, submission attempt numbers).
2. If accuracy over the last 5 sessions exceeds 75%, it escalates difficulty levels. If accuracy drops below 40%, it drops the target difficulty, unlocking more guided paths.
3. Updated levels are saved to `UserProfile` parameters.

---

### Module 15: Interview Simulation Arena

#### Core Responsibilities
* Replicates strict corporate interview environments with company modes, rigid timing counts, and vocal reasoning logging.

#### API Boundaries
* `POST /api/simulation/initiate`: Instantiates an interview simulation. Returns problem sets, instructions, and locks.
* `POST /api/simulation/stream-transcript`: Accepts real-time speech-to-text text blocks, tracking user verbal reasoning logs.
* `GET /api/simulation/report/:id`: Retrieves evaluation reports, metrics, and hiring recommendations.

#### Data Flow & Logic
1. Starting a simulation sets up a strict 45-minute countdown in Redis. Hints and custom test executions are disabled.
2. The user types their code while the microphone input streams voice transcripts to the backend.
3. Once complete, the system scores the simulation based on company guidelines (e.g., Google’s optimization focus, Amazon’s edge case focus) and saves reports to the database.

---

### Module 16: AI Mentor

#### Core Responsibilities
* Provides real-time guidance, diagnoses systemic weaknesses, and outlines weekly preparation briefings.

#### API Boundaries
* `GET /api/mentor/briefing`: Fetches the current weekly briefing, priority focus areas, and optimization tips.
* `GET /api/mentor/session-guidance/:sessionId`: Retrieves real-time tips without revealing solutions.

#### Data Flow & Logic
1. The user requests help during a session. The backend builds a context payload (problem, observations, current code, error messages) and dispatches it to the AI Orchestrator.
2. The model returns tips focused on logic progression rather than direct answers.
3. Every Sunday, the mentor compiles data from `mistake_logs` and `skill_scores` to write the next `mentor_notes` report.

---

### Module 17: Reflection System

#### Core Responsibilities
* Enforces post-solve reflections, locking subsequent milestones until users answer key retrospective prompts.

#### API Boundaries
* `POST /api/sessions/:id/reflection/submit`: Accepts reflection answers, validates quality, and updates progress locks.

#### Data Flow & Logic
1. Upon successful code submission, the session moves to the `REFLECTION_REQUIRED` phase.
2. The user responds to prompts about learnings, mistakes, and optimizations.
3. The AI scores reflection completeness. If approved, the backend unlocks the session, updates the user's `roadmap_items`, and generates the problem's `PatternCard`.

---

## 4. Code Execution Gateway (Judge0 Sandbox)

All code execution is isolated from the main backend web container to protect infrastructure stability and security. Executions route through a self-hosted instance of **Judge0 CE** deployed in a private network segment.

```text
+-------------------+             +-----------------------+             +-----------------------+
|  NestJS Backend   |             |     Redis Queue       |             |     BullMQ Worker     |
|                   |------------>|  (submission-queue)   |------------>|                       |
|   (Auth Check)    |             |                       |             |  (Compiles Payload)   |
+-------------------+             +-----------------------+             +-----------------------+
          ^                                                                         |
          |                                                                         v
          |                                                             +-----------------------+
          | Writes Results                                              |      Judge0 CE        |
          +-------------------------------------------------------------|      Sandbox          |
                                                                        |   (Runs User Code)    |
                                                                        +-----------------------+
```

### Sandbox Limits & Constraints
To prevent resource abuse, the gateway enforces strict container limits on every execution:
* **CPU Allocation:** Limited to a maximum of 0.5 vCPU per submission to prevent denial-of-service loops.
* **Memory Limits:** Hard-capped at 256MB. Exceeding this triggers a `Memory Limit Exceeded` (MLE) status.
* **Wall Time Limits:** Hard-capped at 5.0 seconds. Long-running scripts are killed, returning a `Time Limit Exceeded` (TLE) verdict.
* **Output Buffer limits:** Maximum standard output allocation is restricted to 1MB to prevent disk write attacks.
* **Network Isolation:** Network adapters are completely disabled inside execution sandboxes.

### Compilation Execution Sequence
1. The user requests code compilation; the backend validates their session phase and rate limits. The API gateway caps compilation payloads at 64KB and rate-limits requests per session to block DoS flood attempts.
2. The code, target language, and test cases are packaged into a JSON payload and pushed to a Redis queue.
3. A BullMQ worker picks up the job and sends the compilation payload to the Judge0 CE container.
4. The worker listens for task completion callbacks from Judge0 (rather than executing continuous HTTP loops).
5. Once complete, the worker parses the output, logs stdout, stderr, run durations, and peak memory, writes the results to `submissions` and `verdicts` tables in PostgreSQL, and pushes the completion results to the client via Server-Sent Events (SSE) or WebSockets.

---

## 5. Telemetry & Analytics Event Logging

PatternForge tracks cognitive growth by analyzing user behavior. Every interface action is logged to compile progress metrics.

### Event Tracking Schema
Telemetry records are written to a partitioned `telemetry_logs` table (using time-series database models like TimescaleDB or monthly PostgreSQL partition tables, writing events cached in Redis in bulk intervals to secure database transactions):
* `id`: Unique identifier (UUID).
* `user_id`: Link to the initiating user.
* `session_id`: Optional link to the current practice session.
* `event_name`: String key representing the action (e.g., `first_code_edit`, `pattern_clue_requested`).
* `created_at`: Precise millisecond timestamp.
* `payload`: JSONB document capturing action-specific attributes (e.g., keystroke intervals, duration before opening hints).

### Core Tracking Events
* **`problem_opened`:** Captures starting baselines, problem IDs, and active language contexts.
* **`pattern_guess_submitted`:** Logs guess lists, justifications, and guess sequence numbers.
* **`observation_submitted`:** Logs the length of observation inputs and the AI scoring results.
* **`editor_unlocked`:** Records the time elapsed before the user could begin coding.
* **`code_run_requested`:** Tracks execution types (sample run vs. custom input) and code lengths.
* **`submission_passed`:** Logs code snapshots, durations, memory footprints, and passing counts.
* **`reflection_submitted`:** Captures reflection texts and AI-rated depth levels.

---

## 6. Security, Reliability & Compliance

### API Security & Isolation
* **Authentication:** All routes are protected by JWT session strategies.
* **Route Constraints:** Request handlers check user ownership on resources (e.g., checking if the user owns the `sessionId` being updated).
* **Test Case Security:** Hidden test cases inputs and expected outputs are never returned to client endpoints; error logs return only failures on sample validation boundaries.
* **Referential Cascades:** Define explicit cascade rules on deletion (e.g., `onDelete: Cascade` rules mapping problems to associated test cases and starter codes, and `onDelete: Cascade` mapping users to profiles).

### AI Orchestration Security & Fallbacks
* **Structured Parsing Guards:** The orchestrator runs all LLM outputs through Zod schema validation checks before saving metrics.
* **System Fallbacks:** If AI services experience outages or rate limits (HTTP 429), the backend catches parsing failures and falls back to deterministic parsing checklists (e.g. checking observations against regex-based constraint matches or keyword lists), logging warnings to monitoring services.
* **Prompt Version Controls:** Prompt templates are stored in versioned folders (e.g., `/prompts/v2/observation-scoring.txt`) along with validation rubrics, logging prompt versions in database entries to preserve evaluation consistency.
* **Cost Optimizations:** Responses for deterministic inputs are cached in Redis to control LLM token costs. Rate limiters restrict AI calls per session to prevent API abuse.

### Compliance & Data Privacy
* **Consent Framework:** Implement an explicit user opt-in notice for keyboard timing telemetry and speech recording modules during onboarding, details of which are shared in compliance agreements.
* **Automated Data Purging:** To align with GDPR/DPDPA data compliance rules, execute background cron jobs to purge raw keystroke and telemetry log tables older than 90 days.
