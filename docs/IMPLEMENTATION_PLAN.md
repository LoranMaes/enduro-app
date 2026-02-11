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
- Calendar operational hardening (COMPLETE):
  - calendar now includes synced external activity rows in day columns (linked/unlinked state)
  - provider status pill + manual sync action are available in calendar header
  - provider status now has websocket + polling fallback refresh behavior
  - athlete calendar modes implemented: `Infinite` / `Day` / `Week` / `Month`
  - jump control added for returning to current week context
  - prepend-loading scroll anchoring stabilized to prevent random jump behavior while extending past weeks
  - unlinked activity rows now route to a read-only detail analysis surface

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
- Sync post-processing hardening (COMPLETE):
  - auto-link pass now runs after persisted provider sync batches/single-activity sync
  - existing manual links are preserved during provider upserts
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
  - athlete calendar header now updates sync state live and triggers session-window refresh on sync success
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
- Approval workflows (COMPLETE for coach onboarding V1)

Status update:
- Coach-athlete assignment backbone is implemented (model, migration, policies, query scoping, read-only coach views, tests).
- Coach access is now assignment-aware and read-only for calendar data.
- Admin console + users directory + session impersonation are now implemented and validated:
  - admin sidebar scope includes:
    - `Admin Console`
    - `Users`
    - `Analytics`
    - `Coach Applications`
  - impersonation start/stop routes implemented
  - Inertia impersonation context shared globally
  - impersonated sessions use role-correct navigation context
  - training-data writes are blocked while impersonating
- Admin moderation + reporting hardening is now implemented:
  - user suspension lifecycle:
    - `POST /admin/users/{user}/suspend`
    - `DELETE /admin/users/{user}/suspend`
    - `not_suspended` middleware enforcement on authenticated web/API paths
  - users directory now supports server-side:
    - search
    - role/status filters
    - sort
    - pagination
    - created-at visibility
  - admin analytics surface (`/admin/analytics`) now reports:
    - range-based user growth (total/athlete/coach lines)
    - coach pipeline
    - platform usage
    - sync health
    - moderation
    - system ops
- Next in this phase is explicit role-management/admin account actions (separate scope), without expanding into training-data write access.
- Role-aware auth/onboarding is now implemented:
  - login/register screens redesigned in Endure style
  - registration supports `first_name` + `last_name`
  - athlete and coach registration branches are split
  - coach registrations now create pending approval applications with document uploads
  - unapproved coaches are redirected to a dedicated pending-review screen
  - admin has a dedicated coach-application review tab (`/admin/coach-applications`) with approve/reject actions and file previews
- Coach review/admin control hardening is now implemented:
  - coach application queue supports explicit status filtering tabs:
    - pending
    - accepted
    - rejected
  - pending/rejected coach accounts are blocked from impersonation in policy/controller/UI paths
  - admin users + recent-signups tables include direct navigation to per-user detail view
- Coach onboarding upload hardening is now implemented:
  - frontend guardrails for certification file limits (count/per-file/total)
  - backend validation uses explicit limit messaging
  - coach certification storage disk is configurable for cloud object storage (`COACH_APPLICATION_FILESYSTEM_DISK`)
- Admin observability V1 is now implemented:
  - user detail page (`/admin/users/{user}`) includes tabbed overview/log inspection
  - log table supports pagination + scope/event filtering + per-entry old/new value popup
  - mutating HTTP requests are logged with redacted payloads
  - model-level activity logging is enabled for core mutable domains

---

## Phase 6 — Monetization

- Subscription tiers
- Feature flags
- Plan marketplace (later)

---

## Phase 7 — Athlete Slicing Parity (In Progress)

Scope: athlete only, slicing-first, production-safe vertical slices with real backend wiring.

### 7.0 Parity Audit (COMPLETE)

- completed screenshot+component audit for athlete views
- documented exact mismatches between current app and slicing authority
- clarified implementation rules for interval structure and stream behavior

### 7.1 Settings Parity (COMPLETE)

- replaced starter settings entrypoint with slicing-style tabbed shell at `/settings/overview`
- tabs now match athlete slicing structure:
  - Profile
  - Training Preferences
  - Integrations
  - Billing & Plans
- added athlete account label/sidebar treatment

### 9.3 Tickets Frontend Decomposition (IN PROGRESS)

- Objective:
  - split oversized admin tickets page into testable UI units + hooks without API/behavior changes
  - stabilize rich editor suggestion UX in edit mode before deeper extraction
