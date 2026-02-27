import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CreditCard,
    LoaderCircle,
    Plug,
    Settings2,
    Sparkles,
    TimerReset,
    TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import {
    SubscriptionFeatureMatrix,
    type SubscriptionFeatureEntitlement,
} from './components/subscription-feature-matrix';

type EntryTypeEntitlement = {
    key: string;
    category: 'workout' | 'other' | string;
    label: string;
    requires_subscription: boolean;
};

type AdminSettingsProps = {
    ticketArchiveDelayHours: number;
    entryTypeEntitlements: EntryTypeEntitlement[];
    subscriptionFeatureEntitlements: SubscriptionFeatureEntitlement[];
};
type SettingsTab =
    | 'general'
    | 'workout-types'
    | 'feature-matrix'
    | 'integrations'
    | 'billing';

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
    subscriptionEntitlements: SubscriptionFeatureEntitlement[],
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
        subscription_entitlements: subscriptionEntitlements
            .map((entitlement) => ({
                key: entitlement.key,
                athlete_free_enabled: entitlement.athlete_free_enabled,
                athlete_free_limit: entitlement.athlete_free_limit,
                athlete_paid_enabled: entitlement.athlete_paid_enabled,
                coach_paid_enabled: entitlement.coach_paid_enabled,
            }))
            .sort((left, right) => left.key.localeCompare(right.key)),
    });
};

