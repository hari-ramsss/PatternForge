# Application Screens and Layouts - PatternForge AI

This document defines the structural layouts, visual regions, screen zones, responsive boundaries, and design token implementations for all user-facing screens in **PatternForge AI**. It maps core frontend pages to the user workflows defined in [interactions.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/Architecture-docs/interactions.md) and the interface primitives detailed in [component-library.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/Architecture-docs/component-library.md).

---

## 1. Global Page Layout & Responsive Grid Systems

PatternForge operates as a single-page full-viewport application (`h-screen overflow-hidden`) to mimic professional IDE environments and keep the user's attention focused on cognitive exercises.

```text
+-----------------------------------------------------------------------------------+
|                                 Header Ribbon                                     |
+-----------------------------------------------------------------------------------+
|  Collapsible  |                                                                   |
|   Sidebar     |                         Main Workspace Panel                      |
|               |                                                                   |
|  - Dashboard  |                         - Dynamic Screen Content                  |
|  - Roadmap    |                                                                   |
|  - Gyms       |                                                                   |
|  - Library    |                                                                   |
|  - Arena      |                                                                   |
+-----------------------------------------------------------------------------------+
```

### Grid Layout Rules
* **Sidebar Zone:** Fixed-width panel (width `w-64` expanding to `w-20` on collapse) pinned to the left canvas edge. Handles global navigation.
* **Header Ribbon:** Pinned to the top viewport edge (height `h-16`). Houses global status updates, session timers, and theme controllers.
* **Content Container:** Dynamic layout using a `flex-1 h-[calc(100vh-64px)] overflow-y-auto` structure, rendering individual screen paths.

### Design Token Application
* **Aesthetic Palette:** Screens utilize a light sand-wash theme (`#FBF9F6` canvas with `#FFFFFF` surfaces) and a dark slate-stone mode (`#1A1A18` canvas with `#232320` surfaces). Low-contrast dividers use `#EFECE6` or `#2F2F2B` lines.
* **Typography Hierarchy:** Editorial titles are set in Georgia serif headings (`font-serif`), controls use Inter sans-serif (`font-sans`), and data structures render in Fira Code (`font-mono`).

---

## 2. Screen Specifications

### 1. Landing & Authentication Screen (`/`, `/auth`)

#### Purpose
Captures marketing details and redirects users to login/registration panels (User Story `US-001`).

#### Layout Grid
* **Split Layout:** 2-column flexgrid viewport (`md:grid-cols-2`).
  * **Left Hero Zone (60% width):** Displays marketing content. Uses a dark slate canvas. Headline text renders in Georgia serif (`font-serif` text-5xl), highlighting product values. Includes floating illustrations of spaced repetition card decks.
  * **Right Authentication Zone (40% width):** Surface panel container (`bg-white` or `bg-stone-900`) enclosing login forms.

#### Reusable Components
* `AuthCard` (Tabs for logging in and registering)
* `Button` (Primary CTAs styled with amber gold highlights)

---

### 2. Onboarding Survey Screen (`/onboarding`)

#### Purpose
Guides new users through profile setup, target companies mapping, timeline settings, and preparation language preferences (User Story `US-001`).

#### Layout Grid
* **Centered Single Column:** Pinned card workspace (`max-w-2xl mx-auto my-12`).
* **Progress Steps Header:** Simple list showing onboarding milestone progression.
* **Card Container:** Slide-out steps containing form layouts and grids.

#### Reusable Components
* `OnboardingSurvey` (Multi-step cards container)
* `Button` (CTA triggers)

---

### 3. Diagnostic Assessment Screen (`/assessment`)

#### Purpose
A distraction-free diagnostic bench evaluating baseline pattern recognition, observation, and optimization scores (User Story `US-002`, `US-003`).

#### Layout Grid
* **Full-Screen Canvas (`w-screen h-screen`):** Overlays global sidebars, focusing user attention.
* **Progress Bar Header:** Thin top bar displaying question counts (e.g., *Question 4 of 20*).
* **Question Panel (Center):** Displays deduction card grids, input-output tables, or pseudocode exercises.
* **Control Footer:** Houses navigation buttons and the diagnostic timer indicator.

