# Frontend Architecture - PatternForge AI

This document defines the web client architecture, folder structures, global state boundaries, visual design implementations, integration pipelines, and performance guidelines for the frontend of **PatternForge AI**.

---

## 1. Product & Architecture Alignment

The PatternForge AI web application is structured to deliver a **Thinking-First** DSA learning experience. Unlike traditional coding platforms that present a bare editor alongside problem statements, PatternForge implements a progressive step-by-step wizard. The interface guides users through pre-coding cognitive phases (pattern matching, observation drafting, complexity commitment) before unlocking editor tools.

### Aesthetic Design System

The frontend implements the visual guidelines specified in [design-system.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/Architecture-docs/design-system.md):
* **Canvas Background:** Utilizes a light-sand theme (`#FBF9F6`) and a dark-stone theme (`#1A1A18`) as the main canvas backgrounds.
* **Surfaces:** Floating cards, workspace split-panels, and settings widgets use light-white (`#FFFFFF`) or dark-charcoal (`#232320`) backgrounds.
* **Borders:** Subtle low-contrast panel partitions use `#EFECE6` (light) or `#2F2F2B` (dark) borders.
* **Typography Contrast:** 
  * **Editorial Typography:** Georgia, Merriweather, or Playfair Display is used for reading problem descriptions, examples, constraints, and mentor notes. This reduces scanning strain.
  * **UI Typography:** Inter or Plus Jakarta Sans is applied to dashboard metrics, interactive controls, inputs, and routing tabs.
  * **Monospace Typography:** JetBrains Mono or Fira Code is used in code blocks, Monaco workspaces, and custom diff panels.
* **Color Accents:** Accent CTA buttons use amber-gold hues (`#D97706` / `#F59E0B`). Success ticks use emerald-green (`#10B981` / `#34D399`), and diagnostic alerts use soft red (`#EF4444` / `#F87171`).

---

## 2. Next.js 15 App Router & Folder Architecture

The client application leverages **Next.js 15 (App Router)**. Routing is file-system based, split between root layouts, static marketing interfaces, and dynamic, session-locked dynamic workspaces.

### Project Folder Directory Structure

The project directory is structured into domain-specific features rather than technical layers, isolating views, hooks, and services by functionality:

```text
src/
├── app/                           # Next.js App Router Page Mappings & Layouts
│   ├── layout.tsx                 # Root wrapper (Theme, TanStack Query, Auth Context Providers)
│   ├── page.tsx                   # System landing portal & marketing pages
│   ├── dashboard/                 # Student profile landing page & diagnostic metrics
│   ├── roadmap/                   # Spaced-repetition card decks & weekly target roadmaps
│   ├── library/                   # Personal Pattern Cards grid & study search guides
│   ├── workspace/[sessionId]/     # Locked step-by-step coding workspace
│   └── simulation/                # Interview Simulation Arena entry
│
├── components/                    # Global Shared Design-System Primitives
│   ├── ui/                        # Radix UI + shadcn components (Button, Modal, Input, Drawer)
│   ├── navbar.tsx                 # Main application header controls
│   └── sidebar.tsx                # Left-side navigation bar
│
├── features/                      # Domain-specific modules (business logic + encapsulated UI)
│   ├── auth/                      # Account registration, login forms, target-company surveys
│   ├── dashboard/                 # Cognitive radar charts, learning velocity timelines
│   ├── roadmap/                   # Weekly milestone track lists, progress bars
│   ├── workspace/                 # Unified Workspace Page elements
│   │   ├── components/            # Workspace layout modules
│   │   │   ├── monaco-wrapper.tsx # Dynamic Monaco instance wrapper
│   │   │   ├── wizard-steps/      # Step screens (PatternDiscovery, ObservationTraining, etc.)
│   │   │   ├── clue-drawer.tsx    # Slide-out hints panel
│   │   │   └── data-visualizer.tsx# Visual debugger boards (arrays, pointers, graph structures)
│   │   ├── hooks/                 # Workspace hooks (useAutosave, useJudge0Polling)
│   │   └── services/              # Client API endpoints (sessions, compilations, submissions)
│   ├── pattern-library/           # Card-flipping boards, category filters, PDF export
│   └── simulation/                # Arena control modules, company visual stylesheets
│
├── hooks/                         # Global hooks (useTheme, useLocalStorage, useKeyPress)
├── lib/                           # Instantiated client wrappers (Axios client, QueryClient)
├── types/                         # Shared TS interfaces (Problem, User, Session, Verdict)
└── styles/                        # Global CSS configurations (Tailwind utilities, keyframes)
```