- Completed in current increment:
  - extracted `TicketCreateDialog` from `admin/tickets/index.tsx`
  - stabilized mention and `/user` trigger parsing in existing ticket editing
  - stabilized query-driven ticket opening from notification URLs
  - hardened mark-seen/mark-all-seen notification mutations with direct Wayfinder route usage
- Next:
  - extract ticket detail dialog/sheet into dedicated component
  - extract ticket mutation actions into `useTicketMutations`
  - keep payload and policy behavior unchanged

### 9.4 Tickets Primitive + Semantics Alignment (COMPLETE)

- Completed:
  - ShadCN primitive adoption for toggle-like controls in ticket create/detail/editor flows
  - badge/pill normalization through shared badge-based ticket UI helpers
  - semantic board/list/table interaction cleanup for keyboard and SR clarity
  - realtime ticket channel effect stabilization to avoid unnecessary subscription churn
  - removal of remaining arbitrary `px` classes in ticket-related notification surface
- Constraints respected:
  - no backend or contract changes
  - no policy/auth changes
  - no visual redesign
- integrations tab now reflects real provider state; static Garmin copy removed
- added backend persistence endpoints/validation for profile + training preferences

### 7.2 Calendar + Session Detail Parity (CORE COMPLETE)

- replaced static calendar provider badge with real Strava connection/sync state
- added slicing-style interval structure builder in session editor
- persisted `planned_structure` for training sessions with explicit validation
- added completed-session detail route/page (`/sessions/{trainingSession}`)
- added planned-vs-actual detail shell with stream toggles and route map surface
- implemented provider-agnostic activity stream fetching with Strava-first backend support

### 7.3 Progress Parity (COMPLETE FOR V1)

- retained range model (`4/8/12/24`)
- kept existing trend/consistency framing
- added slicing-style weekly logs section sourced from session aggregates
- no physiology/PMC modeling introduced

### 7.4 Plans Parity (COMPLETE FOR V1)

- replaced generic plans placeholder with slicing-style coming-soon surface
- plans remain explicitly positioned as additive/non-core

### 7.5 Verification (COMPLETE FOR CURRENT SLICE)

- targeted Pest coverage added for new athlete detail/stream behavior
- `vendor/bin/sail bin pint --dirty --format agent` executed
- `vendor/bin/sail npm run types` executed
- targeted feature/api suites passing

### 7.6 Remaining Athlete Gaps (Next)

- add richer parity polish for session-detail chart/map fidelity against slicing source
- add deterministic visual-seeding updates for interval-heavy completed sessions in athlete screenshots
- extend targeted tests around `planned_structure` validation edge-cases and stream availability ordering

### 7.7 Workout Structure Hardening (COMPLETE FOR V1)

- athlete training preferences now include editable performance anchors and zone ranges
- calendar/session-editor now receive athlete target context for unit conversion
- workout builder now supports:
  - unit-aware preview axis
  - range-band preview rendering
  - block-specific defaults
  - grouped repeat templates
  - drag/drop in preview and snappier insertion markers in block list
  - explicit structure summary (`duration`, `estimated TSS`, `block count`)

### 7.8 Session Detail + Builder Refinement (COMPLETE FOR CURRENT SLICE)

- planned-structure payload now supports nested block items (`steps[*].items[*]`)
- session request validation now covers nested range/target rules + `repeats` type
- session editor now derives planned duration/TSS from structure when present
- session detail now includes:
  - cursor-aligned hover telemetry on chart
  - drag-select zoom + focused route highlight
  - right-rail consolidated statistics card
  - internal-notes edit/save surface
  - read-only planned-structure preview with hover summary
- stream chart rendering now down-samples deterministically for smoother interaction at higher sample counts

### 7.9 Progress Chart Fidelity Hardening (COMPLETE FOR CURRENT SLICE)

- athlete Training Progress trend chart corrected to avoid horizontal distortion (`preserveAspectRatio` guardrail)
- trend now explicitly shows:
  - planned centerline
  - target range band
  - actual weekly trajectory
- backend weekly aggregation now includes linked-activity actuals when manual completion has not yet been triggered:
  - duration fallback from activity duration
  - TSS fallback from activity payload (`tss`, `suffer_score`)
  - conservative estimate fallback from power/HR anchors when payload TSS is missing
- training session API responses now expose:
  - persisted `actual_tss` (domain source of truth)
  - computed `resolved_actual_tss` for athlete read surfaces (graph/detail/calendar load)
- progress aggregation now also includes unlinked synced activities in actual weekly totals
- calendar week summary now uses activity-backed actual volume/load and exposes per-sport volume breakdown chips
- no predictive load modeling or physiology calculations introduced in this slice

