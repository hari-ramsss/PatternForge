# Design System - PatternForge AI

This document establishes the UI/UX design tokens, layouts, interface components, and animation patterns for the frontend of **PatternForge AI**. The design system is inspired by the **Claude** interface, prioritizing editorial-level typography, low-strain warm color themes (the "Calm Dev" aesthetic), and clean layout hierarchies.

---

## 1. Visual Foundation & Theming (The "Calm Dev" Aesthetic)

Instead of the neon-green-on-pitch-black dark mode of typical coding platforms, PatternForge AI adopts a warmer, high-readability color scheme to promote focus and reduce eye strain over long study sessions.

### Color Tokens

```text
Light Mode: Warm Cream / Editorial Paper (#F9F6F0 or #FAF8F5)
Dark Mode: Muted Charcoal-Sepia / Dark Slate (#1E1E1C or #181816)
Accents: Soft Coral-Orange (#EA580C / #D97706) for primary triggers, Warm Amber (#F59E0B) for hints
```

| Token / Category | Light Mode Value | Dark Mode Value | Tailwind Equivalent | Purpose / Application |
|---|---|---|---|---|
| **Canvas Background** | `#FBF9F6` | `#1A1A18` | `bg-sand-50` / `bg-stone-950` | Primary application canvas base background. |
| **Surface (Card / Panel)**| `#FFFFFF` | `#232320` | `bg-white` / `bg-stone-900` | Floating workspace panels, sidebars, modal containers. |
| **Primary Borders** | `#EFECE6` | `#2F2F2B` | `border-sand-200` / `border-stone-800`| Low-contrast section divides, panel separators. |
| **Text - Editorial** | `#1A1A1A` | `#ECE9E2` | `text-stone-900` / `text-stone-100` | Problem statements, headers, large typography. |
| **Text - UI Secondary**| `#6E6B64` | `#B5B1A9` | `text-stone-500` / `text-stone-400` | Labels, helper text, constraints, dropdown menus. |
| **Accent - Call-to-action**| `#D97706` | `#F59E0B` | `bg-amber-600` / `text-amber-400` | Primary action buttons, success ticks, highlighted states. |
| **System Alert (Soft Red)**| `#EF4444` | `#F87171` | `bg-red-500/10` / `text-red-400` | Muted error boxes, failed compiler verdicts, stack traces. |
| **System Success (Muted)** | `#10B981` | `#34D399` | `bg-emerald-500/10` / `text-emerald-400`| Successful verdicts, test case passed indicator. |

### Typography Split

We use a deliberate contrast between editorial typography and functional user interface typography:

1. **Serif (Problem Prompts & Headers):**
   - **Fonts:** `Georgia`, `Merriweather`, or `Playfair Display`.
   - **Application:** Render problem titles (`h1`), long-form description blocks (`p`), examples, and prompt directions.
   - **Aesthetic Goal:** Mimics the high-end look of engineering journals and printed textbooks, lowering the cognitive load of scanning complex logic.
2. **Sans-Serif (Controls & Navigation):**
   - **Fonts:** `Inter`, `Plus Jakarta Sans`, or `system-ui`.
   - **Application:** Used for system menus, tabs, execution buttons, metadata tags, and dashboard analytics.
   - **Aesthetic Goal:** High legibility, alignment grids, compact spacing.
3. **Monospace (Code & Terminal):**
   - **Fonts:** `JetBrains Mono`, `Fira Code`.
   - **Application:** Editor window, input/output test case diff panels, compile errors.
   - **Aesthetic Goal:** Clear character differentiation (e.g., zero and letter O), proper alignment structure.

---

## 2. Layout Grid (Split-Pane adjustable Workspace)

The workspace adapts the classic three-column layout to accommodate the coding environment and console tabs smoothly.

```text
+---------------------------------------------------------------------------------+
|  Logo   [Run] [Submit]                                            (Profile)     |
+---------------------------------------------------------------------------------+
| Collapsible  |                                   |  Floating Code Console       |
| Problem      |  * Title (Serif Font)             |  (Monospace Editor)          |
| Directory    |                                   |                              |
|              |  Given an array of integers...    |  function twoSum() {         |
|  - 3Sum      |  The description flows cleanly    |     // Code here             |
|  - Two Sum   |  like a textbook page.            |  }                           |
|  - LRU Cache |                                   |                              |
|              |-----------------------------------|------------------------------|
|              |  Test Cases / Console             |  Floating Code Control Pill  |
|              |  [Input] [Expected] [Output]      |  (+) [TS 5.0] [Run   >]     |
+--------------+-----------------------------------+------------------------------+
```

### Grid Panes

- **Left Sidebar (Problem Directory):**
  - **Width:** 240px (collapsible to 48px icons-only rail).
  - **UX Pattern:** Mimics Claude's chat history drawer. Slides off-canvas to maximize space. Displays categorized roadmaps, problem status tags (solved/unsolved/locked), and spaced repetition intervals.
