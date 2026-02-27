export type ProgressWeek = {
    week_start: string;
    week_end: string;
    planned_duration_minutes: number | null;
    actual_duration_minutes: number | null;
    planned_tss: number | null;
    actual_tss: number | null;
    planned_sessions: number;
    completed_sessions: number;
    load_state: 'low' | 'in_range' | 'high' | 'insufficient' | string;
    load_state_ratio: number | null;
    recommended_tss_min: number | null;
    recommended_tss_max: number | null;
    recommended_tss_state: 'low' | 'in_range' | 'high' | 'insufficient' | string;
    recommended_tss_source: string;
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

export type ProgressComplianceWeek = {
    week_starts_at: string;
    week_ends_at: string;
    planned_sessions_count: number;
    planned_completed_count: number;
    compliance_ratio: number;
    planned_duration_minutes_total: number;
    completed_duration_minutes_total: number;
    planned_tss_total: number;
    completed_tss_total: number;
    load_state: 'low' | 'in_range' | 'high' | 'insufficient' | string;
    load_state_ratio: number | null;
    load_state_source: string;
    actual_minutes_total: number;
    recommendation_band: {
        min_minutes: number;
        max_minutes: number;
    } | null;
    recommendation_tss_band: {
        min_tss: number;
        max_tss: number;
    } | null;
    recommended_tss_state: 'low' | 'in_range' | 'high' | 'insufficient' | string;
    recommended_tss_source: string;
};

export type ProgressComplianceSummary = {
    total_planned_sessions_count: number;
    total_planned_completed_count: number;
    compliance_ratio: number;
    range_starts_at: string;
    range_ends_at: string;
};

export type ProgressCompliancePayload = {
    weeks: ProgressComplianceWeek[];
    summary: ProgressComplianceSummary;
};

export type ProgressPageProps = {
    load_metrics_enabled: boolean;
    range: ProgressRange;
    summary: ProgressSummary;
    weeks: ProgressWeek[];
    compliance: ProgressCompliancePayload;
    trendSeedWeeks: number[];
    todaySnapshot: {
        date: string;
        actual_tss_today: number;
        planned_tss_today: number;
        suggested_min_tss_today: number;
        suggested_max_tss_today: number;
    };
};

export type LoadSeriesPoint = {
    date: string;
    sport: 'combined' | 'run' | 'bike' | 'swim' | 'other' | string;
    tss: number;
    atl: number;
    ctl: number;
    tsb: number;
    isProjected?: boolean;
};

export type ProgressLoadHistoryPayload = {
    from: string;
    to: string;
    combined: LoadSeriesPoint[];
    per_sport: {
        run: LoadSeriesPoint[];
        bike: LoadSeriesPoint[];
        swim: LoadSeriesPoint[];
        other: LoadSeriesPoint[];
    };
    latest: {
        date: string;
        atl: number;
        ctl: number;
        tsb: number;
    } | null;
};

export type ProgressPoint = {
    x: number;
    plannedTss: number | null;
    actualTss: number | null;
    suggestedMinTss: number | null;
    suggestedMaxTss: number | null;
    plannedY: number | null;
    actualY: number | null;
    suggestedMinY: number | null;
    suggestedMaxY: number | null;
    label: string;
};

export type ProgressTrend = {
    yMax: number;
    points: ProgressPoint[];
    actualSegments: string[];
    plannedSegments: string[];
    targetBands: string[];
    targetBandUpperSegments: string[];
    targetBandLowerSegments: string[];
    targetBandColumns: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    chartWidth: number;
    chartHeight: number;
    chartPaddingX: number;
    chartPaddingY: number;
    innerHeight: number;
    stepX: number;
    gridLines: number;
};

export type PerformanceSeriesSnapshot = {
    date: string;
    atl: number;
    ctl: number;
    tsb: number;
    source: 'today' | 'last_real';
};

export type PerformanceLineKey = 'ctl' | 'atl' | 'tsb';
