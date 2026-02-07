# Endure — Project State

## Current Phase

Design complete + backend domain spine scaffolded + read-only API integration started in frontend dashboard

## Confidence Level

High — UX validated, backend structure in place

## Known Risks

- Performance with large calendars
- Garmin data normalization
- Overcomplicating early admin tools
- Coach-athlete assignment model not implemented yet
- API controllers are currently structural stubs (no business logic yet)
- Read integration is currently limited to dashboard view; broader calendar surfaces still pending

## Mitigations

- Virtualized lists
- Strict scope discipline
- Feature flags everywhere
- Deliver API logic incrementally behind policy checks
- Implement coach-athlete assignment early before coach features expand

## Design Status

LOCKED for MVP

## Backend Status

- Domain entities, migrations, policies, API resources, and API route scaffolding are in place.
- Authentication remains Fortify-based; API routes currently use `auth` middleware.
- Sanctum is not installed in the current project baseline.
- Dashboard now receives training plan data from server-side Inertia props (policy-scoped, paginated).
- TrainingWeek read API endpoints are implemented with nested session payloads.