---

## 3. Client State Management & Zustand Store Boundaries

To minimize DOM re-renders during active practice, frontend state is decoupled into three independent **Zustand** stores:

```text
+---------------------------------------------------------------------------------+
|                                 Zustand Stores                                  |
+---------------------------------------------------------------------------------+
          |                               |                               |
          v                               v                               v
+------------------+            +------------------+            +------------------+
|  useSessionStore |            |   useEditorStore |            |useSimulationStore|
|  - Active Phase  |            |  - Monaco Ref    |            |  - Sim Mode Flag |
|  - Timers State  |            |  - Code Draft    |            |  - Company Theme |
|  - Hint Status   |            |  - Exec Verdicts |            |  - Countdowns    |
+------------------+            +------------------+            +------------------+
```

### 1. `useSessionStore` (Session Logic)
* **Responsibilities:** Tracks active `sessionId` and the current `SessionPhase` (e.g., `READING_PROBLEM`, `PATTERN_DISCOVERY`, `REFLECTION_REQUIRED`).
* **Timer Operations:** Operates internal intervals tracking student thinking times before pattern guesses are committed, and total active session durations.
* **Hint Logs:** Stores arrays of unlocked hints and counts used to calculate structural penalties.

### 2. `useEditorStore` (Workspace State)
* **Responsibilities:** Keeps references to active Monaco instances, active programming language selections (Python, Java, C++, JS), and the active code draft buffer.
* **Execution Logs:** Manages mutation states during runs, tracking temporary standard output logs and diagnostic verdicts.

### 3. `useSimulationStore` (Arena Configuration)
* **Responsibilities:** Controls strict execution conditions inside the Interview Arena.
* **Theme Accents:** Stores variables modifying global styles to fit selected corporate layouts (Google, Microsoft, Amazon).
* **Restrictions:** Controls flags disabling standard clues, hint drawers, and custom inputs.

---

## 4. Progressive Workspace Wizard UI Flow

The practice workspace uses a split-panel design:
* **Static Panel (Left):** Displays problem statements, constraint descriptions, examples, and the slide-out clue drawers.
* **Dynamic Panel (Right):** Rendered screens adapt to the user's active phase.

### Phase Interface Settings

| Phase | Right Panel Component | Primary Action | Navigation Restrictions |
|---|---|---|---|
| `READING_PROBLEM` | Locked Workspace Panel | Click "Begin Analysis" CTA | Code editor is hidden. An unlock delay blocks progression for 30s. |
| `PATTERN_DISCOVERY` | Pattern Guessing Card Grid | Click "Submit Hypothesis" | Editor is locked. Clue Drawer is open for hint requests. |
| `OBSERVATION_TRAINING` | Tabbed Observation Form | Click "Submit Observations" | Editor is locked. User must log constraints and edge-cases. |
| `APPROACH_REASONING` | Complexity Selector Deck | Click "Commit Complexity" | Editor is locked. User selects target big-O complexities. |
| `CODING_UNLOCKED` | Monaco Editor + Console | Click "Run Code" / "Submit" | Editor and run buttons are unlocked. Custom inputs are enabled. |
| `SUBMITTED` | Shimmering Status Screen | Dispatches execution poll | Editor inputs are set to read-only. Navigation is blocked. |
| `ANALYZED` | Complexity Graph Panel | Click "Begin Reflection" | Renders Recharts comparing runtime curves. Editor remains read-only. |
| `REFLECTION_REQUIRED` | Reflection Text Area Form | Click "Complete Practice" | Forms are validated. Trivial inputs shake and return warning labels. |
| `COMPLETED` | Personalized Pattern Card | Click "Return to Roadmap" | Confetti animations trigger. Renders spaced-repetition card decks. |

