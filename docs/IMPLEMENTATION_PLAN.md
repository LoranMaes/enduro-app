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

- Real data models
- Week/day/session relationships
- Infinite scroll performance
- Memoized rendering
- TrainingWeek read endpoints implemented (index/show)
- TrainingSession read endpoints implemented (index/show)
- Calendar read filters/pagination in place for plan/week/session collections

---

## Phase 3 — Training Sessions

- CRUD planned sessions
- Garmin sync ingestion (placeholder only in V1 scaffold)
- Planned ↔ completed linking

Status update:
- TrainingWeek CRUD is now implemented and validated.
- Calendar UX wiring for week writes is intentionally deferred to a later step.

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