---

## Next Session TODO (Prioritized)

1. Frontend bundle hardening:
   - split heavy chunks further (`app`, `session-detail`, `landing`) to reduce initial payload cost.
2. Admin analytics query caching:
   - add short cache windows for `/admin/analytics` to reduce repeated DB pressure.
3. Admin users table scale indexes:
   - verify/add optimized indexes for `users.created_at` and status/filter query paths.
4. Production runtime hardening checklist:
   - supervised queue workers
   - supervised Reverb process
   - `APP_DEBUG=false`
   - monitoring + alerts
   - backup policy
   - object storage for uploads
5. Athlete slicing parity polish:
   - remaining work is behavior/performance polish, not architectural rewrites.

---

## Phase 8 — Admin Internal Ops: Tickets Module (V1 COMPLETE)

- Admin-only tickets board now implemented with strict impersonation blocking.
- Core backend domain implemented:
    - ticket lifecycle entities + enums
    - private per-admin internal notes
    - ticket attachments
    - mentions
    - explicit ticket audit trail
    - persisted admin ticket settings
- Realtime implemented via Reverb:
    - board update event broadcasts
    - mention notification broadcasts
- Notifications surface implemented:
    - global admin bell
    - unread badge
    - mark seen / mark-all
- Board + archive UX implemented:
    - board columns: todo / in progress / to review / done
    - drag/drop status changes
    - archived table with sorting + pagination
    - filtering (assignee, creator, type, importance) + global search
- Delayed archive automation implemented:
    - scheduler-backed archive job
    - configurable archive-delay hours

### 8.1 Remaining Tickets Enhancements (Next)

- Upgrade description editor from structured textarea payloads to full rich-text command UX parity.
- Add richer keyboard DnD/accessibility semantics for board interactions.
- Expand mention parsing support for comment/internal-note contexts.
- Add stronger notification deep-link focus behavior in ticket detail panels.

### 8.2 Tickets UX Hardening (COMPLETE FOR CURRENT SLICE)

- Tickets board filter model now auto-applies with debounce (manual apply button removed).
- Tickets settings moved to dedicated Admin Settings surface:
    - `GET /admin/settings`
    - `PATCH /admin/settings`
    - archive delay now managed there for future extensibility (feature flags/config blocks).
- Notification bell is integrated into admin layout chrome instead of floating absolute corner positioning.
- Ticket creation UX now uses richer, explicit controls:
    - type badge group
    - importance slider
    - assignee input with avatar suggestions
- Ticket description editor upgraded to lightweight WYSIWYG:
    - formatting toolbar (bold, heading, underline, bullet list)
    - `@admin` mentions
    - `/user` references with caret-anchored suggestions
    - inserted references rendered as clickable badge tokens
- Ticket detail open/update robustness improved by normalizing resource payload shapes from API responses.
- Ticket detail editing is now auto-sync first:
    - manual `Save Changes` action removed
    - debounced field sync for title/type/importance/assignee/description
    - debounced private-note sync
    - persistent sync status chip in modal (`pending`, `syncing`, `saved`, `error`)
- Request validation feedback is now surfaced inline for create/detail ticket forms with field-level clear-on-edit behavior.
- Description editor usability hardening:
    - active toolbar state highlighting for selected formats
    - explicit heading level selector
    - slash command transforms (`/h1`, `/h2`, `/h3`, `/paragraph`, `/bullet`, `/bold`, `/italic`, `/underline`)
    - bounded editor height to prevent modal growth
- Ticket detail audit trail now uses constrained dialog layout + scroll-safe containers so long histories no longer break vertical scrolling.

---

## Phase 9 — Global Quality Cleanup (Audit Complete, Refactor Pending Approval)

Scope: full codebase quality pass with behavior stability and slicing parity preservation.

### 9.0 Phase 1 Audit (COMPLETE)

- backend hotspots identified:
    - oversized controllers (`DashboardController`, `AthleteCalendarController`, `TrainingSessionController`, `Api/Admin/TicketController`, `AdminAnalyticsController`)
    - duplicated request validation (`Store/UpdateTrainingSessionRequest`, `Store/UpdateTrainingWeekRequest`)
    - repeated impersonation checks across policies
    - repeated role-scoped query fallbacks (`whereRaw('1 = 0')`) that should be centralized
- frontend hotspots identified:
    - oversized React pages/components with mixed responsibilities (tickets board, session detail, workout builder, session editor)
    - remaining hardcoded API paths instead of Wayfinder helpers (tickets, notifications, activity streams)
    - custom UI patterns where shadcn primitives are available and should be preferred
