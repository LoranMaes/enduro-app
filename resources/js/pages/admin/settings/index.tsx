import { Head, router } from '@inertiajs/react';
import { CreditCard, Plug, Settings2, TimerReset } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import {
    show as adminSettingsShow,
    update as adminSettingsUpdate,
} from '@/routes/admin/settings';
import type { BreadcrumbItem } from '@/types';

type EntryTypeEntitlement = {
    key: string;
    category: 'workout' | 'other' | string;
    label: string;
    requires_subscription: boolean;
};

type AdminSettingsProps = {
    ticketArchiveDelayHours: number;
    entryTypeEntitlements: EntryTypeEntitlement[];
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

const serializeAdminSettingsState = (
    delayHours: number,
    entitlements: EntryTypeEntitlement[],
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

export default function AdminSettings({
    ticketArchiveDelayHours,
    entryTypeEntitlements,
}: AdminSettingsProps) {
    const [activeTab, setActiveTab] = useState<
        'general' | 'workout-types' | 'integrations' | 'billing'
    >('general');
    const [archiveDelayHours, setArchiveDelayHours] =
        useState<number>(ticketArchiveDelayHours);
    const [entitlements, setEntitlements] =
        useState<EntryTypeEntitlement[]>(entryTypeEntitlements);
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
    const lastSavedStateRef = useRef(initialSerializedState);

    const groupedEntitlements = useMemo(() => {
        return {
            workout: entitlements.filter((entitlement) => entitlement.category === 'workout'),
            other: entitlements.filter((entitlement) => entitlement.category === 'other'),
        };
    }, [entitlements]);

    useEffect(() => {
        setArchiveDelayHours(ticketArchiveDelayHours);
        setEntitlements(entryTypeEntitlements);
        lastSavedStateRef.current = initialSerializedState;
    }, [entryTypeEntitlements, initialSerializedState, ticketArchiveDelayHours]);

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

    const updateEntitlement = (key: string, checked: boolean): void => {
        setEntitlements((currentEntitlements) => {
            return currentEntitlements.map((currentEntitlement) => {
                if (currentEntitlement.key !== key) {
                    return currentEntitlement;
                }

                return {
                    ...currentEntitlement,
                    requires_subscription: checked,
                };
            });
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Settings" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-6">
                    <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                        Admin Controls
                    </p>
                    <h1 className="mt-2 text-4xl font-medium text-zinc-100">Settings</h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        Operational defaults and entry type controls.
                    </p>
                </header>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => {
                            setActiveTab(
                                value === 'workout-types' || value === 'integrations' || value === 'billing'
                                    ? value
                                    : 'general',
                            );
                        }}
                    >
                        <TabsList className="grid w-full max-w-3xl grid-cols-4 border border-border bg-surface p-1">
                            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                            <TabsTrigger value="workout-types" className="text-xs">Workout Types</TabsTrigger>
                            <TabsTrigger value="integrations" className="text-xs">Integrations</TabsTrigger>
                            <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="mt-5 rounded-xl border border-border bg-surface p-5">
                        {activeTab === 'general' ? (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <TimerReset className="h-4 w-4 text-zinc-500" />
                                    <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                        Ticket Lifecycle
                                    </h2>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ticket-archive-delay">Archive delay (hours)</Label>
                                    <Input
                                        id="ticket-archive-delay"
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={archiveDelayHours}
                                        onChange={(event) => {
                                            setArchiveDelayHours(
                                                Number.parseInt(event.target.value, 10) || 1,
                                            );
                                        }}
                                        className="h-10 max-w-40 bg-background"
                                    />
                                </div>
                            </section>
                        ) : null}

                        {activeTab === 'workout-types' ? (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-zinc-500" />
                                    <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                        Workout Type Entitlements
                                    </h2>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <EntitlementGroup
                                        title="Workout types"
                                        entitlements={groupedEntitlements.workout}
                                        onToggle={updateEntitlement}
                                    />
                                    <EntitlementGroup
                                        title="Other entries"
                                        entitlements={groupedEntitlements.other}
                                        onToggle={updateEntitlement}
                                    />
                                </div>
                            </section>
                        ) : null}

                        {activeTab === 'integrations' ? (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <Plug className="h-4 w-4 text-zinc-500" />
                                    <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                        Integrations
                                    </h2>
                                </div>
                                <p className="text-sm text-zinc-500">Integration controls are coming soon.</p>
                            </section>
                        ) : null}

                        {activeTab === 'billing' ? (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-zinc-500" />
                                    <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                        Billing
                                    </h2>
                                </div>
                                <p className="text-sm text-zinc-500">Billing administration is currently a placeholder.</p>
                            </section>
                        ) : null}

                        <div className="mt-5 flex justify-end">
                            <span className="text-xs text-zinc-500">
                                {saveStatus === 'saving'
                                    ? 'Saving...'
                                    : saveStatus === 'saved'
                                      ? 'Saved'
                                      : saveStatus === 'error'
                                        ? 'Could not save'
                                        : 'Auto-save enabled'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function EntitlementGroup({
    title,
    entitlements,
    onToggle,
}: {
    title: string;
    entitlements: EntryTypeEntitlement[];
    onToggle: (key: string, checked: boolean) => void;
}) {
    return (
        <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
            <p className="text-xs font-medium text-zinc-300 uppercase">{title}</p>
            <div className="space-y-2">
                {entitlements.map((entitlement) => (
                    <label
                        key={entitlement.key}
                        className="flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2"
                    >
                        <span className="text-sm text-zinc-300">{entitlement.label}</span>
                        <Checkbox
                            checked={entitlement.requires_subscription}
                            onCheckedChange={(checked) => {
                                onToggle(entitlement.key, checked === true);
                            }}
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}
