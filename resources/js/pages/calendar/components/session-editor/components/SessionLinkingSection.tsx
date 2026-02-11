import { Link2, Unlink } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    formatDurationSeconds,
    formatStartedAt,
} from '../hooks/useSessionDerivedValues';
import type {
    ValidationErrors,
} from '../types';

type SessionLinkingSectionProps = {
    isEditMode: boolean;
    isLoadingSessionDetails: boolean;
    linkedActivitySummary: import('@/types/training-plans').TrainingSessionView['linkedActivitySummary'];
    suggestedActivities: import('@/types/training-plans').TrainingSessionView['suggestedActivities'];
    canManageSessionLinks: boolean;
    canPerformLinking: boolean;
    isUnlinkingActivity: boolean;
    isLinkingActivity: boolean;
    errors: ValidationErrors;
    onUnlinkActivity: () => void;
    onLinkActivity: (activityId: number) => void;
    completionContent: React.ReactNode;
};

export function SessionLinkingSection({
    isEditMode,
    isLoadingSessionDetails,
    linkedActivitySummary,
    suggestedActivities,
    canManageSessionLinks,
    canPerformLinking,
    isUnlinkingActivity,
    isLinkingActivity,
    errors,
    onUnlinkActivity,
    onLinkActivity,
    completionContent,
}: SessionLinkingSectionProps) {
    if (!isEditMode) {
        return null;
    }

    return (
        <div className="space-y-2 rounded-md border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[0.6875rem] font-medium tracking-wide text-zinc-300 uppercase">
                    Suggested Activities
                </p>
                {isLoadingSessionDetails ? (
                    <span className="text-[0.6875rem] text-zinc-500">Loading...</span>
                ) : null}
            </div>

            {linkedActivitySummary !== null ? (
                <div className="space-y-2 rounded-md border border-sky-400/25 bg-sky-500/10 p-2.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-xs text-sky-200">
                                <Link2 className="h-3.5 w-3.5" />
                                Linked Activity
                            </p>
                            <p className="mt-1 text-[0.6875rem] text-zinc-200">
                                {formatStartedAt(linkedActivitySummary.startedAt)}
                            </p>
                            <p className="mt-0.5 text-[0.6875rem] text-zinc-400">
                                {linkedActivitySummary.sport ?? 'other'} •{' '}
                                {formatDurationSeconds(linkedActivitySummary.durationSeconds)}
                            </p>
                        </div>

                        {canManageSessionLinks ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!canPerformLinking}
                                onClick={onUnlinkActivity}
                                className="border-red-500/35 text-red-300 hover:text-red-200"
                            >
                                <Unlink className="h-3.5 w-3.5" />
                                {isUnlinkingActivity ? 'Unlinking...' : 'Unlink'}
                            </Button>
                        ) : null}
                    </div>

                    {completionContent}
                </div>
            ) : (
                <p className="text-xs text-zinc-500">No linked activity yet.</p>
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
                                    {formatStartedAt(activity.startedAt)}
                                </p>
                                <p className="mt-0.5 text-[0.6875rem] text-zinc-500">
                                    {activity.sport ?? 'other'} •{' '}
                                    {formatDurationSeconds(activity.durationSeconds)}
                                </p>
                            </div>

                            {canManageSessionLinks ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!canPerformLinking}
                                    onClick={() => {
                                        onLinkActivity(activity.id);
                                    }}
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                    {isLinkingActivity ? 'Linking...' : 'Link'}
                                </Button>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : !isLoadingSessionDetails ? (
                <p className="text-xs text-zinc-500">No suggested activities found.</p>
            ) : null}

            <InputError message={errors.activity_id} />
            <InputError message={errors.session} />
        </div>
    );
}
