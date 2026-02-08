# Endure — Progress Log

## 2026-02-07

- Backend domain spine generated:
  - models + relationships
  - migrations
  - policies
  - API resources
  - API controllers (stubbed)
  - API routes
- Added `role` to users (`athlete`, `coach`, `admin`)
- Registered policy mappings for core training entities
- API auth decision recorded: use Fortify/session `auth` middleware (no Sanctum in baseline)
- Phase 2A started: dashboard now reads real training plan data from `GET /api/training-plans` (nested weeks/sessions), read-only
- Added frontend transformer layer for training plan API payloads to keep UI decoupled from raw response shape
- Dashboard data loading moved to Inertia server props (no client-side fetch for plan reads)
- Implemented TrainingWeek read endpoints (`index`, `show`) with policy-aware scoping and nested sessions
- Added read performance controls for TrainingPlan + TrainingWeek index endpoints:
  - `per_page`
  - `starts_from`
  - `ends_to`
  - paginated response shape (`data`, `links`, `meta`)
- Added/updated API tests for:
  - training plan pagination + date filters
  - training week read access behavior
  - authenticated endpoint behavior updates
- Implemented TrainingSession read endpoints (`index`, `show`) for calendar backbone
- Added TrainingSession read filters:
  - `from`
  - `to`
  - `training_plan_id`
  - `training_week_id`
- Added TrainingSession read tests for:
  - auth requirements
  - athlete own-data access
  - athlete forbidden cross-user access
  - admin full access
  - coach empty collection behavior
  - date window filtering
- Implemented TrainingWeek CRUD (`store`, `update`, `destroy`) with policy checks
- Added explicit TrainingWeek write validation via FormRequests:
  - required `starts_at` / `ends_at`
  - date ordering (`starts_at < ends_at`)
  - non-overlapping weeks within the same training plan
- Added focused TrainingWeek CRUD API tests for auth, ownership, admin, overlap, and invalid date ranges
- Added deterministic visual verification seeders:
  - `VisualSeeder`
  - `Visual/AdminVisualSeeder`
  - `Visual/CoachVisualSeeder`
  - `Visual/AthleteVisualSeeder`
  - deterministic role users + predictable plan/week/session calendar data
- Implemented role-aware navigation shells (athlete/coach/admin/settings route surfaces)
- Refactored athlete calendar to slicing-first composition using real backend data:
  - single calendar canvas
  - fixed top calendar header
  - fixed weekday row
  - sticky week headers
  - 7 aligned day columns + right weekly summary rail
  - read-only interaction posture preserved
- Reworked sidebar from starter-kit panel navigation to slicing-style fixed icon rail:
  - icon stack + active blue indicator dot
  - role-aware nav visibility retained
  - role badge + sign-out controls aligned to slicing layout
- Removed/neutralized starter-kit visual token drift:
  - slicing-aligned dark tokens in `resources/css/app.css`
  - Inter + JetBrains Mono font loading in app shell
  - bootstrap background set to slicing dark to avoid initial flash mismatch
- Updated calendar session visuals toward slicing `SessionCard` behavior:
  - removed planned badge
  - status icon rules aligned
  - mono metric row + left sport accent strip + density/rhythm parity updates
- Updated docs to track frontend slicing convergence and backend readiness

## 2026-02-08

- Completed athlete calendar visual parity hardening pass (frontend-only, read-only behavior unchanged):
  - scroll ownership locked to calendar canvas (page wrapper overflow hidden)
  - duplicate day-column vertical separators removed
  - current-week emphasis reduced to subtle header treatment (no full-week tint / left stripe)
  - weekly summary rail width adjusted to slicing proportions
  - week/day vertical rhythm normalized for consistent band height
  - day-cell inset spacing tightened for closer date-to-session scan flow
  - planned-session contrast increased (title + primary duration metric)
  - session metrics restructured to stacked mono duration/TSS blocks
  - planned-state right-side marker aligned to slicing composition
- Verified frontend safety with targeted TypeScript check (`npm run types`) after the pass.
- No backend/API/routes/policy changes in this update.

Next milestone:
→ Final screenshot-level athlete calendar QA and lock, then start controlled `TrainingSession` write backend phase (`store` / `update` / `destroy` + tests) without expanding coach assignment scope.