---

## 5. Module-by-Module Frontend Specifications

### Module 1: AI Skill Assessment Engine

#### Component Layouts
* **Wizard Dashboard:** A single-page layout that introduces diagnostic rules.
* **Diagnostic Test Bench:** A full-screen panel showing deduction exercises, pseudocode execution challenges, and observation cards without standard problem headings.
* **Diagnostic Report Card:** Renders a 6-axis Radar Chart (using Recharts) mapping the user's skill dimensions alongside an AI-authored text review.

#### User Interactions
* Selecting pattern cards from a deck using keyboard navigations.
* Drag-and-drop ordering of logic steps in algorithm assemblies.
* Submitting complexity slider calculations.

#### State Tracking & Form Validation
* Registers thinking durations (millisecond intervals) for each diagnostic step.
* Schema validations (Zod) check that all questions have answers selected before allowing final submission.

---

### Module 2: Personalized Learning Engine

#### Component Layouts
* **Roadmap Panel:** A vertical roadmap interface. Renders week-by-week cards containing core topic goals, milestone checklists, and progress progress bars.
* **Remediation Callouts:** Alert panels highlighting active coaching adjustments (e.g., *"Adjusting roadmap path: introducing 3 heap observation drills based on your recent edge-case errors"*).

#### User Interactions
* Expanding weekly cards to view assigned problems.
* Toggling focus priorities (e.g., switching roadmap views to highlight Swiggy or Microsoft prep targets).

---

### Module 3: Daily Adaptive Challenge System

#### Component Layouts
* **Challenge Card Stack:** Displays 4 stylized problem cards arranged in a grid, styled with custom hover translations and border fades.
* **Time Budget Selector:** A drawer containing radio options to select available prep durations (e.g., 30, 60, 90+ minutes), modifying active challenge distributions.

#### User Interactions
* Clicking problem cards to open session workspaces.
* Custom animations reveal locked states on subsequent challenges until current problems are completed.

---

### Module 4: Pattern Discovery Mode

#### Component Layouts
* **Algorithmic Card Deck:** A selection grid displaying common pattern categories. Cards feature custom hover animations.
* **Justification Panel:** A text area input container appearing below selected cards, prompting justification logs.

#### User Interactions
* Selecting cards highlights borders with amber accents.
* Submitting wrong guesses initiates shake animations on the card grid and slides out a clue panel highlighting problem constraints.

#### Form Validation
* A Zod schema checks that text inputs contain at least 15 characters, blocking empty submissions.

---

### Module 5: Observation Training System

#### Component Layouts
* **Observation Dashboard:** A tabbed workspace categorizing inputs: *Input Properties, Output Properties, Constraints, Edge Cases*.
* **Critical Observations Checklist:** A list of items that changes from locked to revealed upon evaluation, highlighting match accuracies.

#### User Interactions
* Adding observation items into dynamic arrays (clicking `+ Add Observation` appends input inputs).
* Submitting prompts triggers a skeleton overlay while the AI rates observations.

---

### Module 6: Formula Discovery Trainer

#### Component Layouts
* **Derivation Board:** Displays data sequence tables alongside an expression input box.
* **AST Visualizer:** A canvas structure that renders typed equations as logic trees, helping users verify recursive layouts visually.

#### User Interactions
* Inputting variable trial guesses in sandbox columns to verify expected values.
* Typing formulas using input fields, generating formatted equations on the fly.

---

### Module 7: Pattern Recognition Gym

#### Component Layouts
* **Gym Canvas:** Displays I/O array mappings in monospace blocks without wording clues.
* **Deception Alert Cards:** Warning overlays that show up when deceptive inputs are misidentified.

#### User Interactions
* Clicking pattern cards in timed runs to build speed.
* Selecting "Show Deception Pivot" triggers 3D card flips explaining structural constraint changes.

---

### Module 8: Pattern Library

#### Component Layouts
* **Card Flip Grid:** A grid showing personal **Pattern Cards**.
* **Study Guide Tool:** A modal containing PDF compilation sliders (allowing category selections before exports).

