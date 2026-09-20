# Reusable Component Library - PatternForge AI

This document details the reusable UI components for **PatternForge AI**. The component library is designed around standard Radix UI primitives and styled with utility classes. It enforces visual styles using design tokens from [design-system.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/Architecture-docs/design-system.md) and addresses the user scenarios defined in [user-stories.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/project-docs/user-stories.md).

---

## 1. Component Library Architecture & Design Token Integration

All components are presentational (stateless) or interface with global client stores (`Zustand`) via selectors. They automatically adapt between light and dark modes, and transition styles when company-specific configurations are active in the Interview Arena.

### Typography Constraints
* **Editorial serif:** Georgia, Merriweather, or Playfair Display is used in problem summaries and mentor notes to lower cognitive load.
* **Sans-serif UI typography:** Inter or Plus Jakarta Sans is applied to charts, buttons, forms, and navigation menus.
* **Monospace text:** JetBrains Mono or Fira Code is used in editor frames and terminal inputs.

---

## 2. Core Layout Components

Core layout components define the structural grid of the application, managing side navigation, global headers, and resizable workspaces.

### 1. `Sidebar` (Global Navigation)
* **Purpose:** Left-aligned menu panel serving navigation links across application directories.
* **Aesthetics:** Styled with a dark-slate canvas (`#1A1A18`) and low-contrast boundaries (`#2F2F2B`).
* **Interactions:** Collapses into a thin icon bar to maximize editor workspace widths. Active routes show amber-gold indicator ticks.
* **Navigation Links:**
  * Dashboard (Topic metric graphs)
  * Personalized Roadmap (Weekly assignments list)
  * Pattern Library (Review lists, flips cards)
  * Pattern Gym / Formula Trainer (Practice boards)
  * Simulation Arena (Mock company selection hubs)

### 2. `Header` (Session Status Ribbon)
* **Purpose:** Global top header tracking active sessions, user identities, theme selectors, and mock simulation status.
* **Aesthetics:** Uses glassmorphic backdrop filters with blurred surface overlays.
* **Components:**
  * **Timer Module:** Renders count-up timers for practice or countdown timers for mock simulations.
  * **User Badge:** Displays user name and active streak counts.
  * **Theme Toggle:** Shifts styling states between Light and Dark canvas palettes.

### 3. `SplitPanel` (Resizable Grid Container)
* **Purpose:** Provides a split-panel grid dividing the problem description (left) and the interactive workspace (right).
* **Aesthetics:** Uses resizable split borders (`#2F2F2B`) with hover drag states.
* **Interactions:** Supports double-click actions to hide the left description pane, expanding the Monaco editor width.

---

## 3. Domain-Specific Reusable Components

### 1. Onboarding & Profile Setup

#### `AuthCard`
* **Purpose:** Handles new user signup and authentication (User Story `US-001`).
* **Aesthetics:** Centered modal container with glassmorphic styling, featuring tabs for toggling between "Sign In" and "Create Account".
* **Interactions:** Standard email/password forms. Includes dynamic field validation error states.

#### `OnboardingSurvey`
* **Purpose:** Collects goals, timelines, language preferences, and company targets (User Story `US-001`).
* **Aesthetics:** Multi-step wizard layout with slide transitions.
* **Interactions:**
  * **Target Company Grid:** Multi-select grid with cards representing tech companies (Google, Amazon, Microsoft, Swiggy). Selected cards highlight with an amber-gold border.
  * **Timeline Slider:** Linear range slider setting the date for upcoming interviews.
  * **Language Dropdown:** Selects target coding languages (Python, Java, C++, JS).
  * **CTA Progress Button:** Clicking registers credentials and loads the Diagnostic Assessment popup.

---

### 2. Dashboard, Streaks & Progress Analytics

#### `StreakBadge`
* **Purpose:** Renders the active daily practice streak (User Story `US-004`).
* **Aesthetics:** Floating tag containing a flame icon, dynamically animating (breathing scale effect) when streaks increment.
* **Interactions:** Hovering reveals details of current milestones (e.g., *"Solve today's challenge to maintain your 12-day streak"*).

#### `ActivityCalendar`
* **Purpose:** Displays annual grid tracking solved/unlocked session histories (User Story `US-004`).
* **Aesthetics:** Green/amber pixel block grid tracking daily solve densities (similar to GitHub commits).
* **Interactions:** Hovering on individual blocks reveals date stamps and solved problem listings.

