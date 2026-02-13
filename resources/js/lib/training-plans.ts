import type {
    ActivityApi,
    ActivityView,
    ApiCollectionResponse,
    CalendarEntryApi,
    CalendarEntryView,
    GoalApi,
    GoalView,
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
        title: session.title ?? null,
        status: session.status,
        planningSource: session.planning_source ?? 'planned',
        completionSource: session.completion_source ?? null,
        isCompleted: session.is_completed ?? session.status === 'completed',
        completedAt: session.completed_at ?? null,
        autoCompletedAt: session.auto_completed_at ?? null,
        durationMinutes: session.duration_minutes,
        actualDurationMinutes: session.actual_duration_minutes ?? null,
        plannedTss: session.planned_tss,
        actualTss: session.resolved_actual_tss ?? session.actual_tss,
        notes: session.notes,
        plannedStructure:
            session.planned_structure !== undefined &&
            session.planned_structure !== null
                ? {
                      unit: session.planned_structure.unit,
                      mode: session.planned_structure.mode,
                      steps: session.planned_structure.steps.map((step) => ({
                          id: step.id ?? null,
                          type: step.type,
                          durationMinutes: step.duration_minutes,
                          target: step.target ?? null,
                          rangeMin: step.range_min ?? null,
                          rangeMax: step.range_max ?? null,
                          repeatCount: step.repeat_count ?? null,
                          note: step.note ?? null,
                          items:
                              step.items?.map((item) => ({
                                  id: item.id ?? null,
                                  label: item.label ?? null,
                                  durationMinutes: item.duration_minutes,
                                  target: item.target ?? null,
                                  rangeMin: item.range_min ?? null,
                                  rangeMax: item.range_max ?? null,
                              })) ?? null,
                      })),
                  }
                : null,
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

export const mapActivity = (activity: ActivityApi): ActivityView => {
    const startedAt = activity.started_at ?? null;

    return {
        id: activity.id,
        linkedSessionId:
            activity.linked_session_id ?? activity.training_session_id ?? null,
        athleteId: activity.athlete_id,
        provider: activity.provider,
        externalId: activity.external_id,
        sport: activity.sport,
        startedAt,
        startedDate:
            startedAt !== null && startedAt.length >= 10
                ? startedAt.slice(0, 10)
                : null,
        durationSeconds: activity.duration_seconds ?? null,
        distanceMeters: activity.distance_meters ?? null,
        elevationGainMeters: activity.elevation_gain_meters ?? null,
        resolvedTss: activity.resolved_tss ?? null,
    };
};

export const mapCalendarEntry = (
    entry: CalendarEntryApi,
): CalendarEntryView => {
    return {
        id: entry.id,
        userId: entry.user_id,
        scheduledDate: entry.scheduled_date,
        type: entry.type,
        title: entry.title,
        body: entry.body,
        meta: entry.meta,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
    };
};

export const mapGoal = (goal: GoalApi): GoalView => {
    return {
        id: goal.id,
        userId: goal.user_id,
        type: goal.type,
        sport: goal.sport,
        title: goal.title,
        description: goal.description,
        targetDate: goal.target_date,
        priority: goal.priority,
        status: goal.status,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
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

export const mapActivityCollection = (
    response: ApiCollectionResponse<ActivityApi>,
): ActivityView[] => {
    return response.data.map(mapActivity);
};

export const mapCalendarEntryCollection = (
    response: ApiCollectionResponse<CalendarEntryApi>,
): CalendarEntryView[] => {
    return response.data.map(mapCalendarEntry);
};

export const mapGoalCollection = (
    response: ApiCollectionResponse<GoalApi>,
): GoalView[] => {
    return response.data.map(mapGoal);
};