#### Reusable Components
* `RadarChart` (Ability indicators modal shown on test completion)
* `PatternSelectCard` (Deduction options)
* `TimerBadge` (Session timer)

#### Screen States
* **Test Completed State:** Shows an overlay block rendering the `RadarChart` along with reviews from the AI Mentor.

---

### 4. Personalized Learning Dashboard Screen (`/dashboard`)

#### Purpose
The primary landing hub displaying diagnostic levels, daily challenges, weekly milestones, and advice from the AI Mentor (User Story `US-004`).

#### Layout Grid
* **Dashboard Layout:** 3-column dashboard grid.
  * **Left Column (40%):** Renders the weekly Roadmap checklist card stack.
  * **Center Column (35%):** Displays the `RadarChart` assessment values, current streak indicators, and Github-style activity calendars.
  * **Right Column (25%):** Displays advice cards from the AI Mentor.

#### Reusable Components
* `StreakBadge` (Daily streak tracker)
* `ActivityCalendar` (Pixel block solved tracker)
* `RadarChart` (6-axis skill diagram)
* `ChallengeCard` (Grid problem triggers)
* `WeeklyProgressMetric` (Progress tracking bars)

---

### 5. Interactive Spaced Repetition Roadmap Screen (`/roadmap`)

#### Purpose
Tracks weekly milestones and lists scheduled spaced-repetition card reviews (User Story `US-021`, `US-053`).

#### Layout Grid
* **Split Dashboard Layout (50/50):**
  * **Left Column (Milestones Feed):** Lists curriculum target check-boxes, weekly objectives, and target company challenge lists.
  * **Right Column (Review Arena):** Contains review decks of Pattern Cards.

#### Reusable Components
* `CurriculumCard` (Expandable milestone card deck)
* `InteractiveFlipCard` (Personal Pattern Card)

#### Screen States
* **Review Mode Overlay:** Clicking "Begin Review" opens an interactive card space. Shows `InteractiveFlipCard` elements that flip to collect recall ratings.

---

### 6. Progressive Practice Workspace Screen (`/workspace/[sessionId]`)

#### Purpose
The core learning environment, locking the editor panel until cognitive thinking stages are completed (User Story `US-005` to `US-018`, `US-046` to `US-048`).

#### Layout Grid
* **Split panel Viewport (`h-full flex`):**
  * **Left Panel (50%):** Encloses the static problem statement, examples list, constraints, and the collapsible clue accordion drawer.
  * **Right Panel (50%):** Adapts its display based on the active state of the learning session.

```text
+----------------------------------+----------------------------------+
|            Left Panel            |           Right Panel            |
|       (Static Description)       |        (Progressive Wizard)      |
|                                  |                                  |
|   - Problem statement in serif   |   Displays screens matching      |
|   - Unlocked clue accordions     |   the active session state       |
|                                  |   (Guesses, Observations, Code)  |
|                                  |                                  |
+----------------------------------+----------------------------------+
```

#### Reusable Components
* `SplitPanel` (Partition layout)
* `UnlockingTimerOverlay` (Editor locking card)
* `PatternSelectCard` (Pattern options grid)
* `ObservationTabGroup` (Categorized textareas)
* `ComplexitySelector` (Complexity dropdown options)
* `MonacoWorkspace` (Monaco workspace wrapper)
* `TestCasesConsole` (Test console and stdout tabs)
* `DryRunVisualizer` (Debugging board)

#### Screen Step Layouts
* **Stage 1 (Reading):** The left pane displays text; the right pane shows `UnlockingTimerOverlay`.
* **Stage 2 (Pattern Guessing):** The right pane renders `PatternSelectCard` decks.
* **Stage 3 (Observation Training):** The right pane displays the tabbed `ObservationTabGroup`.
* **Stage 4 (Active Coding):** The right pane opens the split `MonacoWorkspace` (top) and `TestCasesConsole` (bottom) along with the `DryRunVisualizer` side panels.

---

### 7. Workspace Solutions & Retrospectives (`/workspace/[sessionId]/post-solve`)

#### Purpose
Evaluates performance metrics and prompts users for retrospective feedback after successful submissions (User Story `US-029`, `US-046`).

