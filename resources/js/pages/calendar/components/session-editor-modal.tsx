import {
    Activity,
    Bike,
    CheckCircle2,
    Droplets,
    Dumbbell,
    Footprints,
    Link2,
    RotateCcw,
    Trash2,
    Unlink,
} from 'lucide-react';
import {
    FormEvent,
    KeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    complete as completeTrainingSession,
    destroy as destroyTrainingSession,
    linkActivity as linkActivityToSession,
    revertCompletion as revertTrainingSessionCompletion,
    show as showTrainingSession,
    store as storeTrainingSession,
    unlinkActivity as unlinkActivityFromSession,
    update as updateTrainingSession,
} from '@/routes/training-sessions';
import type {
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';
import {
    isSessionAdjusted,
    isSessionCompleted,
} from './session-reconciliation';
import {
    calculateWorkoutStructureDurationMinutes,
    estimateWorkoutStructureTss,
    WorkoutStructureBuilder,
    type AthleteTrainingTargets,
    type WorkoutStructure,
    type WorkoutStructureMode,
    type WorkoutStructureStep,
    type WorkoutStructureUnit,
} from './workout-structure-builder';

type SessionEditorMode = 'create' | 'edit';
type Sport = 'swim' | 'bike' | 'run' | 'gym' | 'other';

type ValidationField =
    | 'training_week_id'
    | 'date'
    | 'sport'
    | 'planned_duration_minutes'
    | 'planned_tss'
    | 'notes'
    | 'planned_structure'
    | 'activity_id'
    | 'session';

type ValidationErrors = Partial<Record<ValidationField, string>>;

type SessionWritePayload = {
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

export type { AthleteTrainingTargets };

type SessionEditorModalProps = {
    open: boolean;
    context: SessionEditorContext | null;
    canManageSessionWrites: boolean;
    canManageSessionLinks: boolean;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

const sportOptions: Array<{
    value: Sport;
    label: string;
    icon: typeof Activity;
}> = [
    { value: 'swim', label: 'Swim', icon: Droplets },
    { value: 'bike', label: 'Bike', icon: Bike },
    { value: 'run', label: 'Run', icon: Footprints },
    { value: 'gym', label: 'Gym', icon: Dumbbell },
    { value: 'other', label: 'Other', icon: Activity },
];

const validationFields: ValidationField[] = [
    'training_week_id',
    'date',
    'sport',
    'planned_duration_minutes',
    'planned_tss',
    'notes',
    'planned_structure',
    'activity_id',
    'session',
];

export function SessionEditorModal({
    open,
    context,
    canManageSessionWrites,
    canManageSessionLinks,
    athleteTrainingTargets,
    onOpenChange,
    onSaved,
}: SessionEditorModalProps) {
    const plannedDurationInputRef = useRef<HTMLInputElement | null>(null);
    const [sport, setSport] = useState<Sport>('run');
    const [plannedDurationMinutes, setPlannedDurationMinutes] = useState('60');
    const [plannedTss, setPlannedTss] = useState('');
    const [notes, setNotes] = useState('');
    const [plannedStructure, setPlannedStructure] = useState<WorkoutStructure | null>(
        null,
    );
    const [sessionDetails, setSessionDetails] = useState<TrainingSessionView | null>(
        null,
    );
    const [isLoadingSessionDetails, setIsLoadingSessionDetails] =
        useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLinkingActivity, setIsLinkingActivity] = useState(false);
    const [isUnlinkingActivity, setIsUnlinkingActivity] = useState(false);
    const [isCompletingSession, setIsCompletingSession] = useState(false);
    const [isRevertingCompletion, setIsRevertingCompletion] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [activeEditorTab, setActiveEditorTab] = useState<'details' | 'structure'>(
        'details',
    );

    const isEditMode = context?.mode === 'edit';
    const isBusy =
        isSubmitting ||
        isDeleting ||
        isLinkingActivity ||
        isUnlinkingActivity ||
        isCompletingSession ||
        isRevertingCompletion;
    const canPersistSessionWrites =
        canManageSessionWrites && context !== null && !isBusy;
    const canPerformLinking =
        canManageSessionLinks && isEditMode && context !== null && !isBusy;
    const canPerformCompletion =
        canManageSessionLinks && isEditMode && context !== null && !isBusy;
    const selectedSession =
        isEditMode && context !== null
            ? (sessionDetails ?? context.session)
            : null;
    const sessionIsCompleted =
        selectedSession !== null && isSessionCompleted(selectedSession);
    const sessionIsAdjusted =
        selectedSession !== null && isSessionAdjusted(selectedSession);
    const linkedActivitySummary = selectedSession?.linkedActivitySummary ?? null;
    const suggestedActivities =
        selectedSession?.suggestedActivities.filter(
            (activity) => activity.id !== selectedSession.linkedActivityId,
        ) ?? [];
    const plannedDurationLabel =
        selectedSession !== null
            ? formatDurationMinutes(selectedSession.durationMinutes)
            : '—';
    const actualDurationLabel = sessionIsCompleted
        ? formatDurationMinutes(selectedSession?.actualDurationMinutes ?? null)
        : formatDurationSecondsValue(linkedActivitySummary?.durationSeconds ?? null);
    const plannedTssLabel = formatTssValue(selectedSession?.plannedTss ?? null);
    const actualTssLabel = sessionIsCompleted
        ? formatTssValue(selectedSession?.actualTss ?? null)
        : '—';

    const dialogTitle = isEditMode ? 'Edit Session' : 'Create Session';
    const dialogDescription = isEditMode
        ? 'Update planned session details, manage links, or remove this session.'
        : 'Add a planned training session to this day.';
    const isStructureTab = activeEditorTab === 'structure';
    const dateLabel = useMemo(() => {
        if (!context) {
            return '';
        }

        return new Date(`${context.date}T00:00:00`).toLocaleDateString(
            'en-US',
            {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            },
        );
    }, [context]);
    const hasStructuredPlanning =
        plannedStructure !== null && plannedStructure.steps.length > 0;
    const derivedStructureDurationMinutes = useMemo(() => {
        return calculateWorkoutStructureDurationMinutes(plannedStructure);
    }, [plannedStructure]);
    const derivedStructureTss = useMemo(() => {
        return estimateWorkoutStructureTss(plannedStructure);
    }, [plannedStructure]);

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

    const refreshSessionDetails = useCallback(
        async (sessionId: number): Promise<void> => {
            setIsLoadingSessionDetails(true);

            try {
                const route = showTrainingSession(sessionId);
                const response = await fetch(route.url, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as {
                    data?: TrainingSessionApi;
                };

                if (payload.data !== undefined) {
                    setSessionDetails(mapSessionFromApi(payload.data));
                }
            } finally {
                setIsLoadingSessionDetails(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (!open || !context) {
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

            void refreshSessionDetails(context.session.id);
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
    }, [open, context, refreshSessionDetails]);

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

    const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>): void => {
        if (!canManageSessionWrites || event.key !== 'Enter') {
            return;
        }

        if (event.target instanceof HTMLTextAreaElement) {
            return;
        }

        if (event.target instanceof HTMLButtonElement) {
            return;
        }

        event.preventDefault();

        if (!isBusy) {
            event.currentTarget.requestSubmit();
        }
    };

    const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (!context || !canManageSessionWrites || isBusy) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);
        setConfirmingDelete(false);

        const payload = buildPayload({
            trainingWeekId: context.trainingWeekId,
            date: context.date,
            sport,
            plannedDurationMinutes,
            plannedTss,
            notes,
            plannedStructure,
            derivedStructureDurationMinutes,
            derivedStructureTss,
        });

        try {
            const route =
                context.mode === 'create'
                    ? storeTrainingSession()
                    : updateTrainingSession(context.session.id);

            const response = await fetch(route.url, {
                method: context.mode === 'create' ? 'POST' : 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onOpenChange(false);
                onSaved();

                return;
            }

            const responsePayload = await response.json().catch(() => null);
            const validationErrors = extractValidationErrors(responsePayload);

            if (validationErrors !== null) {
                setErrors(validationErrors);

                if (
                    validationErrors.training_week_id !== undefined ||
                    validationErrors.date !== undefined
                ) {
                    setGeneralError(
                        'Session context is invalid for this week. Refresh and try again.',
                    );
                }
            }

            if (validationErrors === null) {
                setGeneralError(
                    extractMessage(responsePayload) ??
                        'Unable to save this session.',
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteSession = async (): Promise<void> => {
        if (
            !context ||
            context.mode !== 'edit' ||
            !canManageSessionWrites ||
            isBusy
        ) {
            return;
        }

        if (!confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }

        setIsDeleting(true);
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);

        try {
            const route = destroyTrainingSession(context.session.id);
            const response = await fetch(route.url, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                onOpenChange(false);
                onSaved();

                return;
            }

            const responsePayload = await response.json().catch(() => null);
            setGeneralError(
                extractMessage(responsePayload) ?? 'Unable to delete session.',
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const linkActivity = async (activityId: number): Promise<void> => {
        if (!context || context.mode !== 'edit' || !canPerformLinking) {
            return;
        }

        setIsLinkingActivity(true);
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);

        try {
            const route = linkActivityToSession(context.session.id);
            const response = await fetch(route.url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    activity_id: activityId,
                }),
            });

            if (response.ok) {
                await refreshSessionDetails(context.session.id);
                onSaved();
                setStatusMessage('Activity linked.');
                return;
            }

            const responsePayload = await response.json().catch(() => null);
            const validationErrors = extractValidationErrors(responsePayload);

            if (validationErrors !== null) {
                setErrors(validationErrors);
            }

            setGeneralError(
                extractMessage(responsePayload) ?? 'Unable to link activity.',
            );
        } finally {
            setIsLinkingActivity(false);
        }
    };

    const unlinkActivity = async (): Promise<void> => {
        if (!context || context.mode !== 'edit' || !canPerformLinking) {
            return;
        }

        setIsUnlinkingActivity(true);
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);

        try {
            const route = unlinkActivityFromSession(context.session.id);
            const response = await fetch(route.url, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                await refreshSessionDetails(context.session.id);
                onSaved();
                setStatusMessage('Activity unlinked.');
                return;
            }

            const responsePayload = await response.json().catch(() => null);
            const validationErrors = extractValidationErrors(responsePayload);

            if (validationErrors !== null) {
                setErrors(validationErrors);
            }

            setGeneralError(
                extractMessage(responsePayload) ?? 'Unable to unlink activity.',
            );
        } finally {
            setIsUnlinkingActivity(false);
        }
    };

    const completeSession = async (): Promise<void> => {
        if (!context || context.mode !== 'edit' || !canPerformCompletion) {
            return;
        }

        setIsCompletingSession(true);
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);

        try {
            const route = completeTrainingSession(context.session.id);
            const response = await fetch(route.url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                await refreshSessionDetails(context.session.id);
                onSaved();
                setStatusMessage('Session marked as completed.');
                return;
            }

            const responsePayload = await response.json().catch(() => null);
            const validationErrors = extractValidationErrors(responsePayload);

            if (validationErrors !== null) {
                setErrors(validationErrors);
            }

            setGeneralError(
                extractMessage(responsePayload) ??
                    'Unable to complete this session.',
            );
        } finally {
            setIsCompletingSession(false);
        }
    };

    const revertSessionCompletion = async (): Promise<void> => {
        if (!context || context.mode !== 'edit' || !canPerformCompletion) {
            return;
        }

        setIsRevertingCompletion(true);
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);

        try {
            const route = revertTrainingSessionCompletion(context.session.id);
            const response = await fetch(route.url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                await refreshSessionDetails(context.session.id);
                onSaved();
                setStatusMessage('Session reverted to planned.');
                return;
            }

            const responsePayload = await response.json().catch(() => null);
            const validationErrors = extractValidationErrors(responsePayload);

            if (validationErrors !== null) {
                setErrors(validationErrors);
            }

            setGeneralError(
                extractMessage(responsePayload) ??
                    'Unable to revert session completion.',
            );
        } finally {
            setIsRevertingCompletion(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isBusy && !nextOpen) {
                    return;
                }

                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                className={cn(
                    'max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden border-border bg-surface p-0 text-zinc-200',
                    isStructureTab
                        ? 'max-w-[min(98vw,1360px)]'
                        : 'max-w-[min(96vw,860px)]',
                )}
                onEscapeKeyDown={(event) => {
                    if (isBusy) {
                        event.preventDefault();
                        return;
                    }

                    onOpenChange(false);
                }}
            >
                <DialogHeader className="border-b border-border px-6 py-4">
                    <DialogTitle className="font-sans text-base font-medium text-white">
                        {dialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        {dialogDescription}
                    </DialogDescription>
                </DialogHeader>

                {context ? (
                    <form
                        onSubmit={submit}
                        onKeyDown={handleFormKeyDown}
                        aria-busy={isBusy}
                        className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col"
                    >
                        <div className="border-b border-border px-6 py-2.5">
                            <div className="inline-flex items-center gap-1 rounded-md bg-background/60 p-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveEditorTab('details')}
                                    className={cn(
                                        'rounded px-3 py-1.5 text-xs font-medium',
                                        activeEditorTab === 'details'
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-300',
                                    )}
                                >
                                    Session Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveEditorTab('structure')}
                                    className={cn(
                                        'rounded px-3 py-1.5 text-xs font-medium',
                                        activeEditorTab === 'structure'
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-300',
                                    )}
                                >
                                    Workout Structure
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-4">
                            {generalError !== null ? (
                                <p
                                    role="alert"
                                    className="mb-4 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                                >
                                    {generalError}
                                </p>
                            ) : null}

                            {statusMessage !== null ? (
                                <p className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                    {statusMessage}
                                </p>
                            ) : null}

                            {activeEditorTab === 'structure' ? (
                                <div className="space-y-1.5">
                                    <WorkoutStructureBuilder
                                        value={plannedStructure}
                                        sport={sport}
                                        trainingTargets={
                                            athleteTrainingTargets
                                        }
                                        disabled={!canManageSessionWrites}
                                        onChange={(nextStructure) => {
                                            setPlannedStructure(nextStructure);
                                            clearFieldError('planned_structure');
                                        }}
                                    />
                                    <InputError message={errors.planned_structure} />
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-md border border-border bg-background/60 px-3 py-2">
                                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                                Date
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-200">
                                                {dateLabel}
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-border bg-background/60 px-3 py-2">
                                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                                Week
                                            </p>
                                            <p className="mt-1 font-mono text-xs text-zinc-200">
                                                {context.trainingWeekId !== null
                                                    ? `#${context.trainingWeekId}`
                                                    : 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-400">
                                            Sport
                                        </Label>
                                        <div className="grid grid-cols-5 gap-2 rounded-lg bg-background/70 p-1">
                                            {sportOptions.map((option) => {
                                                const Icon = option.icon;

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        disabled={!canManageSessionWrites}
                                                        onClick={() => {
                                                            if (!canManageSessionWrites) {
                                                                return;
                                                            }

                                                            setSport(option.value);
                                                            clearFieldError('sport');
                                                        }}
                                                        className={cn(
                                                            'flex items-center justify-center gap-1.5 rounded-md px-1 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
                                                            sport === option.value
                                                                ? 'border border-zinc-700 bg-zinc-800 text-white'
                                                                : 'text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200',
                                                            !canManageSessionWrites &&
                                                                'cursor-default opacity-65 hover:bg-transparent hover:text-zinc-500',
                                                        )}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" />
                                                        <span>{option.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.sport} />
                                    </div>

                                    {hasStructuredPlanning ? (
                                        <div className="space-y-2 rounded-md border border-sky-400/25 bg-sky-500/10 px-3 py-2.5">
                                            <p className="text-[11px] font-medium tracking-wide text-sky-200 uppercase">
                                                Structure-driven targets
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-2">
                                                    <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                                        Planned Duration
                                                    </p>
                                                    <p className="mt-1 font-mono text-xs text-zinc-100">
                                                        {formatDurationMinutes(
                                                            derivedStructureDurationMinutes,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-2">
                                                    <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                                        Estimated TSS
                                                    </p>
                                                    <p className="mt-1 font-mono text-xs text-zinc-100">
                                                        {formatTssValue(
                                                            derivedStructureTss,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-zinc-300">
                                                Planned duration and planned TSS are derived
                                                from the current workout structure.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="planned-duration-minutes"
                                                    className="text-xs text-zinc-400"
                                                >
                                                    Planned Duration (min)
                                                </Label>
                                                <Input
                                                    id="planned-duration-minutes"
                                                    ref={plannedDurationInputRef}
                                                    type="number"
                                                    min={1}
                                                    disabled={!canManageSessionWrites}
                                                    value={plannedDurationMinutes}
                                                    onChange={(event) => {
                                                        setPlannedDurationMinutes(
                                                            event.target.value,
                                                        );
                                                        clearFieldError(
                                                            'planned_duration_minutes',
                                                        );
                                                    }}
                                                    className="border-border bg-background font-mono text-sm text-zinc-200"
                                                />
                                                <InputError
                                                    message={errors.planned_duration_minutes}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="planned-tss"
                                                    className="text-xs text-zinc-400"
                                                >
                                                    Planned TSS
                                                </Label>
                                                <Input
                                                    id="planned-tss"
                                                    type="number"
                                                    min={0}
                                                    disabled={!canManageSessionWrites}
                                                    value={plannedTss}
                                                    onChange={(event) => {
                                                        setPlannedTss(
                                                            event.target.value,
                                                        );
                                                        clearFieldError(
                                                            'planned_tss',
                                                        );
                                                    }}
                                                    className="border-border bg-background font-mono text-sm text-zinc-200"
                                                />
                                                <InputError
                                                    message={errors.planned_tss}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="session-notes"
                                            className="text-xs text-zinc-400"
                                        >
                                            Notes
                                        </Label>
                                        <textarea
                                            id="session-notes"
                                            rows={4}
                                            disabled={!canManageSessionWrites}
                                            value={notes}
                                            onChange={(event) => {
                                                setNotes(event.target.value);
                                                clearFieldError('notes');
                                            }}
                                            className={cn(
                                                'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-200',
                                                'placeholder:text-zinc-600 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                                !canManageSessionWrites &&
                                                    'cursor-default opacity-65',
                                            )}
                                        />
                                        <InputError message={errors.notes} />
                                    </div>

                                    {isEditMode ? (
                                        <div className="space-y-2 rounded-md border border-border bg-background/50 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] font-medium tracking-wide text-zinc-300 uppercase">
                                                    Suggested Activities
                                                </p>
                                                {isLoadingSessionDetails ? (
                                                    <span className="text-[11px] text-zinc-500">
                                                        Loading...
                                                    </span>
                                                ) : null}
                                            </div>

                                            {linkedActivitySummary !== null ? (
                                                <div className="space-y-2 rounded-md border border-sky-400/25 bg-sky-500/10 p-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="flex items-center gap-1.5 text-xs text-sky-200">
                                                                <Link2 className="h-3.5 w-3.5" />
                                                                Linked activity
                                                            </p>
                                                            <p className="mt-1 text-xs text-zinc-300">
                                                                {formatStartedAt(
                                                                    linkedActivitySummary.startedAt,
                                                                )}
                                                                {' • '}
                                                                {formatDurationSeconds(
                                                                    linkedActivitySummary.durationSeconds,
                                                                )}
                                                            </p>
                                                        </div>

                                                        {canManageSessionLinks ? (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={!canPerformLinking}
                                                                onClick={() => {
                                                                    void unlinkActivity();
                                                                }}
                                                                className="border-red-500/35 text-red-300 hover:text-red-200"
                                                            >
                                                                <Unlink className="h-3.5 w-3.5" />
                                                                {isUnlinkingActivity
                                                                    ? 'Unlinking...'
                                                                    : 'Unlink'}
                                                            </Button>
                                                        ) : null}
                                                    </div>

                                                    {selectedSession !== null ? (
                                                        <>
                                                            <div className="space-y-2 rounded-md border border-border/70 bg-background/30 p-2.5">
                                                                <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                                                                    Planned vs Actual
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="rounded-md border border-border/80 bg-background/50 px-2.5 py-2">
                                                                        <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                                                            Duration
                                                                        </p>
                                                                        <p className="mt-1 text-[11px] text-zinc-300">
                                                                            Planned:{' '}
                                                                            <span className="font-mono text-zinc-100">
                                                                                {plannedDurationLabel}
                                                                            </span>
                                                                        </p>
                                                                        <p className="mt-0.5 text-[11px] text-zinc-300">
                                                                            Actual:{' '}
                                                                            <span className="font-mono text-zinc-100">
                                                                                {actualDurationLabel}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="rounded-md border border-border/80 bg-background/50 px-2.5 py-2">
                                                                        <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                                                            TSS
                                                                        </p>
                                                                        <p className="mt-1 text-[11px] text-zinc-300">
                                                                            Planned:{' '}
                                                                            <span className="font-mono text-zinc-100">
                                                                                {plannedTssLabel}
                                                                            </span>
                                                                        </p>
                                                                        <p className="mt-0.5 text-[11px] text-zinc-300">
                                                                            Actual:{' '}
                                                                            <span className="font-mono text-zinc-100">
                                                                                {actualTssLabel}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[11px] text-zinc-500">
                                                                    {sessionIsCompleted
                                                                        ? sessionIsAdjusted
                                                                            ? 'Actual values differ from planned values.'
                                                                            : 'Actual values align with planned targets.'
                                                                        : 'Marking complete copies linked duration and available linked TSS. Missing values remain —.'}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-2 rounded-md border border-border/70 bg-background/30 px-2.5 py-2">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        {sessionIsCompleted ? (
                                                                            <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                Completed
                                                                                {sessionIsAdjusted ? (
                                                                                    <span className="rounded-full border border-zinc-600/70 bg-zinc-800/70 px-1.5 py-0.5 text-[10px] text-zinc-300">
                                                                                        Adjusted
                                                                                    </span>
                                                                                ) : null}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-xs text-zinc-300">
                                                                                Ready to mark as completed.
                                                                            </p>
                                                                        )}
                                                                        <p className="mt-0.5 text-[11px] text-zinc-500">
                                                                            {sessionIsCompleted
                                                                                ? selectedSession.completedAt !== null
                                                                                    ? `Completed ${formatCompletedAt(selectedSession.completedAt)}`
                                                                                    : 'Completed'
                                                                                : 'Uses linked activity values only.'}
                                                                        </p>
                                                                    </div>

                                                                    {canManageSessionLinks ? (
                                                                        sessionIsCompleted ? (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="outline"
                                                                                disabled={
                                                                                    !canPerformCompletion
                                                                                }
                                                                                onClick={() => {
                                                                                    void revertSessionCompletion();
                                                                                }}
                                                                            >
                                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                                {isRevertingCompletion
                                                                                    ? 'Reverting...'
                                                                                    : 'Revert to Planned'}
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                disabled={
                                                                                    !canPerformCompletion
                                                                                }
                                                                                onClick={() => {
                                                                                    void completeSession();
                                                                                }}
                                                                            >
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                {isCompletingSession
                                                                                    ? 'Completing...'
                                                                                    : 'Mark as Completed'}
                                                                            </Button>
                                                                        )
                                                                    ) : null}
                                                                </div>

                                                                {sessionIsCompleted ? (
                                                                    <p className="text-[11px] text-zinc-500">
                                                                        Reverting completion clears
                                                                        actual duration and actual
                                                                        TSS, while keeping this
                                                                        activity linked.
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-500">
                                                    No linked activity yet.
                                                </p>
                                            )}

                                            {suggestedActivities.length > 0 ? (
                                                <div className="space-y-2">
                                                    {suggestedActivities.map((activity) => (
                                                        <div
                                                            key={activity.id}
                                                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface/70 px-2.5 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-zinc-300">
                                                                    {formatStartedAt(
                                                                        activity.startedAt,
                                                                    )}
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] text-zinc-500">
                                                                    {activity.sport ?? 'other'}
                                                                    {' • '}
                                                                    {formatDurationSeconds(
                                                                        activity.durationSeconds,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {canManageSessionLinks ? (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        !canPerformLinking
                                                                    }
                                                                    onClick={() => {
                                                                        void linkActivity(
                                                                            activity.id,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Link2 className="h-3.5 w-3.5" />
                                                                    {isLinkingActivity
                                                                        ? 'Linking...'
                                                                        : 'Link'}
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : !isLoadingSessionDetails ? (
                                                <p className="text-xs text-zinc-500">
                                                    No suggested activities found.
                                                </p>
                                            ) : null}

                                            <InputError message={errors.activity_id} />
                                            <InputError message={errors.session} />
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border px-6 py-4">
                            <DialogFooter className="gap-2 sm:justify-between">
                                {isEditMode && canManageSessionWrites ? (
                                    <div className="mr-auto flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                confirmingDelete
                                                    ? 'destructive'
                                                    : 'ghost'
                                            }
                                            size="sm"
                                            className={
                                                confirmingDelete
                                                    ? ''
                                                    : 'text-red-400 hover:text-red-300'
                                            }
                                            disabled={isBusy}
                                            onClick={deleteSession}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {isDeleting
                                                ? 'Deleting...'
                                                : confirmingDelete
                                                  ? 'Confirm Delete'
                                                  : 'Delete'}
                                        </Button>

                                        {confirmingDelete ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    setConfirmingDelete(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        ) : null}
                                    </div>
                                ) : (
                                    <span />
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isBusy}
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Close
                                    </Button>

                                    {canManageSessionWrites ? (
                                        <Button
                                            type="submit"
                                            disabled={!canPersistSessionWrites}
                                        >
                                            {isSubmitting
                                                ? 'Saving...'
                                                : isEditMode
                                                  ? 'Save Changes'
                                                  : 'Create Session'}
                                        </Button>
                                    ) : null}
                                </div>
                            </DialogFooter>

                            {!canManageSessionWrites ? (
                                <p className="mt-2 text-right text-[11px] text-zinc-500">
                                    Session fields are read-only in this context.
                                </p>
                            ) : (
                                <p className="mt-2 text-right text-[11px] text-zinc-500">
                                    Press Enter to save, Esc to close.
                                </p>
                            )}

                            {isBusy ? (
                                <p
                                    aria-live="polite"
                                    className="mt-2 text-right text-[11px] text-zinc-500"
                                >
                                    {isDeleting
                                        ? 'Deleting session...'
                                        : isLinkingActivity
                                          ? 'Linking activity...'
                                          : isUnlinkingActivity
                                            ? 'Unlinking activity...'
                                            : isCompletingSession
                                              ? 'Completing session...'
                                              : isRevertingCompletion
                                                ? 'Reverting completion...'
                                            : 'Saving session...'}
                                </p>
                            ) : null}
                        </div>
                    </form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function toSport(value: string): Sport {
    if (sportOptions.some((option) => option.value === value)) {
        return value as Sport;
    }

    return 'other';
}

const workoutStructureUnits: WorkoutStructureUnit[] = [
    'ftp_percent',
    'max_hr_percent',
    'threshold_hr_percent',
    'threshold_speed_percent',
    'rpe',
];

const workoutStructureBlockTypes: WorkoutStructureStep['type'][] = [
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

function normalizeEditorWorkoutStructure(
    structure: TrainingSessionView['plannedStructure'],
): WorkoutStructure | null {
    if (structure === null) {
        return null;
    }

    const unit = workoutStructureUnits.includes(
        structure.unit as WorkoutStructureUnit,
    )
        ? (structure.unit as WorkoutStructureUnit)
        : 'rpe';
    const mode: WorkoutStructureMode = structure.mode === 'target'
        ? 'target'
        : 'range';

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
                    durationMinutes: Math.max(
                        1,
                        Math.round(item.durationMinutes),
                    ),
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

function buildPayload(data: {
    trainingWeekId: number | null;
    date: string;
    sport: Sport;
    plannedDurationMinutes: string;
    plannedTss: string;
    notes: string;
    plannedStructure: WorkoutStructure | null;
    derivedStructureDurationMinutes: number;
    derivedStructureTss: number | null;
}): SessionWritePayload {
    const parsedDurationMinutes = Number.parseInt(
        data.plannedDurationMinutes,
        10,
    );
    const parsedPlannedTss = Number.parseInt(data.plannedTss, 10);
    const normalizedNotes = data.notes.trim();

    return {
        training_week_id: data.trainingWeekId,
        date: data.date,
        sport: data.sport,
        planned_duration_minutes:
            data.plannedStructure !== null
                ? Math.max(1, Math.round(data.derivedStructureDurationMinutes))
                : Number.isFinite(parsedDurationMinutes)
                  ? parsedDurationMinutes
                  : 0,
        planned_tss:
            data.plannedStructure !== null
                ? data.derivedStructureTss
                : data.plannedTss.trim() === ''
                  ? null
                  : Number.isFinite(parsedPlannedTss)
                    ? parsedPlannedTss
                    : null,
        notes: normalizedNotes === '' ? null : normalizedNotes,
        planned_structure: normalizePlannedStructureForRequest(
            data.plannedStructure,
        ),
    };
}

function normalizePlannedStructureForRequest(
    plannedStructure: WorkoutStructure | null,
): SessionWritePayload['planned_structure'] {
    if (
        plannedStructure === null ||
        !Array.isArray(plannedStructure.steps) ||
        plannedStructure.steps.length === 0
    ) {
        return null;
    }

    return {
        unit: plannedStructure.unit,
        mode: plannedStructure.mode,
        steps: plannedStructure.steps.map((step) => {
            const normalizedNote = step.note.trim();

            return {
                id: step.id,
                type: step.type,
                duration_minutes: Math.max(1, Math.round(step.durationMinutes)),
                target:
                    step.target === null || Number.isNaN(step.target)
                        ? null
                        : step.target,
                range_min:
                    step.rangeMin === null || Number.isNaN(step.rangeMin)
                        ? null
                        : step.rangeMin,
                range_max:
                    step.rangeMax === null || Number.isNaN(step.rangeMax)
                        ? null
                        : step.rangeMax,
                repeat_count: Math.max(1, Math.round(step.repeatCount)),
                note: normalizedNote === '' ? null : normalizedNote,
                items:
                    step.items?.map((item) => {
                        return {
                            id: item.id,
                            label: item.label,
                            duration_minutes: Math.max(
                                1,
                                Math.round(item.durationMinutes),
                            ),
                            target:
                                item.target === null || Number.isNaN(item.target)
                                    ? null
                                    : item.target,
                            range_min:
                                item.rangeMin === null ||
                                Number.isNaN(item.rangeMin)
                                    ? null
                                    : item.rangeMin,
                            range_max:
                                item.rangeMax === null ||
                                Number.isNaN(item.rangeMax)
                                    ? null
                                    : item.rangeMax,
                        };
                    }) ?? null,
            };
        }),
    };
}

function extractValidationErrors(payload: unknown): ValidationErrors | null {
    if (
        typeof payload !== 'object' ||
        payload === null ||
        !('errors' in payload) ||
        typeof payload.errors !== 'object' ||
        payload.errors === null
    ) {
        return null;
    }

    const errors = payload.errors as Record<string, unknown>;
    const extracted: ValidationErrors = {};

    validationFields.forEach((field) => {
        const value = errors[field];

        if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === 'string'
        ) {
            extracted[field] = value[0];
        }
    });

    const plannedStructureError = Object.entries(errors).find(([key, value]) => {
        return (
            key.startsWith('planned_structure')
            && Array.isArray(value)
            && value.length > 0
            && typeof value[0] === 'string'
        );
    });

    if (plannedStructureError !== undefined) {
        extracted.planned_structure = (
            plannedStructureError[1] as Array<string>
        )[0];
    }

    return extracted;
}

function extractMessage(payload: unknown): string | null {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
    ) {
        return payload.message;
    }

    return null;
}

function mapSessionFromApi(session: TrainingSessionApi): TrainingSessionView {
    return {
        id: session.id,
        trainingWeekId: session.training_week_id ?? null,
        scheduledDate: session.scheduled_date,
        sport: session.sport,
        status: session.status,
        isCompleted: session.is_completed ?? session.status === 'completed',
        completedAt: session.completed_at ?? null,
        durationMinutes: session.duration_minutes,
        actualDurationMinutes: session.actual_duration_minutes ?? null,
        plannedTss: session.planned_tss,
        actualTss: session.actual_tss,
        notes: session.notes,
        plannedStructure:
            session.planned_structure !== undefined &&
            session.planned_structure !== null
                ? {
                      unit: session.planned_structure.unit as WorkoutStructureUnit,
                      mode: session.planned_structure.mode as WorkoutStructureMode,
                      steps: session.planned_structure.steps.map((step) => ({
                          id: step.id ?? `step-${session.id}-${step.type}`,
                          type: step.type as WorkoutStructureStep['type'],
                          durationMinutes: step.duration_minutes,
                          target: step.target ?? null,
                          rangeMin: step.range_min ?? null,
                      rangeMax: step.range_max ?? null,
                      repeatCount: step.repeat_count ?? 1,
                      note: step.note ?? '',
                      items:
                          step.items?.map((item, itemIndex) => ({
                              id:
                                  item.id ??
                                  `item-${session.id}-${step.type}-${itemIndex}`,
                              label: item.label ?? `Step ${itemIndex + 1}`,
                              durationMinutes: item.duration_minutes,
                              target: item.target ?? null,
                              rangeMin: item.range_min ?? null,
                              rangeMax: item.range_max ?? null,
                          })) ?? null,
                  })),
              }
            : null,
        linkedActivityId: session.linked_activity_id ?? null,
        linkedActivitySummary:
            session.linked_activity_summary !== undefined &&
            session.linked_activity_summary !== null
                ? {
                      id: session.linked_activity_summary.id,
                      provider: session.linked_activity_summary.provider,
                      startedAt:
                          session.linked_activity_summary.started_at ?? null,
                      durationSeconds:
                          session.linked_activity_summary.duration_seconds ??
                          null,
                      sport: session.linked_activity_summary.sport ?? null,
                  }
                : null,
        suggestedActivities:
            session.suggested_activities?.map((activity) => ({
                id: activity.id,
                provider: activity.provider,
                sport: activity.sport ?? null,
                startedAt: activity.started_at ?? null,
                durationSeconds: activity.duration_seconds ?? null,
            })) ?? [],
    };
}

function formatDurationSeconds(durationSeconds: number | null): string {
    if (durationSeconds === null || Number.isNaN(durationSeconds)) {
        return '—';
    }

    const roundedMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

function formatDurationSecondsValue(durationSeconds: number | null): string {
    if (durationSeconds === null || Number.isNaN(durationSeconds)) {
        return '—';
    }

    return formatDurationSeconds(durationSeconds);
}

function formatDurationMinutes(durationMinutes: number | null): string {
    if (durationMinutes === null || Number.isNaN(durationMinutes)) {
        return '—';
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

function formatTssValue(tss: number | null): string {
    if (tss === null || Number.isNaN(tss)) {
        return '—';
    }

    return `${tss}`;
}

function formatStartedAt(startedAt: string | null): string {
    if (startedAt === null) {
        return 'Unknown start time';
    }

    return new Date(startedAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatCompletedAt(completedAt: string): string {
    return new Date(completedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
