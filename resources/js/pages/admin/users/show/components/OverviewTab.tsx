import { Button } from '@/components/ui/button';
import type { AdminUser, AdminUserShowPageProps } from '../types';
import { formatDateTime } from '../utils';

type OverviewTabProps = {
    user: AdminUser;
    suspension: AdminUserShowPageProps['suspension'];
    suspensionReason: string;
    setSuspensionReason: (value: string) => void;
    isSubmittingSuspension: boolean;
    suspendUser: () => void;
    unsuspendUser: () => void;
};

export function OverviewTab({
    user,
    suspension,
    suspensionReason,
    setSuspensionReason,
    isSubmittingSuspension,
    suspendUser,
    unsuspendUser,
}: OverviewTabProps) {
    return (
        <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
                <OverviewCard label="Role" value={user.role ?? '—'} />
                <OverviewCard label="Status" value={user.status} />
                <OverviewCard label="Training Plans" value={user.plan_label} />
                <OverviewCard
                    label="Impersonation"
                    value={user.can_impersonate ? 'Allowed' : 'Blocked'}
                />
            </div>

            {user.role !== 'admin' ? (
                <div className="rounded-xl border border-border bg-surface p-4">
                    <h2 className="text-sm font-medium text-zinc-100">Moderation</h2>

                    {suspension.is_suspended ? (
                        <div className="mt-3 space-y-3">
                            <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2">
                                <p className="text-xs text-zinc-300">
                                    This user is currently suspended.
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Suspended by {suspension.suspended_by_name ?? 'Unknown'} on{' '}
                                    {formatDateTime(suspension.suspended_at)}
                                </p>
                                <p className="mt-2 text-xs text-zinc-400">
                                    {suspension.suspended_reason ?? 'No reason recorded.'}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                className="h-9"
                                disabled={isSubmittingSuspension}
                                onClick={unsuspendUser}
                            >
                                {isSubmittingSuspension ? 'Updating...' : 'Reactivate User'}
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-3 space-y-3">
                            <textarea
                                value={suspensionReason}
                                onChange={(event) =>
                                    setSuspensionReason(event.target.value)
                                }
                                placeholder="Describe why this account is being suspended..."
                                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                className="h-9"
                                disabled={
                                    isSubmittingSuspension ||
                                    suspensionReason.trim().length < 10
                                }
                                onClick={suspendUser}
                            >
                                {isSubmittingSuspension ? 'Suspending...' : 'Suspend User'}
                            </Button>
                        </div>
                    )}
                </div>
            ) : null}
        </section>
    );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">{label}</p>
            <p className="mt-1 text-sm text-zinc-100">{value}</p>
        </div>
    );
}
