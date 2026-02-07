# Endure — Progress Log

## 2026-02-07

- Calendar-first UX finalized
- Analysis UX hardened
- Progress view implemented
- Admin / coach vision aligned
- Design system stabilized
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

Next milestone:
→ Build dedicated calendar pages/components on top of server-provided read models, then expand Week/Session backend beyond read-only
