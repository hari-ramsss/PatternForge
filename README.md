# PatternForge

<p align="center">
  <img src="frontend/public/flame.png" alt="PatternForge flame logo" width="120" />
</p>


### Personalized Algorithmic Thinking & Pattern Recognition Training


PatternForge is a coding-practice workspace built around the reasoning that happens before and after writing code. It helps learners examine a problem, choose a plausible algorithmic approach, practice in an interactive editor, run real test cases, and revisit reusable patterns.

## The Story Behind PatternForge

While preparing for technical interviews and solving a large number of coding problems, I noticed a frustrating gap: it is possible to solve hundreds of problems and still feel stuck when a new one looks unfamiliar.

The hard part is often not typing the code. It is deciding what matters in the prompt, spotting the useful constraints, recognizing a familiar structure, and turning those observations into an approach. After a failed attempt, it is just as easy to remember the answer without learning what to notice next time.

I built PatternForge to give those parts of practice more room. The goal is not another problem counter. It is a workspace for practicing the thinking around the solution: analyze, form an approach, code, evaluate, and carry a pattern forward.

## The Problem

Traditional practice can feel like a short loop:

~~~text
Problem → Code → Submit → Accepted / Wrong Answer
~~~

PatternForge is designed around a broader learning loop:

~~~text
Problem → Observe → Identify signals → Form an approach
        → Recognize a pattern → Code → Evaluate → Review
~~~

That loop is the product philosophy, not a claim that every step is required for every problem. The onboarding quiz records a deterministic baseline across pattern recognition, observation, optimization, speed, and consistency. In the workspace, learners can plan an approach and submit it for evaluation before coding, but the guided flow can be bypassed.

## Why PatternForge?

Coding platforms are valuable for practicing problems and checking whether a solution passes. PatternForge puts more emphasis on the reasoning that can make a solution transferable to a different problem.

> Practice problems to improve your code. Study the patterns behind them to get better at unfamiliar problems.

## Product Capabilities

- **Visual practice journey:** Browse algorithm topics, subtopics, and assigned problems through a visual learning interface.
- **Guided coding workspace:** Read a problem, inspect constraints and examples, record a proposed time and space complexity and pseudocode, and request approach feedback before coding. The flow can be bypassed.
- **Interactive editor and execution:** Edit in Monaco, save drafts, run custom inputs, submit solutions, and receive streamed execution status and test-case results.
- **AI learning assistance:** Ask the coding coach for conceptual help, get feedback on a proposed approach, and generate or regenerate practice problems.
- **Pattern Library:** Create and review pattern cards. Review intervals are updated using a SuperMemo-2-style ease factor and repetition schedule.
- **Timed assessment scenarios:** Launch company-themed coding practice sessions. These are practice scenarios, not official assessments or endorsements by the named companies.
- **Mistake dashboard:** A dashboard is present, but its current category counts and recent verdict history include hard-coded sample data. They should not be interpreted as a complete record of a learner’s performance.

The diagnostic quiz uses explicit scoring rules; it is not an AI evaluation. Pattern matching feedback is based on problem-topic matching. AI is used for the separate approach evaluation and coaching flows.

## AI Architecture

The backend centralizes AI calls in an orchestrator. Configured Groq and Gemini providers are tried for supported tasks such as approach feedback, coach chat, edge-case generation, and problem generation.

~~~mermaid
flowchart LR
    A[Next.js frontend] --> B[NestJS API]
    B --> C[AI orchestrator]
    C --> D[Groq provider]
    C --> E[Gemini provider]
    D --> F[Structured learning response]
    E --> F
    C --> G[Deterministic fallback for selected tasks]
    F --> A
    G --> A
~~~

Approach evaluation and edge-case generation have deterministic fallbacks when providers are unavailable. Coach chat returns a generic fallback response. AI problem generation requires a working provider. AI feedback is advisory: it does not decide whether submitted code compiled or passed.

## Code Execution Architecture

Code submitted in the workspace is queued through BullMQ and processed by the NestJS backend. The processor sends execution requests to the Judge0 service, polls for results, saves submissions, and streams status updates to the browser using server-sent events.

