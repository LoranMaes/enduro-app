# Endure — Implementation Plan

This follows the **design-first → Codex → backend** approach.

---

## Phase 0 — Design (COMPLETE)

- Google AI Studio prototype
- Design system locked
- Core UX validated

---

## Phase 1 — Frontend Extraction

- Export React code from AI Studio
- Place into Laravel + React starter
- Mirror structure from prototype
- Add /slicing/screenshots

---

## Phase 1.5 — Backend Domain Spine (COMPLETE)

- Core domain models scaffolded
- Migrations created for V1 entities
- Policy scaffolding created and registered
- API resources created
- API controllers created as structural stubs
- API routes added under authenticated middleware

---

## Phase 2 — Calendar Backbone

- Real data models (COMPLETE)
- Week/day/session relationships (COMPLETE)
- TrainingWeek read endpoints (COMPLETE)
- TrainingSession read endpoints (COMPLETE)
- Calendar read filters/pagination for plan/week/session collections (COMPLETE)
- TrainingWeek CRUD backend (COMPLETE)
- Athlete calendar slicing convergence pass (COMPLETE for structural parity):
  - fixed header + fixed day axis + sticky weeks
  - slicing-aligned session/day/week composition
  - slicing-style sidebar rail integration
  - token/typography hardening
  - scroll ownership, separator cleanup, summary rail ratio, and session metric hierarchy hardening

---

## Phase 3 — Training Sessions

- CRUD planned sessions (NEXT)
- Garmin sync ingestion (placeholder only in V1 scaffold)
- Planned ↔ completed linking

Status update:
- TrainingWeek CRUD is implemented and validated.
- Calendar remains read-only and mapped to slicing-first layout using real API data.
- Athlete calendar structural parity hardening is complete; remaining work is screenshot-level lock/cleanup only.
- Session write logic is still intentionally deferred and is the next backend milestone.

---

## Phase 4 — Analysis

- Real telemetry ingestion
- Chart performance tuning
- Derived metrics

---

## Phase 5 — Roles & Permissions

- Athlete / Coach / Admin
- Impersonation support
- Approval workflows

---

## Phase 6 — Monetization

- Subscription tiers
- Feature flags
- Plan marketplace (later)
