export type AnalyticsRange = {
    selected: string;
    options: string[];
    weeks: number;
    start: string;
    end: string;
};

export type UserGrowth = {
    labels: string[];
    totals: number[];
    athletes: number[];
    coaches: number[];
    current: {
        total: number;
        athletes: number;
        coaches: number;
    };
};

export type AnalyticsSeriesState = {
    totals: boolean;
    athletes: boolean;
    coaches: boolean;
};

export type AnalyticsSeriesKey = keyof AnalyticsSeriesState;

export type AdminAnalyticsPageProps = {
    range: AnalyticsRange;
    userGrowth: UserGrowth;
    coachPipeline: {
        pending: number;
        approved: number;
        rejected: number;
        submitted_in_range: number;
        reviewed_in_range: number;
    };
    platformUsage: {
        planned_sessions: number;
        completed_sessions: number;
        linked_sessions: number;
        synced_activities: number;
        active_athletes: number;
        completion_rate: number;
    };
    syncHealth: {
        connected_accounts: number;
        queued_or_running: number;
        success_runs: number;
        failed_runs: number;
        rate_limited_runs: number;
        success_rate: number;
    };
    moderation: {
        suspended_total: number;
        suspended_in_range: number;
        pending_coach_applications: number;
        recent_suspensions: Array<{
            id: number;
            name: string;
            email: string;
            suspended_at: string | null;
            reason: string | null;
        }>;
    };
    systemOps: {
        queue_backlog: number;
        failed_jobs_24h: number;
        webhook_events_24h: number;
        webhook_failed_24h: number;
        mutating_requests_24h: number;
    };
};