~~~mermaid
flowchart LR
    A[Browser editor] --> B[NestJS API]
    B --> C[Redis and BullMQ queue]
    C --> D[NestJS execution processor]
    D --> E[Judge0 server]
    E --> G[Judge0 Redis]
    F[Judge0 worker] --> G
    E --> H[PostgreSQL]
    F --> H
    B --> H
    D --> H
    D --> I[Execution result stream]
    I --> A
~~~

Judge0 is a dedicated code-execution service, separate from the main API process. Execution requests currently map Python, JavaScript, C++, and Java to Judge0 language IDs and set per-test-case resource limits (2 seconds CPU, 128 MiB memory, and 4 seconds wall time). This separation and these limits reduce risk; they are not a claim that arbitrary code execution is risk-free.

## Production Architecture

The deployed system separates the browser-delivered frontend from the persistent API and execution infrastructure:

~~~mermaid
flowchart TB
    U[User browser]
    V[Vercel<br/>Next.js frontend]
    D[HTTPS API hostname<br/>patternforge.work.gd]
    C[Caddy reverse proxy<br/>TLS termination on Azure VM]
    N[NestJS backend<br/>Docker container]
    P[(PostgreSQL)]
    R[(Application Redis)]
    J[Judge0 server]
    W[Judge0 worker]
    JR[(Judge0 Redis)]

    U -->|Loads app over HTTPS| V
    U -->|API requests over HTTPS| D
    D --> C --> N
    N --> P
    N --> R
    N --> J
    J --> JR
    W --> JR
    J --> P
    W --> P
~~~

