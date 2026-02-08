# Endure — Project State

## Current Phase

Backend spine + calendar read/write foundation complete, with athlete calendar in screenshot-level parity lock mode.

## Confidence Level

High — UX validated, backend structure in place

## Known Risks

- Performance with large calendars
- Garmin data normalization
- Overcomplicating early admin tools
- Coach-athlete assignment model not implemented yet
- Session write APIs not yet implemented (store/update/destroy)
- Remaining visual drift risk from starter-kit primitives still present in non-calendar surfaces

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
- Authentication remains Fortify-based; API routes use `auth` middleware.
- TrainingPlan CRUD is implemented and tested.
- TrainingWeek read + CRUD is implemented and tested (including overlap/date validation).
- TrainingSession read endpoints are implemented and tested with policy scoping + filters.
- Visual verification seeders are available via `VisualSeeder` for deterministic UI snapshots.

## Frontend Status

- Athlete calendar uses real backend data and is read-only.
- Calendar composition now follows slicing structure:
  - fixed calendar header
  - fixed weekday axis
  - sticky week labels
  - aligned day columns + summary rail
- Calendar hardening pass completed for slicing parity:
  - calendar-owned scrolling (no page-level scroll ownership)
  - single-source vertical separators (no double grid lines)
  - adjusted week-band rhythm and summary rail width
  - planned-session metric hierarchy aligned (stacked duration/TSS + planned marker)
- Sidebar is now slicing-style fixed icon rail with role-aware entries.
- Core theme tokens/fonts were hardened to slicing palette + typography baselines.
