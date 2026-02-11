# Endure Design System — V1.0

This document defines the **visual, structural, and interaction foundations**
of the Endure endurance training platform.

It is authoritative.

If something is not defined here, it should not be invented casually.

---

## 1. Core Principles

### Product stance

Endure is a **serious endurance training tool**, not a consumer fitness app.

It is designed for:

- Daily use
- Planning under cognitive load
- Reviewing performance under fatigue
- Athletes, coaches, and administrators who value clarity over novelty

### Design intent

- Calm
- Technical
- Precise
- Slightly industrial
- Coach-grade

Avoid anything playful, motivational, or gamified.

---

## 2. Visual Language

### Aesthetic

**Performance Lab**

- Dark, neutral base
- Clear structure
- Minimal decoration
- Visual weight communicates importance

The UI should feel like:

- A coach’s notebook
- A performance lab dashboard
- A training log meant to last years

---

## 3. Color Semantics

Color is functional, not decorative.

### Surfaces

- `bg-background` — `#09090b`
    - Global application background
- `bg-surface` — `#18181b`
    - Cards, panels, sidebars

### Borders

- `border-border` — `#27272a`
    - Structural separation
    - Used heavily and consistently

### Sport Encoding

Each sport has a **stable semantic color**:

- Swim → `sport-swim` — Sky-400 (`#38bdf8`)
- Bike → `sport-bike` — Violet-400 (`#a78bfa`)
- Run → `sport-run` — Rose-400 (`#fb7185`)
- Gym / Strength → `sport-gym` — Amber-400 (`#fbbf24`)

Sport colors may be used for:

- Icons
- Accents
- Small indicators

Never for large backgrounds.

### Status Encoding

- Completed → `status-completed` — Emerald-500
- Planned → `status-planned` — Zinc-600
- Skipped → `status-skipped` — Red-500
- Warning / overload → `status-warning` — Amber-500

Status color must always encode meaning.
Never use status colors decoratively.

---

## 4. Typography

Typography is part of the product’s credibility.

### Font families

- **Inter**
    - Headings
    - Labels
    - Body text
- **JetBrains Mono**
    - All numerical data
    - Metrics
    - Time, duration, power, TSS

### Rules (non-negotiable)

- Never use `font-mono` for body copy
- Never use `font-sans` for raw numeric data
- Typography hierarchy must be obvious without color

### Hierarchy

- Page titles → calm, confident
- Section headers → utilitarian
- Labels → uppercase, small, muted
- Data → mono, prominent, readable

---

## 5. Spacing & Density

Endure is a **dense application**, but never cluttered.

### Spacing philosophy

- Small gaps for dense data
- Larger padding for structural containers

### Standards

- Tight grids: 4px–8px gaps
- Panels: 16px–24px padding
- Vertical rhythm must feel deliberate

Avoid:

- Excessive whitespace
- “Breathing room” for its own sake

---

## 6. Radius & Shape

Radius communicates hierarchy.

- `rounded-sm`
    - Inner elements
    - Progress bars
- `rounded-md`
    - Inputs
    - Session cards
- `rounded-xl`
    - Panels
    - Modals
- `rounded-full`
    - Badges
    - Avatars

Never mix radii arbitrarily.

---

## 7. Core Components (Conceptual)

These components define the system.
They should be reused, not reinvented.

### Layout

- **AppShell**
    - Fixed sidebar
    - Scrollable main area
- **PageHeader**
    - Sticky
    - Contextual
- **Panel**
    - `bg-surface + border-border + rounded-xl`
    - Fundamental container

### Calendar

- **TrainingCalendar**
    - Infinite vertical scroll
- **WeekSection**
    - Week header + grid
- **DayCell**
    - Stack of sessions
- **SessionCard**
    - Atomic training unit
    - Clear planned vs completed state

### Metrics & Analysis

- **MetricCard**
    - Label → Value → Subvalue
- **PerformanceChart**
    - SVG-based
    - Lightweight
    - No decorative legends

### Feedback

- **StatusBadge**
    - Small, semantic
- **Modal**
    - Centered
    - Backdrop blur
    - Clear exit

### Dialog implementation rule (Shadcn/Radix)

For every dialog implementation, always include:

- `DialogContent`
- `DialogTitle`

Recommended baseline structure:

- `Dialog`
- `DialogContent`
- `DialogHeader`
- `DialogTitle`
- optional `DialogDescription`

Even if a visual heading is custom-rendered, keep `DialogTitle` present
(can be visually hidden) for consistent accessibility semantics.

Scrollable dialog pattern:

- `DialogContent` should define viewport constraints:
    - height: `h-[92vh]` + `max-h-[...]`
    - width: `w-[98vw]` + `max-w-[...]`
    - `overflow-hidden`
- Prefer explicit viewport classes over CSS `min(...)` expressions in utility
  classes to avoid inconsistent class generation in complex builds.
- Inner content container should use:
    - `flex min-h-0 flex-col`
- Any scroll region inside a dialog must use:
    - `min-h-0 flex-1 overflow-y-auto`
- Avoid unconstrained children (`h-full` without a constrained parent), as this
  breaks vertical scrolling and causes content overflow in audit/log lists.

---

## 8. State Definitions

States must never be ambiguous.

- Planned
    - Muted
    - Outline-driven
- Completed
    - Solid
    - Confident
- Active / Today
    - Subtle background highlight (`bg-zinc-900/30`)

If two states compete visually, one must be reduced.

---

## 9. Motion & Interaction

Motion is **functional only**.

Allowed:

- Reveal content
- Open / close modals
- Transition state changes

Avoid:

- Decorative animations
- Attention-seeking motion
- Multiple animations at once

If motion does not communicate state, remove it.

---

## 10. Accessibility & Fatigue Considerations

Endure is used:

- Early morning
- Late evening
- After hard training sessions

Design must:

- Maintain contrast
- Avoid visual noise
- Keep interactions predictable
- Reduce cognitive load

The UI should feel calm even when the user is not.

---

## 11. Non-Goals

This design system intentionally avoids:

- Gamification (streaks, badges, fireworks)
- Social-first UI patterns
- Influencer fitness aesthetics
- Neon gradients
- Excessive micro-interactions
- “Motivational” copy

Endure is about structure, not hype.

---

## Final Note

This design system exists to protect the product.

If a design decision feels questionable, slow down.
Clarity and consistency always win.