- **Frontend:** [Vercel deployment](https://pattern-forge-eosin.vercel.app/)
- **API:** [https://patternforge.work.gd/api](https://patternforge.work.gd/api)
- **Health check:** [https://patternforge.work.gd/api/health](https://patternforge.work.gd/api/health)
- **Backend host:** Azure VM running Docker Compose services.
- **Public entry point:** Caddy runs on the VM host, terminates HTTPS for the API hostname, and reverse-proxies to the backend container.

The Azure NSG permits public HTTP/HTTPS traffic to Caddy. PostgreSQL, application Redis, and the Judge0 HTTP port are bound to loopback on the VM; they are not intended as public endpoints. Containers communicate through Docker Compose networking.

## Docker Architecture

The production Compose file is `azure-infra/docker-compose.yml`. It runs:

| Service | Role |
|---|---|
| `backend` | NestJS API and BullMQ execution processor |
| `postgres` | Application database and Judge0 database |
| `redis` | Application queue and draft cache |
| `judge0-server` | Judge0 submission API |
| `judge0-worker` | Judge0 code-execution worker |
| `judge0-redis` | Redis used by Judge0 |

PostgreSQL and application Redis data use named Docker volumes. The `azure-infra/init-db.sh` script creates the separate database used by Judge0. Caddy is installed as a host service; it is not a Compose container.

Docker gives the backend components reproducible service environments and a shared network. Azure provides the persistent VM needed to run the API, database, queues, and self-hosted Judge0 services together. Vercel serves the Next.js frontend; it does not replace the backend execution infrastructure.

## Data and Request Flow

The NestJS API uses Prisma to read and write PostgreSQL records for users, profiles, problems, curriculum assignments, examples, diagrams, constraints, test cases, drafts, submissions, telemetry, and pattern cards.

Redis serves the BullMQ compile queue and short-lived draft storage. Judge0 handles compilation and execution. AI providers handle selected language-learning tasks. These responsibilities stay separate so an AI response is not treated as an execution verdict.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS, Framer Motion, D3, Recharts, Mermaid |
| Code editor | Monaco Editor |
| API | NestJS, TypeScript |
| Data access | Prisma |
| Database | PostgreSQL |
| Queue and cache | Redis, BullMQ |
| AI providers | Groq and Gemini (configured on the backend) |
| Code execution | Judge0 CE |
| Infrastructure | Docker, Docker Compose, Azure VM |
| Reverse proxy and TLS | Caddy |
| Frontend hosting | Vercel |

## Security and Isolation

- Caddy serves the API through HTTPS; the Azure NSG controls inbound access.
- Database, application Redis, and Judge0’s API port are not published on public interfaces by the production Compose configuration.
- Protected API routes use JWT authentication. Production startup exits if `DATABASE_URL`, `REDIS_URL`, or `JWT_SECRET` is missing.
- Secrets belong in environment files on the relevant host or in the hosting provider’s environment settings, never in source control.
- Before queueing code, the API applies a source-pattern check, a 64 KiB code-size limit, and a limit of 10 execution requests per user per minute. Judge0 runs the submitted code with configured resource limits.

These controls are defense-in-depth measures, not a blanket security guarantee. The code-pattern check is not a substitute for isolated execution.

## Local Development

### Run the frontend against the deployed API

Requirements: Node.js 20 or newer and npm.

Install the workspace dependencies from the repository root:

~~~bash
npm install
~~~

Create `frontend/.env.local`:

~~~env
NEXT_PUBLIC_API_URL=https://patternforge.work.gd/api
~~~

Start the frontend from the repository root:

~~~bash
npm run dev:frontend
~~~

Open [http://localhost:3000](http://localhost:3000). The `NEXT_PUBLIC_API_URL` value is public frontend configuration, not a secret.

### Run the backend locally through SSH tunnels

The current development workflow can run NestJS locally while forwarding the VM’s loopback-only PostgreSQL, Redis, and Judge0 ports over SSH. Keep this tunnel open in one terminal:

~~~bash
ssh -i <path-to-private-key> -N \\
  -L 5432:127.0.0.1:5432 \\
  -L 6379:127.0.0.1:6379 \\
  -L 8000:127.0.0.1:8000 \\
  azureuser@104.211.93.157
~~~

Create `backend/.env` using the credentials provisioned for the database and Redis. Set the hostnames to the forwarded local ports:

~~~env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:5432/patternforge_db?schema=public
REDIS_URL=redis://:<REDIS_PASSWORD>@127.0.0.1:6379
JUDGE0_URL=http://127.0.0.1:8000
JWT_SECRET=<local-development-secret>
FRONTEND_URL=http://localhost:3000
GROQ_API_KEY=<optional>
GEMINI_API_KEY=<optional>
~~~

Then point `frontend/.env.local` at the local API and start both apps from the repository root:

~~~env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
~~~

~~~bash
npm run dev:backend
npm run dev:frontend
~~~

The SSH tunnel connects to the deployed VM’s data and execution services. Treat database changes and migration commands accordingly; do not run destructive or unreviewed migrations against shared data.

### Run the containerized backend infrastructure

`azure-infra/docker-compose.yml` describes the backend services. On a Linux Docker host, create `azure-infra/.env` from `azure-infra/.env.example`, replace every placeholder with private values, then run:

~~~bash
cd azure-infra
docker compose up -d --build
# Run migrations only when intentionally applying them to this deployment.
docker compose exec backend npx prisma migrate deploy
~~~

Use this only against the database intended for that deployment. Never commit the resulting `.env` file.

## Repository Structure

~~~text
.
├── frontend/             Next.js application and browser UI
├── backend/              NestJS API, execution pipeline, Prisma schema/migrations
├── azure-infra/          Production Compose file and environment template
├── Architecture-docs/    Architecture and interface design notes
├── implementation-docs/  Implementation phase notes
├── project-docs/         Product vision, personas, and user stories
├── docker-compose.yml    Root-level all-in-one Compose configuration
├── package.json          npm workspace scripts
└── README.md
~~~

The frontend’s flame mark is rendered with `lucide-react`; the app icon is generated in `frontend/src/app/icon.tsx`. The repository does not contain a separate static logo image.

## Key Engineering Decisions

- **NestJS:** Organizes API, authentication, problems, assessment, cards, mistakes, and execution into modules.
- **PostgreSQL and Prisma:** Store relational user, problem, practice, and submission data with schema migrations.
- **Redis and BullMQ:** Queue execution work and support short-lived draft storage.
- **Judge0:** Keeps submitted-code execution outside the main API process.
- **Docker Compose:** Runs the backend’s dependent services together on the VM.
- **Azure VM:** Provides persistent compute for the API and self-hosted Judge0 stack.
- **Caddy:** Provides the public reverse proxy and HTTPS endpoint for the API.
- **Vercel:** Builds and serves the Next.js frontend independently from the backend.

## Current Scope

PatternForge is deployed as a beta with a Vercel-hosted frontend and an Azure-hosted backend. It is not described as production-ready. Some screens and assessment summaries are prototypes: in particular, mistake-category counts and recent company verdicts are sample data, and company-themed scenarios are not official employer assessments.

No formal public roadmap or repository license is currently present. No roadmap items are presented here as implemented.