#### Layout Grid
* **Solution Path Analyzer Pane (Stage 5 - Active on solve):**
  * **Upper Panel:** Renders execution speed percentiles and Big-O comparison tables.
  * **Lower Panel:** Compares user code blocks with optimal versions, highlighting key missed observations.
* **Reflection Lock Panel (Stage 6):** Encloses retrospective questionnaire cards.

#### Reusable Components
* `ReflectionFormCard` (Retrospective questionnaire)
* `ComplexitySelector` (Speed comparison grids)

---

### 8. Formula Discovery Trainer Screen (`/gym/formula`)

#### Purpose
Hosts interactive formula derivation drills (User Story `US-023`, `US-024`).

#### Layout Grid
* **Centered Canvas Grid:**
  * **Problem Display (Top):** Monospace table mapping inputs to outputs.
  * **Trial Simulator Workspace (Center):** spreadsheet input rows where users test formulas.
  * **LaTeX Formula Input Panel (Bottom):** Input boxes showing MathJax preview overlays.

#### Reusable Components
* `TrialSimulatorTable` (spreadsheet verification rows)
* `LaTeXFormulaInput` (LaTeX math equations preview)
* `RecurrenceTreeVisualizer` (Visual tree mapping recurrence branches)

---

### 9. Pattern Recognition Gym Screen (`/gym/pattern`)

#### Purpose
Renders abstract timed-challenge decks for rapid pattern identification (User Story `US-026`, `US-027`, `US-028`).

#### Layout Grid
* **Dashboard Split Grid:**
  * **Controls Header:** Shows current score meters and count-down timers.
  * **Grid Deck:** Displays sequential panels mapping I/O examples.
  * **Selection Footer:** Deck of pattern choice buttons.

#### Reusable Components
* `Button` (Answer selections)
* `TimerBadge` (Timed run clocks)

---

### 10. User Problem Import Screen (`/import`)

#### Purpose
Scrapes and extracts external problems from URLs, image documents, or PDF uploads (User Story `US-049`, `US-050`).

#### Layout Grid
* **Split Review Screen (50/50):**
  * **Left Side (Upload Hub):** Drag-and-drop file target area.
  * **Right Side (Extracted Data Editor):** Interactive form showing parsed properties.

#### Reusable Components
* `ImportDropZone` (Drag-and-drop uploading card)
* `OCRResultsEditor` (Parsed values validation form)

---

### 11. Personal Pattern Library Screen (`/library`)

#### Purpose
A searchable directory of all completed problems and compiled Pattern Cards (User Story `US-019`, `US-020`, `US-022`).

#### Layout Grid
* **Controls Header:** Search input bar and tag filter dropdown selectors.
* **Grid Stack:** Renders interactive Pattern Cards.

#### Reusable Components
* `InteractiveFlipCard` (Personal Pattern Card)
* `Button` (Controls for exporting cards to PDF study guides)

---

### 12. Interview Arena Selection Launcher (`/arena/select`)

#### Purpose
Enables users to select corporate mock targets, configurations, and initiate simulations (User Story `US-040`, `US-041`).

#### Layout Grid
* **Corporate Selection Grid:** Responsive card deck (`grid grid-cols-1 md:grid-cols-3 gap-6`) presenting available companies.
* **Setup Sidebar Panel:** Side panel setting targets and countdown options.

#### Reusable Components
* `Button` (Initiation CTA)

---

### 13. Mock Interview Simulation Arena Screen (`/arena/workspace`)

#### Purpose
Simulates strict corporate interviews, wrapping screens in company-specific style themes and disabling hints (User Story `US-040` to `US-042`).

#### Layout Grid
* **Corporate Themed Canvas (`w-screen h-screen`):** Overwrites default theme color tokens (e.g., swaps accent colors to match Swiggy or Google palettes).
* **Countdown Header:** Houses the persistent `SimulationTimerRibbon`.
* **Workspace Pane:** Grid workspace dividing problem statements (left), Monaco coding workspace (top-right), and custom speech transcription drawers (bottom-right).

#### Reusable Components
* `SimulationTimerRibbon` (Countdown timer ribbon)
* `SpeechTranscriptDrawer` (Transcription log panel)
* `MonacoWorkspace` (Code editor workspace)
