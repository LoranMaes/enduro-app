# Endure — Progress Log

## 2026-02-13 (Calendar Create/Library UX + Drag/Drop Hardening Complete)

- Completed post-wave UX hardening and behavior-preserving fixes for calendar creation and workout library interactions:
    - restored intended creation flow:
        - day click / `+` opens first-step picker
        - selecting workout type opens the regular session editor (`Details` + `Structure`)
        - library flow is now separate from in-modal sport selection flow
    - moved workout library interaction to a dedicated calendar side sheet:
        - opened from calendar header action
        - non-blocking sheet behavior so calendar remains visible/interactable
        - mode-specific sheet width (browse vs create/edit)
    - improved workout template preview fidelity:
        - template previews now render variable-height block bars to better reflect intensity/structure differences
    - added workout template edit support in the library panel
    - hardened calendar drag-and-drop:
        - uncompleted sessions can be moved to different days
        - library template drop creates planned sessions on target date
        - normalized dropped planned-structure payload into API-expected shape (`duration_minutes` fields, nested items)
        - added defensive fallback for invalid `training_week_id` scenarios by retrying with `null`
    - added `hideOverlay` support on shared sheet primitive for non-modal sidepanel usage
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/DashboardTest.php tests/Feature/WorkoutLibraryApiTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-13 (ATP + Workout Library + Merge Polish + Settings Refactor Complete)

- Completed strict behavior-preserving wave for ATP, workout library, merge hardening, and settings entitlements refactor:
    - ATP moved to dedicated athlete page:
        - page route: `/atp/{year}`
        - API: `GET /api/atp/{year}`, `PATCH /api/atp/{year}/weeks/{week_start}`
        - added persisted week metadata model (`annual_training_plan_weeks`) with week type/priority/notes and planned/completed minutes + placeholder TSS values
        - ATP read payload is cached for 60 seconds
        - ATP row/bar interactions navigate to calendar week context (`/calendar?week=YYYY-MM-DD`)
    - workout library added as athlete-owned reusable structure catalog:
        - API: `GET/POST/PATCH/DELETE /api/workout-library...`
        - owner-only policy enforcement
        - integrated into calendar create flow (`Workout -> New Workout | From Library`)
        - selecting a library item creates a planned session with structure + estimated metrics
    - merge/completion hardening:
        - reconciler now handles ambiguous multi-match cases safely (no auto-link, no duplicate free-workout creation)
        - deterministic matching improved with sport/day/tolerance/proximity checks
        - completion source visibility hardened (`Auto-completed` vs manual)
    - settings refactor:
        - removed separate admin entitlements page
        - moved workout type gating management into `Admin Settings` tabs (`Workout Types`)
        - admin-only and hidden during impersonation
    - resolved Wayfinder generation corruption by regenerating and replacing generated route/action artifacts
- Added/updated test coverage:
    - `tests/Feature/Api/AnnualTrainingPlanApiTest.php`
    - `tests/Feature/AtpPageTest.php`
    - `tests/Feature/WorkoutLibraryApiTest.php`
    - `tests/Feature/Activities/ActivityToSessionReconcilerTest.php`
    - `tests/Feature/AdminSettingsPageTest.php`
- Validation completed:
    - `vendor/bin/sail artisan wayfinder:generate --no-interaction`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-13 (Completion & Compliance Phase 2 Complete)

- Completed coach-grade compliance and entitlement hardening pass with behavior-preserving scope:
    - added read-only compliance API endpoint:
        - `GET /api/progress/compliance?from=...&to=...`
    - added modular progress services:
        - `app/Services/Progress/ComplianceService.php`
        - `app/Services/Progress/WeeklyRecommendationBandService.php`
    - compliance now uses planned sessions only for denominator:
        - `planned_sessions_count`
        - `planned_completed_count`
        - `compliance_ratio`
    - added placeholder weekly recommendation band plumbing (minutes-based, no load science):
        - min/max derived from prior 4 weeks completed-minute average
        - returns `null` when fewer than 2 history weeks exist
    - integrated compliance + placeholder band into frontend:
        - progress page now includes a dedicated Compliance panel
        - calendar week headers now show subtle compliance and range-state indicators (`In range`/`High`/`Low`/`No baseline`)
        - week compliance chip can jump into `/progress` with an appropriate range window
    - added dedicated admin entitlement management surface:
        - web page: `/admin/settings/entitlements`
        - API: `GET/PATCH /api/admin/entitlements/entry-types`, `POST /api/admin/entitlements/entry-types/reset`
        - DB overrides now include `updated_by_admin_id`
        - effective source now exposed per entry type (`config_default` vs `customized`)
        - entitlement resolution now uses 60-second cache
    - completion-source UX polish:
        - calendar session row shows subtle `Auto-completed` vs `Completed`
        - session completion section now surfaces completion source meta
- Added/updated test coverage:
    - `tests/Feature/Api/ProgressComplianceApiTest.php`
    - `tests/Feature/Api/Admin/EntryTypeEntitlementApiTest.php`
    - `tests/Feature/AdminEntitlementPageTest.php`
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/ProgressComplianceApiTest.php tests/Feature/Api/Admin/EntryTypeEntitlementApiTest.php tests/Feature/AdminEntitlementPageTest.php tests/Feature/ProgressPageTest.php tests/Feature/DashboardTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-13 (Training Completion Flow v2 Foundations Complete)

- Completed behavior-preserving Phase 1 foundation pass:
    - verified existing activity reconciliation pipeline and duplicate-card filtering
    - fixed athlete context gating in calendar selection to treat `role: null` and impersonation as athlete context (restores session edit/title input behavior)
    - added Goals domain backbone:
        - `goals` table + model + resource + API controller + requests + policy
        - endpoints: `GET/POST /api/goals`, `GET/PATCH /api/goals/{goal}`
    - added ATP scaffold:
        - `annual_training_plans` table + model
        - endpoint: `GET /api/annual-training-plan/{year}` with create-if-missing behavior
    - wired goals into calendar payload and frontend loading:
        - goals now load with initial dashboard payload and infinite-window fetches
        - goals render in day columns and open a dedicated goal modal
        - create-entry flow now routes `Other -> Goal` to goal creation modal
    - added config-driven entitlement defaults (`config/training.php`) while retaining DB override behavior
    - constrained completion write behavior so `actual_tss` is copied only from provider `raw_payload.tss` during completion writes
    - added plans-page ATP placeholder link (`Annual Training Plan (coming soon)`)
- Added/updated test coverage:
    - `tests/Feature/Api/GoalApiTest.php`
    - `tests/Feature/Api/AnnualTrainingPlanApiTest.php`
    - `tests/Feature/DashboardTest.php`
    - `tests/Feature/Activities/ActivityToSessionReconcilerTest.php`
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Activities/ActivityToSessionReconcilerTest.php tests/Feature/Api/GoalApiTest.php tests/Feature/Api/AnnualTrainingPlanApiTest.php tests/Feature/DashboardTest.php tests/Feature/Api/CalendarEntryApiTest.php`
    - `vendor/bin/sail artisan test --compact`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Unified Completion + Calendar Entry Types Pass Complete)

- Completed feature pass for unified completion and calendar entry types:
    - linked activities now collapse to a single calendar card (session card only)
    - provider sync now reconciles activities into sessions automatically:
        - planned match -> auto-link + auto-complete
        - no planned match -> create plan-less `Free Workout` session + auto-complete
    - introduced first-step calendar creation flow:
        - `Workout` -> existing session editor flow
        - `Other` -> dedicated calendar entry editor (`event` / `goal` / `note`)
    - introduced subscription-gated entry/workout types with admin-managed entitlement flags
    - updated calendar compliance logic to:
        - `Completed Planned Sessions / Planned Sessions`
    - kept manual completion/linking flows available
- Added backend and feature coverage:
    - `tests/Feature/Activities/ActivityToSessionReconcilerTest.php`
    - `tests/Feature/Api/CalendarEntryApiTest.php`
    - `tests/Feature/AdminEntitlementsTest.php`
    - updated `tests/Feature/AdminImpersonationTest.php` for impersonated-athlete write expectations
- Validation completed:
    - `vendor/bin/sail artisan test --compact tests/Feature/Activities/ActivityToSessionReconcilerTest.php tests/Feature/Api/CalendarEntryApiTest.php tests/Feature/AdminEntitlementsTest.php tests/Feature/AdminImpersonationTest.php`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Unified Completion + Calendar Entry Types Pass Start)

- Started feature pass for:
    - unified session/activity completion flow (auto-link + auto-complete)
    - first-step calendar entry creation flow (`Workout` vs `Other`)
    - subscription-gated entry types with admin-configured entitlements
    - single-card calendar rendering for linked workout activity/session pairs
- Scope guardrails:
    - no training-science/load-modeling expansion
    - keep provider and API boundaries explicit
    - preserve role/impersonation rules

## 2026-02-12 (Refactor Wave 8 Complete: Final Smoke + Full Quality Gates)

- Completed final validation sweep:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact`
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npx eslint resources/js/components/two-factor-setup-modal.tsx resources/js/pages/admin/users/index.tsx resources/js/pages/admin/users/show/components/LogsTab.tsx resources/js/lib/pagination.ts`
- Result:
    - no API/backend/route contract regressions detected
    - no behavior drift detected in touched surfaces

## 2026-02-12 (Refactor Wave 8 Start: Final Smoke + Full Quality Gates)

- Wave 8 started with behavior-preserving scope:
    - run final full quality gates after Waves 6 and 7
    - verify no regressions in notifications/ticket selection and policy/provider behavior

## 2026-02-12 (Refactor Wave 7 Complete: Security + Content Hardening)

- Completed Wave 7 with behavior preserved:
    - removed `dangerouslySetInnerHTML` pagination rendering in admin user/log tables via safe label decoder
    - added explicit QR SVG sanitization boundary in two-factor setup modal before HTML injection
    - kept existing UX and payload behavior unchanged
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminUserManagementTest.php tests/Feature/Auth/AuthenticationTest.php tests/Feature/Auth/TwoFactorChallengeTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 7 Start: Security + Content Hardening)

- Wave 7 started with behavior-preserving scope:
    - harden rich-text rendering boundaries that use `dangerouslySetInnerHTML`
    - preserve existing payload shapes and UI behavior while making trust boundaries explicit

## 2026-02-12 (Refactor Wave 6 Complete: Backend Hardening Pass)

- Completed Wave 6 with behavior preserved:
    - replaced `whereRaw('1 = 0')` fallbacks in `TrainingScope` with explicit empty-key constraints
    - consolidated duplicated impersonation checks into shared policy trait:
        - `app/Policies/Concerns/DetectsImpersonation.php`
    - split Strava provider responsibilities without contract changes:
        - `StravaApiClient` (HTTP/token/request)
        - `StravaActivityMapper` (payload mapping)
        - `StravaActivityProvider` (orchestration)
- Validation completed:
    - `vendor/bin/sail artisan test --compact tests/Feature/ActivityProviders/StravaActivityProviderTest.php tests/Feature/ActivityProviders/ActivityProviderManagerTest.php tests/Unit/ActivityProviders/ActivityProviderTokenManagerTest.php`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/ActivityReadApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/Api/TrainingSessionActivityLinkApiTest.php tests/Feature/Api/TrainingSessionCompletionApiTest.php tests/Feature/AdminTicketsTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 6 Start: Backend Hardening Pass)

- Wave 6 started with behavior-preserving scope:
    - remove `whereRaw('1 = 0')` style fallbacks in favor of expressive empty-result constraints
    - centralize impersonation checks used repeatedly in policies
    - split Strava provider responsibilities for maintainability boundaries

## 2026-02-12 (Refactor Wave 5 Complete: Session Analysis Chart Decomposition)

- Completed Wave 5 with behavior preserved:
    - decomposed `resources/js/pages/calendar/session-detail/components/SessionAnalysisChart.tsx`
    - extracted:
        - `session-analysis-chart/InteractiveStreamChart.tsx`
        - `session-analysis-chart/SelectionStatLine.tsx`
    - preserved zoom drag, hover behavior, axis behavior, stream rendering, and selection summary output
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Calendar/SessionDetailPageTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 5 Start: Session Analysis Chart Decomposition)

- Wave 5 started with behavior-preserving scope:
    - split `resources/js/pages/calendar/session-detail/components/SessionAnalysisChart.tsx`
    - isolate chart UI/state helpers without changing math, zoom, hover, or map-sync behavior

## 2026-02-12 (Refactor Wave 4 Complete: Admin Page Decomposition)

- Completed Wave 4 with behavior preserved:
    - decomposed `resources/js/pages/admin/analytics.tsx` into feature-scoped types/utils/hook/components
    - decomposed `resources/js/pages/admin/users/show.tsx` into feature-scoped types/utils/components
    - preserved all route contracts, payload shapes, and interaction flows
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact --filter=AdminUserManagementTest`
    - `vendor/bin/sail artisan test --compact --filter=AdminAnalytics` (no tests matched)
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 4 Start: Admin + Session Analysis Decomposition)

