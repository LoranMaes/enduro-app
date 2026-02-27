# Training Load System – Full Specification

## Overview

This document describes the full endurance load system for the platform.

The system is based on the classical Performance Management Model used in coach-grade systems such as TrainingPeaks:

- ATL (Acute Training Load)
- CTL (Chronic Training Load)
- TSB (Training Stress Balance)

This implementation supports:

- Per-sport ATL / CTL / TSB
- Combined ATL / CTL / TSB
- Hybrid recalculation model (event-based + nightly backfill)
- Historical backfilling
- Multi-athlete safe architecture
- Queue-based recalculation
- Future coach/team compatibility

---

# 1. Core Definitions

## 1.1 TSS (Training Stress Score)

TSS is the daily stress value for a workout.

Sources:

- If planned session → use planned TSS.
- If completed session:
    - Use actual provider TSS if available.
    - Otherwise calculate from duration × intensity (future).
- If unplanned synced workout → use actual TSS.
- If no TSS available → fallback to duration-based approximation (future enhancement).

TSS is the base input to ATL/CTL.

---

# 2. Performance Management Model

We use exponentially weighted moving averages (EWMA).

## 2.1 ATL (Acute Training Load)

Represents short-term fatigue.

Time constant: 7 days

Formula:

ATL_today =
ATL_yesterday + (TSS_today - ATL_yesterday) × (1 / 7)

---

## 2.2 CTL (Chronic Training Load)

Represents long-term fitness.

Time constant: 42 days

Formula:

CTL_today =
CTL_yesterday + (TSS_today - CTL_yesterday) × (1 / 42)

---

## 2.3 TSB (Training Stress Balance)

Represents freshness.

TSB_today =
CTL_yesterday - ATL_yesterday

Positive → fresh  
Negative → fatigued

---

# 3. Per-Sport + Combined Model

We calculate:

- Bike ATL / CTL / TSB
- Run ATL / CTL / TSB
- Swim ATL / CTL / TSB
- Other ATL / CTL / TSB
- Combined ATL / CTL / TSB (sum of all sports daily TSS)

Each sport uses its own TSS input stream.

Combined = sum of daily sport TSS values before smoothing.

---

# 4. Storage Model

We store DAILY snapshots per user per sport.

Table: training_load_snapshots

Columns:

- id
- user_id
- date
- sport (nullable for combined)
- tss
- atl
- ctl
- tsb
- created_at
- updated_at

Constraints:

- unique(user_id, date, sport)

sport values:

- bike
- run
- swim
- other
- combined (or NULL for combined)

---

# 5. Recalculation Model (Hybrid)

## 5.1 Event-Based Recompute

Trigger on:

- Session completion
- Session unlink
- Session TSS change
- Strava sync reconciliation

Action:

Recompute last 60 days for that user.

Why 60 days?

- Covers 42-day CTL window.
- Adds buffer.

---

## 5.2 Nightly Backfill Job

Scheduled daily at low traffic time.

Job:

- Recompute last 90 days for all active users.
- Ensures drift correction.
- Ensures mathematical consistency.

---

## 5.3 Full Rebuild Command

CLI:

php artisan load:recompute --user=ID
php artisan load:recompute --all
php artisan load:recompute --from=YYYY-MM-DD

---

# 6. Multi-Athlete Safe Architecture

All services must accept User explicitly.

Never use auth() inside load services.

Core service signature:

recalculateForUser(User $user, Carbon $from, Carbon $to)

This ensures:

- Queue compatibility
- Admin repair tools
- Future coach dashboards
- Multi-athlete recalculation

---

# 7. Strava Import Strategy

Import:

- Activities only.
- No load computation during import.

After reconciliation:

- Trigger recalculation job.

Backfill Strategy:

- Background job paginates full Strava history.
- Import in chunks.
- After each batch, enqueue load recalculation.

---

# 8. Historical Backfill

If user has existing activities:

We must:

- Backfill from first activity date.
- Seed ATL/CTL at zero.
- Walk forward day-by-day.
- Store daily snapshot.

---

# 9. Athlete Toggle

Users can toggle:

- Normalized Load (default ON)
- Disable Load Metrics

If disabled:

- UI hides ATL/CTL/TSB widgets.
- Backend still stores snapshots.

---

# 10. Future Extensions

This system supports:

- Performance Management Chart
- Ramp Rate
- TSB target for race
- Goal-based load modeling
- AI plan generation
- Per-sport fatigue modeling
- Coach multi-athlete comparison

---

# 11. Compliance vs Load

Compliance:
Completed Planned Sessions / Planned Sessions

Load:
Total actual stress (planned + unplanned)

They are separate concepts.

---

# 12. Why This Architecture

This system is:

- Deterministic
- Rebuildable
- Coach-grade
- Multi-user safe
- Queue-safe
- Horizontally scalable
- Mathematically consistent

It prevents future architectural refactors.
