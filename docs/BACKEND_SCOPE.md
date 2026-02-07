## Backend V1 Scope

Entities:

- User
- AthleteProfile
- CoachProfile
- TrainingPlan
- Week
- TrainingSession
- Activity (Garmin)

Implemented (2026-02-07):

- Domain models scaffolded:
  - User (with `role`: athlete, coach, admin)
  - AthleteProfile
  - CoachProfile
  - TrainingPlan
  - TrainingWeek
  - TrainingSession
  - Activity
- Database migrations created for all entities above.
- API controllers generated as structural stubs:
  - TrainingPlanController
  - TrainingWeekController
  - TrainingSessionController
  - ActivityController
- API resources generated:
  - TrainingPlanResource
  - TrainingWeekResource
  - TrainingSessionResource
  - ActivityResource
- Authorization policies generated:
  - TrainingPlanPolicy
  - TrainingWeekPolicy
  - TrainingSessionPolicy
  - ActivityPolicy
- Policy posture:
  - Admin: full access
  - Athlete: own data only
  - Coach: assignment-based access TODO (not implemented)
- API routing:
  - Protected under `auth` middleware (Fortify/session guard)
  - No Sanctum integration in current project setup

Non-goals V1:

- Messaging
- Social
- Nutrition
- Marketplace payouts
- Mobile-specific APIs
- Full Garmin sync implementation (placeholder model only)
- Business rules and metrics computation

Invariants:

- Planned sessions exist independently of activities
- Activities never overwrite planned intent
- Metrics are derived, not stored raw
- Recalculation is deterministic