- Wave 4 started with behavior-preserving scope:
    - decompose remaining oversized admin pages:
        - `resources/js/pages/admin/analytics.tsx`
        - `resources/js/pages/admin/users/show.tsx`
    - decompose `resources/js/pages/calendar/session-detail/components/SessionAnalysisChart.tsx`
    - preserve API contracts, route contracts, and visual behavior

## 2026-02-12 (Refactor Wave 3 Complete: Legacy Surface Cleanup + Auth/Register Decomposition)

- Completed Wave 3 with behavior preserved:
    - removed unused legacy `resources/js/pages/calendar/components/plan-section.tsx`
    - rewired `resources/js/pages/auth/register.tsx` into a modular orchestrator
    - extracted and integrated missing coach application step component:
        - `resources/js/pages/auth/register/components/CoachApplicationStep.tsx`
    - retained existing registration flow, payload shape, and validation/error-step behavior
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact --filter=Auth`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 2 Complete: Ticket Description Editor Decomposition)

- Decomposed `resources/js/pages/admin/tickets/components/ticket-description-editor.tsx` into isolated modules while preserving behavior:
    - new orchestrator:
        - `ticket-description-editor.tsx`
    - extracted hook:
        - `ticket-description-editor/useTicketDescriptionEditor.ts`
    - extracted UI modules:
        - `ticket-description-editor/TicketDescriptionToolbar.tsx`
        - `ticket-description-editor/TicketSuggestionPopover.tsx`
    - extracted shared types/utilities:
        - `ticket-description-editor/types.ts`
        - `ticket-description-editor/utils.ts`
- Preserved mention/slash UX:
    - `@admin` suggestions
    - `/user ...` suggestions
    - keyboard selection (`ArrowUp/ArrowDown/Tab/Enter/Escape`)
    - click selection and token insertion
    - payload output shape (`html`, `text`, `mentionAdminIds`, `userRefs`)
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail npx eslint resources/js/pages/admin/tickets/components/ticket-description-editor.tsx resources/js/pages/admin/tickets/components/ticket-description-editor/useTicketDescriptionEditor.ts resources/js/pages/admin/tickets/components/ticket-description-editor/TicketDescriptionToolbar.tsx resources/js/pages/admin/tickets/components/ticket-description-editor/TicketSuggestionPopover.tsx`
    - `vendor/bin/sail artisan test --compact --filter=Ticket`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 3 Start: Legacy Surface Cleanup + Auth/Register Decomposition)

- Wave 3 started with behavior-preserving scope:
    - resolve legacy `plan-section.tsx` dead-weight risk (remove if unused)
    - decompose oversized auth register page into stable step components/hooks
    - keep existing onboarding flow and payload behavior identical

## 2026-02-12 (Refactor Wave 1 Complete: Stability + Wayfinder Completion)

- Completed behavior-preserving Wave 1 batch:
    - stabilized ticket selection state without `set-state-in-effect` patterns
    - stabilized coach-application active selection derivation without effect-driven state writes
    - finished strict Wayfinder migration in remaining targeted pages:
        - `plans/index`
        - `coaches/index`
        - `athletes/index`
        - `athletes/show`
        - `calendar/session-detail`
    - added/validated admin ticket notification mark-seen feature coverage
- Validation completed:
    - `vendor/bin/sail npx eslint resources/js/pages/admin/tickets/hooks/useTicketSelection.ts resources/js/pages/admin/coach-applications/index.tsx`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact --filter=AdminTicketsTest`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-12 (Refactor Wave 2 Start: Ticket Description Editor Decomposition)

- Wave 2 started for highest frontend maintainability risk:
    - decompose `ticket-description-editor.tsx` into smaller hooks/components/utilities
    - preserve exact mention/slash command behavior, keyboard selection, and payload format
    - no backend/API/route changes

## 2026-02-12 (Refactor Wave 1 Start: Stability + Wayfinder Completion)

- Wave 1 started for full hardening request:
    - smoke-test and stabilize ticket notification actions + ticket query selection
    - fix remaining React stability blockers
    - complete strict Wayfinder migration on targeted remaining frontend pages
- Scope is behavior-preserving only (no backend contract or UX flow change).

## 2026-02-12 (Wave D: Global Frontend Hardening Pass)

- Completed a behavior-preserving frontend hardening pass across `resources/js` with no backend/API/route/policy changes.
- ShadCN standardization updates:
    - native `<select>` usage fully migrated to ShadCN `Select` (including remaining admin/auth/workout-builder usage)
    - remaining admin status/event pills standardized to ShadCN `Badge`
    - coach-application status switcher standardized to ShadCN `ToggleGroup`
- Pixel utility cleanup:
    - arbitrary Tailwind pixel utilities reduced from 219 to 10
    - remaining pixel utilities are shadow/border accent exceptions only
- Semantic + accessibility hardening:
    - converted remaining clickable non-semantic wrappers in calendar/landing cards to semantic button patterns
    - preserved keyboard and focus behavior for interactive cards/day cells
- Stability + test hardening:
    - resolved metadata test drift by moving session-detail helper files under `session-detail/components`
    - added missing page `<Head>` declarations in thin wrappers to keep title metadata coverage green
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-11 (Wave C5: Session Detail Decomposition)

- Completed structural decomposition of the session detail page with no backend/API/route changes:
    - `resources/js/pages/calendar/session-detail.tsx` reduced from ~2473 lines to 347 lines (thin orchestrator)
    - extracted UI modules:
        - `SessionDetailLayout`
        - `SessionMap`
        - `SessionStatisticsCard`
        - `SessionInternalNotes`
        - `SessionPlannedStructurePreview`
        - `SessionAnalysisChart`
    - extracted state/derivation hooks:
        - `useSessionStreams`
        - `useSessionZoom`
        - `useSessionHover`
        - `useSessionStats`
    - extracted shared session-detail constants/types/utils modules for stable reuse
- Preserved session-detail behavior:
    - chart drag-to-zoom + reset
    - hover sync between chart and map
    - route highlight segment + hover marker
    - x-axis mode toggle behavior
    - planned structure conditional rendering
    - internal notes save flow and validation handling
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Calendar/SessionDetailPageTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-11 (Wave C4: Tickets Full Decomposition + Hook Isolation)

- Completed ticket-page decomposition with behavior preserved:
    - `resources/js/pages/admin/tickets/index.tsx` reduced to 395 lines (thin orchestrator)
    - extracted detail dialog into dedicated component:
        - `TicketDetailSheet`
        - `TicketDetailOverviewTab`
        - `TicketDetailAuditTab`
    - extracted mutation/network boundary into `useTicketMutations`
    - extracted selection + URL ticket-query synchronization into `useTicketSelection`
    - extracted detail draft/sync state into `useTicketDetailState`
- Kept strict Wayfinder route usage in extracted mutation flows (no hardcoded API paths introduced).
- Moved filter UI to single-payload update contract (`onFiltersChange`) to reduce parent coupling.
- Preserved ticket UX behavior:
    - notification/query-driven ticket open still works through selection state
    - realtime board refresh + selected-ticket refresh remains active
    - create/edit/auto-sync/audit/attachments flows unchanged from user perspective
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact --filter=Ticket`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-11 (Wave C3: Tickets ShadCN + Semantics Hardening)

