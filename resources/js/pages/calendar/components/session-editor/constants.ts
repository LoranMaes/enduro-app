import {
    Activity,
    Bike,
    Flag,
    Droplets,
    Dumbbell,
    Footprints,
    Mountain,
    MoonStar,
} from 'lucide-react';
import type { ValidationField, Sport } from './types';
import type {
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from './types';

export const sportOptions: Array<{
    value: Sport;
    label: string;
    icon: typeof Activity;
}> = [
    { value: 'swim', label: 'Swim', icon: Droplets },
    { value: 'bike', label: 'Bike', icon: Bike },
    { value: 'run', label: 'Run', icon: Footprints },
    { value: 'mtn_bike', label: 'MTN Bike', icon: Mountain },
    { value: 'walk', label: 'Walk', icon: Footprints },
    { value: 'day_off', label: 'Day Off', icon: MoonStar },
    { value: 'custom', label: 'Custom', icon: Flag },
    { value: 'gym', label: 'Gym', icon: Dumbbell },
    { value: 'other', label: 'Other', icon: Activity },
];

export const validationFields: ValidationField[] = [
    'training_week_id',
    'date',
    'sport',
    'title',
    'planned_duration_minutes',
    'planned_tss',
    'notes',
    'planned_structure',
    'activity_id',
    'session',
];

export const workoutStructureUnits: WorkoutStructureUnit[] = [
    'ftp_percent',
    'max_hr_percent',
    'threshold_hr_percent',
    'threshold_speed_percent',
    'rpe',
];

const sportUnitMatrix: Record<Sport, WorkoutStructureUnit[]> = {
    swim: ['max_hr_percent', 'threshold_hr_percent', 'rpe'],
    bike: ['ftp_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    run: ['threshold_speed_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    day_off: ['rpe'],
    mtn_bike: ['ftp_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    custom: ['rpe', 'max_hr_percent'],
    walk: ['threshold_speed_percent', 'max_hr_percent', 'threshold_hr_percent', 'rpe'],
    gym: ['rpe'],
    other: ['rpe', 'max_hr_percent'],
};

export function resolveAllowedWorkoutStructureUnitsForSport(
    sport: Sport,
): WorkoutStructureUnit[] {
    return sportUnitMatrix[sport] ?? ['rpe'];
}

export const workoutStructureBlockTypes: WorkoutStructureStep['type'][] = [
    'warmup',
    'active',
    'recovery',
    'cooldown',
    'two_step_repeats',
    'three_step_repeats',
    'repeats',
    'ramp_up',
    'ramp_down',
];
