# Endure Design System — V1.0

## 1. Core Principles
*   **Aesthetic**: "Performance Lab". Dark, industrial, precise.
*   **Interaction**: High density, low latency. Designed for daily repetition.
*   **Data**: Data is beautiful. Numbers are `JetBrains Mono`. Labels are `Inter`.

---

## 2. Visual Primitives

### Color Semantics
*   **Surface**:
    *   `bg-background` (#09090b): Global app background.
    *   `bg-surface` (#18181b): Cards, panels, sidebars.
*   **Borders**:
    *   `border-border` (#27272a): Used heavily to define structure.
*   **Sports**:
    *   `sport-swim`: Sky-400 (#38bdf8)
    *   `sport-bike`: Violet-400 (#a78bfa)
    *   `sport-run`: Rose-400 (#fb7185)
    *   `sport-gym`: Amber-400 (#fbbf24)
*   **Status**:
    *   `status-completed`: Emerald-500
    *   `status-planned`: Zinc-600
    *   `status-skipped`: Red-500
    *   `status-warning`: Amber-500

### Typography
*   **Heading**: `Inter`, Tight tracking. Weights: 400 (light) to 600 (semi-bold).
*   **Data**: `JetBrains Mono`. Used for *all* numerical metrics (duration, TSS, power).
*   **Label**: `Inter`, Uppercase, tracking-wider, text-xs. Used for table headers and metric labels.

### Radius & Spacing
*   **Radius**:
    *   `rounded-sm`: Inner elements (progress bars, small buttons).
    *   `rounded-md`: Standard interactives (inputs, session cards).
    *   `rounded-xl`: Containers (modals, panels).
    *   `rounded-full`: Status badges, avatars.
*   **Spacing**:
    *   Dense grids. 4px gaps for tight data. 16px/24px padding for containers.

---

## 3. Component Inventory

### A. Layout Components
*   **`AppShell`**: Fixed sidebar (left), scrolling main area (right).
*   **`PageHeader`**: Sticky top bar. Contains Breadcrumbs + Global Actions.
*   **`Panel`**: `bg-surface border border-border rounded-xl`. The fundamental container for content.

### B. Calendar Components
*   **`TrainingCalendar`**: Infinite vertical scroll container.
*   **`WeekSection`**: A single row representing 7 days + Summary.
*   **`DayCell`**: A vertical stack for a single day.
*   **`SessionCard`**: The atomic unit of training.
    *   *Props*: `session`, `compact` (boolean).
    *   *Visual*: Left border strip indicates status. Background opacity indicates completion.

### C. Training & Analysis
*   **`WorkoutBuilder`**: Visualizes intervals.
    *   *Structure*: Bar chart visualization + Sortable list.
*   **`PerformanceChart`**: SVG-based, lightweight line chart.
    *   *Rules*: No legends inside the chart. Tooltips or external legends only.
*   **`MetricCard`**: Standardized box for single data points.
    *   *Layout*: Label (top) + Mono Value (middle) + Delta/Sub-label (bottom).

### D. Feedback
*   **`StatusBadge`**: Pill-shaped indicator.
    *   *Variants*: Planned, Completed, Skipped.
*   **`Modal`**: Centered, backdrop-blur.
    *   *Usage*: Creation flows, deep editing.

---

## 4. Composition Rules

1.  **Nesting**:
    *   `WeekSection` MUST contain `DayCell`.
    *   `DayCell` MUST contain `SessionCard`.
    *   `Panel` can contain `PerformanceChart` or `MetricCard`.
2.  **Typography**:
    *   Never use `font-mono` for body text.
    *   Never use `font-sans` for raw duration/power data.
3.  **Mobile Behavior**:
    *   **Calendar**: Week grid transforms to vertical day list or horizontal swipe (TBD V2).
    *   **Charts**: Must define a fixed height and allow horizontal scrolling if data density is too high.
    *   **Sidebar**: Collapses to bottom nav or hamburger menu.

---

## 5. State Definitions

*   **Planned**: Opaque, gray-scale, outline styles.
*   **Completed**: Colored accents, filled styles, "solid" feel.
*   **Active/Today**: Highlighted background `bg-zinc-900/30`.