- Hardened ticket UI primitives without API/backend changes:
    - ticket detail status control migrated to ShadCN `ToggleGroup`
    - ticket create type selector migrated to ShadCN `ToggleGroup`
    - editor toolbar toggles migrated to ShadCN `Toggle`
- Standardized badge/pill rendering with ShadCN `Badge`:
    - importance indicator badges
    - assignee badges
    - status badges in archived table
- Semantic/a11y hardening in ticket board:
    - ticket columns now expose region semantics
    - column contents switched to list semantics (`ul/li`)
    - archived ticket open action moved to explicit button in title cell (no clickable row anti-pattern)
    - suggestion popover now has explicit listbox/option ARIA attributes
- Ticket realtime hook optimized to reduce unnecessary channel re-subscriptions by using refs for mutable callbacks/state.
- Removed remaining ticket-system arbitrary `px` utilities in notification bell:
    - `w-[360px]` → `w-[22.5rem]`
    - `text-[10px]/text-[11px]` → rem equivalents
- Validation completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact --filter=Ticket`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-11 (Ticket Editor Stabilization + Tickets Decomposition Increment)

- Follow-up fixes applied:
    - removed duplicate TipTap underline extension registration to eliminate duplicate-extension warning noise
    - suggestion `Enter` handling now runs in capture phase so active mention/user suggestions are selected before editor newline handling
- Stabilized admin ticket editor trigger behavior in existing-ticket edit mode:
    - mention and slash-user trigger detection now supports non-whitespace boundaries (for example `...text@name` and `...text/user name`)
    - reduced stale suggestion churn by keeping async user-search request guards in place
    - maintained focus after suggestion insertions
- Hardened ticket query-driven open behavior from notifications:
    - stabilized `openTicketDetail` callback identity to prevent repeated URL-effect re-open loops
    - improved query parsing in realtime hook and skip re-open when selected ticket is already open
- Hardened admin notification actions:
    - mark-seen/mark-all-seen calls now use direct Wayfinder route definitions (PATCH with JSON body) for consistency
    - notification navigation now uses explicit Inertia visit options (`preserveState: false`) to ensure query transitions are applied
- Decomposition increment:
    - extracted large New Ticket modal into `TicketCreateDialog` component
    - kept behavior, field validation rendering, and payload format unchanged
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact --filter=Ticket`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-11 (Phase 9 Wave C Start: Frontend Decomposition + ShadCN Alignment)

- Wave C execution started with behavior-preserving frontend-only constraints.
- Scope locked to:
    - decomposition of oversized frontend pages/components into hooks + presentational units
    - strict ShadCN/Radix primitive alignment for suggestion lists, popovers, tabs, table/scroll containers, and dialog structure
    - ticket rich-text editor migration from fragile `contentEditable` to TipTap foundation while preserving payload format
    - pixel cleanup + semantic/a11y hardening in touched surfaces
- Added frontend dependencies via Sail for this wave:
    - `@radix-ui/react-popover`
    - `@radix-ui/react-tabs`
    - `@radix-ui/react-scroll-area`
    - `cmdk`
    - `@tiptap/react`
    - `@tiptap/starter-kit`
    - `@tiptap/extension-placeholder`
    - `@tiptap/extension-underline`
- Guardrails:
    - no backend, route, policy, or API contract changes
    - no behavioral regressions
    - slicing-aligned UI preserved

## 2026-02-11 (Phase 9 Wave B Complete: Backend Boundary Extraction)

- Extracted shared calendar payload orchestration:
    - added `AthleteCalendarPayloadService`
    - moved duplicated dashboard/calendar aggregation out of controllers
    - preserved `trainingPlans`, `trainingSessions`, `activities`, `calendarWindow`, `providerStatus`, and athlete target payload shapes
- Centralized role-based visibility query scoping:
    - added `TrainingScope` helper with scoped methods for plans, weeks, sessions, and activities
    - replaced inline role conditionals and `whereRaw('1 = 0')` duplication in API/controllers
- Split training session business actions from controller:
    - added action classes:
        - `LinkActivityAction`
        - `UnlinkActivityAction`
        - `CompleteSessionAction`
        - `RevertCompletionAction`
    - `TrainingSessionController` now validates/authorizes/delegates/returns resources
- Consolidated duplicate training session request logic:
    - added `HasTrainingSessionRules` concern
    - `StoreTrainingSessionRequest` and `UpdateTrainingSessionRequest` now share the same rules + post-validation logic
- Added users indexing migration for admin table scale paths:
    - `users(created_at)`
    - `users(role, created_at)`
- Added 60-second cache layer to admin analytics aggregates with range-aware cache keys.
- Verification completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/DashboardTest.php tests/Feature/CoachCalendarReadAccessTest.php tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingPlanCrudApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php tests/Feature/Api/TrainingWeekCrudApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/Api/TrainingSessionActivityLinkApiTest.php tests/Feature/Api/TrainingSessionCompletionApiTest.php tests/Feature/Api/ActivityReadApiTest.php tests/Feature/NavigationShellPagesTest.php tests/Feature/AdminUserManagementTest.php`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminImpersonationTest.php`

## 2026-02-11 (Phase 9 Wave B Start: Backend Boundary Extraction)

- Wave B execution started with behavior-preserving constraints.
- Scope locked to:
    - calendar payload service extraction
    - centralized role-based training/activity visibility scoping
    - training session action extraction (link/unlink/complete/revert)
    - shared training session request rule concern
    - users index migration (`created_at`, potential role composite)
    - admin analytics 60-second caching
- Guardrails:
    - no API contract/payload changes
    - impersonation and policy behavior preserved
    - slicing behavior preserved

## 2026-02-11 (Phase 9 Wave A Complete: Mechanical Cleanup)

- Completed strict Wayfinder migration for remaining frontend API calls in Wave A scope:
    - admin tickets board/detail fetches now use generated Wayfinder helpers
    - admin notification bell fetches now use generated Wayfinder helpers
    - session detail activity-stream fetch now uses generated Wayfinder helper
    - removed ticket API URL prop injection from `AdminTicketBoardController`
- Extracted ticket index filter validation into dedicated FormRequest:
    - added `TicketIndexRequest`
    - moved `TicketController@index` inline validation into request class
    - preserved response/query behavior
- De-duplicated shared ticket constants:
    - backend enums now expose `values()` for rule reuse
    - ticket store/update/move-status requests now consume enum `values()`
    - frontend ticket status/type/importance constants centralized in `resources/js/pages/admin/tickets/constants.ts`
- Verification completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail npm run build`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminTicketsTest.php`
    - `vendor/bin/sail artisan test --compact tests/Feature/Calendar/SessionDetailPageTest.php`

## 2026-02-11 (Phase 9 Wave A Start: Mechanical Cleanup)

- Wave A execution started with strict behavior-preservation constraints.
- Scope locked to:
    - strict Wayfinder migration for remaining frontend API fetches
    - ticket filter validation extraction to FormRequest
    - shared ticket constant cleanup (status/type/importance string de-duplication)
- No functional UX or policy changes are included in this wave.

## 2026-02-11 (Phase 1 Global Codebase Audit Baseline)

- Completed a structured, no-refactor audit across backend, frontend, styling, accessibility, and performance.
- Confirmed key backend hotspots:
    - fat controllers (`DashboardController`, `AthleteCalendarController`, `TrainingSessionController`, `Api/Admin/TicketController`, `AdminAnalyticsController`)
    - duplicated validation rules (`Store/UpdateTrainingSessionRequest`, `Store/UpdateTrainingWeekRequest`)
    - repeated impersonation checks duplicated across policies
    - repeated role-scope query logic (`whereRaw('1 = 0')` fallback pattern in multiple controllers)
- Confirmed key frontend hotspots:
    - very large components mixing orchestration + rendering + API calls (tickets board/detail, session detail, workout builder, session editor)
    - remaining hardcoded API URLs instead of Wayfinder route usage (notably admin tickets, notifications, activity streams)
    - custom UI patterns where shadcn primitives are available but not yet adopted consistently (tabs/command/popover/table/sonner patterns)
- Confirmed styling/accessibility/responsive debt:
    - high concentration of fixed pixel utility usage in critical screens
    - dialog/modal overflow logic still fragile in large content views
    - semantic and keyboard patterns are inconsistent across complex interactive components
- No structural refactor was applied in this audit step.
- Next step: execute prioritized cleanup phases after explicit approval.

## 2026-02-11 (Admin Tickets UX Hardening: Auto-Sync + Editor + Dialog Scroll)

- Hardened ticket detail editing to auto-sync by default:
    - removed manual “Save Changes” action from ticket detail
    - debounced auto-sync now persists title/type/importance/assignee/description edits
    - internal notes now auto-sync with the same flow
    - added persistent in-modal sync state indicator (`pending`, `syncing`, `saved`, `error`)
- Improved ticket create/edit error feedback:
    - request error parser now surfaces backend validation messages
    - create and detail forms now render field-level validation feedback
    - field-level errors clear as users edit related inputs
- Hardened ticket description editor interaction quality:
    - active formatting state is now visible for bold/italic/underline/list controls
    - heading control now supports explicit heading level selection
    - slash commands added for quick formatting (`/h1`, `/h2`, `/h3`, `/paragraph`, `/bullet`, `/bold`, `/italic`, `/underline`)
    - list and heading output now renders with visible typography/list styling
    - editor height is constrained to prevent modal growth beyond viewport
