# Endure Training Load Calculations (Current Implementation)

This document explains how load is **currently calculated in code** so coaches and performance staff can validate assumptions.

Scope covered:
- Daily TSS input resolution
- ATL / CTL / TSB formulas
- Per-sport and combined load
- Recalculation triggers and windows
- Data persistence and API output
- Known implementation gaps

---

## 1) What is implemented today

Load engine implementation is present and active:
- Daily snapshot persistence (`training_load_snapshots`)
- Per-sport and combined ATL/CTL/TSB
- Queue-safe recomputation jobs
- Nightly backfill
- Rebuild command (`load:recompute`)
- Progress API (`/api/progress`) exposing combined + per-sport series
- Performance Management chart consuming that API

Primary code paths:
- `/Users/loran/Desktop/endure-app/app/Services/Load/TrainingLoadCalculator.php`
- `/Users/loran/Desktop/endure-app/app/Jobs/RecalculateUserLoadJob.php`
- `/Users/loran/Desktop/endure-app/app/Jobs/RecalculateRecentLoadJob.php`
- `/Users/loran/Desktop/endure-app/app/Console/Commands/RecomputeLoadCommand.php`
- `/Users/loran/Desktop/endure-app/app/Http/Controllers/Api/ProgressController.php`
- `/Users/loran/Desktop/endure-app/app/Services/Load/LoadHistoryService.php`

---

## 2) Daily TSS input logic (what feeds ATL/CTL)

For each session day and sport bucket:

1. If session is completed:
- Use `actual_tss` if `actual_tss > 0`
- Else use `0` (no fallback approximation yet)

2. If session is not completed:
- Use `planned_tss` if `planned_tss > 0`
- Else use `0`

This logic is in:
- `/Users/loran/Desktop/endure-app/app/Services/Load/TrainingLoadCalculator.php` (`resolveSessionTss`)

Important:
- There is currently **no duration-based fallback TSS estimation** in the load calculator when TSS is missing.
- So missing TSS contributes `0`.

---

## 3) ATL / CTL / TSB formulas

Constants:
- ATL time constant = `7` days
- CTL time constant = `42` days

Formulas used per day:

- `ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) * (1/7)`
- `CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) * (1/42)`
- `TSB_today = CTL_yesterday - ATL_yesterday`

Implementation:
- `/Users/loran/Desktop/endure-app/app/Services/Load/TrainingLoadCalculator.php`

Seeding:
- Recalculation seeds from snapshots on `from - 1 day`.
- If no prior snapshot exists, seed values are `0.0`.

---

## 4) Per-sport and combined load

Sport buckets currently calculated:
- `run`
- `bike`
- `swim`
- `other`
- `combined`

Combined is computed as:
- Sum of all sport-bucket daily TSS before EWMA smoothing.

Sport normalization rules (examples):
- Bike bucket includes: `bike`, `ride`, `cycling`, `virtualride`, `ebikeride`, `mtn_bike`, `mountainbike`
- Unknown/empty sport -> `other`

Implementation:
- `/Users/loran/Desktop/endure-app/app/Services/Load/TrainingLoadCalculator.php` (`sportBucket`, `resolveDailyTss`)

---

## 5) Storage model

Table:
- `training_load_snapshots`

Columns:
- `user_id`, `date`, `sport`, `tss`, `atl`, `ctl`, `tsb`, timestamps

Constraint:
- Unique: `(user_id, date, sport)`

Migration/model:
- `/Users/loran/Desktop/endure-app/database/migrations/2026_02_13_160817_create_training_load_snapshots_table.php`
- `/Users/loran/Desktop/endure-app/app/Models/TrainingLoadSnapshot.php`

---

## 6) Recalculation model (hybrid)

### Event-based recompute
Recompute window defaults to last `60` days via:
- `/Users/loran/Desktop/endure-app/app/Actions/Load/DispatchRecentLoadRecalculation.php`

Triggered on:
- Session completion
- Session unlink activity
- Session update when planned load fields change
- Activity sync/reconciliation completion

Relevant files:
- `/Users/loran/Desktop/endure-app/app/Actions/TrainingSession/CompleteSessionAction.php`
- `/Users/loran/Desktop/endure-app/app/Actions/TrainingSession/UnlinkActivityAction.php`
- `/Users/loran/Desktop/endure-app/app/Http/Controllers/Api/TrainingSessionController.php`
- `/Users/loran/Desktop/endure-app/app/Services/Activities/ActivitySyncService.php`

### Nightly backfill
- Job: `RecalculateRecentLoadJob`
- Default: last `90` days
- Chunk size: `100` athletes
- Schedule: daily `02:00`

File:
- `/Users/loran/Desktop/endure-app/routes/console.php`

---

## 7) Full rebuild command

Command:
- `php artisan load:recompute`

Options:
- `--user=ID`
- `--all`
- `--from=YYYY-MM-DD`

Behavior:
- Dispatches queued recalculation jobs (does not compute inline)

File:
- `/Users/loran/Desktop/endure-app/app/Console/Commands/RecomputeLoadCommand.php`

---

## 8) Strava full-history import path

Job:
- `StravaFullHistoryImportJob`

Behavior:
- Paginates Strava activity history
- Persists activities only
- Dispatches load + weekly metrics recomputation after each imported batch

File:
- `/Users/loran/Desktop/endure-app/app/Jobs/StravaFullHistoryImportJob.php`

---

## 9) Progress API output (load history)

Endpoint:
- `GET /api/progress?from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns:
- `combined[]` daily points with `tss`, `atl`, `ctl`, `tsb`
- `per_sport.run[]`, `.bike[]`, `.swim[]`, `.other[]`
- `latest` combined point summary

Controller/resource:
- `/Users/loran/Desktop/endure-app/app/Http/Controllers/Api/ProgressController.php`
- `/Users/loran/Desktop/endure-app/app/Http/Resources/LoadHistoryResource.php`

---

## 10) Validation/tests available

Core tests:
- `/Users/loran/Desktop/endure-app/tests/Unit/TrainingLoadCalculatorTest.php`
- `/Users/loran/Desktop/endure-app/tests/Feature/RecalculateUserLoadJobTest.php`
- `/Users/loran/Desktop/endure-app/tests/Feature/LoadRebuildCommandTest.php`
- `/Users/loran/Desktop/endure-app/tests/Feature/PerformanceManagementApiTest.php`

These verify:
- EWMA smoothing behavior
- TSB calculation behavior
- Per-sport separation + combined series
- Rebuild command dispatch behavior
- API payload structure

---

## 11) Known gap vs full product intent

The `users.enable_load_metrics` field exists and progress UI respects it (widgets hide when false), but there is currently **no athlete-facing settings control** to toggle this value directly.

Implemented parts:
- DB field and casting
- Conditional rendering based on flag

Missing part:
- User-accessible toggle flow in settings UI/API.

---

## 12) Practical interpretation notes for coaches

- ATL reacts quickly to short-term load changes.
- CTL reacts slowly and reflects longer-term accumulated load.
- TSB is freshness proxy (`positive` fresher, `negative` more fatigue).
- Any session with missing TSS currently behaves as `0` load contribution.
- Unplanned completed sessions contribute to load if `actual_tss` is present.

If you want to tune model behavior later:
- Add duration/intensity fallback for missing TSS.
- Add sport-specific time constants.
- Add threshold-based readiness bands from ATL/CTL/TSB directly.
