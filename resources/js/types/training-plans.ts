export type LinkedActivitySummaryApi = {
    id: number;
    provider: string;
    started_at: string | null;
    duration_seconds: number | null;
    sport: string | null;
};

export type SuggestedActivityApi = {
    id: number;
    provider: string;
    sport: string | null;
    started_at: string | null;
    duration_seconds: number | null;
};

export type TrainingSessionApi = {
    id: number;
    training_week_id: number | null;
    scheduled_date: string;
    sport: string;
    status: 'planned' | 'completed' | 'skipped' | 'partial' | string;
    is_completed?: boolean;
    completed_at?: string | null;
    duration_minutes: number;
    actual_duration_minutes?: number | null;
    planned_tss: number | null;
    actual_tss: number | null;
    notes: string | null;
    planned_structure?: {
        unit: string;
        mode: 'range' | 'target' | string;
        steps: Array<{
            id?: string | null;
            type: string;
            duration_minutes: number;
            target?: number | null;
            range_min?: number | null;
            range_max?: number | null;
            repeat_count?: number | null;
            note?: string | null;
            items?: Array<{
                id?: string | null;
                label?: string | null;
                duration_minutes: number;
                target?: number | null;
                range_min?: number | null;
                range_max?: number | null;
            }> | null;
        }>;
    } | null;
    linked_activity_id?: number | null;
    linked_activity_summary?: LinkedActivitySummaryApi | null;
    suggested_activities?: SuggestedActivityApi[];
};

export type TrainingWeekApi = {
    id: number;
    starts_at: string;
    ends_at: string;
    training_sessions: TrainingSessionApi[];
};

export type TrainingPlanApi = {
    id: number;
    user_id: number;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string;
    training_weeks: TrainingWeekApi[];
};

export type ApiCollectionResponse<TData> = {
    data: TData[];
};

export type ApiPaginationMeta = {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
};

export type ApiPaginatedCollectionResponse<TData> =
    ApiCollectionResponse<TData> & {
        links?: unknown;
        meta?: ApiPaginationMeta;
    };

export type TrainingSessionView = {
    id: number;
    trainingWeekId: number | null;
    scheduledDate: string;
    sport: string;
    status: string;
    isCompleted: boolean;
    completedAt: string | null;
    durationMinutes: number;
    actualDurationMinutes: number | null;
    plannedTss: number | null;
    actualTss: number | null;
    notes: string | null;
    plannedStructure: {
        unit: string;
        mode: 'range' | 'target' | string;
        steps: Array<{
            id?: string | null;
            type: string;
            durationMinutes: number;
            target?: number | null;
            rangeMin?: number | null;
            rangeMax?: number | null;
            repeatCount?: number | null;
            note?: string | null;
            items?: Array<{
                id?: string | null;
                label?: string | null;
                durationMinutes: number;
                target?: number | null;
                rangeMin?: number | null;
                rangeMax?: number | null;
            }> | null;
        }>;
    } | null;
    linkedActivityId: number | null;
    linkedActivitySummary: {
        id: number;
        provider: string;
        startedAt: string | null;
        durationSeconds: number | null;
        sport: string | null;
    } | null;
    suggestedActivities: Array<{
        id: number;
        provider: string;
        sport: string | null;
        startedAt: string | null;
        durationSeconds: number | null;
    }>;
};

export type TrainingWeekView = {
    id: number;
    startsAt: string;
    endsAt: string;
    sessions: TrainingSessionView[];
};

export type TrainingPlanView = {
    id: number;
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    weeks: TrainingWeekView[];
};