- Fixed ticket detail audit trail scroll behavior:
    - dialog content now uses a constrained viewport-aware layout
    - audit list switched to proper `min-h-0 flex-1 overflow-y-auto` structure
    - audit metadata payload preview now has max-height caps to avoid overflow lockups
- Updated shared dialog primitive default sizing:
    - wider default max-width for shadcn dialog content to reduce content clipping in complex admin modals
- Documented dialog implementation guardrails in `docs/DESIGN_SYSTEM.md`:
    - required semantic structure
    - required scroll-container pattern for overflow-safe dialog layouts

## 2026-02-10 (Admin Tickets Board + Archive + Mentions + Realtime Notifications)

- Implemented new admin-only Tickets module (`/admin/tickets`) with strict impersonation blocking:
    - middleware alias added: `not_impersonating`
    - admin web/API ticket routes now require `admin` + `not_impersonating`
    - sidebar now includes admin `Tickets` icon entry
- Added tickets domain schema + models:
    - tables: `tickets`, `ticket_internal_notes`, `ticket_comments`, `ticket_attachments`, `ticket_mentions`, `ticket_audit_logs`, `admin_settings`
    - Laravel notifications table added for in-app admin mentions
    - enums: `TicketStatus`, `TicketType`, `TicketImportance`
    - model relationships and casts wired for explicit, typed domain behavior
- Added ticket policy + service layer:
    - `TicketPolicy` (admin-only, blocked while impersonating)
    - `TicketArchiveDelayResolver` (config + persisted admin setting fallback)
    - `TicketAuditLogger` (explicit audit event persistence)
    - `TicketMentionService` (mention sync + database notifications + realtime push)
    - reusable upload service: `FileUploadService`
- Implemented admin ticket APIs:
    - board/archived listing + filtering + sorting + pagination
    - create/update/delete ticket
    - status move endpoint (kanban drag target)
    - attachment upload/download/remove
    - private internal note upsert/delete (per-admin scoped)
    - audit log fetch endpoint
    - admin notification endpoints (list, mark seen, mark all seen)
    - `/user` helper endpoint for athlete/coach lookup (top-3 search)
- Added realtime events over Reverb:
    - `TicketUpdated` (board refresh signal)
    - `AdminNotificationCreated` (mention notification push)
- Added delayed-archive job + scheduler:
    - job: `ArchiveDoneTicketsJob`
    - schedule: every 5 minutes
    - archives `done` tickets older than configured delay
    - writes explicit archive audit events
- Added admin tickets UI (Inertia + React):
    - Board tab with 4 columns: `Todo`, `In Progress`, `To Review`, `Done`
    - drag/drop status transitions
    - ticket create dialog
    - ticket detail dialog:
        - editable title/type/importance/assignee/description
        - attachments section
        - private internal notes section
        - audit trail tab
    - Archived tab with header-click sorting + pagination
    - filtering by assignee/creator/type/importance + global search
    - archive delay setting control wired to backend
- Added global admin notification bell in app layout:
    - unread badge
    - realtime mention updates
    - mark seen / mark all seen actions
- Hardened existing request activity logger:
    - safe serialization for uploaded file payloads to prevent JSON encoding failures in production paths
- Added targeted tests:
    - `tests/Feature/AdminTicketsTest.php`
    - coverage includes authorization, impersonation blocking, mentions → notifications, internal-note privacy search, delayed archive behavior, and attachment auth flow
- Verification completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminTicketsTest.php tests/Feature/AdminImpersonationTest.php tests/Feature/AdminUserManagementTest.php tests/Feature/NavigationShellPagesTest.php`

## 2026-02-10 (Coach Registration Upload Guardrails + S3-Ready Storage)

- Hardened coach certification upload UX on register flow:
    - frontend now shows explicit limits (file count, per-file size, total size, accepted formats)
    - client-side guardrails reject oversized/excess files before submit
    - inline validation messages now appear in the same error region as other form fields
- Hardened backend validation messaging for coach uploads:
    - explicit max-files, max-file-size, and total-size validation messaging
    - clearer mimes validation copy for certification file types
- Coach application file persistence is now disk-configurable:
    - upload disk now resolves from `filesystems.coach_applications.disk`
    - supports local or S3 without code changes
- Added env config knobs for coach-upload limits/storage:
    - `COACH_APPLICATION_FILESYSTEM_DISK`
    - `COACH_APPLICATION_MAX_FILES`
    - `COACH_APPLICATION_MAX_FILE_SIZE_KB`
    - `COACH_APPLICATION_MAX_TOTAL_SIZE_MB`
- Added/updated tests for upload guardrails and configurable storage disk.
- Improved coach pending-approval UX:
    - uploaded certification files now open in an in-app preview modal
    - preview uses existing dialog primitives and keeps styling consistent
    - includes fallback "Open in new tab" action for unsupported browser preview types

## 2026-02-09 (Admin Analytics Chart Correctness Follow-up)

- Fixed admin user-growth role counting bug:
    - normalized enum-casted `role` values (`UserRole`) before athlete/coach bucket comparison in `AdminAnalyticsController`
    - athlete/coach growth series now count correctly
- Fixed analytics chart usability regression:
    - removed stretched SVG behavior (`preserveAspectRatio="none"`)
    - chart now uses non-distorting aspect handling
    - added hover inspection layer with crosshair + point values for selected week
- Added persistent chart guardrails to docs to prevent recurrence:
    - see `docs/PROJECT_STATE.md` → `UI Chart Guardrails`

## 2026-02-09 (Admin Analytics + Moderation Hardening)

- Added admin analytics surface and routing:
    - new route/page: `GET /admin/analytics`
    - new controller: `AdminAnalyticsController`
    - range-aware reporting (`4w/8w/12w/24w`) with real data sections:
        - user growth (total/athlete/coach lines)
        - coach pipeline
        - platform usage
        - sync health
        - moderation
        - system ops
- Added user suspension moderation backbone:
    - migration: `2026_02_09_203958_add_suspension_columns_to_users_table.php`
    - `users` now store:
        - `suspended_at`
        - `suspended_by_user_id`
        - `suspension_reason`
    - new middleware: `EnsureNotSuspended` and route alias `not_suspended`
    - suspension enforced on web and API authenticated paths
    - new admin actions:
        - `POST /admin/users/{user}/suspend`
        - `DELETE /admin/users/{user}/suspend`
    - suspended users are non-impersonatable and get blocked from normal access
- Hardened admin user directory (`/admin/users`):
    - server-side search/filter/sort + pagination
    - added status filtering and sorting
    - added `Created at` column for rapid recent-account review
    - added table controls without mock data
- Hardened admin user detail (`/admin/users/{user}`):
    - explicit back navigation link
    - moderation card for suspend/reactivate
    - fixed log modal overflow by wrapping/scrolling JSON payload fields safely
    - added defensive fallback for missing log meta payloads
- Admin navigation now includes `Analytics` in admin console mode.
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminUserManagementTest.php tests/Feature/AdminImpersonationTest.php`
    - `vendor/bin/sail artisan test --compact tests/Feature/DashboardTest.php tests/Feature/NavigationShellPagesTest.php`

## 2026-02-09 (Calendar Stability + Activity Detail Clickthrough Tweaks)

- Removed sticky-header seam/bleed between calendar mode controls and weekday axis by making both sticky bars fully opaque.
- Hardened infinite-scroll prepend behavior:
    - added synchronous past/future load guards to prevent duplicate prepend fetches
    - switched prepend scroll preservation to anchor-based restoration (`data-week-start`) to prevent random jump-to-month behavior
- Added activity detail clickthrough for unlinked activities:
    - new athlete route: `GET /activities/{activity}`
    - unlinked activity rows now navigate to read-only detail analysis view
    - linked activity rows redirect to their linked session detail route
- Updated shared session-detail page to support activity-only read mode (`isActivityOnly`) with notes editing disabled.
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/Calendar/ActivityDetailPageTest.php tests/Feature/Calendar/SessionDetailPageTest.php tests/Feature/DashboardTest.php tests/Feature/Activities/ActivityAutoLinkServiceTest.php`

## 2026-02-09 (Calendar Rework: Activity Overlay + Sync State + View Modes)

- Implemented calendar activity overlay wiring using real activity reads:
    - dashboard/athlete calendar payloads now include in-window `activities`
    - calendar day columns now render synced activity rows (linked/unlinked state shown)
    - no mock data introduced; existing read endpoints reused
- Added automatic activity-to-session linking during provider sync:
    - new service: `ActivityAutoLinkService`
    - sync pipeline now runs auto-link after Strava persistence
    - matching is explicit and conservative (same athlete/day/sport + duration threshold)
    - provider upserts now preserve existing manual links
- Hardened calendar sync awareness:
    - header now includes explicit `Sync` action next to provider status
    - provider pill state updates from realtime events and polling fallback
    - calendar refreshes sessions + activities when sync reaches `success`
- Implemented athlete calendar view-mode controls:
    - modes: `Infinite` (default), `Day`, `Week`, `Month`
    - non-infinite modes get previous/next range navigation
    - `Jump to current week` appears when out of current-week context
- Fixed infinite-scroll stability issue:
    - removed unintended recenter resets tied to prop churn
    - preserved one-time initial centering while keeping infinite loading behavior
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Activities/ActivityAutoLinkServiceTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-09 (Admin Observability + Coach Review UX + Realtime Calendar Sync Hardening)

- Added admin observability backbone with Spatie activity logs:
    - dependency installed: `spatie/laravel-activitylog`
    - published config + migrations:
        - `2026_02_09_173810_create_activity_log_table.php`
        - `2026_02_09_173811_add_event_column_to_activity_log_table.php`
        - `2026_02_09_173812_add_batch_uuid_column_to_activity_log_table.php`
    - model-level change logging enabled for core mutable domains
    - request-level mutating action logging middleware added (`log_activity`) with sensitive-field redaction
- Added admin user-detail logging surface:
    - new route + controller:
        - `GET /admin/users/{user}`
    - new page:
        - `resources/js/pages/admin/users/show.tsx`
    - includes:
        - overview/log tabs
        - paginated activity table
        - scope/event/per-page filters
        - value popup for old/new property payloads
- Hardened admin user listings:
    - users list + recent signups now include explicit detail links to user detail page
    - pending/rejected coach accounts are now non-impersonatable in backend and UI
    - athlete status now resolves to `active` (no false `pending` status)
- Hardened coach review workflow UX:
    - coach applications page now supports status tabs:
        - Pending
        - Accepted
        - Rejected
    - metrics split into total/pending/accepted/rejected
    - backend filtering supported via `?status=...`
- Hardened auth onboarding UX:
    - register flow now supports Enter key progression/submit via form submit semantics
    - coach file rename input now supports keyboard confirm/cancel:
        - Enter = confirm rename
        - Escape = cancel rename
    - pending-approval page now explicitly shows rejected state + rejection reason
- Hardened realtime activity-sync awareness:
    - calendar now subscribes to sync status broadcasts and updates header provider pill live
    - calendar auto-refreshes session window when sync reaches `success`
    - settings sync surfaces now update transient status/error messages based on live broadcast events
- Fixed settings overview render loop:
    - removed recursive `useForm.setData` synchronization effects that caused `Maximum update depth exceeded`
    - settings page now renders/stays stable without infinite browser error logging
- Verification completed:
    - `vendor/bin/sail npx prettier --write ...` (touched TSX files)
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminImpersonationTest.php tests/Feature/Auth/CoachApprovalFlowTest.php tests/Feature/Auth/RegistrationTest.php tests/Feature/NavigationShellPagesTest.php`

