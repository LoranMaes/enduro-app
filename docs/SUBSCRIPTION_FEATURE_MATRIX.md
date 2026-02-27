# Subscription Feature Matrix

## Current Decision Defaults

- Free depth: **Generous**
- Coach billing: **Paid coach now**
- Ad model: **House upsell cards only**

## Matrix

| Feature Area                                              | Free Athlete                | Paid Athlete                         | Free Coach                | Paid Coach                              |
| --------------------------------------------------------- | --------------------------- | ------------------------------------ | ------------------------- | --------------------------------------- |
| Auth/profile/settings core                                | Yes                         | Yes                                  | Yes                       | Yes                                     |
| Calendar basic CRUD (sessions/goals/events/notes)         | Yes                         | Yes                                  | No athlete write          | No athlete write (current policy)       |
| Workout/other entry types                                 | Keep generous defaults      | Full + admin overrides               | N/A                       | N/A                                     |
| Workout structure builder                                 | Locked                      | Unlocked                             | N/A                       | N/A                                     |
| Workout library (`/api/workout-library`)                  | Locked                      | Unlocked                             | N/A                       | N/A                                     |
| Session stream analytics (`/api/activities/{id}/streams`) | Locked                      | Unlocked                             | Locked                    | Unlocked (assigned athletes)            |
| Progress page                                             | Basic summary + short range | Full range + load/performance charts | Locked                    | Unlocked (assigned athletes)            |
| ATP page/API (`/atp/{year}`, `/api/atp/*`)                | Locked                      | Unlocked                             | Locked                    | Unlocked (assigned athletes, read-only) |
| History depth                                             | Short window                | Full window                          | Short window              | Full window                             |
| Coach athlete roster                                      | N/A                         | N/A                                  | Trial cap (1 athlete max) | Full assigned roster                    |
| Ads                                                       | House upsell cards only     | None                                 | None                      | None                                    |
| Future AI features                                        | Locked                      | Unlocked                             | Locked                    | Unlocked                                |

## Planned Enforcement Points

- ATP: `AtpPageController`, `Api/AtpController`, `Api/AtpWeekController`
- Progress: `AthleteProgressController`, `Api/ProgressController`, `Api/ProgressComplianceController`
- Workout Library: `Api/WorkoutLibraryController`
- Streams: `Api/ActivityStreamController`
- History-window limits: `AthleteCalendarPayloadService`
- Coach roster scope/caps: `TrainingScope`, `CoachAthleteIndexController`

## Notes You Can Edit

- Entry-type entitlement system (existing) remains separate from feature-level entitlements.
- Billing UI is still placeholder; Stripe webhook subscription sync exists.
- Coach is currently read-only by policy (no session/plan/week writes).
