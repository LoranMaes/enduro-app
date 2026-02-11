export type ProgressWeek = {
    week_start: string;
    week_end: string;
    planned_duration_minutes: number | null;
    actual_duration_minutes: number | null;
    planned_tss: number | null;
    actual_tss: number | null;
    planned_sessions: number;
    completed_sessions: number;
};

export type ProgressRange = {
    weeks: number;
    options: number[];
};

export type ProgressSummary = {
    average_weekly_tss: number | null;
    average_weekly_duration_minutes: number | null;
    planned_tss_total: number;
    actual_tss_total: number;
    planned_duration_minutes_total: number;
    actual_duration_minutes_total: number;
    planned_sessions_total: number;
    completed_sessions_total: number;
    consistency_weeks: number;
    current_streak_weeks: number;
};

export type ProgressPageProps = {
    range: ProgressRange;
    summary: ProgressSummary;
    weeks: ProgressWeek[];
};

export type ProgressPoint = {
    x: number;
    plannedTss: number | null;
    actualTss: number | null;
    plannedY: number | null;
    actualY: number | null;
    label: string;
};

export type ProgressTrend = {
    yMax: number;
    points: ProgressPoint[];
    actualSegments: string[];
    plannedSegments: string[];
    targetBands: string[];
    chartWidth: number;
    chartHeight: number;
    chartPaddingX: number;
    chartPaddingY: number;
    innerHeight: number;
    stepX: number;
    gridLines: number;
};