## 2026-02-09 (Auth + Coach Approval Flow Hardening)

- Implemented role-aware registration backbone on Fortify:
    - registration now captures `first_name` + `last_name` separately (while keeping `name` for compatibility)
    - role branch added in `CreateNewUser`:
        - athlete path creates `athlete_profiles` onboarding fields from submitted multi-step payload
        - coach path creates:
            - `coach_profiles.is_approved = false`
            - `coach_applications` submission record
            - `coach_application_files` attachments persisted on local disk
- Added coach approval domain layer:
    - new migrations:
        - `2026_02_09_161614_add_first_name_and_last_name_to_users_table.php`
        - `2026_02_09_161614_create_coach_applications_table.php`
        - `2026_02_09_161615_create_coach_application_files_table.php`
    - new models:
        - `CoachApplication`
        - `CoachApplicationFile`
    - new middleware:
        - `approved_coach` (redirects unapproved coaches to pending screen)
- Added pending-approval experience for coaches:
    - new route: `/coach/pending-approval`
    - new Inertia page: `auth/pending-approval`
    - coach can review submitted answers + uploaded files (preview links)
- Added admin review tooling for coach applications:
    - new admin tab/page: `/admin/coach-applications`
    - accordion-style application list with left-side answers and right-side single-file preview navigator
    - explicit approve/reject actions with review notes
    - admin dashboard now includes pending coach applications widget + metric
- Added secure application file preview endpoints:
    - admin route for review previews
    - coach owner route for pending-screen previews
    - authorization checks enforced in controller
- Redesigned auth UI surfaces to match Endure style:
    - new split auth layout
    - refreshed login screen
    - multi-step register flow:
        - athlete steps: account -> preferences -> zones -> integrations/tutorial
        - coach steps: account -> profile -> motivation + document uploads
    - coach upload UX includes rename/delete list behavior with extension lock and explicit confirm/cancel controls
- Verification completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npx prettier --write ...` (touched auth/admin TSX files)
    - `vendor/bin/sail artisan test --compact tests/Feature/Auth/RegistrationTest.php tests/Feature/Auth/CoachApprovalFlowTest.php tests/Feature/NavigationShellPagesTest.php tests/Feature/AdminImpersonationTest.php tests/Feature/CoachCalendarReadAccessTest.php tests/Feature/CoachAthleteAssignmentTest.php tests/Feature/DashboardTest.php tests/Feature/Api/TrainingSessionReadApiTest.php`

## 2026-02-09 (Workout Builder + Session Detail UX Refinement)

- Expanded workout structure payload/model handling for nested block items:
    - `planned_structure.steps.*.items` is now validated and persisted
    - added `repeats` block-type validation in session store/update requests
    - range/target validation now applies to nested repeat/ramp items
- Improved builder execution UX:
    - block-list drag/drop now uses a dedicated drag handle + visible insertion line
    - repeat/ramp inner blocks remain individually editable and persist across reloads
- Session editor modal hardening:
    - larger structure-authoring modal width and viewport-safe height
    - details tab now switches to structure-driven planned metrics when structure exists
    - planned duration + planned TSS payload values are now derived from structure (manual fields only when no structure exists)
    - keyboard hint added (`Enter` save, `Esc` close)
- Rebuilt session-detail surface for fidelity + usability:
    - graph zoom remains click-drag based (no range sliders)
    - hover guideline now tracks cursor precisely
    - elevation renders as a filled background profile
    - map remains real Leaflet and now keeps focused zoom segment contrast
    - route hover telemetry panel remains vertically stacked on map
    - analysis panel label simplified to `Analysis`
    - planned structure preview is now read-only with hover inspection and summary copy
    - metrics consolidated into one right-side `Statistics` card
    - added `Internal Notes` textarea with explicit save action
    - map moved to second row in detail composition
- Session-detail composition adjusted again for workflow clarity:
    - row 1: route map + route statistics side card (internal notes included)
    - row 2: planned blocks + analysis when structure exists, otherwise full-width analysis
    - right side card compacted with a `Statistics / Internal Notes` switcher to keep row-1 height tighter
    - planned vs actual summary reduced to compact badge-style chips
- chart rendering performance improved via deterministic stream downsampling
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCompletionApiTest.php tests/Feature/Api/TrainingSessionActivityLinkApiTest.php tests/Feature/Calendar/SessionDetailPageTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-09 (Workout Structure Hardening Pass)

- Added athlete performance-anchor persistence for workout builder scaling:
    - new athlete profile fields:
        - `ftp_watts`
        - `max_heart_rate_bpm`
        - `threshold_heart_rate_bpm`
        - `threshold_pace_minutes_per_km`
        - `power_zones` (JSON)
        - `heart_rate_zones` (JSON)
    - new migration:
        - `2026_02_09_142712_add_performance_targets_to_athlete_profiles_table.php`
    - settings training-preferences validation now enforces:
        - numeric anchor bounds
        - threshold HR <= max HR
        - zone range integrity (`min <= max`)
- Upgraded athlete Settings → Training Preferences surface:
    - added editable performance anchors (FTP/HR/pace)
    - added editable zone tables (power + heart rate)
    - values persist through existing training-preferences endpoint
- Wired athlete training targets into calendar/session editor context:
    - dashboard + athlete calendar controllers now provide `athleteTrainingTargets`
    - session editor passes these targets into workout builder
- Rebuilt workout structure builder for stronger execution flow:
    - unit-aware preview axis labels (with converted values when anchors exist)
    - explicit range-band visualization in preview
    - block-type-specific default targets/ranges
    - grouped repeat/warmup templates:
        - warmup = phased block in one card
        - two/three-step repeats remain single editable cards with repeat count
    - overview tiles added (`Total Duration`, `Estimated TSS`, `Blocks`)
    - preview blocks are now draggable
    - list drag/drop now uses clear insertion separators for snappier placement feedback
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Settings/AthleteTrainingPreferencesTest.php tests/Feature/DashboardTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php`
    - `vendor/bin/sail bin pint --dirty --format agent`

## 2026-02-09 (Athlete Slicing Parity Implementation Pass)

- Implemented slicing-aligned athlete settings overview as the primary settings surface:
    - route moved to `/settings/overview` with tab-driven shell
    - tabs now follow slicing structure:
        - Profile
        - Training Preferences
        - Integrations
        - Billing & Plans
    - athlete account label and sidebar tab hierarchy added
    - profile/training preference persistence wired to dedicated controllers + FormRequests
- Added persistence for athlete settings fields:
    - `users`: `timezone`, `unit_system`
    - `athlete_profiles`: `primary_sport`, `weekly_training_days`, `preferred_rest_day`, `intensity_distribution`
- Replaced static calendar provider chip behavior:
    - calendar/dashboard now receive real provider status props
    - header chip reflects Strava connection/sync state instead of fixed Garmin copy
- Implemented interval structure backbone for session create/edit:
    - new `planned_structure` JSON column on `training_sessions`
    - request validation + controller persistence for structure payload
    - slicing-style workout structure builder integrated in session editor modal
    - supports requested block types and editable fields (bike/run-first workflow)
- Added athlete completed-session detail flow:
    - new route/controller: `/sessions/{trainingSession}`
    - completed session click now opens dedicated detail page
    - detail page includes planned-vs-actual surfaces, stream toggles, and map panel
- Added provider-agnostic activity stream read layer:
    - new stream contract + manager resolution
    - Strava stream provider implementation
    - `GET /api/activities/{activity}/streams` endpoint
    - caching support via `ACTIVITY_PROVIDER_STREAM_CACHE_SECONDS`
    - default stream enablement aligns with requirement:
        - on by default: heart rate, power, cadence, elevation
        - optional streams appear after available set; unavailable streams are disabled
- Updated athlete plans and progress parity surfaces:
    - `/plans` now slicing-style coming-soon shell
    - `/progress` expanded with weekly logs section tied to real session aggregates
- UX hardening follow-up:
    - session editor modal now stays viewport-safe (`max-height` + internal scroll)
    - workout structure moved to a dedicated editor tab
    - modal expands to a wider canvas while authoring workout structure
    - completed-session detail graph upgraded with:
        - x-axis mode toggle (`kilometers` default when available, `time` fallback)
        - drag-select zoom (click + drag on chart), with reset action
        - axis grid/ticks and hover inspection
    - route panel upgraded from static SVG to real Leaflet map with route polyline
    - chart hover now highlights the corresponding route point on the map
    - zoomed chart segment now maps to a contrasting highlighted route segment and focused map bounds
    - when no planned blocks exist, the analysis panel renders full-width and planned-block wrapper is omitted
