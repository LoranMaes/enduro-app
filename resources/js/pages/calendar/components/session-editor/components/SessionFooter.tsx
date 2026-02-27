import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

type SessionFooterProps = {
    isEditMode: boolean;
    canManageSessionWrites: boolean;
    confirmingDelete: boolean;
    setConfirmingDelete: (next: boolean) => void;
    isBusy: boolean;
    isDeleting: boolean;
    isLinkingActivity: boolean;
    isUnlinkingActivity: boolean;
    isCompletingSession: boolean;
    isRevertingCompletion: boolean;
    isSubmitting: boolean;
    canPersistSessionWrites: boolean;
    onDeleteSession: () => void;
    onClose: () => void;
};

export function SessionFooter({
    isEditMode,
    canManageSessionWrites,
    confirmingDelete,
    setConfirmingDelete,
    isBusy,
    isDeleting,
    isLinkingActivity,
    isUnlinkingActivity,
    isCompletingSession,
    isRevertingCompletion,
    isSubmitting,
    canPersistSessionWrites,
    onDeleteSession,
    onClose,
}: SessionFooterProps) {
    return (
        <div className="border-t border-border px-6 py-4">
            <DialogFooter className="gap-2 sm:justify-between">
                {isEditMode && canManageSessionWrites ? (
                    <div className="mr-auto flex items-center gap-2">
                        <Button
                            type="button"
                            variant={confirmingDelete ? 'destructive' : 'ghost'}
                            size="sm"
                            className={
                                confirmingDelete ? '' : 'text-red-400 hover:text-red-300'
                            }
                            disabled={isBusy}
                            onClick={onDeleteSession}
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
                                onClick={() => {
                                    setConfirmingDelete(false);
                                }}
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
                        onClick={onClose}
                    >
                        Close
                    </Button>

                    {canManageSessionWrites ? (
                        <Button type="submit" disabled={!canPersistSessionWrites}>
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
                <p className="mt-2 text-right text-[0.6875rem] text-zinc-500">
                    Session fields are read-only in this context.
                </p>
            ) : (
                <p className="mt-2 text-right text-[0.6875rem] text-zinc-500">
                    Press Enter to save, Esc to close.
                </p>
            )}

            {isBusy ? (
                <p
                    aria-live="polite"
                    className="mt-2 text-right text-[0.6875rem] text-zinc-500"
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
    );
}
