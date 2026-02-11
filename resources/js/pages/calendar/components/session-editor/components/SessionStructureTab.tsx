import InputError from '@/components/input-error';
import { WorkoutStructureBuilder } from '../../workout-structure-builder';
import type {
    AthleteTrainingTargets,
    ValidationErrors,
    WorkoutStructure,
} from '../types';

type SessionStructureTabProps = {
    plannedStructure: WorkoutStructure | null;
    sport: string;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    canManageSessionWrites: boolean;
    errors: ValidationErrors;
    clearFieldError: (field: keyof ValidationErrors) => void;
    setPlannedStructure: (nextStructure: WorkoutStructure | null) => void;
};

export function SessionStructureTab({
    plannedStructure,
    sport,
    athleteTrainingTargets,
    canManageSessionWrites,
    errors,
    clearFieldError,
    setPlannedStructure,
}: SessionStructureTabProps) {
    return (
        <div className="space-y-1.5">
            <WorkoutStructureBuilder
                value={plannedStructure}
                sport={sport}
                trainingTargets={athleteTrainingTargets}
                disabled={!canManageSessionWrites}
                onChange={(nextStructure) => {
                    setPlannedStructure(nextStructure);
                    clearFieldError('planned_structure');
                }}
            />
            <InputError message={errors.planned_structure} />
        </div>
    );
}
