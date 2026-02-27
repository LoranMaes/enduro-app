import { blockDefinitions } from '../constants';
import type {
    WorkoutStructure,
    WorkoutStructureBlockType,
    WorkoutStructureItem,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from '../types';
import { stepUsesItems } from '../utils';

type IntensityDefaults = {
    durationMinutes: number;
    target: number;
    rangeMin: number;
    rangeMax: number;
};

export function createDefaultStructureForSport(sport: string): WorkoutStructure {
    if (sport === 'bike' || sport === 'run') {
        const unit: WorkoutStructureUnit =
            sport === 'bike' ? 'ftp_percent' : 'threshold_hr_percent';

        return {
            unit,
            mode: 'range',
            steps: [
                createStep({
                    type: 'warmup',
                    durationMinutes: 12,
                    unit,
                    index: 0,
                }),
                createStep({
                    type: 'active',
                    durationMinutes: 8,
                    unit,
                    index: 1,
                }),
                createStep({
                    type: 'recovery',
                    durationMinutes: 4,
                    unit,
                    index: 2,
                }),
                createStep({
                    type: 'two_step_repeats',
                    durationMinutes: 8,
                    unit,
                    index: 3,
                }),
                createStep({
                    type: 'ramp_down',
                    durationMinutes: 8,
                    unit,
                    index: 4,
                }),
                createStep({
                    type: 'cooldown',
                    durationMinutes: 10,
                    unit,
                    index: 5,
                }),
            ],
        };
    }

    return {
        unit: 'rpe',
        mode: 'target',
        steps: [
            createStep({
                type: 'active',
                durationMinutes: 45,
                unit: 'rpe',
                index: 0,
            }),
        ],
    };
}

export function resetStepForType(
    type: WorkoutStructureBlockType,
    unit: WorkoutStructureUnit,
    index: number,
    currentStep?: WorkoutStructureStep,
): WorkoutStructureStep {
    return createStep({
        type,
        durationMinutes:
            currentStep?.durationMinutes ??
            blockDefinitions.find((item) => item.type === type)?.defaultDuration ??
            8,
        unit,
        index,
    });
}

export function createStep({
    type,
    durationMinutes,
    unit,
    index,
}: {
    type: WorkoutStructureBlockType;
    durationMinutes: number;
    unit: WorkoutStructureUnit;
    index: number;
}): WorkoutStructureStep {
    const defaults = defaultIntensityForType(type, unit);
    const items = createDefaultItemsForType(type, unit);

    return {
        id: `step-${Date.now()}-${index}`,
        type,
        durationMinutes,
        target: defaults.target,
        rangeMin: defaults.rangeMin,
        rangeMax: defaults.rangeMax,
        repeatCount: type === 'repeats' ? 3 : 1,
        items,
        note: '',
    };
}

export function createDefaultItemsForType(
    type: WorkoutStructureBlockType,
    unit: WorkoutStructureUnit,
): WorkoutStructureItem[] | null {
    if (!stepUsesItems(type)) {
        return null;
    }

    if (type === 'two_step_repeats') {
        return [
            defaultItemDefinition(type, 0, 'Work', unit),
            defaultItemDefinition(type, 1, 'Recover', unit),
        ];
    }

    if (type === 'three_step_repeats') {
        return [
            defaultItemDefinition(type, 0, 'Build', unit),
            defaultItemDefinition(type, 1, 'Recover', unit),
            defaultItemDefinition(type, 2, 'Peak', unit),
        ];
    }

    if (type === 'repeats') {
        return [
            defaultItemDefinition(type, 0, 'Hard', unit),
            defaultItemDefinition(type, 1, 'Easy', unit),
        ];
    }

    if (type === 'ramp_up') {
        return [
            defaultItemDefinition(type, 0, 'Step 1', unit),
            defaultItemDefinition(type, 1, 'Step 2', unit),
            defaultItemDefinition(type, 2, 'Step 3', unit),
            defaultItemDefinition(type, 3, 'Step 4', unit),
        ];
    }

    return [
        defaultItemDefinition(type, 0, 'Step 1', unit),
        defaultItemDefinition(type, 1, 'Step 2', unit),
        defaultItemDefinition(type, 2, 'Step 3', unit),
        defaultItemDefinition(type, 3, 'Step 4', unit),
    ];
}

export function defaultItemDefinition(
    type: WorkoutStructureBlockType,
    index: number,
    label: string,
    unit: WorkoutStructureUnit,
): WorkoutStructureItem {
    const defaults = defaultIntensityForType(type, unit, index);

    return {
        id: `item-${Date.now()}-${type}-${index}`,
        label,
        durationMinutes: Math.max(1, defaults.durationMinutes),
        target: defaults.target,
        rangeMin: defaults.rangeMin,
        rangeMax: defaults.rangeMax,
    };
}

export function defaultIntensityForType(
    type: WorkoutStructureBlockType,
    unit: WorkoutStructureUnit,
    itemIndex = 0,
): IntensityDefaults {
    const isRpe = unit === 'rpe';

    const base = isRpe
        ? {
              warmup: [12, 3, 2, 4],
              active: [8, 7, 6, 8],
              recovery: [4, 3, 2, 4],
              cooldown: [10, 3, 2, 3],
              two_step_repeats: [4, 7, 6, 8],
              three_step_repeats: [3, 8, 7, 9],
              repeats: [3, 7, 6, 8],
              ramp_up: [2, 6, 5, 7],
              ramp_down: [2, 6, 5, 7],
          }
        : {
              warmup: [12, 60, 50, 70],
              active: [8, 92, 85, 100],
              recovery: [4, 60, 55, 65],
              cooldown: [10, 55, 45, 60],
              two_step_repeats: [4, 96, 90, 105],
              three_step_repeats: [3, 100, 92, 110],
              repeats: [3, 98, 90, 108],
              ramp_up: [2, 90, 80, 95],
              ramp_down: [2, 85, 75, 90],
          };

    const [durationMinutes, target, rangeMin, rangeMax] =
        base[type] as number[];

    if (type === 'two_step_repeats' && itemIndex === 1) {
        return {
            durationMinutes,
            target: isRpe ? 3 : 60,
            rangeMin: isRpe ? 2 : 55,
            rangeMax: isRpe ? 4 : 65,
        };
    }

    if (type === 'three_step_repeats') {
        if (itemIndex === 1) {
            return {
                durationMinutes,
                target: isRpe ? 3 : 60,
                rangeMin: isRpe ? 2 : 55,
                rangeMax: isRpe ? 4 : 65,
            };
        }

        if (itemIndex === 2) {
            return {
                durationMinutes,
                target: isRpe ? 8.5 : 105,
                rangeMin: isRpe ? 7.5 : 98,
                rangeMax: isRpe ? 9.5 : 115,
            };
        }
    }

    if (type === 'repeats' && itemIndex % 2 === 1) {
        return {
            durationMinutes,
            target: isRpe ? 3 : 60,
            rangeMin: isRpe ? 2 : 55,
            rangeMax: isRpe ? 4 : 65,
        };
    }

    if (type === 'ramp_up') {
        const min = isRpe ? 5 + itemIndex : 75 + itemIndex * 8;
        const max = isRpe ? 6 + itemIndex : 82 + itemIndex * 8;

        return {
            durationMinutes,
            target: (min + max) / 2,
            rangeMin: min,
            rangeMax: max,
        };
    }

    if (type === 'ramp_down') {
        const min = isRpe ? 8 - itemIndex : 98 - itemIndex * 8;
        const max = isRpe ? 9 - itemIndex : 106 - itemIndex * 8;

        return {
            durationMinutes,
            target: (min + max) / 2,
            rangeMin: min,
            rangeMax: max,
        };
    }

    return {
        durationMinutes,
        target,
        rangeMin,
        rangeMax,
    };
}
