import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCompletedAt } from '../hooks/useSessionDerivedValues';

type SessionCompletionSectionProps = {
    sessionIsCompleted: boolean;
    sessionIsAdjusted: boolean;
    plannedDurationLabel: string;
    actualDurationLabel: string;
    plannedTssLabel: string;
    actualTssLabel: string;
    selectedSession: import('@/types/training-plans').TrainingSessionView;
    canManageSessionLinks: boolean;
    canPerformCompletion: boolean;
    isRevertingCompletion: boolean;
    isCompletingSession: boolean;
    onRevertCompletion: () => void;
    onCompleteSession: () => void;
};

export function SessionCompletionSection({
    sessionIsCompleted,
    sessionIsAdjusted,
    plannedDurationLabel,
    actualDurationLabel,
    plannedTssLabel,
    actualTssLabel,
    selectedSession,
    canManageSessionLinks,
    canPerformCompletion,
    isRevertingCompletion,
    isCompletingSession,
    onRevertCompletion,
    onCompleteSession,
}: SessionCompletionSectionProps) {
    return (
        <>
            <div className="space-y-2 rounded-md border border-border/70 bg-background/30 p-2.5">
                <p className="text-[0.6875rem] font-medium tracking-wide text-zinc-400 uppercase">
                    Planned vs Actual
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-border/80 bg-background/50 px-2.5 py-2">
                        <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                            Duration
                        </p>
                        <p className="mt-1 text-[0.6875rem] text-zinc-300">
                            Planned:{' '}
                            <span className="font-mono text-zinc-100">
                                {plannedDurationLabel}
                            </span>
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] text-zinc-300">
                            Actual:{' '}
                            <span className="font-mono text-zinc-100">
                                {actualDurationLabel}
                            </span>
                        </p>
                    </div>
                    <div className="rounded-md border border-border/80 bg-background/50 px-2.5 py-2">
                        <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                            TSS
                        </p>
                        <p className="mt-1 text-[0.6875rem] text-zinc-300">
                            Planned:{' '}
                            <span className="font-mono text-zinc-100">
                                {plannedTssLabel}
                            </span>
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] text-zinc-300">
                            Actual:{' '}
                            <span className="font-mono text-zinc-100">
                                {actualTssLabel}
                            </span>
                        </p>
                    </div>
                </div>
                <p className="text-[0.6875rem] text-zinc-500">
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
                                    <span className="rounded-full border border-zinc-600/70 bg-zinc-800/70 px-1.5 py-0.5 text-[0.625rem] text-zinc-300">
                                        Adjusted
                                    </span>
                                ) : null}
                            </p>
                        ) : (
                            <p className="text-xs text-zinc-300">
                                Ready to mark as completed.
                            </p>
                        )}
                        <p className="mt-0.5 text-[0.6875rem] text-zinc-500">
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
                                disabled={!canPerformCompletion}
                                onClick={onRevertCompletion}
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
                                disabled={!canPerformCompletion}
                                onClick={onCompleteSession}
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
                    <p className="text-[0.6875rem] text-zinc-500">
                        Reverting completion clears actual duration and actual TSS,
                        while keeping this activity linked.
                    </p>
                ) : null}
            </div>
        </>
    );
}
