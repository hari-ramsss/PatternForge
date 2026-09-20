# Animation & Motion Guidelines - PatternForge AI

This document establishes the animation principles, transition constants, micro-interactions, and state indicator keyframes for **PatternForge AI**. The design targets the **Claude** interface language—valuing minimal, organic spring physics and low-strain visual transitions to support long, concentrated study sessions.

---

## 1. Claude-Inspired Motion & Spring Philosophy

PatternForge avoids harsh, linear animations. Motion must serve a functional purpose—directing focus, signaling hierarchy, and smoothing layouts without causing visual clutter.

### Key Animation Principles
* **Functional Purpose:** Animations must only trigger to signal state changes (e.g., locking routes, step updates, progress validations).
* **Calm Dev Aesthetic:** Timings and curves are optimized to feel soft and non-disruptive, using muted warm backgrounds (`#FAF8F5` or `#232320`) and subtle color transitions.
* **Physics-Based Spring Models:** UI translations leverage spring physics (Framer Motion models) rather than fixed-time curves, mimicking natural weight and elasticity.

### Global Timing and Stiffness Presets
* **Instant Interactions (Fast):** Duration: $150\text{ms}$. Easing: `ease-out`. Applied to hover indicators, tooltips, and border highlights.
* **Elastic Springs (Medium):** Applied to card selections and wizard layouts.
  * *Spring Formula:* `stiffness: 300, damping: 30`.
* **Subtle Slides (Slow):** Duration: $500\text{ms}$. Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo). Applied to onboarding steps and workspace panels.

---

## 2. Page & Panel Transitions

Panel animations are designed to guide the user's attention through structural steps.

### 1. Wizard Phase Slide Transitions
When transitioning between active learning session phases (e.g., `PATTERN_DISCOVERY` $\rightarrow$ `OBSERVATION_TRAINING`), components slide horizontally to indicate progression:

```text
Wizard Step Transition Flow
[ Current Step View ] -------------> Slides Left & Fades Out (x: -20, opacity: 0)
                                                |
[ Next Step View ] <----------------------------+ Slides Left & Fades In (x: 20 -> 0, opacity: 1)
```

* **Transition Mechanics:** The departing phase container translates to `x: -20px` while its opacity decays to `0`. Simultaneously, the incoming phase container initializes at `x: 20px` with `0` opacity, sliding into place (`x: 0`) as opacity reaches `1`.
* **Interpolation Curve:** Spring config (`stiffness: 300, damping: 30`), ensuring quick settlement with zero bounce.

### 2. Slide-Out Artifacts & Mentor Drawers
Sidebar drawers (like the AI Mentor dashboard drawer or the visual debugger panels) slide in from the screen edges:
* **Trigger:** Click action on "Ask Mentor" or "Show Visuals" button.
* **Transition:** Slides in horizontally from the right canvas boundary (`x: '100%'` $\rightarrow$ `x: '0%'`) using an ease-out expo curve (`duration: 0.5s`), overlaying workspace panels.

---

## 3. Micro-Interactions & Visual Triggers

Micro-interactions provide immediate feedback to user actions, using physical behaviors to guide inputs.

### 1. Pattern Card 3D Flip
Personal spaced-repetition cards (in the Pattern Library or warmup deck) flip to reveal answers:
* **Trigger:** Click action on `Flip Card` buttons.
* **Transition:** Smooth 3D rotation-Y transition (`rotateY: 180deg`) over a duration of $0.6\text{s}$ with a spring layout.
* **Aesthetics:** The parent card uses perspective styling (`perspective: 1000px`) to prevent visual clipping, rendering card details on the back cleanly.

### 2. Circular SVG Timer Rings
The problem-reading overlay counts down using an SVG stroke-offset animation:
* **Trigger:** Workspace session start.
* **Transition:** The outer stroke path of a circular badge animates from a full circumference offset (`stroke-dashoffset: 282`) down to `0` over a 30-second delay.
* **Aesthetics:** Renders in a warm amber hue (`#F59E0B`), fading out once the 30-second reading time completes.

### 3. Shallow Input Shake Alert
Inputs (such as brief reflection answers or incorrect pattern guesses) trigger warning animations:
* **Trigger:** Submission checks fail.
* **Transition:** The text-area container or card deck translates horizontally in a quick sequence (`x: [0, -10, 10, -10, 10, 0]`) over a duration of $0.4\text{s}$.
* **Aesthetics:** The container border turns red (`#EF4444`) during the animation to highlight errors.

---

## 4. System Loading & State Indicators

State indicators use rhythmic loops to signal background operations without blocking layouts.

### 1. Rhythmic Console Shimmer
Active compilation tasks render a shimmer effect across terminal cards:
* **Trigger:** Click action on code execution buttons.
* **Transition:** A linear gradient background slides horizontally across the console card:
  ```css
  @keyframes rhythmicShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-console {
    background: linear-gradient(90deg, var(--surface-bg) 25%, var(--border-color) 50%, var(--surface-bg) 75%);
    background-size: 200% 100%;
    animation: rhythmicShimmer 1.8s infinite ease-in-out;
  }
  ```

### 2. Execution Button Pulse
During compiler queries, execution buttons display a breathing pulse:
* **Trigger:** Code run processes are active.
* **Transition:**
  ```css
  @keyframes buttonPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.96); }
  }
  .executing-pulse {
    animation: buttonPulse 1.4s infinite ease-in-out;
  }
  ```

### 3. Speech Capture Wave
The recording drawer inside Swiggy/Google simulation arenas renders active sound indicator waves:
* **Trigger:** Speech inputs are active.
* **Transition:** Five vertical bar elements scale up and down dynamically using randomized delays, indicating sound captures.
