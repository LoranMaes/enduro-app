export type TrainingSessionApi = {
    id: number;
    scheduled_date: string;
    sport: string;
    status: 'planned' | 'completed' | 'skipped' | 'partial' | string;
    duration_minutes: number;
    planned_tss: number | null;
    actual_tss: number | null;
    notes: string | null;
};

export type TrainingWeekApi = {
    id: number;
    starts_at: string;
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

export type ApiPaginatedCollectionResponse<TData> = ApiCollectionResponse<TData> & {
    links?: unknown;
    meta?: ApiPaginationMeta;
};

export type TrainingSessionView = {
    id: number;
    scheduledDate: string;
    sport: string;
    status: string;
    durationMinutes: number;
};

export type TrainingWeekView = {
    id: number;
    startsAt: string;
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
