export type AtpPrimaryGoal = {
    id: number;
    title: string;
    target_date: string | null;
    priority: string;
    status: string;
};

export type AtpWeek = {
    week_index: number;
    iso_week: number;
    week_start_date: string;
    week_end_date: string;
    week_type: string;
    priority: string;
    notes: string | null;
    planned_minutes: number;
    completed_minutes: number;
    planned_tss: number | null;
    completed_tss: number | null;
    load_state: 'low' | 'in_range' | 'high' | 'insufficient' | string;
    load_state_ratio: number | null;
    recommended_tss_state?: 'low' | 'in_range' | 'high' | 'insufficient';
    recommended_tss_source?: string;
    is_current_week: boolean;
    primary_goal: AtpPrimaryGoal | null;
    goal_marker: AtpPrimaryGoal | null;
    weeks_to_goal: number | null;
};

export type AtpPlan = {
    id: number;
    user_id: number;
    year: number;
    weeks: AtpWeek[];
};

export type AtpPageProps = {
    year: number;
    plan: AtpPlan;
    weekTypeOptions: string[];
    priorityOptions: string[];
    isLocked: boolean;
};
