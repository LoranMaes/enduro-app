export type WorkoutStructureMode = 'range' | 'target';
export type WorkoutStructureUnit =
    | 'ftp_percent'
    | 'max_hr_percent'
    | 'threshold_hr_percent'
    | 'threshold_speed_percent'
    | 'rpe';
export type WorkoutStructureDurationType = 'time' | 'distance';
export type WorkoutStructureZoneLabel = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
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
    durationType: WorkoutStructureDurationType;
    durationSeconds: number;
    durationMinutes: number;
    distanceMeters: number | null;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
    zoneLabel: WorkoutStructureZoneLabel | null;
};

export type WorkoutStructureStep = {
    id: string;
    type: WorkoutStructureBlockType;
    durationType: WorkoutStructureDurationType;
    durationSeconds: number;
    durationMinutes: number;
    distanceMeters: number | null;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
    zoneLabel: WorkoutStructureZoneLabel | null;
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
    lt1_power_watts: number | null;
    lt2_power_watts: number | null;
    max_heart_rate_bpm: number | null;
    lt1_heart_rate_bpm: number | null;
    lt2_heart_rate_bpm: number | null;
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
    durationSeconds: number;
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
