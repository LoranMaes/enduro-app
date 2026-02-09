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
- Calendar behavioral parity hardening (COMPLETE):
  - initial load centers current week in owned calendar scroll container
  - infinite vertical week loading (past + future) via session-window reads
  - no pagination UI and no write-path changes

---

## Phase 3 — Training Sessions

- CRUD planned sessions (COMPLETE)
- Athlete calendar write wiring (COMPLETE for explicit modal CRUD):
  - athlete-only create/edit/delete session modals
  - role-gated write affordances
  - backend validation error rendering
  - real API writes + Inertia calendar data reload
- Activity ↔ session read-only link hints (COMPLETE):
  - `ActivityLinkingService` suggestions by athlete/sport/date/duration proximity
  - `TrainingSessionResource` now includes `suggested_activities`
  - `ActivityResource` now exposes `linked_session_id` for downstream UI wiring
  - no auto-assignment and no link-write endpoints (intentionally deferred)
- Activity ↔ session manual linking actions (COMPLETE):
  - explicit API actions:
    - `POST /api/training-sessions/{training_session}/link-activity`
    - `DELETE /api/training-sessions/{training_session}/unlink-activity`
  - athlete-only link/unlink policy path
  - conflict-safe validation (already-linked activity / already-linked session)
  - calendar modal affordances for link/unlink with non-optimistic refresh flow
- Session completion from linked activity (COMPLETE):
  - explicit API actions:
    - `POST /api/training-sessions/{training_session}/complete`
    - `POST /api/training-sessions/{training_session}/revert-completion`
  - completion requires linked activity and explicit user action
  - copied completion fields:
    - `actual_duration_minutes`
    - `actual_tss` (nullable when missing)
  - completion/revert UI actions integrated in session editor modal (athlete contexts only)
- Garmin sync ingestion (placeholder only in V1 scaffold)
- Planned ↔ completed linking

Status update:
- TrainingWeek CRUD is implemented and validated.
- Calendar remains read-only and mapped to slicing-first layout using real API data.
- Athlete calendar structural parity hardening is complete; remaining work is screenshot-level lock/cleanup only.
- TrainingSession write endpoints (`store`, `update`, `destroy`) are implemented and validated with policy + FormRequest coverage.
- Athlete calendar now supports explicit athlete-only modal CRUD for planned sessions while preserving non-athlete read-only behavior.
- External activities can now be correlated to planned sessions through read-only API hints; write-side linking is intentionally out of scope for this phase.
- Manual activity linking is now enabled via explicit athlete actions, while automatic matching and metrics derivation remain out of scope.
- Manual session completion is now enabled as a distinct explicit step after linking; no automatic completion or training metric derivation has been introduced.
- Athlete Training Progress page is now implemented as a read-only session-derived surface (`/progress`) with range filtering, trend visualization, and consistency indicators.
- Post-activity reconciliation UX is now hardened in calendar/editor surfaces:
  - linked session rows expose ready-to-complete state
  - completed rows now indicate adjusted outcomes when actual values materially differ
  - session editor shows explicit planned-vs-actual comparison and clear completion/revert effects

---

## Phase 4 — Analysis

- Real telemetry ingestion
- Chart performance tuning
- Derived metrics

---

## Phase 4.5 — External Activity Providers (Backend Backbone)

- Provider-agnostic contract + manager/registry (COMPLETE)
- Strava read-only provider implementation (COMPLETE)
- Normalized DTO mapping + typed activity collections (COMPLETE)
- Minimal persistence into `activities` (COMPLETE, no session-linking/metrics)
- Read-only activities API with role-scoped access + pagination/filtering (COMPLETE)
- Test coverage for provider resolution, mapping, token failures, and activity read access (COMPLETE)
- OAuth/connect contract + provider-specific auth handler resolution (COMPLETE)
- Strava OAuth connect/callback/disconnect flow (COMPLETE)
- Token lifecycle refresh management behind provider abstractions (COMPLETE)
- Manual sync entrypoint with status tracking (COMPLETE):
  - `POST /api/activity-providers/{provider}/sync`
  - now queue-backed (`202 queued`)
  - sync run tracking table/model in place
- Settings → Connections page (COMPLETE):
  - real connection status
  - connect/disconnect actions
  - sync-now action
- Idempotent provider activity persistence during sync (COMPLETE)
- Queue orchestration hardening (COMPLETE):
  - one-lock-per-user+provider sync safety
  - deterministic lock retry delay
  - deterministic rate-limit requeue (`Retry-After` or exponential fallback)
  - connection status lifecycle (`queued` → `running` → terminal/limited state)
- Real-time sync status delivery (COMPLETE):
  - broadcasting + Reverb scaffold installed
  - private user-channel sync-status event broadcasting
  - settings connections view now updates live when sync status transitions
- Strava webhook ingestion (COMPLETE, Strava-first):
  - verification endpoint (challenge response)
  - event ingestion endpoint
  - idempotent event persistence
  - create/update event dispatches targeted sync
  - delete event soft-deletes local external activity records
- Soft-delete safe external activity upserts (COMPLETE)

Status update:
- External provider scaffolding is now production-safe and swappable by provider key.
- Strava is wired as the first provider with explicit read-only sync behavior, token refresh handling, queue-backed execution, and webhook-triggered sync.
- OAuth + sync/webhook architecture is structured for future provider extensions (Garmin/Suunto/Polar) without changing activity read contracts.
- Provider webhook subscription lifecycle automation, periodic scheduling strategy, and derived load metrics remain intentionally out of scope.

---

## Phase 5 — Roles & Permissions

- Athlete / Coach / Admin
- Impersonation support (COMPLETE for session-based read-only admin supervision)
- Approval workflows

Status update:
- Coach-athlete assignment backbone is implemented (model, migration, policies, query scoping, read-only coach views, tests).
- Coach access is now assignment-aware and read-only for calendar data.
- Admin console + users directory + session impersonation are now implemented and validated:
  - admin sidebar scope corrected to `Admin Console` + `Users`
  - impersonation start/stop routes implemented
  - Inertia impersonation context shared globally
  - impersonated sessions use role-correct navigation context
  - training-data writes are blocked while impersonating
- Next in this phase is explicit role-management/admin account actions (separate scope), without expanding into training-data write access.

---

## Phase 6 — Monetization

- Subscription tiers
- Feature flags
- Plan marketplace (later)
