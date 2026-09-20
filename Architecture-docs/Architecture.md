# PatternForge AI - Product Architecture

## 1. Product Context

PatternForge AI is a DSA preparation platform for users who want to improve their problem-solving ability and get placed in top product-based technology companies. The product is not just another problem repository. It combines a LeetCode-style coding environment with a structured learning system that trains:

- Pattern recognition
- Observation quality
- Formula derivation
- Optimization reasoning
- Edge-case thinking
- Interview performance under time pressure
- Reflection and long-term retention

The core product promise is:

> Help users move from "I can understand a solution after seeing it" to "I can independently discover the solution during an interview."

The architecture must therefore support two systems at the same time:

1. A reliable coding platform similar to LeetCode, including editor, submissions, test cases, and judging.
2. A learning intelligence platform that measures how the user thinks before, during, and after coding.

## 2. Architectural Philosophy

### Thinking-First Product Flow

The primary workflow is not:

```text
Problem -> Code -> Submit -> Next Problem
```

PatternForge uses:

```text
Problem -> Observation -> Pattern Identification -> Formula/Approach Reasoning
-> Code -> Run/Test -> Submit -> Analyze -> Reflect -> Store Pattern
```

The architecture must enforce this flow at the product level. The backend should know whether a user has completed the required thinking stages before allowing final submission, while still supporting flexible practice modes later.

### LeetCode-Like Coding Experience

The coding experience should feel serious, fast, and familiar:

- Monaco Editor in the frontend
- Multi-language support through Judge0 CE
- Run against sample tests
- Submit against hidden tests
- View verdicts, runtime, memory, and failed cases when allowed
- Save draft code per problem and language
- Support custom test cases

The platform must be pleasant enough for daily use, because the learning loop only works if users actually want to solve inside the environment.

### Modular Monolith First, Service Boundaries Later

For the MVP, PatternForge should be built as a modular monolith rather than many separately deployed microservices. The product has many domains, but early development speed matters more than distributed-system complexity.

The backend should still keep clear module boundaries so that future extraction is possible:

- Auth and user profile
- Problem catalog
- Learning session engine
- Pattern discovery
- Observation training
- Code execution gateway
- Submission and verdict processing
- AI feedback orchestration
- Pattern library
- Mistake intelligence
- Roadmap and adaptive difficulty
- Interview simulation
- Analytics and reporting

### Observability as Product Data

PatternForge measures cognitive growth, not just problem count. User actions are learning signals:

- Time spent reading the problem
- Time before first code edit
- Pattern guesses and reguesses
- Observation text quality
- Number of runs before submission
- Failed test categories
- Hint usage
- Reflection depth
- Time-to-correct and time-to-optimal

These events should be captured intentionally from day one.

## 3. Suggested Tech Stack

| Layer | Recommended Choice | Reason |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Full-stack friendly, strong routing, SSR where useful, good ecosystem |
| Editor | Monaco Editor | Industry-standard browser code editor, familiar to VS Code users |
| Styling | Tailwind CSS or existing design system | Fast iteration with consistent UI primitives |
| Backend API | Node.js + Express or NestJS | TypeScript end-to-end; NestJS preferred if structure grows quickly |
| Database | PostgreSQL | Strong relational model plus JSONB for AI metadata |
| ORM | Prisma | Type-safe schema and migrations |
| Code Judge | Judge0 CE self-hosted | Multi-language execution without building sandboxing from scratch |
| Cache/Queue | Redis + BullMQ + SSE / WebSockets | Submission queues, async AI tasks, spaced-repetition jobs, and real-time frontend execution notifications |
| Object Storage | Local storage in MVP, Cloudflare R2/S3 later | Screenshots, imported PDFs, exported reports, generated artifacts |
| AI Layer | Provider-agnostic AI orchestration service | Keeps prompts, evaluation rubrics, and model choice isolated |
| Auth | JWT sessions or NextAuth/Auth.js | Fast MVP auth with room for OAuth later |
| Deployment | Docker Compose for MVP | Easy local/self deployment with app, Postgres, Redis, Judge0 |
| Monitoring | Structured logs + basic metrics | Needed for judge health, queue failures, AI cost, and product analytics |

