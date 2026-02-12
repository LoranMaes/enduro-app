import { Head, router } from '@inertiajs/react';
import { Cog, Flag, Layers, TimerReset } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import {
    show as adminSettingsShow,
    update as adminSettingsUpdate,
} from '@/routes/admin/settings';
import type { BreadcrumbItem } from '@/types';

type AdminSettingsProps = {
    ticketArchiveDelayHours: number;
    entryTypeEntitlements: Array<{
        key: string;
        category: 'workout' | 'other' | string;
        label: string;
        requires_subscription: boolean;
    }>;
};

const serializeAdminSettingsState = (
    delayHours: number,
    entitlements: AdminSettingsProps['entryTypeEntitlements'],
): string => {
    const normalizedEntitlements = entitlements
        .map((entitlement) => ({
            key: entitlement.key,
            requires_subscription: entitlement.requires_subscription,
        }))
        .sort((left, right) => left.key.localeCompare(right.key));

    return JSON.stringify({
        ticket_archive_delay_hours: delayHours,
        entitlements: normalizedEntitlements,
    });
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Settings',
        href: adminSettingsShow().url,
    },
];

export default function AdminSettings({
    ticketArchiveDelayHours,
    entryTypeEntitlements,
}: AdminSettingsProps) {
    const [archiveDelayHours, setArchiveDelayHours] = useState<number>(
        ticketArchiveDelayHours,
    );
    const [entitlements, setEntitlements] = useState(entryTypeEntitlements);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveStatusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const initialSerializedState = useMemo(() => {
        return serializeAdminSettingsState(
            ticketArchiveDelayHours,
            entryTypeEntitlements,
        );
    }, [ticketArchiveDelayHours, entryTypeEntitlements]);
    const lastSavedStateRef = useRef<string>(initialSerializedState);

    const groupedEntitlements = useMemo(() => {
        const workout = entitlements.filter(
            (entitlement) => entitlement.category === 'workout',
        );
        const other = entitlements.filter(
            (entitlement) => entitlement.category === 'other',
        );

        return { workout, other };
    }, [entitlements]);

    useEffect(() => {
        setArchiveDelayHours(ticketArchiveDelayHours);
        setEntitlements(entryTypeEntitlements);
        lastSavedStateRef.current = initialSerializedState;
    }, [
        entryTypeEntitlements,
        initialSerializedState,
        ticketArchiveDelayHours,
    ]);

    useEffect(() => {
        const currentState = serializeAdminSettingsState(
            archiveDelayHours,
            entitlements,
        );

        if (currentState === lastSavedStateRef.current) {
            return;
        }

        if (archiveDelayHours < 1 || archiveDelayHours > 168) {
            return;
        }

        if (saveDebounceRef.current !== null) {
            clearTimeout(saveDebounceRef.current);
        }

        saveDebounceRef.current = setTimeout(() => {
            setSaving(true);
            setSaveStatus('saving');

            const route = adminSettingsUpdate();
            const snapshot = currentState;

            router.patch(
                route.url,
                {
                    ticket_archive_delay_hours: archiveDelayHours,
                    entitlements: entitlements.map((entitlement) => ({
                        key: entitlement.key,
                        requires_subscription: entitlement.requires_subscription,
                    })),
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        lastSavedStateRef.current = snapshot;
                        setSaveStatus('saved');
                    },
                    onError: () => {
                        setSaveStatus('error');
                    },
                    onFinish: () => {
                        setSaving(false);
                    },
                },
            );
        }, 450);

        return () => {
            if (saveDebounceRef.current !== null) {
                clearTimeout(saveDebounceRef.current);
            }
        };
    }, [archiveDelayHours, entitlements]);

    useEffect(() => {
        if (saveStatus !== 'saved' && saveStatus !== 'error') {
            return;
        }

        if (saveStatusResetRef.current !== null) {
            clearTimeout(saveStatusResetRef.current);
        }

        saveStatusResetRef.current = setTimeout(() => {
            setSaveStatus('idle');
        }, 1600);

        return () => {
            if (saveStatusResetRef.current !== null) {
                clearTimeout(saveStatusResetRef.current);
            }
        };
    }, [saveStatus]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Settings" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-6">
                    <div className="flex items-center gap-2">
                        <Cog className="h-4 w-4 text-zinc-500" />
                        <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                            Admin Controls
                        </p>
                    </div>
                    <h1 className="mt-2 text-4xl font-medium text-zinc-100">
                        Settings
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        Operational defaults and feature controls for internal tools.
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="grid gap-4 xl:grid-cols-3">
                        <section className="rounded-xl border border-border bg-surface p-5 xl:col-span-2">
                            <div className="mb-4 flex items-center gap-2">
                                <TimerReset className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Ticket Lifecycle
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ticket-archive-delay">
                                        Archive delay (hours)
                                    </Label>
                                    <Input
                                        id="ticket-archive-delay"
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={archiveDelayHours}
                                        onChange={(event) =>
                                            setArchiveDelayHours(
                                                Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                ) || 1,
                                            )
                                        }
                                        className="h-10 max-w-40 bg-background"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Tickets in Done are archived automatically after
                                        this delay.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end">
                                    <span className="text-xs text-zinc-500">
                                        {saveStatus === 'saving'
                                            ? 'Saving...'
                                            : saveStatus === 'saved'
                                              ? 'Saved'
                                              : saveStatus === 'error'
                                                ? 'Could not save'
                                                : saving
                                                  ? 'Saving...'
                                                  : 'Auto-save enabled'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-border bg-surface p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Flag className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Feature Flags
                                </h2>
                            </div>
                            <p className="text-sm text-zinc-500">
                                Placeholder for coach/athlete variables and rollout flags.
                            </p>
                        </section>

                        <section className="rounded-xl border border-border bg-surface p-5 xl:col-span-3">
                            <div className="mb-4 flex items-center gap-2">
                                <Flag className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Entry Type Entitlements
                                </h2>
                            </div>
                            <p className="mb-4 text-xs text-zinc-500">
                                Toggle which calendar entry types require a subscription.
                            </p>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
                                    <p className="text-xs font-medium text-zinc-300 uppercase">
                                        Workout types
                                    </p>
                                    <div className="space-y-2">
                                        {groupedEntitlements.workout.map((entitlement) => (
                                            <label
                                                key={entitlement.key}
                                                className="flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2"
                                            >
                                                <span className="text-sm text-zinc-300">
                                                    {entitlement.label}
                                                </span>
                                                <Checkbox
                                                    checked={
                                                        entitlement.requires_subscription
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        const resolvedChecked =
                                                            checked === true;
                                                        setEntitlements((currentEntitlements) =>
                                                            currentEntitlements.map((currentEntitlement) => {
                                                                if (
                                                                    currentEntitlement.key !==
                                                                    entitlement.key
                                                                ) {
                                                                    return currentEntitlement;
                                                                }

                                                                return {
                                                                    ...currentEntitlement,
                                                                    requires_subscription:
                                                                        resolvedChecked,
                                                                };
                                                            }),
                                                        );
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
                                    <p className="text-xs font-medium text-zinc-300 uppercase">
                                        Other entries
                                    </p>
                                    <div className="space-y-2">
                                        {groupedEntitlements.other.map((entitlement) => (
                                            <label
                                                key={entitlement.key}
                                                className="flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2"
                                            >
                                                <span className="text-sm text-zinc-300">
                                                    {entitlement.label}
                                                </span>
                                                <Checkbox
                                                    checked={
                                                        entitlement.requires_subscription
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        const resolvedChecked =
                                                            checked === true;
                                                        setEntitlements((currentEntitlements) =>
                                                            currentEntitlements.map((currentEntitlement) => {
                                                                if (
                                                                    currentEntitlement.key !==
                                                                    entitlement.key
                                                                ) {
                                                                    return currentEntitlement;
                                                                }

                                                                return {
                                                                    ...currentEntitlement,
                                                                    requires_subscription:
                                                                        resolvedChecked,
                                                                };
                                                            }),
                                                        );
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-border bg-surface p-5 xl:col-span-3">
                            <div className="mb-3 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Configuration Roadmap
                                </h2>
                            </div>
                            <ul className="space-y-2 text-sm text-zinc-500">
                                <li>- Athlete defaults (units, onboarding toggles)</li>
                                <li>- Coach constraints and approval automation</li>
                                <li>- Ticket workflow templates and SLA presets</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
