# Accessibility Specifications (a11y) - PatternForge AI

This document establishes the accessibility guidelines, visual contrast parameters, screen reader mappings, and keyboard navigation rules for **PatternForge AI**. It ensures the application remains compliant with **WCAG 2.1 Level AA** standards.

---

## 1. Accessibility Compliance Standards

To serve all users, the interface implements accessibility structures targeting the following criteria:
* **Perceivable:** Information and user interface components are presented in ways users can perceive (supporting text alternatives, zoom scaling, and color contrasts).
* **Operable:** User interface components and navigation must be operable (enabling full keyboard navigation controls without mouse dependencies, and avoiding timed traps).
* **Understandable:** Information and the operation of the user interface must be understandable (consistent navigation layouts, readable typography, and explicit input validation alerts).
* **Robust:** Content is compatible with modern screen readers and assistive technologies.

---

## 2. Keyboard Navigation & Focus Control

The application supports keyboard-only navigation to ensure users can access all dashboard areas and workspaces.

### Keyboard Navigation Shortcuts

| Key Binding | Target Action | Application Context |
|---|---|---|
| `Tab` | Moves focus to the next interactive component. | Global context |
| `Shift + Tab` | Moves focus to the previous interactive component. | Global context |
| `Enter` / `Space` | Activates focused buttons, links, or dropdown selectors. | Global context |
| `Esc` | Closes modals, sheets, clue drawers, or active dropdown menus. | Modals & popovers |
| `Ctrl + Backtick` | Shifts focus between the left problem description panel and the right workspace panel. | Active Workspace (`/workspace`) |
| `Ctrl + R` | Executes code validation against sample test cases (dispatches compiler requests). | Coding Phase (`CODING_UNLOCKED`) |
| `Ctrl + Enter` | Submits code to run against the complete hidden test suite. | Coding Phase (`CODING_UNLOCKED`) |
| `Arrow Keys` | Navigates through item choices, lists, or dropdown items. | Grids & Menus |
| `Ctrl + H` | Opens the slide-out AI Mentor guidance panel. | Workspace |

### Focus Management Policies
* **Focus Visual Style:** Focused elements must render a high-contrast outline border using the design system accents (e.g., `outline outline-2 outline-offset-2 outline-amber-500` or `#F59E0B`). Muting or hiding outline styles is prohibited.
* **Skip Navigation Links:** A hidden skip link is pinned at the top DOM edge, becoming visible when tabbed (`focus:translate-y-0`). This allows users to skip sidebars and headers, jumping directly to main layout contents.
* **Focus Traps:** Modals, dialogs (e.g., the test case modal), and slide-out sheets capture keyboard focus inside their container boundaries, preventing users from tabbing outside active panels until dismissed.
* **Focus Recovery:** Closing popups returns focus to the button that originally triggered the modal.

---

## 3. Screen Reader Integration (ARIA Roles & Labels)

To support screen reader navigation, the DOM structure utilizes semantic HTML5 elements alongside ARIA landmarks and dynamic alert attributes.

### ARIA Landmarks
* **`nav`:** Marks the left sidebar container, with `aria-label="Global Navigation"`.
* **`header`:** Marks the top session ribbon, with `aria-label="Session Header Metrics"`.
* **`main`:** Marks the central content container.
* **`section`:** Used inside active workspaces to partition descriptions, editor workspaces, and terminal console logs.

### Dynamic Alert Areas (`aria-live`)
* **Compilation Statuses:** When running or submitting code, the test case execution console sets `aria-live="polite"`. The reader announces status transitions: *"Running compilation"* $\rightarrow$ *"Verification completed: 12 tests passed"* $\rightarrow$ *"Accepted"*.
* **Validation Feedback:** Dynamic input errors (such as entering brief reflection answers) set `aria-live="assertive"`, prompting screen readers to read validation alerts instantly.
* **Mock Simulation Clues:** Prompting clue drawers reads hints dynamically.

### Interactive Components ARIA Settings
* **Pattern Guess Cards:** Cards use `role="radio"` or `role="checkbox"`, tracking selection statuses via `aria-checked="true" | "false"`.
* **Clue Drawers Accordion:** Accordion header controls link to panels using `aria-controls` properties, tracking open states via `aria-expanded`.
* **Icon-Only Buttons:** Non-text button assets (such as search magnifying glasses or user avatars) must include explicit descriptive labels via `aria-label` attributes.

---

## 4. Visual Contrast & Accessibility Guidelines

### Color Contrast Criteria
In compliance with WCAG 2.1 AA standards, text elements must maintain the following contrast ratios against their parent backgrounds:
* **Body Text (Georgia / Inter):** Must achieve a minimum contrast ratio of **4.5:1** (e.g., `#ECE9E2` text on a `#1A1A18` background).
* **Headings & Large Fonts:** Must achieve a minimum contrast ratio of **3.0:1**.
* **Visual Decorators & Controls:** Accent focus borders, checkboxes, and buttons must achieve a minimum contrast ratio of **3.0:1**.

### Text Scaling & Responsive Layouts
* **Fluid Layouts:** Layout structures must scale fluidly when users increase browser zoom levels up to **200%**, preventing layouts from breaking or overlapping.
* **Text Sizing:** Typography layouts utilize relative units (`rem` or `em`) to respect user browser font size preferences.

### Screen-Specific Accessibility Adaptations

#### 1. Diagnostic Radar Chart (`/assessment`)
* Radar charts are visual SVG structures on desktop, and rendered as static PNG image assets on mobile viewports. To support users with visual impairments across both layouts:
  * SVG structures house descriptive text labels describing active dimensions, while PNG fallback elements include descriptive `alt` tags.
  * A hidden details HTML table (`aria-hidden="false"` for readers, styled off-screen) is placed in the DOM directly below the chart element, enabling screen readers to read raw numeric dimensional scores.

#### 2. Monaco Editor Workspace (`/workspace/[sessionId]`)
* Monaco editor models integrate accessibility supports, exposing lines as standard text blocks for readers.
* Interactive focus controls allow users to escape editor frames via keyboard shortcuts, returning to page flow.

#### 3. Simulation Voice Logs (`/arena/workspace`)
* During mock interview speech-to-text logging:
  * A pulsing visual wave indicates audio captures.
  * A text description ("Recording audio...") is read via `aria-live="polite"` elements.
  * An alternative typing option is provided to ensure users who cannot speak can complete requirements.
