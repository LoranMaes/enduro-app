import type {
    WorkoutStructureDurationType,
    BlockDefinition,
    WorkoutStructureZoneLabel,
    WorkoutStructureBlockType,
    WorkoutStructureUnit,
} from './types';

export const blockDefinitions: BlockDefinition[] = [
    {
        type: 'warmup',
        label: 'Warmup',
        defaultDuration: 12,
        helperText: 'Single preparation block.',
    },
    {
        type: 'active',
        label: 'Active',
        defaultDuration: 8,
        helperText: 'Main work effort.',
    },
    {
        type: 'recovery',
        label: 'Recovery',
        defaultDuration: 4,
        helperText: 'Low-intensity reset block.',
    },
    {
        type: 'cooldown',
        label: 'Cool Down',
        defaultDuration: 10,
        helperText: 'Easy finish and de-load.',
    },
    {
        type: 'two_step_repeats',
        label: 'Two Step Repeats',
        defaultDuration: 8,
        helperText: 'Two-item repeating pattern with editable inner blocks.',
    },
    {
        type: 'three_step_repeats',
        label: 'Three Step Repeats',
        defaultDuration: 9,
        helperText: 'Three-item repeating pattern with editable inner blocks.',
    },
    {
        type: 'repeats',
        label: 'Repeats',
        defaultDuration: 6,
        helperText: 'Custom repeat cycle. Repeat count only lives here.',
    },
    {
        type: 'ramp_up',
        label: 'Ramp Up',
        defaultDuration: 8,
        helperText: 'Predefined 4-step progressive build.',
    },
    {
        type: 'ramp_down',
        label: 'Ramp Down',
        defaultDuration: 8,
        helperText: 'Predefined 4-step progressive unload.',
    },
];

export const unitLabels: Record<WorkoutStructureUnit, string> = {
    ftp_percent: '% Functional Threshold Power',
    max_hr_percent: '% Maximum Heart Rate',
    threshold_hr_percent: '% Threshold Heart Rate',
    threshold_speed_percent: '% Threshold Pace',
    rpe: 'RPE',
};

export const unitDisplayLabels: Record<WorkoutStructureUnit, string> = {
    ftp_percent: 'FTP%',
    max_hr_percent: 'Max HR%',
    threshold_hr_percent: 'THR%',
    threshold_speed_percent: 'Threshold Pace%',
    rpe: 'RPE',
};

export const itemBasedBlockTypes: WorkoutStructureBlockType[] = [
    'two_step_repeats',
    'three_step_repeats',
    'repeats',
    'ramp_up',
    'ramp_down',
];

export const durationTypeLabels: Record<WorkoutStructureDurationType, string> = {
    time: 'Time',
    distance: 'Distance',
};

export const zoneLabels: WorkoutStructureZoneLabel[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];

const sportUnitMatrix: Record<string, WorkoutStructureUnit[]> = {
    bike: ['ftp_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    mtn_bike: ['ftp_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    run: ['threshold_speed_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    walk: ['threshold_speed_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    swim: ['max_hr_percent', 'threshold_hr_percent', 'rpe'],
    gym: ['rpe'],
    day_off: ['rpe'],
    custom: ['rpe', 'max_hr_percent'],
    other: ['rpe', 'max_hr_percent'],
};

export function resolveAllowedUnitsForSport(sport: string): WorkoutStructureUnit[] {
    return sportUnitMatrix[sport] ?? ['rpe'];
}
