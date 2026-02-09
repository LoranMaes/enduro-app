# Endure — Project State

## Current Phase

Backend spine + athlete operational flows are complete, including activity sync/link/complete pipelines, coach-athlete assignment, and admin impersonation.

Athlete slicing parity is in active Phase 7 implementation with settings/calendar/session-detail/progress/plans V1 surfaces now wired to real data.

## Confidence Level

High — UX validated, backend structure in place

## Known Risks

- Performance with large calendars
- Frontend bundle size remains heavy in key chunks (`app`, `session-detail`, `landing`)
- Garmin data normalization
- Overcomplicating early admin tools
- Admin role-management actions are still partial (suspension is implemented; broader role/billing governance is pending)
- Remaining visual drift risk from starter-kit primitives still present in non-calendar surfaces
- External provider operations still need production rollout hardening (queue worker uptime, webhook subscription lifecycle, operational alerting)
- Admin analytics is currently uncached and can add unnecessary DB load during frequent range switching
- Admin list scaling needs explicit index verification for created-at + status/filter paths
- Activity ↔ TrainingSession matching is heuristic (date/sport/duration) and may need future confidence tuning before write-side linking is enabled
- Linking currently supports single explicit attach/detach actions only; no bulk-link workflow yet
- Completion flow currently copies provider data only; reconciliation UI is manual and explicit, with no auto-completion or derived load science
- Athlete session-detail chart/map visual fidelity still needs screenshot-level polish against slicing reference
- Interval structure taxonomy is currently code-defined; admin-manageable block catalogs are deferred
- Stream coverage depends on provider payload availability; unsupported streams remain disabled by design

## Mitigations

- Virtualized lists
- Strict scope discipline
- Feature flags everywhere
- Short-window caching on analytics aggregates
- Add/verify table indexes for high-volume admin lists and filters
- Deliver API logic incrementally behind policy checks
- Keep coach permissions read-only until assignment + impersonation workflows are fully stabilized
- Keep admin writes tightly scoped to moderation-only flows (suspension/reactivation) until full governance policy phase
- Maintain a production readiness checklist before go-live:
    - supervised queue workers
    - supervised Reverb
    - `APP_DEBUG=false`
    - monitoring/alerts
    - verified backups
    - object storage for user uploads

## UI Chart Guardrails

- Do not render analytics SVG charts with `preserveAspectRatio="none"` because it stretches axes and distorts line geometry.
- All trend charts must expose point-level hover inspection (crosshair + values) so data remains readable and actionable.
- Prefer stable chart aspect-ratio behavior (`xMidYMid meet`) and avoid fullscreen stretching inside fixed-height cards.
- When range toggles are enabled (`4w/8w/12w/24w`), x-axis labels and hover values must remain aligned with the selected data window.

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
- Pending/rejected coach accounts are blocked from impersonation start (`422`) to prevent invalid supervisory context.
- Visual verification seeders are available via `VisualSeeder` for deterministic UI snapshots.
- Activity provider OAuth + token refresh + read sync backbone is implemented (Strava first).
- Provider sync is now queue-backed with lock safety and run tracking (`activity_provider_sync_runs`).
- Strava webhook verification and ingestion endpoints are implemented with idempotent event storage (`activity_provider_webhook_events`).
- Activity delete webhook events are handled via soft deletes (no hard deletion from `activities`).
- Reverb broadcasting is configured for live provider sync status updates on authenticated user channels.
- Sail compose exposes Reverb websocket port (`FORWARD_REVERB_PORT`, default `8080`) for local browser subscriptions.
- Activity observability now includes Spatie activity logs:
    - activity log schema/config installed
    - model-level logging enabled for core mutable entities
    - mutating HTTP requests logged via `log_activity` middleware with sensitive field redaction
- Admin audit detail route is available:
    - `GET /admin/users/{user}`
    - filterable/paginated user activity logs with value-inspection modal
- Admin moderation + analytics routes are available:
    - `GET /admin/analytics`
    - `POST /admin/users/{user}/suspend`
    - `DELETE /admin/users/{user}/suspend`
    - suspension is enforced through `not_suspended` middleware on authenticated web/API paths