- styling/accessibility hotspots identified:
    - heavy fixed-pixel utility usage in critical surfaces
    - fragile modal viewport ownership in high-content dialogs
    - semantic/keyboard consistency gaps in complex interactive components

### 9.1 Planned Refactor Waves (PENDING APPROVAL)

1. Safe cleanup wave:
   - migrate remaining hardcoded frontend API paths to Wayfinder helpers
   - introduce shared backend query-scope helpers without behavior changes
   - perform low-risk shadcn primitive alignment where component contracts remain stable
2. Structural cleanup wave:
   - split fat controllers and extract duplicated validation/service logic
   - split oversized frontend components into hooks + presentational units
3. Hardening wave:
   - targeted performance pass (analytics caching, index validation, payload trimming)
   - accessibility/semantic polish and responsive overflow hardening
   - focused regression test expansion for touched domains

### 9.2 Wave A (COMPLETE)

1. Strict Wayfinder migration
   - replace remaining hardcoded API fetch URLs with generated route helpers
   - remove ticket-page API URL props that duplicate route definitions
2. Ticket filter validation extraction
   - move API ticket index filter validation out of controller into dedicated FormRequest
   - keep query behavior and response payload shape unchanged
3. Shared constants cleanup
   - de-duplicate ticket status/type/importance string literals across frontend/backend
4. Verification and docs
   - run targeted tests + Pint
   - update progress/state docs with Wave A completion summary

### 9.3 Wave B (COMPLETE)

1. Calendar payload service extraction
   - added `AthleteCalendarPayloadService`
   - `DashboardController` and `AthleteCalendarController` now delegate payload orchestration
2. Role-scope query centralization
   - added `TrainingScope` helper methods:
     - `forVisiblePlans`
     - `forVisibleWeeks`
     - `forVisibleSessions`
     - `forVisibleActivities`
   - replaced duplicated inline role query conditionals in API/controllers
3. Training session action-service split
   - added:
     - `LinkActivityAction`
     - `UnlinkActivityAction`
     - `CompleteSessionAction`
     - `RevertCompletionAction`
   - `TrainingSessionController` is now thin orchestration for these actions
4. Session validation consolidation
   - added `HasTrainingSessionRules` concern
   - shared rules and post-validation now reused by both store/update requests
5. Index additions
   - added migration for `users(created_at)` and `users(role, created_at)`
6. Admin analytics caching
   - added 60-second range-keyed caching to admin analytics aggregates

### 9.4 Next Wave

- Wave C is the next approved scope:
    - frontend decomposition of oversized components
    - stronger shadcn primitive alignment
    - dialog/layout responsiveness and semantic cleanup
    - TipTap-based ticket description editor migration with preserved mention/user-ref payload contract

### 9.5 Wave C (IN PROGRESS)

1. Decompose oversized frontend modules
   - admin tickets board/detail
   - session detail
   - workout structure builder
   - session editor modal
2. ShadCN alignment
   - add missing command/popover/tabs/scroll primitives and migrate custom suggestion/menu implementations
3. Editor migration
   - replace fragile `contentEditable` with TipTap foundation while preserving backend payload shape
4. Styling + a11y hardening
   - reduce fixed-pixel layout usage in touched components
   - standardize dialog viewport-safe behavior and semantic roles

### 9.6 Wave C Slice Update (CURRENT)

1. Completed in this slice
   - shadcn primitive availability added for wave usage:
     - command / popover / tabs / table / scroll-area
   - admin tickets decomposition:
     - extracted shared ticket helpers to `lib/ticket-utils.ts`
     - extracted shared UI atoms to `components/ticket-ui.tsx`
     - extracted assignee combobox (`Popover + Command`) to `components/ticket-assignee-combobox.tsx`
   - tickets page now uses extracted modules and no longer owns the custom assignee suggestion dropdown implementation
   - TipTap editor migration hardening:
     - fixed editorProps typing + `setContent` options for current API
     - fixed suggestion-state typing for slash/mention menu stability
   - session editor modal tab container was stabilized (missing Tabs closure fixed) and retains viewport-safe layout behavior
2. Remaining for Wave C completion
   - further decomposition of oversized calendar surfaces (`session-detail`, `workout-structure-builder`, deeper `session-editor-modal` internals)
   - broader semantic/a11y pass on remaining clickable non-button patterns
   - additional rem-based cleanup in untouched large files where fixed px text sizing remains
