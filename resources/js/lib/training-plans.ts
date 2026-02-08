import type {
    ApiCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
    TrainingPlanView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';

export const mapTrainingSession = (
    session:
        | TrainingPlanApi['training_weeks'][number]['training_sessions'][number]
        | TrainingSessionApi,
): TrainingSessionView => {
    return {
        id: session.id,
        trainingWeekId: session.training_week_id ?? null,
        scheduledDate: session.scheduled_date,
        sport: session.sport,
        status: session.status,
        isCompleted: session.is_completed ?? session.status === 'completed',
        completedAt: session.completed_at ?? null,
        durationMinutes: session.duration_minutes,
        actualDurationMinutes: session.actual_duration_minutes ?? null,
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
        sessions: week.training_sessions.map(mapTrainingSession),
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

export const mapTrainingSessionCollection = (
    response: ApiCollectionResponse<TrainingSessionApi>,
): TrainingSessionView[] => {
    return response.data.map(mapTrainingSession);
};