- Read-only activity/session correlation is available:
    - `TrainingSessionResource` exposes `suggested_activities`
    - `ActivityResource` exposes `linked_session_id`
    - linking is currently non-mutating and service-driven (`ActivityLinkingService`)
- Manual linking API is available:
    - `POST /api/training-sessions/{training_session}/link-activity`
    - `DELETE /api/training-sessions/{training_session}/unlink-activity`
    - athlete-owned sessions/activities only
    - coach/admin direct linking denied
    - impersonated athlete context can link/unlink as athlete
- Manual completion API is available:
    - `POST /api/training-sessions/{training_session}/complete`
    - `POST /api/training-sessions/{training_session}/revert-completion`
    - completion requires linked activity
    - completion writes copied `actual_duration_minutes`/`actual_tss`
    - revert preserves activity link and resets completion fields/status
- Session planned structure persistence is available:
    - `training_sessions.planned_structure` JSON
    - explicit validation in training session store/update requests
    - nested structure items (`steps[*].items`) + `repeats` type validation are supported
    - no auto-derived metrics or science logic attached
- Session read payloads now include resolved historical load hints:
    - `actual_tss` remains persisted write-state
    - `resolved_actual_tss` is computed for read surfaces using activity payload + conservative fallback estimates
- Athlete settings persistence is available:
    - `users`: `timezone`, `unit_system`
    - `athlete_profiles`: `primary_sport`, `weekly_training_days`, `preferred_rest_day`, `intensity_distribution`
- Athlete workout anchor persistence is available:
    - `athlete_profiles`: `ftp_watts`, `max_heart_rate_bpm`, `threshold_heart_rate_bpm`, `threshold_pace_minutes_per_km`
    - `athlete_profiles`: `power_zones` JSON, `heart_rate_zones` JSON
    - training-preferences request now validates anchor bounds + zone integrity
- Activity stream API is available:
    - provider-agnostic stream contract + Strava implementation
    - `GET /api/activities/{activity}/streams`
    - stream payload caching via configurable cache TTL
- Provider sync now includes automatic post-sync link suggestions:
    - explicit auto-link pass after persistence (`ActivityAutoLinkService`)
    - conservative matching only (same athlete/day/sport + duration threshold)
    - existing manual links are preserved during provider upserts

## Frontend Status

- Athlete calendar uses real backend data with athlete-only session write interactions enabled.
- Athlete calendar now supports athlete-only session writes (modal CRUD) against real backend endpoints.
- Athlete calendar now centers on the current week at initial load and supports infinite vertical scrolling (past/future windows) through session read API window fetches.
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
- Admin sidebar now includes:
    - Admin Console
    - Users
    - Analytics
    - Coach Applications
- Admin users directory now supports:
    - search
    - role/status filtering
    - sorting
    - pagination
    - created-at visibility
- Admin users/recent-signups tables include direct links to per-user detail/audit view.
- Admin user detail now includes:
    - explicit back navigation
    - suspend/reactivate moderation controls
    - resilient log modal payload layout
- Persistent impersonation banner is active during impersonated sessions with explicit stop action.
- Coach directory now renders real assigned-athlete data and links into read-only athlete calendar views.
- Core theme tokens/fonts were hardened to slicing palette + typography baselines.
- Auth/onboarding UI now uses Endure-styled auth surfaces:
    - redesigned login
    - role-aware multi-step registration
    - coach pending approval screen with submitted answers + file previews
    - Enter key now advances/submits register flow consistently
- Settings → Connections now reflects async sync states from real backend status (`queued`, `running`, `rate_limited`, `failed`, `success`).
- Settings → Connections now updates those sync states live via Reverb/Echo events (no manual refresh needed).
- Calendar provider status chip now updates from the same live sync events and refreshes session data when sync completes.
- Calendar now renders synced external activities directly inside day columns (linked/unlinked state visible).
- Calendar sync status now has polling fallback when realtime websocket updates are unavailable.
- Athlete calendar view-mode controls are available:
    - `Infinite` (default)
    - `Day`
    - `Week`
    - `Month`
    - contextual `Jump to current week` action when off current week
