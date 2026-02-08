# Endure — Project State

## Current Phase

Backend spine + athlete calendar write flow complete, with coach-athlete assignment and admin impersonation backbone implemented.

## Confidence Level

High — UX validated, backend structure in place

## Known Risks

- Performance with large calendars
- Garmin data normalization
- Overcomplicating early admin tools
- Admin role-management actions are not implemented yet (impersonation-only admin interaction is currently supported)
- Remaining visual drift risk from starter-kit primitives still present in non-calendar surfaces
- External provider operations still need production rollout hardening (queue worker uptime, webhook subscription lifecycle, operational alerting)

## Mitigations

- Virtualized lists
- Strict scope discipline
- Feature flags everywhere
- Deliver API logic incrementally behind policy checks
- Keep coach permissions read-only until assignment + impersonation workflows are fully stabilized
- Keep admin interaction supervisory/read-only (impersonation + user directory) until a dedicated admin write-policy phase

## Design Status

LOCKED for MVP

## Backend Status

- Domain entities, migrations, policies, API resources, and API route scaffolding are in place.
- Authentication remains Fortify-based; API routes use `auth` middleware.
- TrainingPlan CRUD is implemented and tested.
- TrainingWeek read + CRUD is implemented and tested (including overlap/date validation).
- TrainingSession read and write endpoints are implemented and tested with policy scoping + filters.
- Coach-athlete assignment model is implemented and enforced in policies/query scoping.
- Admin impersonation is implemented using session switching (`start` / `stop`) with Inertia-shared impersonation context.
- API routes use session middleware so impersonation context is available for policy checks.
- Training data writes are blocked during impersonation sessions.
- Visual verification seeders are available via `VisualSeeder` for deterministic UI snapshots.
- Activity provider OAuth + token refresh + read sync backbone is implemented (Strava first).
- Provider sync is now queue-backed with lock safety and run tracking (`activity_provider_sync_runs`).
- Strava webhook verification and ingestion endpoints are implemented with idempotent event storage (`activity_provider_webhook_events`).
- Activity delete webhook events are handled via soft deletes (no hard deletion from `activities`).
- Reverb broadcasting is configured for live provider sync status updates on authenticated user channels.
- Sail compose exposes Reverb websocket port (`FORWARD_REVERB_PORT`, default `8080`) for local browser subscriptions.

## Frontend Status

- Athlete calendar uses real backend data with athlete-only session write interactions enabled.
- Athlete calendar now supports athlete-only session writes (modal CRUD) against real backend endpoints.
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
- Admin sidebar now matches slicing scope (non-impersonating admin sees only Admin Console + Users).
- Persistent impersonation banner is active during impersonated sessions with explicit stop action.
- Coach directory now renders real assigned-athlete data and links into read-only athlete calendar views.
- Core theme tokens/fonts were hardened to slicing palette + typography baselines.
- Settings → Connections now reflects async sync states from real backend status (`queued`, `running`, `rate_limited`, `failed`, `success`).
- Settings → Connections now updates those sync states live via Reverb/Echo events (no manual refresh needed).