## 4. High-Level System Architecture

```text
User Browser
  |
  | HTTPS
  v
Next.js Web App
  - Monaco coding workspace
  - Problem reader
  - Observation and pattern panels
  - Submission results
  - Pattern library
  - Dashboard and roadmap
  |
  | REST/JSON or tRPC
  v
Backend API
  - Auth and authorization
  - Problem/session state machine
  - Submission API (streams execution updates via SSE)
  - Learning analytics API
  - AI orchestration endpoints
  |
  +--------------------+
  |                    |
  v                    v
PostgreSQL          Redis / Queue
  - Users              - Submission jobs
  - Problems           - AI evaluation jobs
  - Test cases         - Weekly reports
  - Sessions           - Spaced repetition jobs
  - Attempts           - Judge polling jobs
  - Reflections
  - Skill scores
  |
  v
AI Orchestrator
  - Pattern feedback
  - Observation scoring
  - Reflection scoring
  - Mistake diagnosis
  - Mentor notes

Backend API
  |
  | Internal network only
  v
Judge0 CE Self-Hosted
  - Runs code in isolated workers
  - Returns stdout/stderr/status/runtime/memory
  - Supports multiple languages
```

## 5. Core Product Modules

### 5.1 Authentication and User Profile

Responsibilities:

- Register/login users
- Store target companies, timeline, preferred languages, current level
- Track preparation goal such as campus placement, service-to-product switch, or senior interview preparation
- Store interview dates and daily availability

Key entities:

- User
- UserProfile
- TargetCompany
- UserLanguagePreference
- InterviewGoal

### 5.2 Problem Catalog

Responsibilities:

- Store native PatternForge problems
- Store imported problems from text, URL, screenshot, or PDF
- Normalize problem statements into a common schema
- Attach topics, patterns, difficulty, constraints, examples, starter code, editorial metadata, and test cases

Key entities:

- Problem
- ProblemExample
- ProblemConstraint
- ProblemPattern
- ProblemTopic
- StarterCode
- TestCase

### 5.3 Learning Session Engine

The learning session is the central state machine for one user's attempt on one problem.

Example states:

```text
CREATED
READING_PROBLEM
PATTERN_DISCOVERY
OBSERVATION_TRAINING
APPROACH_REASONING
CODING_UNLOCKED
RUNNING_CODE
SUBMITTED
ANALYZED
REFLECTION_REQUIRED
COMPLETED
```

This state machine prevents the product from becoming a plain judge. For example:

- Final submission can require completed pattern and observation phases.
- Reflection can be required before a problem counts as fully completed.
- Interview simulation can use stricter timers and fewer hints.

Key entities:

- LearningSession
- SessionPhaseEvent
- TimerSnapshot
- HintUsage
- SessionMode

### 5.4 Pattern Discovery

Responsibilities:

- Present possible algorithmic patterns
- Store user's selected pattern hypothesis and justification
- Evaluate the hypothesis through rules plus AI feedback
- Give targeted clues without immediately revealing the answer
- Track first-attempt pattern accuracy

Key entities:

- PatternGuess
- PatternFeedback
- PatternClue

### 5.5 Observation Training

Responsibilities:

- Collect structured observations before coding
- Score completeness, relevance, and depth
- Compare user's observations against critical observations for the problem
- Feed missed observations into mistake intelligence

Observation categories:

- Input properties
- Output properties
- Constraint implications
- Edge cases
- Invariants
- Brute-force baseline
- Optimization clues

Key entities:

- ObservationSet
- ObservationItem
- ObservationScore
- CriticalObservation

### 5.6 Coding Workspace

Frontend responsibilities:

- Monaco Editor integration
- Language selector
- Starter code insertion
- Draft autosave
- Sample test runner UI
- Custom test case panel
- Submission result panel
- Runtime/memory display
- Optional visualizer for arrays, trees, graphs, stacks, queues, and pointers

Backend responsibilities:

- Store code drafts
- Create run and submit requests
- Map languages to Judge0 language IDs
- Validate whether a session can be submitted
- Save verdicts and execution metrics

Key entities:

- CodeDraft
- CodeRun
- Submission
- SubmissionResult
- CustomTestCase

