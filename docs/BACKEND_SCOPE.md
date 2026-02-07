## Backend V1 Scope

Entities:

- User
- AthleteProfile
- CoachProfile
- TrainingPlan
- Week
- TrainingSession
- Activity (Garmin)

Non-goals V1:

- Messaging
- Social
- Nutrition
- Marketplace payouts
- Mobile-specific APIs

Invariants:

- Planned sessions exist independently of activities
- Activities never overwrite planned intent
- Metrics are derived, not stored raw
- Recalculation is deterministic
