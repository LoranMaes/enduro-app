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

Next milestone:
→ Replace remaining prototype/mock calendar surfaces with the same read-only API integration pattern