#### `WeeklyProgressMetric`
* **Purpose:** Renders dynamic completion progress bars (User Story `US-004`).
* **Aesthetics:** Horizontal bar chart mapping target counts (e.g., 4/5 problems solved) using active track colors.

#### `RadarChart` (Assessment Metric Board)
* **Purpose:** Renders the six-dimensional ability profile calculated during diagnostics (User Story `US-003`, `US-051`).
* **Aesthetics:** Rendered with SVG canvas properties, plotting custom indicators on dimensions (*Pattern Recognition*, *Observation Quality*, *Formula Discovery*, *Optimization Ability*, *Speed*, *Consistency*).
* **Interactions:** Hovering over vector nodes displays tooltip alerts showing percentile rankings and AI improvement notes.

---

### 3. Progressive Workspace Thinking Gates

#### `UnlockingTimerOverlay`
* **Purpose:** Restricts editor access during the `READING_PROBLEM` phase (User Story `US-005`).
* **Aesthetics:** Full-screen translucent container overlaying the code editor, rendering a warm sepia card: *"Read the problem carefully. Editor unlocks in 30 seconds."*
* **Interactions:** Incorporates a countdown circular SVG progress indicator. On expiration, the overlay slides out, unlocking the Pattern Discovery controls.

#### `PatternSelectCard` (Pattern Guess Deck)
* **Purpose:** Grid item representing algorithmic pattern choices (User Story `US-006`, `US-007`, `US-008`).
* **Aesthetics:** Inactive states use light borders. Active selections scale up, highlighting borders with amber-gold (`#F59E0B`).
* **Interactions:** Clicking toggles selections, expanding text fields where users input written justifications. Submitting wrong guesses triggers shake animations.

#### `ObservationTabGroup` (Categorized Input Panel)
* **Purpose:** Multi-tab text field interface collecting observations before coding (User Story `US-010`, `US-011`).
* **Aesthetics:** Tab lists use custom active status markers.
* **Interactions:** Tab switching reveals specific input boxes (Constraints, Edge Cases, Properties). Integrates character counters, checking text lengths.

---

### 4. Interactive Playground & Visualizer

#### `MonacoWorkspace` (Code Editor wrapper)
* **Purpose:** Dynamic Monaco Editor component wrapped to support language boilerplates, draft caching, and line numbers (User Story `US-014`).
* **Aesthetics:** Custom dark theme matching the design system, disabling minimap features.
* **Interactions:** Integrates debounced autosaving, flashing a small "Saved draft" indicator in the bottom console ribbon on sync.

#### `TestCasesConsole` (Run Diagnostic Drawer)
* **Purpose:** Displays test run metrics, standard outputs, execution errors, and custom test input configurations (User Story `US-016`).
* **Aesthetics:** Muted dark-slate console layout (`#1A1A18`) with tab selections.
* **Interactions:** Users configure custom case variables, run compilations, and view comparative diff panels (Expected vs. Actual results) with red/green alerts.

#### `DryRunVisualizer` (Algorithmic Debugger Canvas)
* **Purpose:** Displays real-time changes in data structures (arrays, linked lists, trees, graphs, stacks, queues) during code runs (User Story `US-017`).
* **Aesthetics:** Clean SVG/canvas container rendering nodes as circular entities and pointers as active arrows.
* **Interactions:** Step controls (Prev, Next, Play/Pause) allow users to advance index values, highlights code paths, and shows queue queue changes.

---

### 5. Formula Discovery & Pattern Gym

#### `TrialSimulatorTable`
* **Purpose:** Interactive values grid allowing users to test output outputs against custom values to deduce equations (User Story `US-023`).
* **Aesthetics:** Grid of rows and columns formatted like spreadsheets, with monospace styling.
* **Interactions:** Users enter numbers in input fields, and the calculator returns outputs based on problem formulas, helping users verify equations before submission.

#### `LaTeXFormulaInput`
* **Purpose:** Mathematical equation input supporting LaTeX formats (User Story `US-023`, `US-025`).
* **Aesthetics:** Smooth input boxes with live preview containers rendering math formulas (via MathJax/KaTeX).
* **Interactions:** Typing triggers live previews, checking equation validation results.

