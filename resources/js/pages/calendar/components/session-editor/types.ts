import type {
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';
import type {
    AthleteTrainingTargets,
    WorkoutStructure,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from '../workout-structure-builder';

export type SessionEditorMode = 'create' | 'edit';
export type Sport = 'swim' | 'bike' | 'run' | 'gym' | 'other';

export type ValidationField =
    | 'training_week_id'
    | 'date'
    | 'sport'
    | 'planned_duration_minutes'
    | 'planned_tss'
    | 'notes'
    | 'planned_structure'
    | 'activity_id'
    | 'session';

export type ValidationErrors = Partial<Record<ValidationField, string>>;

export type SessionWritePayload = {
    training_week_id: number | null;
    date: string;
    sport: Sport;
    planned_duration_minutes: number;
    planned_tss: number | null;
    notes: string | null;
    planned_structure: {
        unit: WorkoutStructureUnit;
        mode: WorkoutStructureMode;
        steps: Array<{
            id: string;
            type: WorkoutStructureStep['type'];
            duration_minutes: number;
            target: number | null;
            range_min: number | null;
            range_max: number | null;
            repeat_count: number;
            note: string | null;
            items: Array<{
                id: string;
                label: string;
                duration_minutes: number;
                target: number | null;
                range_min: number | null;
                range_max: number | null;
            }> | null;
        }>;
    } | null;
};

export type SessionEditorContext =
    | {
          mode: 'create';
          trainingWeekId: number | null;
          date: string;
      }
    | {
          mode: 'edit';
          trainingWeekId: number | null;
          date: string;
          session: TrainingSessionView;
      };

export type SessionEditorModalProps = {
    open: boolean;
    context: SessionEditorContext | null;
    canManageSessionWrites: boolean;
    canManageSessionLinks: boolean;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

export type SubmitPayloadInput = {
    trainingWeekId: number | null;
    date: string;
    sport: Sport;
    plannedDurationMinutes: string;
    plannedTss: string;
    notes: string;
    plannedStructure: WorkoutStructure | null;
    derivedStructureDurationMinutes: number;
    derivedStructureTss: number | null;
};

export type ApiSessionResponse = {
    data?: TrainingSessionApi;
};

export type {
    AthleteTrainingTargets,
    WorkoutStructure,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
};