#### User Interactions
* Clicking cards triggers 3D rotate-Y animations (`Framer Motion`) to flip cards and reveal details on the back.
* Clicking rating triggers ("Remembered", "Struggled") triggers exit slides, updating spaced-repetition loops.

---

### Module 9: Interactive Coding Playground

#### Component Layouts
* **Split Editor Panel:** A three-pane grid (Left: Problem descriptions; Top-Right: Monaco workspace; Bottom-Right: Test Cases console).
* **Universal Action Pill:** A floating control hub at the bottom center of the editor pane, holding run buttons, language selections, and custom test options.

#### User Interactions
* Toggling console panels via keyboard shortcuts or button clicks.
* Expanding custom test case editors to input custom strings.

---

### Module 10: User Problem Import System

#### Component Layouts
* **Import Hub:** An interface with tabs for URL, PDF, and Screenshot imports.
* **Parsing Feed:** A console view rendering OCR extraction logs.

#### User Interactions
* Pasting URLs or dragging PDF files onto drag-and-drop regions.
* Editing extraction results in side-by-side verification panels before committing to catalog lists.

---

### Module 11: AI Test Case Generator

#### Component Layouts
* **Test Case Dashboard:** Displays lists of standard, edge, and adversarial test boundaries.
* **Parameter Range Modals:** Setup grids where users can configure generation ranges.

#### User Interactions
* Clicking "Generate Adversarial Tests" triggers progress overlays.
* Toggling visualization views on generated test arrays.

---

### Module 12: Solution Path Analyzer

#### Component Layouts
* **Analysis Dashboard:** Details optimization graphs, comparison charts, and improvement recommendations.
* **Code Diff Workspace:** A side-by-side code comparative workspace displaying user code alongside reference solutions, highlighting redundant logic sections.

#### User Interactions
* Hovering over performance curves to view execution percentiles.
* Expanding AI recommendation drawers.

---

### Module 13: Mistake Intelligence System

#### Component Layouts
* **Mistakes Feed:** Renders category pie charts (Recharts) and historical error logs.
* **Weekly Report Card:** A layout that highlights recurring errors and details correction guides from the AI coach.

#### User Interactions
* Filtering mistake history feeds by topic, pattern type, or date.
* Clicking mistake cards to open related practice drills.

---

### Module 14: Adaptive Difficulty Engine

#### Component Layouts
* **Engine Settings:** Controls displaying current baseline levels and pacing metrics.
* **Difficulty Recalibration Alerts:** Overlay notices displaying level updates (e.g., *"Difficulty adjusted to Guided Medium"*).

#### User Interactions
* Accepting level adjustments.

---

### Module 15: Interview Simulation Arena

#### Component Layouts
* **Corporate Workspace:** Apply strict style designs based on the selected company (e.g., Google's clinical grey-white workspace; swiggy's deep orange accents).
* **Timer Ribbon:** A persistent count-down bar in the top workspace navigation.
* **Transcript Feed:** A sliding drawer rendering live speech-to-text transcripts.

#### User Interactions
* Selecting target company mock profiles.
* Activating microphone streaming for oral logic logging.
* Custom alerts pop up when the count-down approaches limit thresholds.

---

### Module 16: AI Mentor

#### Component Layouts
* **Mentor Dialogue Drawer:** A slide-out panel containing conversational chat boxes and guidance logs.
* **Briefing Layouts:** Structured dashboard layouts displaying weekly pre-interview recommendations.

#### User Interactions
* Clicking "Ask Mentor" options within workspace sections.
* Expanding suggestions drawers during active sessions.

---

### Module 17: Reflection System

#### Component Layouts
* **Retrospective Wizard:** A four-step form displayed upon successful submissions, prompting answers about key observations and mistakes.
* **Summary Dashboard:** The final screen that details session analytics, elapsed time charts, and generated Pattern Cards.

#### User Interactions
* Typing reflections in text areas.
* Standard validation rules push back on brief or trivial inputs, shaking text area containers and showing validation warnings.

---

## 6. Monaco Editor Customizations & Lifecycle