## 6. Code Execution Architecture with Judge0 CE

PatternForge should not execute arbitrary user code inside the main application container. All code execution must go through a separate Judge0 CE deployment.

### Execution Flow

```text
1. User clicks Run or Submit in Monaco.
2. Frontend sends code, language, problemId, and sessionId to Backend API.
3. Backend validates auth, session state, language support, and rate limits.
4. Backend builds Judge0 submission payload.
5. Backend sends payload to Judge0 CE over the private Docker network.
6. Judge0 executes code in its sandboxed worker environment.
7. BullMQ workers receive compilation completion signals from Judge0.
8. Backend stores verdict, runtime, memory, stdout, stderr, and failed case metadata in PostgreSQL.
9. Backend streams the normalized compilation results to the Frontend Client over a Server-Sent Events (SSE) connection or WebSockets stream.
10. Learning analytics events are logged.
```

### Run vs Submit

| Action | Test Scope | User Visibility | Product Meaning |
|---|---|---|---|
| Run | Sample tests + custom tests | Full stdout/stderr and case details | Practice and debugging |
| Submit | Hidden official tests | Verdict, selected failed-case info based on mode | Counts toward attempt history and learning metrics |

### Judge0 Deployment Notes

Judge0 CE should be self-hosted using Docker Compose and kept behind the backend. The browser should never call Judge0 directly.

Recommended containers:

- App backend
- Frontend
- PostgreSQL for PatternForge
- Redis for PatternForge queues
- Judge0 server
- Judge0 workers
- Judge0 Redis
- Judge0 Postgres

Judge0 resources should be limited:

- CPU limit per execution
- Memory limit per execution
- Wall-time limit
- Max output size
- Disabled network access inside execution containers
- Rate limits per user/session

## 7. AI Orchestration Architecture

The AI layer should be a backend module, not scattered across frontend components.

Responsibilities:

- Build prompts from trusted problem metadata and user inputs
- Score observations and reflections
- Evaluate pattern reasoning
- Generate mentor feedback
- Classify mistakes
- Produce solution path analysis
- Generate or validate test cases for imported problems
- Create Pattern Cards

### AI Request Pattern

```text
Frontend action
  -> Backend API
  -> AI Orchestrator
  -> Prompt template + rubric + context builder
  -> Model provider
  -> Structured response validation
  -> Store result in PostgreSQL
  -> Return normalized feedback to frontend
```

AI responses should be stored as structured data whenever possible, not only raw text. For example, observation scoring should produce:

```json
{
  "completeness": 72,
  "relevance": 80,
  "depth": 61,
  "missedCriticalObservations": ["sorted input", "n <= 100000"],
  "feedback": "You noticed the constraint size but did not connect it to the required time complexity."
}
```

### AI Safety and Product Constraints

- Do not reveal full solutions during restricted phases.
- Separate clue generation from answer generation.
- Log whether a hint, clue, or full explanation was used.
- Use strict schemas for AI outputs that affect scoring.
- Keep model/provider choice replaceable.
- Cache deterministic feedback where appropriate to reduce cost.

## 8. Data Model Overview

### Core Tables

| Table | Purpose |
|---|---|
| users | Account identity |
| user_profiles | Goals, timeline, preferred languages, target companies |
| problems | Canonical problem metadata |
| problem_examples | Public examples |
| problem_constraints | Constraints and expected complexity clues |
| problem_topics | Topic tags such as arrays, graphs, DP |
| problem_patterns | Pattern tags such as sliding window, binary search |
| starter_codes | Language-specific starter code |
| test_cases | Sample, hidden, edge, adversarial, and stress tests |
| learning_sessions | One user attempt on one problem |
| session_events | Timeline of user actions and behavioral signals |
| pattern_guesses | Pattern selections and justifications |
| observations | User-written pre-coding observations |
| code_drafts | Autosaved code by session/language |
| submissions | Final submissions |
| code_runs | Non-final code executions |
| verdicts | Normalized Judge0 results |
| reflections | Post-problem reflection answers |
| pattern_cards | Personalized learning cards |
| mistake_logs | Categorized mistakes and root causes |
| skill_scores | Rolling dimensional skill scores |
| roadmap_items | Personalized plan assignments |
| mentor_notes | AI mentor messages and recommendations |

