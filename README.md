# PatternForge AI

PatternForge AI is a thinking-first coding practice workspace for learning data-structure and algorithm patterns. It combines a visual prerequisite journey, spaced-repetition pattern cards, company-style assessment practice, mistake analytics, and AI-generated coding problems in one application.

## What is included

- Visual learning journey with prerequisite paths and topic detail drawers
- Curated algorithm subtopics with AI-generated problems for targeted practice
- Pattern Library with flip cards and SuperMemo-2 review ratings
- Corporate assessment arena for Google, Amazon, Meta, and Microsoft-style drills
- Mistake Intelligence dashboard for assessment and execution analytics
- Monaco-based coding workspace with execution and submission flows
- Docker Compose setup for PostgreSQL, Redis, Judge0, backend, and frontend

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Framer Motion, D3
- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ
- Code execution: Judge0
- AI providers: Groq and Gemini-compatible API keys

## Project structure

```text
.
├── frontend/          Next.js application
├── backend/           NestJS API and Prisma schema/migrations
├── Architecture-docs/ Product and technical design documentation
├── implementation-docs/ Implementation notes and phase plans
├── project-docs/      Product vision, personas, stories, and metrics
├── docker-compose.yml Local multi-service development stack
└── package.json       Workspace scripts
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop, if using the full Compose stack
- PostgreSQL and Redis for local backend development
- Judge0 for code execution workflows
- Groq or Gemini credentials for AI features

## Local setup

Install workspace dependencies from the repository root:

```bash
npm install
```

Create environment files locally. Do not commit them:

`frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres_secure_pass@localhost:5432/patternforge_db?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-local-secret
PORT=4000
GROQ_API_KEY=your-local-key
GEMINI_API_KEY=your-local-key
```

Apply the Prisma schema and migrations before starting the API:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Start the backend and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open the application at [http://localhost:3000](http://localhost:3000).

## Docker setup

The Compose file starts PostgreSQL, Redis, Judge0, the NestJS API, and the Next.js frontend:

```bash
docker compose up --build
```

The main services are available at:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`
- Judge0: `http://localhost:8000`

## Useful scripts

Run these from the repository root:

```bash
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
```

Frontend-only commands:

```bash
cd frontend
npm run lint
npm run build
```

Backend-only commands:

```bash
cd backend
npm run lint
npm run test
npm run test:e2e
```

## Main routes

- `/` Authentication
- `/dashboard` Visual learning journey
- `/library` Pattern Library
- `/interview-arena` Company assessment practice
- `/mistakes` Mistake Intelligence
- `/dashboard/creator` AI Problem Creator
- `/workspace/:sessionId` Coding workspace

## Notes for contributors

- Keep secrets in local environment files and never commit API keys.
- Keep Prisma migrations under version control.
- Keep product, architecture, and implementation documentation under their respective documentation folders.
- Generated build output, dependency folders, local scratch files, screenshots, and machine-specific startup notes are ignored by Git.
- Run the focused frontend lint/type checks before opening a pull request.

## License

No public license has been selected for this repository yet. Add a `LICENSE` file before distributing the project outside its intended development group.
