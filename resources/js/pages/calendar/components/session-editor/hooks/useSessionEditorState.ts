import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from 'react';
import { sportOptions, workoutStructureBlockTypes, workoutStructureUnits } from '../constants';
import type {
    SessionEditorContext,
    Sport,
    ValidationErrors,
    WorkoutStructure,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from '../types';

type UseSessionEditorStateParams = {
    open: boolean;
    context: SessionEditorContext | null;
};

type UseSessionEditorStateResult = {
    plannedDurationInputRef: RefObject<HTMLInputElement | null>;
    sport: Sport;
    setSport: Dispatch<SetStateAction<Sport>>;
    plannedDurationMinutes: string;
    setPlannedDurationMinutes: Dispatch<SetStateAction<string>>;
    plannedTss: string;
    setPlannedTss: Dispatch<SetStateAction<string>>;
    notes: string;
    setNotes: Dispatch<SetStateAction<string>>;
    plannedStructure: WorkoutStructure | null;
    setPlannedStructure: Dispatch<SetStateAction<WorkoutStructure | null>>;
    sessionDetails: import('@/types/training-plans').TrainingSessionView | null;
    setSessionDetails: Dispatch<
        SetStateAction<import('@/types/training-plans').TrainingSessionView | null>
    >;
    errors: ValidationErrors;
    setErrors: Dispatch<SetStateAction<ValidationErrors>>;
    generalError: string | null;
    setGeneralError: Dispatch<SetStateAction<string | null>>;
    statusMessage: string | null;
    setStatusMessage: Dispatch<SetStateAction<string | null>>;
    confirmingDelete: boolean;
    setConfirmingDelete: Dispatch<SetStateAction<boolean>>;
    activeEditorTab: 'details' | 'structure';
    setActiveEditorTab: Dispatch<SetStateAction<'details' | 'structure'>>;
    clearFieldError: (field: keyof ValidationErrors) => void;
    dateLabel: string;
};

export function useSessionEditorState({
    open,
    context,
}: UseSessionEditorStateParams): UseSessionEditorStateResult {
    const plannedDurationInputRef = useRef<HTMLInputElement | null>(null);
    const [sport, setSport] = useState<Sport>('run');
    const [plannedDurationMinutes, setPlannedDurationMinutes] = useState('60');
    const [plannedTss, setPlannedTss] = useState('');
    const [notes, setNotes] = useState('');
    const [plannedStructure, setPlannedStructure] =
        useState<WorkoutStructure | null>(null);
    const [sessionDetails, setSessionDetails] = useState<
        import('@/types/training-plans').TrainingSessionView | null
    >(null);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [activeEditorTab, setActiveEditorTab] = useState<'details' | 'structure'>(
        'details',
    );

    const dateLabel = useMemo(() => {
        if (context === null) {
            return '';
        }

        return new Date(`${context.date}T00:00:00`).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }, [context]);

    const clearFieldError = (field: keyof ValidationErrors): void => {
        setErrors((currentErrors) => {
            if (currentErrors[field] === undefined) {
                return currentErrors;
            }

            return {
                ...currentErrors,
                [field]: undefined,
            };
        });

        setGeneralError(null);
    };

    useEffect(() => {
        if (!open || context === null) {
            return;
        }

        if (context.mode === 'edit') {
            setSport(toSport(context.session.sport));
            setPlannedDurationMinutes(context.session.durationMinutes.toString());
            setPlannedTss(
                context.session.plannedTss !== null
                    ? context.session.plannedTss.toString()
                    : '',
            );
            setNotes(context.session.notes ?? '');
            setPlannedStructure(
                normalizeEditorWorkoutStructure(context.session.plannedStructure),
            );
            setSessionDetails(context.session);
        } else {
            setSport('run');
            setPlannedDurationMinutes('60');
            setPlannedTss('');
            setNotes('');
            setPlannedStructure(null);
            setSessionDetails(null);
        }

        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);
        setConfirmingDelete(false);
        setActiveEditorTab('details');
    }, [open, context]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const animationFrame = window.requestAnimationFrame(() => {
            plannedDurationInputRef.current?.focus();
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open, context]);

    return {
        plannedDurationInputRef,
        sport,
        setSport,
        plannedDurationMinutes,
        setPlannedDurationMinutes,
        plannedTss,
        setPlannedTss,
        notes,
        setNotes,
        plannedStructure,
        setPlannedStructure,
        sessionDetails,
        setSessionDetails,
        errors,
        setErrors,
        generalError,
        setGeneralError,
        statusMessage,
        setStatusMessage,
        confirmingDelete,
        setConfirmingDelete,
        activeEditorTab,
        setActiveEditorTab,
        clearFieldError,
        dateLabel,
    };
}

function toSport(value: string): Sport {
    if (sportOptions.some((option) => option.value === value)) {
        return value as Sport;
    }

    return 'other';
}

function normalizeEditorWorkoutStructure(
    structure: import('@/types/training-plans').TrainingSessionView['plannedStructure'],
): WorkoutStructure | null {
    if (structure === null) {
        return null;
    }

    const unit = workoutStructureUnits.includes(structure.unit as WorkoutStructureUnit)
        ? (structure.unit as WorkoutStructureUnit)
        : 'rpe';
    const mode: WorkoutStructureMode =
        structure.mode === 'target' ? 'target' : 'range';

    return {
        unit,
        mode,
        steps: structure.steps.map((step, index) => ({
            id: step.id ?? `step-${Date.now()}-${index}`,
            type: workoutStructureBlockTypes.includes(
                step.type as WorkoutStructureStep['type'],
            )
                ? (step.type as WorkoutStructureStep['type'])
                : 'active',
            durationMinutes: Math.max(1, Math.round(step.durationMinutes)),
            target:
                step.target === null ||
                step.target === undefined ||
                Number.isNaN(step.target)
                    ? null
                    : step.target,
            rangeMin:
                step.rangeMin === null ||
                step.rangeMin === undefined ||
                Number.isNaN(step.rangeMin)
                    ? null
                    : step.rangeMin,
            rangeMax:
                step.rangeMax === null ||
                step.rangeMax === undefined ||
                Number.isNaN(step.rangeMax)
                    ? null
                    : step.rangeMax,
            repeatCount: Math.max(1, Math.round(step.repeatCount ?? 1)),
            note: step.note ?? '',
            items:
                step.items?.map((item, itemIndex) => ({
                    id: item.id ?? `item-${Date.now()}-${index}-${itemIndex}`,
                    label: item.label ?? `Step ${itemIndex + 1}`,
                    durationMinutes: Math.max(1, Math.round(item.durationMinutes)),
                    target:
                        item.target === null ||
                        item.target === undefined ||
                        Number.isNaN(item.target)
                            ? null
                            : item.target,
                    rangeMin:
                        item.rangeMin === null ||
                        item.rangeMin === undefined ||
                        Number.isNaN(item.rangeMin)
                            ? null
                            : item.rangeMin,
                    rangeMax:
                        item.rangeMax === null ||
                        item.rangeMax === undefined ||
                        Number.isNaN(item.rangeMax)
                            ? null
                            : item.rangeMax,
                })) ?? null,
        })),
    };
}