### Editor Initialization
The Monaco Editor leverages `@monaco-editor/react` to enable client-side dynamic loads.
* **Theme Styling:** Integrated with the design system, applying dark slate background overlays (`#1A1A18`) and matching syntax highlighting.
* **Workspace Settings:**
  * Minimap configurations are disabled to optimize space.
  * Line heights are set to 22px; font selections use `Fira Code, JetBrains Mono, monospace`.
  * Dynamic layout adjustments are active, resizing editor borders when console panels expand.

### Autosave Sync Loop
To secure student work-in-progress code drafts, modifications in Monaco trigger a structured client-to-backend autosave sync lifecycle:
1. User key inputs update code draft states in the client `useEditorStore` (Zustand).
2. A custom hook (`useAutosave`) debounces changes, writing them to client `localStorage` every 2000ms of inactivity.
3. The hook sends background API requests every 10 seconds (or when the editor pane loses focus) to flush drafts to backend Redis buffers, which subsequently batch writes to PostgreSQL.
4. The workspace footer updates a small indicator showing saving states.

---

## 7. Real-Time Code Executions & SSE Streams

Compilation calls are handled asynchronously by background workers. The frontend monitors submission states by listening to Server-Sent Events (SSE) from the backend rather than executing continuous HTTP polling loops.

```text
Frontend Client                   NestJS API Gateway                 BullMQ / Redis
      |                                  |                                  |
      |-- POST /api/submissions -------->|                                  |
      |   (Payload contains draft code)  |-- Enqueues Execution Task ------>|
      |<-- Returns submissionId ---------|                                  |
      |                                  |                                  |
      |-- GET /api/submissions/[id]/stream ->|                              |
      |<-- Establishes SSE connection ---|                                  |
      |                                  |                                  |
      |                                  |                                  |
      |<-- Streams status: 'RUNNING' ----|<-- Task Starts ------------------|
      |                                  |                                  |
      |<-- Streams status: 'COMPLETED' --|<-- Task Complete (Writes results)|
      |   (Closes SSE Connection)        |                                  |
```

### TanStack Query SSE Integration Flow
1. **Initiation:** The code execution call is triggered via a mutation hook (`useMutation`).
2. **Connection Setup:** On mutation success, the client establishes an `EventSource` connection targeting `/api/submissions/[submissionId]/stream`.
3. **Stream Events listener:** The client listens for stream changes (e.g. `status = PENDING`, `status = RUNNING`, `status = COMPLETED`).
4. **Completion Event:** Once the `COMPLETED` message is received, the client closes the `EventSource` channel, invalidates active queries in TanStack Query to refresh workspace views, and displays results.

---

## 8. Frontend Performance & UX Guidelines

### 1. Monaco Editor Dynamic Loading
To prevent initial page load lag, Monaco components are dynamic-imported on demand with SSR disabled, rendering skeleton boxes during load delays:
* Dynamic import setups use: `dynamic(() => import('@monaco-editor/react'), { ssr: false })`.

### 2. Framer Motion Animations
* Wizard transitions, panel translations, and flips use hardware-accelerated Framer Motion properties.
* Panel entries use `AnimatePresence` to coordinate step animations without causing jumps in layouts.

### 3. DOM Virtualization
* Renders of long tables (like user checklists, error feeds, and large test sequences) use window virtualizations to keep active DOM element counts low.

### 4. Memory Cleanup
* When workspace layouts unmount, the code workspace runs cleanup logic: clearing intervals, removing key bindings, and dereferencing Monaco model components to prevent memory leaks.

### 5. SEO & Dynamic Metadata
* Dynamic page metadata is set using dynamic descriptors built from problem and topic attributes, ensuring search index compatibility for public directories.

### 6. Multi-Tab State Sync & Offline Resiliency
* **Broadcast Channel API:** To synchronize active session state and Monaco editor modifications across multiple browser tabs, a unified `useTabSync` hook broadcasts store updates via a shared broadcast channel (`patternforge-sync`). Incoming events update Zustand stores instantly.
* **Offline IndexedDB Buffering:** When connections drop during coding or observation input:
  * Draft modifications are cached locally in **IndexedDB** using a transaction log.
  * A banner notifies the user of the offline state.
  * Once connectivity is restored, the local transaction logs are re-played to sync data updates back to the backend Redis cache.