- **Center Pane (Editorial Reader):**
  - **Width:** Flex-grow (min-width: 480px, optimized max-width: 720px for reading comfort).
  - **Styling:** Constrained max-width with generous line height (`leading-relaxed` / 1.65). Low-contrast dividing borders.
- **Right Pane (Code Console):**
  - **Width:** Flexible (adjustable split-pane handler).
  - **Styling:** Floating card structure with subtle rounded borders (`rounded-2xl`), nested Monaco Editor, and a bottom console panel.

---

## 3. Reimagining LeetCode Features (Claude's UI Language)

Rather than copying standard grid-style buttons, PatternForge translates code interactions into minimalist elements modeled after chat interfaces.

### A. The Universal Code Execution Pill
Instead of a crowded bottom bar with multiple button arrays, execution is centered around a floating horizontal controller resembling a search/chat box placed at the bottom center of the editor pane:

```text
+-------------------------------------------------------------+
|  (+)  |  TypeScript 5.0  |  Run Draft   |  [Submit Icon >]  |
+-------------------------------------------------------------+
```

- **Context Ingestion Button (`+`):** Triggers a dropdown allowing instant loading of predefined templates, test case examples, boilerplate variables, or external mock libraries.
- **Model Selector Dropdown (Language Selector):** Replicates Claude's model selector dropdown to let users swap coding compilers (e.g., `Python 3.11`, `C++ 20`, `TypeScript`).
- **Primary Execution Icon (Orange Arrow):** A prominent coral-orange button triggering compilation. Submitting uses a distinct double-tap validation interface.

### B. The Artifacts Feature (Side-by-Side Visualizer & Hints)
Drawing inspiration from Claude's "Artifacts" mechanism, visual aids are rendered in a dedicated sliding pane overlapping the right-hand code console when requested:

- **Activation:** User clicks "Visualize Structure" or "Show Hint Diagram" in the problem pane.
- **Artifact Container:** A slide-out panel (`framer-motion` sliding from the right) with a clean white/charcoal card layout.
- **Renders:**
  - **Dynamic Node Graphs:** Interactive pointer diagrams representing linked lists, trees, or matrices step-by-step.
  - **Complexity Transition Graphs:** Visualizing brute-force curves vs optimal paths side-by-side.
  - **Pattern Cards:** Personalized spaced-repetition card decks.

---

## 4. Micro-Interactions & Loading Animations

We avoid harsh spinning wheels and static banners. The design system leverages smooth, rhythmic animations.

### Shimmering Compilation States (Loading Effect)
When a compiler run or submission is active, the entire output console card uses a soft shimmer (skeleton wave) to signal progress.

```css
@keyframes rhythmicShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer-console {
  background: linear-gradient(90deg, var(--surface-bg) 25%, var(--border-color) 50%, var(--surface-bg) 75%);
  background-size: 200% 100%;
  animation: rhythmicShimmer 1.8s infinite ease-in-out;
}
```

### Pulse Feedback on Triggers
The Universal Execution Pill displays progress by replacing the primary action icon with a breathing pulse animation.
```css
@keyframes buttonPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.96);
  }
}

.executing-pulse {
  animation: buttonPulse 1.4s infinite ease-in-out;
}
```

### Transition Presets (Framer Motion)

For wizard step transitions (shifting between thinking phases e.g., `PATTERN_DISCOVERY` -> `OBSERVATION_TRAINING`), use a spring-based transition formula:

```typescript
export const wizardTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  }
};
```

### Frictionless Error Callouts
Failed compiler executions do not use bright neon banners. Instead, they are rendered inside warm sand-based error blocks with clean differential syntax colors, ensuring failure is treated as constructive feedback:

```text
+--------------------------------------------------------------------------+
|  [!] Compilation Failed                                                  |
|  Lines 12:4 - Expected ';' but found 'return'                            |
|                                                                          |
|  11 |  let value = dfs(root)                                             |
|  12 |  - return value                                                    |
|     |  + return value;                                                   |
+--------------------------------------------------------------------------+
```

---

## 5. State-Based Workspace UI Layouts

To enforce the learning sessions pipeline, individual phases adapt their controls:

### Phase 1: Pattern Discovery Mode
- **Layout:** Standard Editor is masked. The right pane is covered with a clean cards deck containing potential patterns (e.g., Sliding Window, Dijkstra, Dynamic Programming).
- **Interactions:** Selecting a card triggers a text-input box requesting justification. The "Universal Pill" displays a simple "Submit Hypothesis" action.

### Phase 2: Observation Training Mode
- **Layout:** Editor is masked. The right pane displays a checklist input box with section headers (Inputs, Constraints, Invariants).
- **Interactions:** Adding items triggers smooth item-addition animations (`Framer Motion` height shifts).

### Phase 3: Spaced Repetition Card Deck
- **Card Flip Animation:** Personalized learning cards use a classic 3D-rotation hover effect:
  ```typescript
  const cardFlip = {
    hidden: { rotateY: 0 },
    flipped: { rotateY: 180 }
  };
  ```
- **Review Buttons:** Muted grading choices appear beneath card flips ("Forgotten", "Struggled", "Remembered").