export default function AdminSettings({
    ticketArchiveDelayHours,
    entryTypeEntitlements,
    subscriptionFeatureEntitlements,
}: AdminSettingsProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [archiveDelayHours, setArchiveDelayHours] =
        useState<number>(ticketArchiveDelayHours);
    const [entitlements, setEntitlements] =
        useState<EntryTypeEntitlement[]>(entryTypeEntitlements);
    const [subscriptionEntitlements, setSubscriptionEntitlements] = useState<
        SubscriptionFeatureEntitlement[]
    >(subscriptionFeatureEntitlements);
    const [saveStatus, setSaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');

    const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveStatusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const initialSerializedState = useMemo(() => {
        return serializeAdminSettingsState(
            ticketArchiveDelayHours,
            entryTypeEntitlements,
            subscriptionFeatureEntitlements,
        );
    }, [
        ticketArchiveDelayHours,
        entryTypeEntitlements,
        subscriptionFeatureEntitlements,
    ]);
    const lastSavedStateRef = useRef(initialSerializedState);

    const groupedEntitlements = useMemo(() => {
        return {
            workout: entitlements.filter((entitlement) => entitlement.category === 'workout'),
            other: entitlements.filter((entitlement) => entitlement.category === 'other'),
        };
    }, [entitlements]);
    const saveStatusLabel =
        saveStatus === 'saving'
            ? 'Saving changes'
            : saveStatus === 'saved'
              ? 'All changes saved'
              : saveStatus === 'error'
                ? 'Save failed'
                : 'Auto-save enabled';

    useEffect(() => {
        setArchiveDelayHours(ticketArchiveDelayHours);
        setEntitlements(entryTypeEntitlements);
        setSubscriptionEntitlements(subscriptionFeatureEntitlements);
        lastSavedStateRef.current = initialSerializedState;
    }, [
        entryTypeEntitlements,
        initialSerializedState,
        subscriptionFeatureEntitlements,
        ticketArchiveDelayHours,
    ]);

    useEffect(() => {
        const currentState = serializeAdminSettingsState(
            archiveDelayHours,
            entitlements,
            subscriptionEntitlements,
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
                    subscription_entitlements: subscriptionEntitlements.map(
                        (entitlement) => ({
                            key: entitlement.key,
                            athlete_free_enabled:
                                entitlement.athlete_free_enabled,
                            athlete_free_limit:
                                entitlement.athlete_free_limit,
                            athlete_paid_enabled:
                                entitlement.athlete_paid_enabled,
                            coach_paid_enabled:
                                entitlement.coach_paid_enabled,
                        }),
                    ),
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
    }, [archiveDelayHours, entitlements, subscriptionEntitlements]);

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
    const updateSubscriptionEntitlement = (
        key: string,
        segment: 'athlete_free_enabled' | 'athlete_paid_enabled',
        checked: boolean,
    ): void => {
        setSubscriptionEntitlements((currentEntitlements) => {
            return currentEntitlements.map((currentEntitlement) => {
                if (currentEntitlement.key !== key) {
                    return currentEntitlement;
                }

                return {
                    ...currentEntitlement,
                    [segment]: checked,
                };
            });
        });
    };
    const updateSubscriptionFeatureFreeLimit = (
        key: string,
        limit: number | null,
    ): void => {
        setSubscriptionEntitlements((currentEntitlements) => {
            return currentEntitlements.map((currentEntitlement) => {
                if (currentEntitlement.key !== key) {
                    return currentEntitlement;
                }

                return {
                    ...currentEntitlement,
                    athlete_free_limit: limit,
                };
            });
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Settings" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-5">
                    <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-3">
                        <div>
                            <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                Admin Controls
                            </p>
                            <h1 className="mt-1 text-3xl font-medium text-zinc-100">Settings</h1>
                            <p className="mt-2 text-sm text-zinc-500">
                                Manage operational defaults, subscription entitlements, and billing access.
                            </p>
                        </div>
                        <SaveStateBadge status={saveStatus} />
                    </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5">
                        <Tabs
                            value={activeTab}
                            onValueChange={(value) => {
                                setActiveTab(
                                    value === 'workout-types' ||
                                        value === 'feature-matrix' ||
                                        value === 'integrations' ||
                                        value === 'billing'
                                        ? value
                                        : 'general',
                                );
                            }}
                        >
                            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 border border-border bg-surface p-1.5">
                                <TabButton
                                    icon={TimerReset}
                                    label="General"
                                    value="general"
                                />
                                <TabButton
                                    icon={Settings2}
                                    label="Workout Types"
                                    value="workout-types"
                                />
                                <TabButton
                                    icon={Sparkles}
                                    label="Feature Matrix"
                                    value="feature-matrix"
                                />
                                <TabButton
                                    icon={Plug}
                                    label="Integrations"
                                    value="integrations"
                                />
                                <TabButton
                                    icon={CreditCard}
                                    label="Billing"
                                    value="billing"
                                />
                            </TabsList>
                        </Tabs>

                        <div className="rounded-xl border border-border bg-surface p-5">
                            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                                <div>
                                    <h2 className="text-base font-medium text-zinc-100">
                                        {activeTab === 'general'
                                            ? 'General settings'
                                            : activeTab === 'workout-types'
                                              ? 'Workout type entitlements'
                                              : activeTab === 'feature-matrix'
                                                ? 'Subscription feature matrix'
                                                : activeTab === 'integrations'
                                                  ? 'Integrations'
                                                  : 'Billing'}
                                    </h2>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {activeTab === 'general'
                                            ? 'Configure ticket lifecycle and operational defaults.'
                                            : activeTab === 'workout-types'
                                              ? 'Control which entry types require an active subscription.'
                                              : activeTab === 'feature-matrix'
                                                ? 'Manage feature access per subscription segment.'
                                                : activeTab === 'integrations'
                                                  ? 'Third-party integration controls.'
                                                  : 'Billing administration controls.'}
                                    </p>
                                </div>
                                <span className="text-xs text-zinc-500">{saveStatusLabel}</span>
                            </div>

                            {activeTab === 'general' ? (
                                <section className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                                    <div className="rounded-lg border border-border bg-background/40 p-4">
                                        <Label htmlFor="ticket-archive-delay" className="text-xs text-zinc-400 uppercase">
                                            Archive delay (hours)
                                        </Label>
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
                                            className="mt-2 h-10 bg-background"
                                        />
                                        <p className="mt-2 text-xs text-zinc-500">
                                            Valid range: 1 to 168 hours.
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-background/30 p-4">
                                        <p className="text-sm font-medium text-zinc-200">How this is used</p>
                                        <ul className="mt-2 space-y-1.5 text-sm text-zinc-500">
                                            <li>Done tickets remain in active views during this delay window.</li>
                                            <li>After the delay, tickets move to archive automatically.</li>
                                            <li>Changes save automatically when values are valid.</li>
                                        </ul>
                                    </div>
                                </section>
                            ) : null}

                            {activeTab === 'workout-types' ? (
                                <section className="grid gap-4 lg:grid-cols-2">
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
                                </section>
                            ) : null}

                            {activeTab === 'feature-matrix' ? (
                                <SubscriptionFeatureMatrix
                                    entitlements={subscriptionEntitlements}
                                    onToggle={updateSubscriptionEntitlement}
                                    onChangeFreeLimit={
                                        updateSubscriptionFeatureFreeLimit
                                    }
                                />
                            ) : null}

                            {activeTab === 'integrations' ? (
                                <section className="rounded-lg border border-border bg-background/40 p-4">
                                    <p className="text-sm text-zinc-500">
                                        Integration controls are coming soon.
                                    </p>
                                </section>
                            ) : null}

                            {activeTab === 'billing' ? (
                                <section className="rounded-lg border border-border bg-background/40 p-4">
                                    <p className="text-sm text-zinc-500">
                                        Billing administration is currently a placeholder.
                                    </p>
                                </section>
                            ) : null}
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
        <div className="space-y-3 rounded-lg border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-300 uppercase">{title}</p>
                <Badge variant="outline" className="text-[0.625rem] text-zinc-400">
                    {entitlements.length}
                </Badge>
            </div>
            <div className="space-y-2">
                {entitlements.map((entitlement) => (
                    <label
                        key={entitlement.key}
                        className="flex items-center justify-between rounded-md border border-border/70 bg-background/60 px-3 py-2.5 transition-colors hover:border-zinc-700"
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

function SaveStateBadge({
    status,
}: {
    status: 'idle' | 'saving' | 'saved' | 'error';
}) {
    if (status === 'saving') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800/60 bg-blue-950/40 px-2.5 py-1 text-xs text-blue-300">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Saving
            </span>
        );
    }

    if (status === 'saved') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
            </span>
        );
    }

    if (status === 'error') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-800/60 bg-red-950/40 px-2.5 py-1 text-xs text-red-300">
                <TriangleAlert className="h-3.5 w-3.5" />
                Save failed
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-zinc-400">
            Auto-save enabled
        </span>
    );
}

function TabButton({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof TimerReset;
    label: string;
    value: SettingsTab;
}) {
    return (
        <TabsTrigger
            value={value}
            className="inline-flex h-9 items-center gap-1.5 px-3 text-xs"
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
        </TabsTrigger>
    );
}
