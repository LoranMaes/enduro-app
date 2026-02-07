# Frontend Constraints — Endure

These constraints exist to ensure consistency, maintainability,
and smooth migration from prototype to production code.

They are non-negotiable.

---

## Framework & Language

- React
  - Functional components only
  - Hooks-based state management
- TypeScript
  - Strict typing enabled
  - No `any` unless explicitly justified

---

## Styling

- Tailwind CSS only
- No additional CSS frameworks
- No inline styles except where strictly necessary
- Styling must align with DESIGN_SYSTEM.md

---

## UI & Icons

- Use existing UI primitives where possible
- Prefer composition over duplication
- Icons:
  - Lucide React
  - Or custom SVGs

No third-party component libraries beyond what is already defined.

---

## Charts & Data Visualization

- SVG-based charts preferred
- Recharts or equivalent allowed
- Charts must:
  - Prioritize readability
  - Avoid decoration
  - Use color semantically

---

## Interaction & Motion

- Motion must be functional
- Avoid decorative animations
- Use transitions to:
  - Open modals
  - Reveal content
  - Indicate state changes

---

## Code Generation Intent

Generated code should:
- Be readable
- Be migration-friendly
- Avoid clever abstractions
- Prefer explicitness over magic

This project values clarity over novelty.