### JSONB Fields

PostgreSQL JSONB is useful for AI-generated or variable data:

- AI scoring metadata
- Judge output details
- Problem import extraction metadata
- Rubric versions
- Pattern card generated content
- Mistake diagnosis details
- Company-specific simulation scoring

Use JSONB for flexible metadata, but keep core query fields relational.

PatternForge needs event tracking because learning progress depends on behavior.

### Keystroke and Telemetry Storage Optimization
Because user tracking is highly write-intensive (capturing thinking times, keystroke pauses, and scroll events), writing telemetry directly to PostgreSQL causes transaction locks. Telemetry events are captured in memory on the client, debounced locally to `localStorage` every 2000ms, and flushed to Redis cache buffers on the backend. A scheduled worker periodically consolidates and writes Redis logs in bulk to a separate partitioned database or time-series storage (e.g. TimescaleDB or Postgres partitioned tables) to insulate transactional performance.

### Client-Side State Synchronization & Offline Resiliency
* **Multi-Tab Sync:** To prevent state conflicts when the platform is opened in multiple browser tabs, client stores leverage the **Broadcast Channel API** to sync code drafts and session status transitions across open tabs.
* **Offline Buffering:** If connections drop, Monaco draft changes and observations are buffered in the browser's **IndexedDB**. Once online states return, the local data is reconciled and synced back to Redis cache buffers.

Important events:

- `problem_opened`
- `pattern_guess_submitted`
- `pattern_clue_requested`
- `observation_submitted`
- `editor_unlocked`
- `first_code_edit`
- `code_run_requested`
- `submission_created`
- `submission_passed`
- `submission_failed`
- `custom_test_added`
- `reflection_submitted`
- `pattern_card_created`
- `mentor_recommendation_shown`
- `mentor_recommendation_acted_on`

Each event should include:

- userId
- sessionId
- problemId
- timestamp
- mode
- phase
- metadata

This supports dashboards such as:

- Pattern recognition accuracy
- Observation quality trend
- Time-to-first-code
- Time-to-pattern
- Hint dependency
- Failure category distribution
- Interview simulation score trend

## 10. Personalized Learning Engine

The Personalized Learning Engine uses skill scores, mistake logs, target companies, and timeline to decide what the user should practice next.

Inputs:

- Assessment results
- Recent session performance
- Pattern accuracy
- Observation scores
- Submission verdicts
- Mistake categories
- Reflection quality
- Target companies
- Time until interview
- Daily availability

Outputs:

- Daily challenge
- Weekly roadmap
- Recommended drills
- Spaced repetition cards
- Interview simulation readiness
- Mentor notes

MVP can begin with deterministic rules:

```text
If observation score is low and pattern errors are high:
  assign observation drills + guided medium problems.

If user solves correctly but suboptimally:
  assign optimization-focused problems and solution path analysis.

If interview is within 2 weeks:
  reduce new-topic learning and increase simulation consistency.
```

Later, this can evolve into a more sophisticated recommendation engine.

## 11. Pattern Library and Spaced Repetition

Every completed problem should generate a Pattern Card after reflection.

Pattern Card fields:

- Problem name
- Topic
- Pattern
- Trigger clues
- Critical observations
- Brute-force approach
- Optimization insight
- Complexity transition
- Mistakes user made
- Reflection summary
- Review due date

Spaced repetition can be handled through scheduled jobs:

```text
Card created -> review in 1 day
Successful review -> review in 3 days
Successful review -> review in 7 days
Successful review -> review in 14 days
Weak review -> reset interval
```

## 12. Interview Simulation Arena

Interview Simulation is a stricter version of the normal learning session.

Differences from regular practice:

- Fixed timer
- Limited or disabled hints
- More realistic problem sequencing
- Company-specific scoring rubrics
- Emphasis on explanation, edge cases, and optimization
- Post-simulation report

Company modes can be implemented as configuration:

| Mode | Configuration |
|---|---|
| Google | Harder optimization, graphs/DP, explanation quality |
| Amazon | Edge cases, scalable reasoning, medium-hard consistency |
| Microsoft | Implementation clarity, clean code, follow-up extensions |
| Uber | Graphs, real-world constraints, systems-style reasoning |
| Adobe | Recursion, backtracking, creative reasoning |

## 13. Security and Reliability

### Code Execution Security

- Never execute user code in the main backend.
- Keep Judge0 private and reachable only by backend services.
- Enforce CPU, memory, wall-time, and output limits.
- Rate-limit Run and Submit endpoints.
- Sanitize and size-limit custom input.
- Store only necessary stdout/stderr.
- Treat all user code and custom test input as untrusted.

### API Security

- Require authentication for user data.
- Enforce ownership checks for sessions, submissions, drafts, and reports.
- Validate request bodies with schemas.
- Keep admin/problem-authoring APIs separate from user APIs.
- Avoid exposing hidden test cases through error messages.

### AI Reliability

- Validate AI responses against schemas.
- Version prompt templates and rubrics.
- Store AI result provenance: model, prompt version, createdAt.
- Fall back to deterministic feedback if AI calls fail.
- Separate user-facing feedback from scoring fields.

## 14. MVP Scope

The MVP should prove the main learning loop and coding environment.

### Build Now

- Auth and user profile
- Problem catalog with curated DSA problems
- Monaco coding workspace
- Judge0 CE self-hosted execution
- Run sample/custom tests
- Submit hidden tests
- Pattern Discovery gate
- Observation Training panel
- Basic AI feedback for pattern and observations
- Reflection prompts
- Pattern Card generation
- Basic dashboard with core metrics

### Defer Until After MVP

- Full company-specific interview simulations
- Screenshot/PDF problem import
- Advanced visualizers
- Institutional dashboards
- Voice mock interviewer
- Deep adaptive difficulty engine
- Public certification system

## 15. Deployment Architecture

### Local Development

```text
docker-compose
  - frontend
  - backend
  - postgres
  - redis
  - judge0-server
  - judge0-worker
  - judge0-postgres
  - judge0-redis
```

Local development should support seeded problems and test cases so the complete loop can be tested end-to-end.

### Production MVP

Recommended first production shape:

- Frontend deployed separately or served by Next.js
- Backend API deployed as a container
- Managed PostgreSQL for PatternForge data if budget allows
- Redis for queues
- Judge0 CE on isolated VM/container infrastructure
- Object storage for uploads and exports
- Centralized logs
- Daily database backups

Judge0 should be scaled separately from the main API because execution load behaves differently from normal web traffic.

## 16. Future Upgrade Path

```text
Phase 1: Modular monolith
  Next.js + Backend API + PostgreSQL + Redis + Judge0 CE

Phase 2: Async intelligence
  Add robust queues for AI analysis, reports, spaced repetition, imports

Phase 3: Scale execution
  Separate Judge0 workers, autoscale execution capacity, improve rate limits

Phase 4: Dedicated learning services
  Extract recommendation engine, analytics service, and AI mentor service if needed

Phase 5: Institutional platform
  Add cohort management, college dashboards, placement analytics, admin controls
```

## 17. Key Engineering Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Judge0 setup complexity | Delays coding platform MVP | Containerize early and test execution before building advanced product flows |
| Hidden test leakage | Breaks trust and assessment quality | Strict API shaping; never return hidden inputs unless explicitly allowed |
| AI feedback inconsistency | Bad learning experience | Use rubrics, schemas, prompt versions, and stored critical observations |
| Overbuilding adaptive logic early | Slows MVP | Start with simple rules and improve from real user data |
| Too much friction before coding | Users may abandon sessions | Keep thinking gates focused, measurable, and fast |
| Weak problem/test quality | Judge becomes unreliable | Build authoring/review workflow for problems and tests |
| Execution abuse | Infrastructure cost/security risk | Rate limits, quotas, Judge0 isolation, and resource caps |

## 18. Architectural North Star

Every technical decision should support the same product outcome:

> A user opens a problem, learns how to think before coding, writes and tests code in a real interview-like environment, receives precise feedback, reflects on the mistake or insight, and becomes measurably better for the next problem.

If a feature does not improve that loop, it should wait.
