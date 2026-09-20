# Responsive Design Specifications - PatternForge AI

This document establishes the responsive grid guidelines, media query breakpoints, component scaling rules, and device-specific layouts for **PatternForge AI**. It ensures the application remains usable and visually consistent across mobile, tablet, and desktop viewports, aligning with the designs in [design-system.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/Architecture-docs/design-system.md) and the layouts in [screens.md](file:///c:/Users/Hari%20Ram/Documents/leetcode%20app/Architecture-docs/screens.md).

---

## 1. Breakpoint Definitions & Viewport Grid Architecture

PatternForge adopts a hybrid desktop-first and mobile-responsive grid system. Because active programming (Monaco IDE workspace) and visual debugging are desktop-heavy workflows, the application prioritizes desktop scaling for coding, while optimizing mobile and tablet viewports for conceptual exercises, dashboard metrics, card reviews, and mathematical derivations.

### Media Query Breakpoints (Tailwind Defaults)
* **Mobile Viewports (`sm`):** Width $< 768\text{px}$. Optimized for portrait reading, simple forms, spaced-repetition flips, and metrics tracking.
* **Tablet Viewports (`md`):** Width $768\text{px} \le \text{width} < 1024\text{px}$. Optimized for landscape layouts, data visualizations, and conceptual wizards.
* **Desktop Viewports (`lg` / `xl`):** Width $\ge 1024\text{px}$. Full IDE mode, including split panes, code editors, test case consoles, and visual debugger panels.

---

## 2. Layout Shell Adaptations

The global layout frame (comprising the `Sidebar` and `Header` components) adapts dynamically to preserve screen space on smaller screens:

```text
Desktop (width >= 1024px)
+-----------------------------------+-----------------------------------+
|  Sidebar (Expanded)               |  Main Grid Content                |
+-----------------------------------+-----------------------------------+

Tablet (768px <= width < 1024px)
+-------------------+---------------------------------------------------+
|  Sidebar (Icons)  |  Main Grid Content                                |
+-------------------+---------------------------------------------------+

Mobile (width < 768px)
+-----------------------------------------------------------------------+
|  Header (Hamburger Button) | Main Stack Content                       |
+-----------------------------------------------------------------------+
```

### 1. `Sidebar` Navigation
* **Desktop:** The sidebar is pinned at `w-64` (256px), displaying full route names, streak metrics, and profile summaries.
* **Tablet:** The sidebar collapses to `w-20` (80px), displaying only menu icons. Tooltips appear on icon hover to guide navigation.
* **Mobile:** The sidebar is hidden (`hidden`). Navigation options are accessed via a slide-out hamburger menu drawer (`sheet` component) toggled from the header ribbon.

### 2. `Header` Ribbon
* **Desktop:** Displays active session titles, timers, streak indicators, and profile selectors.
* **Tablet & Mobile:** Non-essential metadata (streaks, target milestones) are hidden from the header row. Only active page titles, timer badges, and menu triggers remain visible.

---

## 3. Practice Workspace Adaptive Rules (`/workspace/[sessionId]`)

The `/workspace` view is the most complex viewport state, transforming its layout structure significantly across devices:

### 1. Desktop Viewport (IDE Mode)
* **Layout:** Left panel (problem statement, constraints, clues) and Right panel (wizards, code editors, compiler consoles) are displayed side-by-side using a resizable `SplitPanel` component.
* **UI Features:** Monaco editor displays line numbers, minimaps (if enabled), and bottom execution console drawers.

### 2. Tablet Viewport (Tabbed Workspace Mode)
* **Layout:** Horizontal splits are disabled. The screen transitions into a tabbed layout to prevent cramped text margins:
  * **Tab 1: Description:** Renders problem markdown text and example assets in Georgia serif.
  * **Tab 2: Thinking Wizard:** Houses active pattern guesses and structured observation inputs.
  * **Tab 3: Editor:** Unlocks the code editor and execution console.
* **UI Features:** Monaco code sizes default to 15px. Scroll helpers are enabled in console outputs.

### 3. Mobile Viewport (Conceptual Mode & Editor Lock)
* **Monaco Editor Lock:** Because typing programs is highly error-prone on virtual mobile keyboards, the mobile editor stage is locked:
  * Attempting to enter the coding phase displays a warning modal: *"Monaco Workspace is locked on mobile. Switch to a desktop viewport to write and submit code."*
* **Active Components:** Mobile viewports remain fully functional for pre-coding thinking phases:
  * **Reading & Pattern Discovery:** Users scan problems and submit pattern hypotheses via card grids.
  * **Observation Training:** Users type observations under tabbed forms.
  * **Post-Solve Reflections:** Users complete reflections and review spaced-repetition card decks on the go.

---

## 4. Dashboard, Gym & Analytics Adaptations

### 1. Dashboard (`/dashboard`)
* **Desktop:** Displays 3 columns (Roadmap, Analytics/Radar Chart, AI Mentor briefings).
* **Tablet:** Transitions to 2 columns (Analytics/Radar Chart on top, Roadmap and AI Mentor briefings side-by-side below).
* **Mobile:** Transitions to a single-column stack. Radar charts scale down, and weekly milestone cards list vertically.

### 2. Formula Discovery Trainer (`/gym/formula`)
* **Desktop:** Monospace table templates (left) alongside spreadsheet inputs and LaTeX formula editors (right).
* **Tablet & Mobile:** Stacks elements vertically. Monospace I/O tables are scrollable horizontally to prevent column clipping.

### 3. Personal Pattern Library (`/library`)
* **Desktop:** Displays a grid of Pattern Cards (`grid-cols-3` or `grid-cols-4`).
* **Tablet:** Scales cards to a 2-column grid (`grid-cols-2`).
* **Mobile:** Displays cards in a single-column stack. Card dimensions scale to fit portrait widths, and card flips use swipe gestures.

### 4. Problem Import Screen (`/import`)
* **Desktop:** Side-by-side OCR review tables (Left: PDF/image inputs; Right: data extraction form fields).
* **Tablet & Mobile:** Drops splits, stacking ocr logs on top of edit forms. PDF inputs are viewable via collapsible toggle drawers.

### 5. Onboarding Assessment Adaptations
* **Desktop & Tablet:** Runs both the 6-step conceptual assessment and the optional programming diagnostic challenges.
* **Mobile:** Restricts onboarding diagnostics purely to the 6-step conceptual quiz (evaluating time complexity estimation and pattern recognition). Programming diagnostic tasks are locked, displaying redirect warnings prompting the user to switch to a desktop device.

---

## 5. Viewport Adaptation Summary Matrix

| Screen Area | Desktop ($\ge 1024\text{px}$) | Tablet ($768\text{px} - 1023\text{px}$) | Mobile ($< 768\text{px}$) |
|---|---|---|---|
| **Global Layout** | Left sidebar + top header | Icon sidebar + top header | Top header with hamburger drawer |
| **Workspace Split** | Side-by-side resizable panels | Tabbed views (Description, Wizard, Editor) | Locked editor modal. Only wizard and reflections active. |
| **Monaco Editor** | Unlocked, full code controls | Unlocked, keyboard font-size 15px | Locked with desktop redirect warning |
| **Assessment Radar** | 450px wide SVG chart | 300px wide SVG chart | Scaled down static PNG or 200px SVG chart (with fallback hidden HTML table) |
| **Onboarding Assessment** | Complete quiz + optional programming challenge | Complete quiz + optional programming challenge | Mobile conceptual assessment only (coding locked with redirection warning) |
| **Pattern Library** | 3-4 column grid stacks | 2-column grid stacks | 1-column scrollable flip-cards |
| **Gym & Formula** | Split panels | Vertical layout stack | Vertical stack, horizontal table scrolls |
| **Simulation Timer** | Glow ribbon + text indicator | Glow ribbon + icon alert | Tiny blinking navigation header bar |