- Fixed migration failure in training-session ownership backfill:
    - replaced unsafe `chunkById` path with safe chunk iteration in
      `2026_02_08_230000_add_user_id_and_nullable_week_to_training_sessions_table.php`
- Verification completed:
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/ActivityStreamsApiTest.php tests/Feature/Calendar/SessionDetailPageTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/DashboardTest.php tests/Feature/ProgressPageTest.php`
    - `vendor/bin/sail artisan test --compact tests/Feature/NavigationShellPagesTest.php tests/Feature/Settings/ProfileUpdateTest.php tests/Feature/Settings/ActivityProviderConnectionsTest.php`

## 2026-02-09

- Phase 0 athlete parity audit completed against slicing authority:
    - inspected slicing sources:
        - `slicing-enduro-app/components/**`
        - `slicing-enduro-app/screenshots/athlete/**`
    - inspected current athlete implementation:
        - sidebar/nav (`resources/js/components/app-sidebar.tsx`)
        - calendar (`resources/js/pages/calendar/**`)
        - progress (`resources/js/pages/progress/index.tsx`)
        - plans (`resources/js/pages/plans/index.tsx`)
        - settings (`resources/js/pages/settings/**`, `resources/js/layouts/settings/layout.tsx`)
- Confirmed parity matches (athlete):
    - sidebar tab set/order currently matches requested athlete tabs:
        - Calendar
        - Training Progress
        - Training Plans
        - Settings
    - calendar week-grid composition is in slicing shape:
        - fixed top header
        - fixed weekday row
        - sticky week headers
        - aligned 7-day columns + summary rail
    - progress header/range shell broadly matches slicing intent:
        - long-term analysis header
        - range controls (`4/8/12/24`)
        - load trend + consistency section framing
- Detected parity gaps (athlete):
    - calendar header still shows static `Garmin Sync Active` copy instead of real provider connection state
    - no athlete session detail subpage equivalent to slicing training-detail screen; completed-session analysis route/view is missing
    - no interval block builder (drag/drop planned structure) in session editor
    - no planned-vs-actual detail surface with streams/map overlay in athlete flow
    - progress page is missing slicing-style weekly logs section and associated list interaction
    - plans page is still a starter-style generic card, not slicing-style coming-soon composition
    - settings are still starter-kit multi-route pages (`profile/password/two-factor/appearance/connections`) instead of slicing tabbed settings shell:
        - Profile
        - Training Preferences
        - Integrations
        - Billing & Plans
        - athlete account badge/label
- Phase 0 is now blocked pending clarification answers before implementation.

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
- Implemented TrainingSession write support (backend-only):
    - added `StoreTrainingSessionRequest`
    - added `UpdateTrainingSessionRequest`
    - added enum-backed sport validation via `TrainingSessionSport` (`swim`, `bike`, `run`, `gym`, `other`)
    - enforced session date within selected `TrainingWeek` range
    - enforced week accessibility validation for athlete/admin write paths
- Implemented `TrainingSessionController` write methods:
    - `store` returns `201` + `TrainingSessionResource`
    - `update` returns `200` + `TrainingSessionResource`
    - `destroy` returns `204`
    - policy checks applied for create/update/delete; coach write access remains denied
- Added `tests/Feature/Api/TrainingSessionCrudApiTest.php` covering:
    - auth required
    - athlete own create/update/delete
    - athlete forbidden cross-athlete mutation
    - admin full mutation
    - coach forbidden (`403`)
    - validation failures for invalid week, date outside week range, missing required fields
- Verification completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php tests/Feature/Api/TrainingWeekCrudApiTest.php` (23 passed)
- Wired athlete-only TrainingSession write interactions into calendar UI (frontend-only):
    - create modal triggered from empty day cells / add button
    - edit modal triggered from session row click
    - delete action with explicit confirmation in edit modal
    - all writes call existing API routes (`store` / `update` / `destroy`) via Wayfinder route helpers
    - backend validation errors render inline in the modal
    - successful writes reload calendar data from real backend props
    - role gating enforced: only `auth.user.role === 'athlete'` can trigger write affordances; non-athletes remain read-only
- Frontend verification completed:
    - `vendor/bin/sail npm run types`
- Implemented coach-athlete assignment backbone (backend-first):
    - added `coach_athlete_assignments` table with:
        - `coach_id` FK
        - `athlete_id` FK
        - unique `(coach_id, athlete_id)`
        - cascading deletes
    - added `CoachAthleteAssignment` model
    - added `User` relationships:
        - `coachedAthletes()`
        - `coaches()`
- Updated assignment-aware authorization and read scoping:
    - policies now allow coach read access only for assigned athletes
    - coach write access remains denied for plans/weeks/sessions/activities
    - dashboard + API read controllers (`TrainingPlan`, `TrainingWeek`, `TrainingSession`) now scope coach collections to assigned athletes only
- Implemented read-only coach view enablement:
    - added `CoachAthleteIndexController` for assigned-athlete directory props
    - added `AthleteCalendarController` for coach/admin athlete calendar viewing
    - wired `/coaches` to assigned-athlete directory with real Inertia props
    - wired `/athletes/{athlete}` to reuse existing calendar page in read-only coach context
    - added contextual calendar header text: `Viewing athlete: {name}`
    - kept athlete calendar composition unchanged
- Extended deterministic visual seeders:
    - seeded three deterministic athletes with plans/weeks/sessions
    - seeded one coach assigned to all three athletes
- Added/updated tests:
    - `tests/Feature/CoachAthleteAssignmentTest.php`
    - `tests/Feature/CoachCalendarReadAccessTest.php`
    - updated existing coach read assertions in plan/week/session read API tests for assignment-aware behavior
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/CoachAthleteAssignmentTest.php tests/Feature/CoachCalendarReadAccessTest.php tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingPlanCrudApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php tests/Feature/Api/TrainingWeekCrudApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/NavigationShellPagesTest.php tests/Feature/DashboardTest.php` (46 passed)

- Implemented admin console + impersonation system (session-based, read-only-first):
    - added admin-only route guard middleware (`admin`)
    - added admin routes:
        - `GET /admin`
        - `GET /admin/users`
        - `POST /admin/impersonate/{user}`
        - `POST /admin/impersonate/stop`
    - added backend controllers:
        - `AdminConsoleController`
        - `AdminUserIndexController`
        - `ImpersonationStartController`
        - `ImpersonationStopController`
    - added Inertia shared impersonation context:
        - `auth.impersonating`
        - `auth.original_user`
        - `auth.impersonated_user`
- Corrected admin navigation behavior to slicing rules:
    - admin (not impersonating) sidebar now shows only:
        - Admin Console
        - Users
    - impersonated sessions now show role-correct sidebar automatically
- Added persistent impersonation banner with stop action across app layout.
- Enforced read-only training writes during impersonation:
    - write-policy guard for plan/week/session/activity create/update/delete/restore/forceDelete
    - API routes now include session middleware (`StartSession`) so impersonation context is available for policy enforcement
- Added admin impersonation + role-navigation test coverage:
    - `tests/Feature/AdminImpersonationTest.php`
    - updated `tests/Feature/NavigationShellPagesTest.php`
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminImpersonationTest.php tests/Feature/NavigationShellPagesTest.php tests/Feature/CoachAthleteAssignmentTest.php tests/Feature/CoachCalendarReadAccessTest.php tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingPlanCrudApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php tests/Feature/Api/TrainingWeekCrudApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php` (54 passed)

- Implemented provider-agnostic external activity read scaffolding (backend-only):
    - added provider contract:
        - `app/Services/ActivityProviders/Contracts/ActivityProvider.php`
    - added normalized DTO + typed collection:
        - `app/Data/ExternalActivityDTO.php`
        - `app/Data/Collections/ActivityCollection.php`
    - added provider manager/registry with allowed-provider enforcement:
        - `app/Services/ActivityProviders/ActivityProviderManager.php`
    - added explicit provider exceptions:
        - unsupported provider
        - unauthorized
        - invalid token
        - rate limited
        - token missing
        - request failure
    - container wiring added in `AppServiceProvider` with provider map from `config/services.php`

- Implemented Strava read-only provider:
    - `app/Services/ActivityProviders/Strava/StravaActivityProvider.php`
    - read endpoints used:
        - `/athlete/activities`
        - `/activities/{id}`
    - centralized HTTP client setup (base URL + bearer token + JSON)
    - explicit failure handling for:
        - missing token
        - invalid/expired token (`401`)
        - unauthorized (`403`)
        - rate limit (`429`)
    - explicit mapping from Strava payload to normalized DTO fields

- Added minimal persistence layer for normalized provider activities:
    - `app/Services/Activities/ExternalActivityPersister.php`
    - upsert by (`athlete_id`, `provider`, `external_id`)
    - no training-session linking or derived metrics

- Extended schema for external activity storage:
    - `users`:
        - `strava_access_token`
        - `strava_refresh_token`
        - `strava_token_expires_at`
    - `activities`:
        - renamed `source` → `provider`
        - added `athlete_id`, `sport`, `started_at`, `duration_seconds`, `distance_meters`, `elevation_gain_meters`
        - made `training_session_id` nullable
        - added indexes + unique constraint on (`athlete_id`, `provider`, `external_id`)

- Implemented read-only activities API:
    - controller:
        - `ActivityController@index`
        - `ActivityController@show`
    - routes:
        - `GET /api/activities`
        - `GET /api/activities/{activity}`
    - request validation:
        - `per_page`
        - `provider`
        - `from` / `to`
    - role-scoped access:
        - athlete: own activities
        - coach: assigned athletes only
        - admin: all
    - pagination shape preserved (`data`, `links`, `meta`)

- Added/updated tests:
    - `tests/Feature/ActivityProviders/ActivityProviderManagerTest.php`
    - `tests/Feature/ActivityProviders/StravaActivityProviderTest.php`
    - `tests/Feature/Api/ActivityReadApiTest.php`
    - updated `tests/Feature/Api/DomainSpineRoutesTest.php` for implemented activities index

- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/ActivityProviders/ActivityProviderManagerTest.php tests/Feature/ActivityProviders/StravaActivityProviderTest.php tests/Feature/Api/ActivityReadApiTest.php tests/Feature/Api/DomainSpineRoutesTest.php` (14 passed)
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingPlanCrudApiTest.php tests/Feature/Api/TrainingWeekCrudApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/CoachCalendarReadAccessTest.php` (39 passed)

- Implemented provider-agnostic OAuth connection and sync backbone (Strava first):
    - added OAuth provider contract:
        - `app/Services/ActivityProviders/Contracts/OAuthProvider.php`
    - added normalized OAuth token DTO:
        - `app/Data/OAuthProviderTokensDTO.php`
    - extended provider manager to resolve both:
        - activity providers
        - OAuth providers
- Added durable provider connection persistence:
    - new table + model:
        - `activity_provider_connections`
        - `App\Models\ActivityProviderConnection`
    - stores:
        - encrypted `access_token`
        - encrypted `refresh_token`
        - `token_expires_at`
        - provider athlete id
        - sync tracking (`last_synced_at`, `last_sync_status`, `last_sync_reason`)
- Implemented Strava OAuth provider (read scopes, connect/callback/refresh support):
    - `app/Services/ActivityProviders/Strava/StravaOAuthProvider.php`
    - OAuth endpoints wired against:
        - `https://www.strava.com/oauth/authorize`
        - `https://www.strava.com/oauth/token`
- Implemented centralized token lifecycle management:
    - `ActivityProviderTokenManager` detects near-expiry and refreshes tokens through OAuth provider abstractions
    - `ActivityProviderConnectionStore` handles upsert/disconnect/sync status updates and legacy Strava token compatibility
- Implemented sync orchestration:
    - `ActivitySyncService` fetches provider activities, persists via `ExternalActivityPersister`, and tracks sync status
    - added API endpoint:
        - `POST /api/activity-providers/{provider}/sync`
    - role behavior:
        - athlete/admin allowed
        - coach forbidden
- Implemented web OAuth routes/controllers (auth-protected):
    - connect redirect
    - callback exchange/store
    - disconnect
    - routes under `settings/connections/*`
- Added Settings → Connections UI (Inertia, real backend state, no mock data):
    - `resources/js/pages/settings/connections.tsx`
    - shows connection status + last sync + connect/disconnect + sync now
    - wired into settings navigation and settings overview links
- Config/environment updates:
    - expanded `config/services.php` for OAuth provider map + Strava OAuth credentials/scopes + sync refresh settings
    - added required env variables to `.env.example`
- Added test coverage:
    - `tests/Feature/Settings/ActivityProviderConnectionsTest.php`
    - `tests/Feature/Api/ActivityProviderSyncApiTest.php`
    - `tests/Unit/ActivityProviders/ActivityProviderTokenManagerTest.php`
    - updated `tests/Feature/ActivityProviders/ActivityProviderManagerTest.php` for OAuth provider resolution
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Settings/ActivityProviderConnectionsTest.php tests/Feature/Api/ActivityProviderSyncApiTest.php tests/Feature/ActivityProviders/ActivityProviderManagerTest.php tests/Feature/ActivityProviders/StravaActivityProviderTest.php tests/Feature/Api/ActivityReadApiTest.php tests/Unit/ActivityProviders/ActivityProviderTokenManagerTest.php` (27 passed)

- Upgraded provider sync to queue-backed execution with lock safety:
    - added sync run tracking model/table:
        - `ActivityProviderSyncRun`
        - `activity_provider_sync_runs`
    - added async dispatcher + job:
        - `ActivitySyncDispatcher`
        - `SyncActivityProviderJob`
    - sync endpoint behavior changed:
        - `POST /api/activity-providers/{provider}/sync`
        - now returns `202` + queued payload (`status`, `provider`, `sync_run_id`)
    - one sync lock per `provider + user` enforced via cache lock
    - deterministic retry/backoff implemented:
        - lock-contention release delay
        - rate-limit-aware requeue (uses `Retry-After` when provided; otherwise exponential delay)
    - connection sync statuses expanded in practice:
        - `queued`
        - `running`
        - `rate_limited`
        - `failed`
        - `success`

- Added Strava webhook ingestion + verification (Strava-first, provider-safe structure):
    - new webhook routes:
        - `GET /api/webhooks/strava` (verification handshake)
        - `POST /api/webhooks/strava` (event ingestion)
    - new webhook persistence model/table:
        - `ActivityProviderWebhookEvent`
        - `activity_provider_webhook_events`
    - idempotent event storage enforced by unique (`provider`, `payload_hash`)
    - processing behavior:
        - `create` / `update` activity events queue targeted sync for connected athlete
        - `delete` activity events soft-delete matching local activity record
        - unsupported/unmapped events are stored and marked ignored
    - optional subscription-id matching supported through config for stricter ingestion safety

- Added soft-delete support for external activities:
    - migration:
        - `add_deleted_at_to_activities_table`
    - `Activity` now uses `SoftDeletes`
    - persister restored to handle upserts against previously deleted activity rows

- Updated settings connections UX for async sync lifecycle:
    - sync action now expects `202 queued`
    - sync status labels rendered from real backend connection state (`queued`, `running`, `rate_limited`, `failed`, `success`)
    - no fake status data introduced

- Added/updated tests for queue + webhook hardening:
    - `tests/Feature/Api/ActivityProviderSyncApiTest.php`
    - `tests/Feature/Api/ActivityProviderSyncJobTest.php`
    - `tests/Feature/Api/ActivityProviderWebhookTest.php`
    - existing provider/token/read/settings tests kept green

- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/ActivityProviderSyncApiTest.php tests/Feature/Api/ActivityProviderWebhookTest.php tests/Feature/Api/ActivityProviderSyncJobTest.php tests/Feature/Api/ActivityReadApiTest.php tests/Feature/Settings/ActivityProviderConnectionsTest.php tests/Feature/ActivityProviders/ActivityProviderManagerTest.php tests/Feature/ActivityProviders/StravaActivityProviderTest.php tests/Unit/ActivityProviders/ActivityProviderTokenManagerTest.php` (34 passed)

- Enabled real-time sync status updates with Laravel Reverb:
    - installed broadcasting + Reverb scaffolding (`config/broadcasting.php`, `config/reverb.php`, `routes/channels.php`)
    - added broadcast event:
        - `ActivityProviderSyncStatusUpdated`
    - wired sync status transitions to broadcast from `ActivityProviderConnectionStore`
    - private user channel used:
        - `App.Models.User.{id}`
    - settings connections page now subscribes via Echo and reloads provider data when status events arrive
    - queue/webhook/status behavior unchanged functionally; this step adds live UI propagation only
    - Sail container networking updated for Reverb websocket traffic:
        - exposed container port `8080` via `FORWARD_REVERB_PORT`
- Frontend Echo setup completed:
    - added `resources/js/lib/echo.ts`
    - initialized Echo on app boot in `resources/js/app.tsx`
    - added CSRF meta tag in app root view for private channel auth
    - installer-injected `@laravel/echo-react` import was replaced with explicit `laravel-echo` + `pusher-js` setup for deterministic control
- Added event assertions to sync tests:
    - queued status event dispatched from sync API queueing flow
    - running/success/rate_limited events dispatched from sync job flow
- Validation completed after Reverb wiring:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/ActivityProviderSyncApiTest.php tests/Feature/Api/ActivityProviderSyncJobTest.php tests/Feature/Api/ActivityProviderWebhookTest.php tests/Feature/Settings/ActivityProviderConnectionsTest.php tests/Feature/Api/ActivityReadApiTest.php tests/Feature/ActivityProviders/ActivityProviderManagerTest.php tests/Feature/ActivityProviders/StravaActivityProviderTest.php tests/Unit/ActivityProviders/ActivityProviderTokenManagerTest.php` (34 passed)

- Implemented read-only Activity ↔ TrainingSession linking hints (backend-only):
    - added `ActivityLinkingService` for deterministic suggestion queries by:
        - athlete ownership
        - same sport
        - same calendar date
        - unlinked activities only
        - duration proximity ordering
    - updated `TrainingSessionResource` to include `suggested_activities` (minimal fields only)
    - updated `ActivityResource` to expose `linked_session_id` (+ `linked_session_uid` helper)
    - confirmed no write endpoints, no auto-linking, and no metric derivation were introduced
- Added linking-focused tests:
    - `tests/Feature/Services/ActivityLinkingServiceTest.php`
    - `tests/Feature/Api/ActivityLinkingResourceTest.php`
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail artisan test --compact tests/Feature/Services/ActivityLinkingServiceTest.php tests/Feature/Api/ActivityLinkingResourceTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/ActivityReadApiTest.php` (20 passed)

- Implemented manual Activity ↔ TrainingSession linking (explicit actions, no auto-binding):
    - added API endpoints:
        - `POST /api/training-sessions/{training_session}/link-activity`
        - `DELETE /api/training-sessions/{training_session}/unlink-activity`
    - added FormRequests:
        - `LinkActivityToSessionRequest`
        - `UnlinkActivityFromSessionRequest`
    - controller-level validation and guards now enforce:
        - session policy authorization (`linkActivity`, `unlinkActivity`)
        - same-athlete ownership between session/activity
        - conflict rejection when activity is linked elsewhere
        - conflict rejection when session already has a different linked activity
    - admin link/unlink is blocked by policy unless admin is impersonating an athlete (then treated as athlete context)
- Updated API resource contracts:
    - `TrainingSessionResource` now includes:
        - `linked_activity_id`
        - `linked_activity_summary`
        - `suggested_activities` (computed only for session show context)
    - `ActivityResource` now includes:
        - `linked_session_summary` when relation is loaded
- Frontend calendar wiring (athlete-only link UX):
    - session editor modal now shows:
        - linked activity summary
        - suggested activities list
        - explicit Link / Unlink actions with loading and error feedback
    - role gating updated:
        - athletes can link/unlink
        - coaches/admins do not see link controls
        - impersonated athlete context can access link/unlink controls while session write fields remain read-only
    - session rows show subtle linked-activity indicator
- Added/updated tests:
    - `tests/Feature/Api/TrainingSessionActivityLinkApiTest.php`
    - `tests/Feature/Api/ActivityLinkingResourceTest.php` (extended)
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/TrainingSessionActivityLinkApiTest.php tests/Feature/Api/ActivityLinkingResourceTest.php tests/Feature/Services/ActivityLinkingServiceTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/AdminImpersonationTest.php tests/Feature/Api/ActivityReadApiTest.php` (44 passed)

- Implemented manual TrainingSession completion using linked Activity (explicit, non-automatic):
    - added completion endpoints:
        - `POST /api/training-sessions/{training_session}/complete`
        - `POST /api/training-sessions/{training_session}/revert-completion`
    - added FormRequests:
        - `CompleteTrainingSessionRequest`
        - `RevertTrainingSessionCompletionRequest`
    - added policy methods:
        - `complete`
        - `revertCompletion`
    - admin direct completion writes denied; impersonated athlete context is allowed
- Added session completion persistence fields:
    - `training_sessions.actual_duration_minutes` (nullable)
    - `training_sessions.completed_at` (nullable)
    - model/resource support for:
        - `is_completed`
        - `completed_at`
        - `actual_duration_minutes`
        - `actual_tss`
- Completion semantics implemented:
    - completion requires linked activity
    - status transitions:
        - `planned` → `completed` (explicit action only)
        - `completed` → `planned` via revert endpoint
    - values copied from linked activity (no training-science derivation):
        - duration from activity duration seconds (minute conversion)
        - `actual_tss` copied only if explicit `tss` exists in activity payload; otherwise null
    - revert clears `actual_*` + `completed_at` while retaining linked activity
- Frontend calendar completion UX wired (athlete-only):
    - session editor modal now exposes:
        - `Mark as Completed`
        - `Revert to Planned`
    - completion actions include loading + validation error feedback
    - completed sessions display clear, restrained status cues
    - coach/admin remain read-only; impersonated athlete context behaves as athlete
- Added tests:
    - `tests/Feature/Api/TrainingSessionCompletionApiTest.php`
    - `tests/Feature/Calendar/SessionCompletionUiPropsTest.php` (Inertia rendering props coverage)
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/Api/TrainingSessionCompletionApiTest.php tests/Feature/Calendar/SessionCompletionUiPropsTest.php tests/Feature/Api/TrainingSessionActivityLinkApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/AdminImpersonationTest.php tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php tests/Feature/Api/ActivityReadApiTest.php` (60 passed)

- Implemented athlete Training Progress read model page (`/progress`) using real session aggregates:
    - added athlete-only backend controller + request validation:
        - `AthleteProgressController`
        - `Progress/IndexRequest`
    - range selector now supports validated windows: `4`, `8`, `12`, `24` weeks
    - page now renders:
        - average weekly load/volume
        - planned vs completed totals
        - load trend chart with explicit gaps when data is missing
        - consistency + current streak indicators
    - no training science, prediction, or speculative metrics added
- Completed calendar behavior parity updates:
    - initial calendar load now centers the current week in the owned scroll container
    - infinite vertical week loading added in both directions:
        - prepends past windows
        - appends future windows
    - uses existing `GET /api/training-sessions` read endpoint with date-window queries
    - no write logic changes and no calendar layout redesign introduced
- Added/updated tests:
    - `tests/Feature/ProgressPageTest.php`
    - `tests/Feature/DashboardTest.php` (session-first payload assertions retained/extended)
    - `tests/Feature/Api/TrainingSessionCrudApiTest.php` and existing read/navigation coverage remain green
- Validation completed:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/ProgressPageTest.php tests/Feature/DashboardTest.php tests/Feature/NavigationShellPagesTest.php tests/Feature/Api/TrainingSessionCrudApiTest.php tests/Feature/Api/TrainingSessionReadApiTest.php` (23 passed)
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminImpersonationTest.php tests/Feature/CoachCalendarReadAccessTest.php tests/Feature/Api/TrainingPlanReadApiTest.php tests/Feature/Api/TrainingWeekReadApiTest.php` (25 passed)

- Implemented athlete post-activity reconciliation UX hardening (frontend-only):
    - calendar session rows now distinguish:
        - planned without linked activity
        - linked and ready-to-complete
        - completed
        - completed with adjusted values
    - session editor modal now shows explicit planned-vs-actual comparison when activity is linked
    - completion copy behavior and revert clearing behavior are now explicitly communicated in modal copy
    - no backend, policy, route, or domain logic changes introduced
- Validation completed for this pass:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/DashboardTest.php` (4 passed)

- Hardened athlete Training Progress load trend fidelity (slicing parity follow-up):
    - fixed SVG scaling distortion by switching chart rendering to preserve geometric aspect ratio
    - added point-hover inspection state with aligned weekly crosshair + value overlay
    - trend now renders both:
        - planned centerline (dashed)
        - target range band
        - actual point/line trajectory
    - backend weekly aggregate now counts real execution from linked activities even when a session is not manually completed yet:
        - resolves duration from linked activity seconds
        - resolves actual TSS from `actual_tss`, fallback payload keys (`tss`, `suffer_score`)
    - no training-science derivation introduced; this remains a direct read-model aggregation pass
- Validation completed for this fix:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/ProgressPageTest.php` (4 passed)

- Historical TSS fallback is now unified across athlete read surfaces:
    - added `TrainingSessionActualMetricsResolver` for shared actual-metric resolution
    - `TrainingSessionResource` now exposes:
        - persisted `actual_tss`
        - computed `resolved_actual_tss` (payload-first + conservative estimate fallback)
    - athlete progress, calendar load rail, and session detail now consume resolved values through existing mapping
    - completion/revert domain semantics remain intact (`actual_tss` persists only on explicit completion)
- Validation completed for this fix:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/ProgressPageTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCompletionApiTest.php tests/Feature/DashboardTest.php` (27 passed)

- Calendar summary + progress aggregation hardening (historical activity visibility):
    - calendar week summary now includes actual volume/load from synced activities (including linked activity weeks where session status may still be planned)
    - summary rail now shows per-sport volume chips for quick weekly activity mix scanning
    - progress backend now includes unlinked activities in weekly actual totals to avoid empty trend/log output when sessions are not pre-planned
    - training session read payload keeps persisted completion fields but exposes computed `resolved_actual_tss` for UI read-models
- Validation completed for this fix:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/ProgressPageTest.php tests/Feature/Api/TrainingSessionReadApiTest.php tests/Feature/Api/TrainingSessionCompletionApiTest.php tests/Feature/DashboardTest.php` (28 passed)

Next milestone:
→ Next session starts with prioritized hardening backlog:
    - split heavy frontend chunks (`app`, `session-detail`, `landing`)
    - cache `/admin/analytics` aggregates
    - verify/add indexes for high-scale admin user table filters (`created_at`, status/query paths)
    - complete production readiness checklist (supervised workers/reverb, debug off, monitoring/alerts, backup policy, object storage)
    - finish remaining athlete behavior/performance polish against slicing

Next milestone:
→ Add provider operational hardening phase: webhook subscription lifecycle management + background worker deployment guidance + scheduled sync orchestration (no metrics derivation yet).

- Admin tickets UX hardening pass completed:
    - notification bell moved into integrated admin layout chrome (no floating corner placement)
    - archive delay control moved out of tickets page to dedicated admin settings page (`/admin/settings`)
    - tickets page now uses debounced auto-apply filters (removed manual “Apply Filters” action)
    - all ticket selects now use the shadcn `Select` primitives (themed to Endure dark system)
    - new ticket flow upgraded:
        - type picker as interactive badges
        - importance slider interaction
        - assignee text input with avatar suggestions
    - ticket description upgraded from plain textarea to lightweight WYSIWYG editor:
        - bold / heading / underline / bullet list controls
        - `@admin` mention insertion
        - `/user` reference insertion with dropdown anchored to typing position
        - inserted mention/user references render as clickable badges
    - ticket opening bug fixed by normalizing resource JSON payload shape (`{ data: ... }` vs flat object) for show/create/update flows
- Validation completed for this pass:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminTicketsTest.php tests/Feature/AdminImpersonationTest.php` (19 passed)

- Wave C frontend decomposition + ShadCN alignment slice (tickets/session editor):
    - added reusable ShadCN primitive wrappers:
        - `command`
        - `popover`
        - `tabs`
        - `table`
        - `scroll-area`
    - added reusable ticket UI modules:
        - `components/ticket-assignee-combobox.tsx` (`Popover + Command`, keyboard-safe assignee selection)
        - `components/ticket-ui.tsx` (shared badges/labels/table header controls/search highlighting)
        - `lib/ticket-utils.ts` (payload parsing/serialization + formatting + request error helpers)
    - refactored `admin/tickets/index.tsx` to consume shared ticket modules (reduced inline helper surface and removed custom assignee dropdown implementation)
    - stabilized TipTap editor integration:
        - corrected editor attribute typing for current TipTap API
        - corrected `setContent` options typing
        - fixed suggestion state typing to keep mention command menu behavior intact
    - standardized session editor modal structure:
        - fixed missing `Tabs` closure after tab migration
        - modal remains viewport-safe with dialog size contract
    - converted remaining hardcoded pixel text sizes in session editor to rem-based equivalents in touched areas
- Validation completed for this Wave C slice:
    - `vendor/bin/sail bin pint --dirty --format agent`
    - `vendor/bin/sail npm run types`
    - `vendor/bin/sail artisan test --compact tests/Feature/AdminTicketsTest.php` (6 passed)
