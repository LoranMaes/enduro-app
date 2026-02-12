import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { sportOptions } from '../constants';
import type { SessionEditorContext, Sport, ValidationErrors } from '../types';
import { SessionCompletionSection } from './SessionCompletionSection';
import { SessionLinkingSection } from './SessionLinkingSection';
import { SessionNotesSection } from './SessionNotesSection';
import { SessionTotalsSection } from './SessionTotalsSection';

type SessionDetailsTabProps = {
    context: SessionEditorContext;
    dateLabel: string;
    sport: Sport;
    setSport: (sport: Sport) => void;
    sessionTitle: string;
    setSessionTitle: (value: string) => void;
    canManageSessionWrites: boolean;
    clearFieldError: (field: keyof ValidationErrors) => void;
    errors: ValidationErrors;
    hasStructuredPlanning: boolean;
    derivedStructureDurationMinutes: number;
    derivedStructureTss: number | null;
    plannedDurationMinutes: string;
    plannedTss: string;
    plannedDurationInputRef: React.RefObject<HTMLInputElement | null>;
    setPlannedDurationMinutes: (value: string) => void;
    setPlannedTss: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
    isEditMode: boolean;
    isLoadingSessionDetails: boolean;
    linkedActivitySummary: import('@/types/training-plans').TrainingSessionView['linkedActivitySummary'];
    suggestedActivities: import('@/types/training-plans').TrainingSessionView['suggestedActivities'];
    canManageSessionLinks: boolean;
    canPerformLinking: boolean;
    isUnlinkingActivity: boolean;
    isLinkingActivity: boolean;
    onUnlinkActivity: () => void;
    onLinkActivity: (activityId: number) => void;
    selectedSession:
        | import('@/types/training-plans').TrainingSessionView
        | null;
    sessionIsCompleted: boolean;
    sessionIsAdjusted: boolean;
    plannedDurationLabel: string;
    actualDurationLabel: string;
    plannedTssLabel: string;
    actualTssLabel: string;
    canPerformCompletion: boolean;
    isRevertingCompletion: boolean;
    isCompletingSession: boolean;
    onRevertCompletion: () => void;
    onCompleteSession: () => void;
};

export function SessionDetailsTab({
    context,
    dateLabel,
    sport,
    setSport,
    sessionTitle,
    setSessionTitle,
    canManageSessionWrites,
    clearFieldError,
    errors,
    hasStructuredPlanning,
    derivedStructureDurationMinutes,
    derivedStructureTss,
    plannedDurationMinutes,
    plannedTss,
    plannedDurationInputRef,
    setPlannedDurationMinutes,
    setPlannedTss,
    notes,
    setNotes,
    isEditMode,
    isLoadingSessionDetails,
    linkedActivitySummary,
    suggestedActivities,
    canManageSessionLinks,
    canPerformLinking,
    isUnlinkingActivity,
    isLinkingActivity,
    onUnlinkActivity,
    onLinkActivity,
    selectedSession,
    sessionIsCompleted,
    sessionIsAdjusted,
    plannedDurationLabel,
    actualDurationLabel,
    plannedTssLabel,
    actualTssLabel,
    canPerformCompletion,
    isRevertingCompletion,
    isCompletingSession,
    onRevertCompletion,
    onCompleteSession,
}: SessionDetailsTabProps) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-background/60 px-3 py-2">
                    <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                        Date
                    </p>
                    <p className="mt-1 text-xs text-zinc-200">{dateLabel}</p>
                </div>
                <div className="rounded-md border border-border bg-background/60 px-3 py-2">
                    <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
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
                <Label
                    htmlFor="session-title"
                    className="text-xs text-zinc-400"
                >
                    Title
                </Label>
                <Input
                    id="session-title"
                    value={sessionTitle}
                    disabled={!canManageSessionWrites}
                    maxLength={180}
                    placeholder="Interval Session, Easy Run, etc."
                    onChange={(event) => {
                        setSessionTitle(event.target.value);
                        clearFieldError('title');
                    }}
                    className={cn(
                        'h-10 rounded-md border-border bg-background text-zinc-200 placeholder:text-zinc-600',
                        !canManageSessionWrites && 'cursor-default opacity-65',
                    )}
                />
                <InputError message={errors.title} />
            </div>

            <div className="space-y-1.5">
                <div className="text-xs text-zinc-400">Sport</div>
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

            <SessionTotalsSection
                hasStructuredPlanning={hasStructuredPlanning}
                derivedStructureDurationMinutes={
                    derivedStructureDurationMinutes
                }
                derivedStructureTss={derivedStructureTss}
                plannedDurationMinutes={plannedDurationMinutes}
                plannedTss={plannedTss}
                canManageSessionWrites={canManageSessionWrites}
                plannedDurationInputRef={plannedDurationInputRef}
                setPlannedDurationMinutes={setPlannedDurationMinutes}
                setPlannedTss={setPlannedTss}
                clearFieldError={clearFieldError}
                errors={errors}
            />

            <SessionNotesSection
                notes={notes}
                canManageSessionWrites={canManageSessionWrites}
                setNotes={setNotes}
                clearFieldError={clearFieldError}
                errors={errors}
            />

            <SessionLinkingSection
                isEditMode={isEditMode}
                isLoadingSessionDetails={isLoadingSessionDetails}
                linkedActivitySummary={linkedActivitySummary}
                suggestedActivities={suggestedActivities}
                canManageSessionLinks={canManageSessionLinks}
                canPerformLinking={canPerformLinking}
                isUnlinkingActivity={isUnlinkingActivity}
                isLinkingActivity={isLinkingActivity}
                errors={errors}
                onUnlinkActivity={onUnlinkActivity}
                onLinkActivity={onLinkActivity}
                completionContent={
                    selectedSession !== null ? (
                        <SessionCompletionSection
                            sessionIsCompleted={sessionIsCompleted}
                            sessionIsAdjusted={sessionIsAdjusted}
                            plannedDurationLabel={plannedDurationLabel}
                            actualDurationLabel={actualDurationLabel}
                            plannedTssLabel={plannedTssLabel}
                            actualTssLabel={actualTssLabel}
                            selectedSession={selectedSession}
                            canManageSessionLinks={canManageSessionLinks}
                            canPerformCompletion={canPerformCompletion}
                            isRevertingCompletion={isRevertingCompletion}
                            isCompletingSession={isCompletingSession}
                            onRevertCompletion={onRevertCompletion}
                            onCompleteSession={onCompleteSession}
                        />
                    ) : null
                }
            />
        </div>
    );
}
