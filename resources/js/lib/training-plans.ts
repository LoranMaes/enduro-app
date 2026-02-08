import type {
    ApiCollectionResponse,
    TrainingPlanApi,
    TrainingPlanView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';

const mapSession = (
    session: TrainingPlanApi['training_weeks'][number]['training_sessions'][number],
): TrainingSessionView => {
    return {
        id: session.id,
        scheduledDate: session.scheduled_date,
        sport: session.sport,
        status: session.status,
        durationMinutes: session.duration_minutes,
        plannedTss: session.planned_tss,
        actualTss: session.actual_tss,
        notes: session.notes,
        linkedActivityId: session.linked_activity_id ?? null,
        linkedActivitySummary:
            session.linked_activity_summary !== undefined &&
            session.linked_activity_summary !== null
                ? {
                      id: session.linked_activity_summary.id,
                      provider: session.linked_activity_summary.provider,
                      startedAt:
                          session.linked_activity_summary.started_at ?? null,
                      durationSeconds:
                          session.linked_activity_summary.duration_seconds ??
                          null,
                      sport: session.linked_activity_summary.sport ?? null,
                  }
                : null,
        suggestedActivities:
            session.suggested_activities?.map((activity) => ({
                id: activity.id,
                provider: activity.provider,
                sport: activity.sport ?? null,
                startedAt: activity.started_at ?? null,
                durationSeconds: activity.duration_seconds ?? null,
            })) ?? [],
    };
};

const mapWeek = (
    week: TrainingPlanApi['training_weeks'][number],
): TrainingWeekView => {
    return {
        id: week.id,
        startsAt: week.starts_at,
        endsAt: week.ends_at,
        sessions: week.training_sessions.map(mapSession),
    };
};

const mapPlan = (plan: TrainingPlanApi): TrainingPlanView => {
    return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        startsAt: plan.starts_at,
        endsAt: plan.ends_at,
        weeks: plan.training_weeks.map(mapWeek),
    };
};

export const mapTrainingPlanCollection = (
    response: ApiCollectionResponse<TrainingPlanApi>,
): TrainingPlanView[] => {
    return response.data.map(mapPlan);
};