- Calendar prepend extension is now anchor-preserved to avoid jumpy month shifts when loading past weeks.
- Unlinked activity rows are now inspectable through a dedicated athlete read-only detail route (`/activity-details/{activity}`).
- Session editor now includes manual activity linking controls:
    - suggested activities list
    - linked activity summary
    - explicit Link/Unlink actions with loading/error feedback
    - role-gated visibility (athlete contexts only)
- Session editor now includes manual completion controls:
    - explicit `Mark as Completed` when linked + planned
    - explicit `Revert to Planned` when completed
    - completion/revert feedback states without optimistic mutation
    - athlete-context only (coach/admin remain read-only)
- Calendar/session reconciliation UX now distinguishes post-activity states clearly:
    - linked planned sessions show `Ready to complete`
    - completed sessions show subtle `Adjusted` marker when actual values materially differ
    - session editor includes explicit planned-vs-actual comparison blocks (duration/TSS)
- Training Progress (`/progress`) is now a real athlete-only read surface:
    - range filters (`4/8/12/24` weeks)
    - average load/volume from session aggregates
    - planned vs completed totals
    - trend chart with explicit missing-data gaps
    - consistency/streak indicators without training-science derivation
- Training Progress chart hardening is applied for slicing parity:
    - fixed chart aspect ratio to prevent horizontal stretching
    - hover crosshair + week value overlay now align with active data point
    - load trend now renders planned centerline + target band + actual trajectory together
    - actual weekly totals now include linked-activity fallback values when sessions are not manually completed yet
    - unlinked synced activities now contribute to actual weekly totals to prevent empty historical graphs/logs
- Calendar and session detail now consume resolved historical TSS for load/summary rendering without mutating session write-state.
- Calendar week summary now includes per-sport actual volume chips based on synced activity volume.
- Settings now use slicing-style tabbed shell at `/settings/overview` with athlete account treatment and real integration state.
- Calendar/provider header now reflects real Strava connection and sync status instead of static Garmin copy.
- Session editor includes slicing-style interval builder and persists `planned_structure`.
- Session editor workout builder now consumes athlete performance anchors and supports:
    - unit-aware preview axis labels
    - range-band rendering
    - grouped repeat/warmup templates
    - summary tiles (`duration`, `estimated TSS`, `blocks`)
    - preview drag/drop + block-list insertion markers
- Session editor now derives planned duration/TSS from structure when structure exists (manual fields only when no structure is defined).
- Session editor modal now includes dedicated tabs and viewport-safe scroll behavior:
    - details and structure are split into explicit tabs
    - structure tab uses wider modal width for interval authoring
    - modal content stays contained within viewport height
- Completed athlete sessions now route to a dedicated session-detail page with planned-vs-actual surfaces, stream toggles, and map panel.
- Session detail now supports interactive workout inspection:
    - chart x-axis toggle (`kilometers`/`time`, kilometers default when available)
    - drag-select zoom with reset for focused inspection windows
    - hover inspection readout for stream values at the active sample
    - cursor-aligned hover guideline and filled elevation profile rendering
    - real Leaflet route map with full polyline + focused highlighted segment and hover-synced marker
    - right-rail consolidated statistics card + internal-notes save surface
    - read-only planned-structure preview with hover detail
    - deterministic stream-point downsampling for smoother chart interaction
    - no-planned-structure sessions collapse to full-width analysis layout (no empty planned-block shell)
- Plans page now uses slicing-style coming-soon layout.
- Remaining athlete parity work is focused on fine-grained visual polish, not architectural rewrites.

## Auth & Approval Status

- Registration now captures separate `first_name` / `last_name` fields and keeps `name` synchronized for compatibility.
- Coach onboarding now enforces explicit application submission:
    - required profile/motivation answers
    - certification file uploads
    - persisted `coach_applications` + `coach_application_files`
- Coaches are blocked from operational routes until approved:
    - middleware redirects unapproved coaches to `/coach/pending-approval`
- Rejected coaches now see explicit rejection state + reason on the pending-approval page.
- Admin review tooling is live:
    - `/admin/coach-applications` queue
    - queue supports status filters (`pending`, `accepted`, `rejected`)
    - approve/reject with review notes
    - one-at-a-time file preview with navigation controls
- Admin dashboard now includes pending coach-application visibility for faster triage.
