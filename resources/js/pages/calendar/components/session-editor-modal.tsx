import {
    Activity,
    Bike,
    Droplets,
    Dumbbell,
    Footprints,
    Link2,
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
    destroy as destroyTrainingSession,
    linkActivity as linkActivityToSession,
    show as showTrainingSession,
    store as storeTrainingSession,
    unlinkActivity as unlinkActivityFromSession,
    update as updateTrainingSession,
} from '@/routes/training-sessions';
import type {
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';

type SessionEditorMode = 'create' | 'edit';
type Sport = 'swim' | 'bike' | 'run' | 'gym' | 'other';

type ValidationErrors = Partial<
    Record<
        | 'training_week_id'
        | 'date'
        | 'sport'
        | 'planned_duration_minutes'
        | 'planned_tss'
        | 'notes'
        | 'activity_id',
        string
    >
>;

type SessionWritePayload = {
    training_week_id: number;
    date: string;
    sport: Sport;
    planned_duration_minutes: number;
    planned_tss: number | null;
    notes: string | null;
};

export type SessionEditorContext =
    | {
          mode: 'create';
          trainingWeekId: number;
          date: string;
      }
    | {
          mode: 'edit';
          trainingWeekId: number;
          date: string;
          session: TrainingSessionView;
      };

type SessionEditorModalProps = {
    open: boolean;
    context: SessionEditorContext | null;
    canManageSessionWrites: boolean;
    canManageSessionLinks: boolean;
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

const validationFields: Array<keyof ValidationErrors> = [
    'training_week_id',
    'date',
    'sport',
    'planned_duration_minutes',
    'planned_tss',
    'notes',
    'activity_id',
];

export function SessionEditorModal({
    open,
    context,
    canManageSessionWrites,
    canManageSessionLinks,
    onOpenChange,
    onSaved,
}: SessionEditorModalProps) {
    const plannedDurationInputRef = useRef<HTMLInputElement | null>(null);
    const [sport, setSport] = useState<Sport>('run');
    const [plannedDurationMinutes, setPlannedDurationMinutes] = useState('60');
    const [plannedTss, setPlannedTss] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionDetails, setSessionDetails] = useState<TrainingSessionView | null>(
        null,
    );
    const [isLoadingSessionDetails, setIsLoadingSessionDetails] =
        useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLinkingActivity, setIsLinkingActivity] = useState(false);
    const [isUnlinkingActivity, setIsUnlinkingActivity] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const isEditMode = context?.mode === 'edit';
    const isBusy =
        isSubmitting ||
        isDeleting ||
        isLinkingActivity ||
        isUnlinkingActivity;
    const canPersistSessionWrites =
        canManageSessionWrites && context !== null && !isBusy;
    const canPerformLinking =
        canManageSessionLinks && isEditMode && context !== null && !isBusy;
    const selectedSession =
        isEditMode && context !== null
            ? (sessionDetails ?? context.session)
            : null;
    const linkedActivitySummary = selectedSession?.linkedActivitySummary ?? null;
    const suggestedActivities =
        selectedSession?.suggestedActivities.filter(
            (activity) => activity.id !== selectedSession.linkedActivityId,
        ) ?? [];

    const dialogTitle = isEditMode ? 'Edit Session' : 'Create Session';
    const dialogDescription = isEditMode
        ? 'Update planned session details, manage links, or remove this session.'
        : 'Add a planned training session to this day.';
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
            setSessionDetails(context.session);

            void refreshSessionDetails(context.session.id);
        } else {
            setSport('run');
            setPlannedDurationMinutes('60');
            setPlannedTss('');
            setNotes('');
            setSessionDetails(null);
        }

        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);
        setConfirmingDelete(false);
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
                className="max-w-xl border-border bg-surface p-0 text-zinc-200"
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
                        className="flex flex-col gap-5 px-6 pt-5 pb-6"
                    >
                        {generalError !== null ? (
                            <p
                                role="alert"
                                className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                            >
                                {generalError}
                            </p>
                        ) : null}

                        {statusMessage !== null ? (
                            <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                {statusMessage}
                            </p>
                        ) : null}

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
                                    #{context.trainingWeekId}
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
                                        setPlannedTss(event.target.value);
                                        clearFieldError('planned_tss');
                                    }}
                                    className="border-border bg-background font-mono text-sm text-zinc-200"
                                />
                                <InputError message={errors.planned_tss} />
                            </div>
                        </div>

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
                            </div>
                        ) : null}

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
                            <p className="text-right text-[11px] text-zinc-500">
                                Session fields are read-only in this context.
                            </p>
                        ) : null}

                        {isBusy ? (
                            <p
                                aria-live="polite"
                                className="text-right text-[11px] text-zinc-500"
                            >
                                {isDeleting
                                    ? 'Deleting session...'
                                    : isLinkingActivity
                                      ? 'Linking activity...'
                                      : isUnlinkingActivity
                                        ? 'Unlinking activity...'
                                        : 'Saving session...'}
                            </p>
                        ) : null}
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

function buildPayload(data: {
    trainingWeekId: number;
    date: string;
    sport: Sport;
    plannedDurationMinutes: string;
    plannedTss: string;
    notes: string;
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
        planned_duration_minutes: Number.isFinite(parsedDurationMinutes)
            ? parsedDurationMinutes
            : 0,
        planned_tss:
            data.plannedTss.trim() === ''
                ? null
                : Number.isFinite(parsedPlannedTss)
                  ? parsedPlannedTss
                  : null,
        notes: normalizedNotes === '' ? null : normalizedNotes,
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
        scheduledDate: session.scheduled_date,
        sport: session.sport,
        status: session.status,
        durationMinutes: session.duration_minutes,
        plannedTss: session.planned_tss,
        actualTss: session.actual_tss,
        notes: session.notes,
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
        return 'Unknown duration';
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