#### `RecurrenceTreeVisualizer`
* **Purpose:** Renders recurrence formulas visually as nested tree structures (User Story `US-024`).
* **Aesthetics:** Collapsible tree structures mapping recursive branchings (e.g., $T(N) = 2T(N/2) + O(N)$).
* **Interactions:** Expanding/collapsing nodes shows complexity weights.

---

### 6. User Problem Import

#### `ImportDropZone` (Document Upload Card)
* **Purpose:** Drag-and-drop file target area for files, screenshots, and URLs (User Story `US-049`, `US-050`).
* **Aesthetics:** Dotted borders with background hover fades.
* **Interactions:** Users drop PDF and image documents or paste URL strings. Renders progress status bars and extraction feeds during OCR operations.

#### `OCRResultsEditor`
* **Purpose:** Verification panel to review and correct parsed problem imports (User Story `US-049`).
* **Aesthetics:** Side-by-side split screen rendering the source image alongside editor fields (Title, Constraints, Examples).
* **Interactions:** Users edit parsed fields, clicking "Confirm Import" to save the problem to catalogues.

---

### 7. Mistake Intelligence & AI Mentor

#### `MistakeReportPie` (Error Distribution Chart)
* **Purpose:** Visualizes historical failure modes (User Story `US-034`).
* **Aesthetics:** Styled with Recharts pie shapes mapping error counts (e.g., missing boundary checks, wrong algorithm guesses).
* **Interactions:** Hovering on slices displays specific count alerts.

#### `MentorDialogueDrawer` (AI Coaching Feed)
* **Purpose:** Conversational chat interface for coaching advice and pre-interview briefings (User Story `US-043`, `US-044`).
* **Aesthetics:** Slide-out drawer with serif message boxes.
* **Interactions:** Expanding the drawer triggers updates of tailored advice without displaying raw solution codes.

---

### 8. Interview Simulation Arena

#### `SimulationTimerRibbon`
* **Purpose:** Displays strict counts during simulations (User Story `US-040`, `US-041`).
* **Aesthetics:** A thin glowing ribbon running along the header. Swaps colors (amber to red) when limits drop below 5 minutes.
* **Interactions:** Blocks pause controls, remaining visible during practice runs.

#### `SpeechTranscriptDrawer` (Simulation Voice Logger)
* **Purpose:** Renders speech-to-text transcript feeds during mock interview runs (User Story `US-042`).
* **Aesthetics:** Bottom slide-out drawer with a glowing audio capture wave.
* **Interactions:** Shows running transcription texts as speech inputs are recorded.

---

### 9. Spaced Repetition & Pattern Cards

#### `InteractiveFlipCard` (Personal Pattern Card)
* **Purpose:** Spaced-repetition card tracking problem trigger clues, common mistakes, and recall ratings (User Story `US-019`, `US-021`).
* **Aesthetics:** Performs smooth 3D rotate-Y card-flipping card transitions.
* **Interactions:** Clicking cards flips them to reveal reference solutions and notes. Bottom panels display recall rating options ("Remembered", "Struggled") to update review dates.

---

### 10. Reflection System

#### `ReflectionFormCard`
* **Purpose:** Post-solve reflection forms (User Story `US-046`, `US-047`).
* **Aesthetics:** Multi-step wizard cards with rounded borders.
* **Interactions:** Input fields collect takeaways. If fields contain brief inputs, the container shakes, displaying red border alerts.

---

## 4. Shared Presentational UI Primitives

Presentational primitives are small components used throughout the application to maintain design consistency.

### 1. `Button` (Action Control Input)
* **Aesthetics:** Primary controls use gold backgrounds (`#D97706` / `#F59E0B`). Secondary options use subtle grey boarders. Critical actions (like system resets) use red borders (`#EF4444`).
* **Animations:** Styled with spring-based hover scales. Includes loading icons that spin when network actions are dispatching.

### 2. `FeedbackAlert` (System Indicator Banner)
* **Aesthetics:** Colored banners delivering system warnings:
  * **Success:** Emerald green background (`#10B981`) indicating positive validation states.
  * **Caution:** Amber background (`#F59E0B`) indicating minor warnings or hint counts.
  * **Error:** Soft red background (`#EF4444`) indicating validation failures or compilation errors.
* **Interactions:** Includes close triggers (`X` buttons) to dismiss notifications.

### 3. `TimerBadge` (Time tracking indicator)
* **Aesthetics:** Rounded labels with clock icons.
* **Logic:** Shifts from standard text to blinking red warnings when mock simulation timers drop below 5 minutes.
