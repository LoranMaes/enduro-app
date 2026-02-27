export type WorkoutStructureMode = 'range' | 'target';
export type WorkoutStructureUnit =
    | 'ftp_percent'
    | 'max_hr_percent'
    | 'threshold_hr_percent'
    | 'threshold_speed_percent'
    | 'rpe';
export type WorkoutStructureBlockType =
    | 'warmup'
    | 'active'
    | 'recovery'
    | 'cooldown'
    | 'two_step_repeats'
    | 'three_step_repeats'
    | 'repeats'
    | 'ramp_up'
    | 'ramp_down';

export type WorkoutStructureItem = {
    id: string;
    label: string;
    durationMinutes: number;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
};

export type WorkoutStructureStep = {
    id: string;
    type: WorkoutStructureBlockType;
    durationMinutes: number;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
    repeatCount: number;
    items: WorkoutStructureItem[] | null;
    note: string;
};

export type WorkoutStructure = {
    unit: WorkoutStructureUnit;
    mode: WorkoutStructureMode;
    steps: WorkoutStructureStep[];
};

export type AthleteTrainingTargets = {
    ftp_watts: number | null;
    max_heart_rate_bpm: number | null;
    threshold_heart_rate_bpm: number | null;
    threshold_pace_minutes_per_km: number | null;
    power_zones: Array<{
        label: string;
        min: number;
        max: number;
    }>;
    heart_rate_zones: Array<{
        label: string;
        min: number;
        max: number;
    }>;
};

export type WorkoutStructureBuilderProps = {
    value: WorkoutStructure | null;
    sport: string;
    trainingTargets: AthleteTrainingTargets | null;
    disabled?: boolean;
    onChange: (next: WorkoutStructure | null) => void;
};

export type BlockDefinition = {
    type: WorkoutStructureBlockType;
    label: string;
    defaultDuration: number;
    helperText: string;
};

export type PreviewSegment = {
    id: string;
    durationMinutes: number;
    type: WorkoutStructureBlockType;
    intensityMin: number;
    intensityMax: number;
};

export type PreviewGroup = {
    stepId: string;
    stepIndex: number;
    totalDurationMinutes: number;
    patternLabel: string | null;
    segments: PreviewSegment[];
};
