import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    CreditCard,
    Link2,
    Link2Off,
    RefreshCw,
    Sliders,
    User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { initializeEcho } from '@/lib/echo';
import { cn } from '@/lib/utils';
import { sync as syncActivityProvider } from '@/routes/activity-providers';
import { connect, disconnect } from '@/routes/settings/connections';
import { overview as settingsOverview } from '@/routes/settings';
import type { BreadcrumbItem, SharedData } from '@/types';

type ProviderConnection = {
    provider: string;
    label: string;
    connected: boolean;
    provider_athlete_id: string | null;
    token_expires_at: string | null;
    last_synced_at: string | null;
    last_sync_status: string | null;
    last_sync_reason: string | null;
};

type ZoneRange = {
    label: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5' | string;
    min: number;
    max: number;
};

type SettingsOverviewProps = {
    activeTab: 'profile' | 'training' | 'integrations' | 'billing';
    role: 'athlete' | 'coach' | 'admin';
    profile: {
        name: string;
        email: string;
        timezone: string;
        unit_system: 'metric' | 'imperial' | string;
    };
    trainingPreferences: {
        primary_sport: 'swim' | 'bike' | 'run' | 'triathlon' | 'other' | string;
        weekly_training_days: number;
        preferred_rest_day:
            | 'monday'
            | 'tuesday'
            | 'wednesday'
            | 'thursday'
            | 'friday'
            | 'saturday'
            | 'sunday'
            | string;
        intensity_distribution:
            | 'polarized'
            | 'pyramidal'
            | 'threshold'
            | 'mixed'
            | string;
        ftp_watts: number | null;
        max_heart_rate_bpm: number | null;
        threshold_heart_rate_bpm: number | null;
        threshold_pace_seconds_per_km: number | null;
        power_zones: ZoneRange[];
        heart_rate_zones: ZoneRange[];
    };
    providers: ProviderConnection[];
    canManageConnections: boolean;
    settingsStatus: string | null;
    connectionStatusMessage: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: settingsOverview().url,
    },
];

type SettingsTab = 'profile' | 'training' | 'integrations' | 'billing';

const tabLabels: Record<SettingsTab, string> = {
    profile: 'Profile',
    training: 'Training Preferences',
    integrations: 'Integrations',
    billing: 'Billing & Plans',
};

const tabIcons = {
    profile: User,
    training: Activity,
    integrations: Link2,
    billing: CreditCard,
} satisfies Record<SettingsTab, typeof User>;

export default function SettingsOverview({
    activeTab,
    role,
    profile,
    trainingPreferences,
    providers,
    canManageConnections,
    settingsStatus,
    connectionStatusMessage,
}: SettingsOverviewProps) {
    const { auth } = usePage<SharedData>().props;
    const [selectedTab, setSelectedTab] = useState<SettingsTab>(activeTab);
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [syncMessageByProvider, setSyncMessageByProvider] = useState<
        Record<string, string>
    >({});
    const [syncErrorByProvider, setSyncErrorByProvider] = useState<
        Record<string, string>
    >({});

    const profileForm = useForm({
        name: profile.name,
        email: profile.email,
        timezone: profile.timezone,
        unit_system: profile.unit_system,
    });

    const trainingForm = useForm({
        primary_sport: trainingPreferences.primary_sport,
        weekly_training_days: trainingPreferences.weekly_training_days,
        preferred_rest_day: trainingPreferences.preferred_rest_day,
        intensity_distribution: trainingPreferences.intensity_distribution,
        ftp_watts: trainingPreferences.ftp_watts,
        max_heart_rate_bpm: trainingPreferences.max_heart_rate_bpm,
        threshold_heart_rate_bpm: trainingPreferences.threshold_heart_rate_bpm,
        threshold_pace_seconds_per_km:
            trainingPreferences.threshold_pace_seconds_per_km,
        power_zones: trainingPreferences.power_zones,
        heart_rate_zones: trainingPreferences.heart_rate_zones,
    });

    useEffect(() => {
        setSelectedTab(activeTab);
    }, [activeTab]);

    useEffect(() => {
        profileForm.setData({
            name: profile.name,
            email: profile.email,
            timezone: profile.timezone,
            unit_system: profile.unit_system,
        });
    }, [
        profile.email,
        profile.name,
        profile.timezone,
        profile.unit_system,
        profileForm,
    ]);

    useEffect(() => {
        trainingForm.setData({
            primary_sport: trainingPreferences.primary_sport,
            weekly_training_days: trainingPreferences.weekly_training_days,
            preferred_rest_day: trainingPreferences.preferred_rest_day,
            intensity_distribution: trainingPreferences.intensity_distribution,
            ftp_watts: trainingPreferences.ftp_watts,
            max_heart_rate_bpm: trainingPreferences.max_heart_rate_bpm,
            threshold_heart_rate_bpm:
                trainingPreferences.threshold_heart_rate_bpm,
            threshold_pace_seconds_per_km:
                trainingPreferences.threshold_pace_seconds_per_km,
            power_zones: trainingPreferences.power_zones,
            heart_rate_zones: trainingPreferences.heart_rate_zones,
        });
    }, [
        trainingPreferences.intensity_distribution,
        trainingPreferences.ftp_watts,
        trainingPreferences.heart_rate_zones,
        trainingPreferences.max_heart_rate_bpm,
        trainingPreferences.power_zones,
        trainingPreferences.preferred_rest_day,
        trainingPreferences.primary_sport,
        trainingPreferences.threshold_heart_rate_bpm,
        trainingPreferences.threshold_pace_seconds_per_km,
        trainingPreferences.weekly_training_days,
        trainingForm,
    ]);

    useEffect(() => {
        if (!canManageConnections || auth.user?.id === undefined) {
            return;
        }

        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channelName = `App.Models.User.${auth.user.id}`;
        const eventName = '.activity-provider.sync-status-updated';
        const channel = echo.private(channelName);

        channel.listen(eventName, (event: { provider?: string }) => {
            if (typeof event.provider !== 'string' || event.provider === '') {
                return;
            }

            router.reload({
                only: ['providers'],
            });
        });

        return () => {
            channel.stopListening(eventName);
            echo.leave(channelName);
        };
    }, [auth.user?.id, canManageConnections]);

    const availableTabs = useMemo((): SettingsTab[] => {
        if (role === 'athlete') {
            return ['profile', 'training', 'integrations', 'billing'];
        }

        return ['profile', 'integrations', 'billing'];
    }, [role]);

    const trainingErrors = trainingForm.errors as Record<string, string | undefined>;

    const updateZoneValue = (
        field: 'power_zones' | 'heart_rate_zones',
        index: number,
        key: 'min' | 'max',
        value: string,
    ): void => {
        const numericValue = Number.parseInt(value, 10);
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

        trainingForm.setData(field, trainingForm.data[field].map((zone, zoneIndex) => {
            if (zoneIndex !== index) {
                return zone;
            }

            return {
                ...zone,
                [key]: safeValue,
            };
        }));
        trainingForm.clearErrors(field);
    };

    const resolveZoneError = (field: 'power_zones' | 'heart_rate_zones'): string | undefined => {
        if (trainingErrors[field] !== undefined) {
            return trainingErrors[field];
        }

        const entry = Object.entries(trainingErrors).find(([key, value]) => {
            return key.startsWith(`${field}.`) && typeof value === 'string';
        });

        return entry?.[1];
    };

    const syncNow = async (provider: string): Promise<void> => {
        if (!canManageConnections || syncingProvider !== null) {
            return;
        }

        setSyncingProvider(provider);
        setSyncMessageByProvider((current) => ({
            ...current,
            [provider]: '',
        }));
        setSyncErrorByProvider((current) => ({
            ...current,
            [provider]: '',
        }));

        try {
            const route = syncActivityProvider(provider);
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    typeof payload?.message === 'string'
                        ? payload.message
                        : 'Unable to sync activities.';

                setSyncErrorByProvider((current) => ({
                    ...current,
                    [provider]: message,
                }));

                return;
            }

            const status =
                typeof payload?.status === 'string' ? payload.status : 'queued';

            setSyncMessageByProvider((current) => ({
                ...current,
                [provider]:
                    status === 'queued'
                        ? 'Sync queued.'
                        : `Sync status: ${status}.`,
            }));

            router.reload({
                only: ['providers'],
            });
        } finally {
            setSyncingProvider(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />

            <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
                <aside className="hidden w-64 shrink-0 border-r border-border bg-background px-6 py-8 md:block">
                    <h1 className="text-xl font-medium text-zinc-100">Settings</h1>
                    <div className="mt-2 inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                        {role.toUpperCase()} ACCOUNT
                    </div>

                    <nav className="mt-8 flex flex-col gap-1">
                        {availableTabs.map((tab) => {
                            const Icon = tabIcons[tab];
                            const isActive = selectedTab === tab;

                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => {
                                        setSelectedTab(tab);
                                        router.get(
                                            settingsOverview().url,
                                            { tab },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                                only: [
                                                    'activeTab',
                                                    'settingsStatus',
                                                    'connectionStatusMessage',
                                                ],
                                            },
                                        );
                                    }}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-zinc-800 text-zinc-100 ring-1 ring-white/5'
                                            : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tabLabels[tab]}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
                    <div className="mx-auto w-full max-w-4xl">
                        {settingsStatus !== null ? (
                            <p className="mb-4 rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
                                {formatSettingsStatus(settingsStatus)}
                            </p>
                        ) : null}
                        {connectionStatusMessage !== null ? (
                            <p className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-zinc-300">
                                {connectionStatusMessage}
                            </p>
                        ) : null}

                        {selectedTab === 'profile' ? (
                            <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
                                <header className="mb-8 border-b border-border pb-6">
                                    <h2 className="text-xl font-medium text-zinc-200">
                                        Profile
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Manage personal details and account defaults.
                                    </p>
                                </header>

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();

                                        profileForm.patch('/settings/overview/profile', {
                                            preserveScroll: true,
                                        });
                                    }}
                                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                                >
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="settings-name"
                                            className="text-xs text-zinc-500"
                                        >
                                            Full Name
                                        </label>
                                        <input
                                            id="settings-name"
                                            value={profileForm.data.name}
                                            onChange={(event) => {
                                                profileForm.setData(
                                                    'name',
                                                    event.target.value,
                                                );
                                                profileForm.clearErrors('name');
                                            }}
                                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                        />
                                        <InputError message={profileForm.errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="settings-email"
                                            className="text-xs text-zinc-500"
                                        >
                                            Email Address
                                        </label>
                                        <input
                                            id="settings-email"
                                            type="email"
                                            value={profileForm.data.email}
                                            onChange={(event) => {
                                                profileForm.setData(
                                                    'email',
                                                    event.target.value,
                                                );
                                                profileForm.clearErrors('email');
                                            }}
                                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                        />
                                        <InputError message={profileForm.errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="settings-timezone"
                                            className="text-xs text-zinc-500"
                                        >
                                            Timezone
                                        </label>
                                        <input
                                            id="settings-timezone"
                                            value={profileForm.data.timezone}
                                            onChange={(event) => {
                                                profileForm.setData(
                                                    'timezone',
                                                    event.target.value,
                                                );
                                                profileForm.clearErrors('timezone');
                                            }}
                                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                        />
                                        <InputError
                                            message={profileForm.errors.timezone}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="settings-unit-system"
                                            className="text-xs text-zinc-500"
                                        >
                                            Unit System
                                        </label>
                                        <select
                                            id="settings-unit-system"
                                            value={profileForm.data.unit_system}
                                            onChange={(event) => {
                                                profileForm.setData(
                                                    'unit_system',
                                                    event.target.value,
                                                );
                                                profileForm.clearErrors('unit_system');
                                            }}
                                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                        >
                                            <option value="metric">Metric (km, kg)</option>
                                            <option value="imperial">
                                                Imperial (mi, lbs)
                                            </option>
                                        </select>
                                        <InputError
                                            message={profileForm.errors.unit_system}
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={profileForm.processing}
                                        >
                                            {profileForm.processing
                                                ? 'Saving...'
                                                : 'Save Profile'}
                                        </Button>
                                    </div>
                                </form>
                            </section>
                        ) : null}

                        {selectedTab === 'training' && role === 'athlete' ? (
                            <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
                                <header className="mb-8 border-b border-border pb-6">
                                    <h2 className="text-xl font-medium text-zinc-200">
                                        Training Preferences
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Configure baseline planning defaults for athlete workflows.
                                    </p>
                                </header>

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();

                                        trainingForm.patch(
                                            '/settings/overview/training-preferences',
                                            {
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="training-primary-sport"
                                                className="text-xs text-zinc-500"
                                            >
                                                Primary Sport
                                            </label>
                                            <select
                                                id="training-primary-sport"
                                                value={trainingForm.data.primary_sport}
                                                onChange={(event) => {
                                                    trainingForm.setData(
                                                        'primary_sport',
                                                        event.target.value,
                                                    );
                                                    trainingForm.clearErrors(
                                                        'primary_sport',
                                                    );
                                                }}
                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                            >
                                                <option value="triathlon">
                                                    Triathlon
                                                </option>
                                                <option value="bike">Bike</option>
                                                <option value="run">Run</option>
                                                <option value="swim">Swim</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <InputError
                                                message={
                                                    trainingForm.errors
                                                        .primary_sport
                                                }
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="training-days"
                                                className="text-xs text-zinc-500"
                                            >
                                                Weekly Training Days
                                            </label>
                                            <input
                                                id="training-days"
                                                type="number"
                                                min={1}
                                                max={7}
                                                value={
                                                    trainingForm.data
                                                        .weekly_training_days
                                                }
                                                onChange={(event) => {
                                                    trainingForm.setData(
                                                        'weekly_training_days',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    );
                                                    trainingForm.clearErrors(
                                                        'weekly_training_days',
                                                    );
                                                }}
                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                            />
                                            <InputError
                                                message={
                                                    trainingForm.errors
                                                        .weekly_training_days
                                                }
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="training-rest-day"
                                                className="text-xs text-zinc-500"
                                            >
                                                Preferred Rest Day
                                            </label>
                                            <select
                                                id="training-rest-day"
                                                value={
                                                    trainingForm.data
                                                        .preferred_rest_day
                                                }
                                                onChange={(event) => {
                                                    trainingForm.setData(
                                                        'preferred_rest_day',
                                                        event.target.value,
                                                    );
                                                    trainingForm.clearErrors(
                                                        'preferred_rest_day',
                                                    );
                                                }}
                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                            >
                                                <option value="monday">
                                                    Monday
                                                </option>
                                                <option value="tuesday">
                                                    Tuesday
                                                </option>
                                                <option value="wednesday">
                                                    Wednesday
                                                </option>
                                                <option value="thursday">
                                                    Thursday
                                                </option>
                                                <option value="friday">
                                                    Friday
                                                </option>
                                                <option value="saturday">
                                                    Saturday
                                                </option>
                                                <option value="sunday">
                                                    Sunday
                                                </option>
                                            </select>
                                            <InputError
                                                message={
                                                    trainingForm.errors
                                                        .preferred_rest_day
                                                }
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="training-intensity"
                                                className="text-xs text-zinc-500"
                                            >
                                                Intensity Distribution
                                            </label>
                                            <select
                                                id="training-intensity"
                                                value={
                                                    trainingForm.data
                                                        .intensity_distribution
                                                }
                                                onChange={(event) => {
                                                    trainingForm.setData(
                                                        'intensity_distribution',
                                                        event.target.value,
                                                    );
                                                    trainingForm.clearErrors(
                                                        'intensity_distribution',
                                                    );
                                                }}
                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                            >
                                                <option value="polarized">
                                                    Polarized (80/20)
                                                </option>
                                                <option value="pyramidal">
                                                    Pyramidal
                                                </option>
                                                <option value="threshold">
                                                    Threshold
                                                </option>
                                                <option value="mixed">
                                                    Mixed
                                                </option>
                                            </select>
                                            <InputError
                                                message={
                                                    trainingForm.errors
                                                        .intensity_distribution
                                                }
                                            />
                                        </div>
                                    </div>

                                    <section className="rounded-lg border border-border/70 bg-background/50 p-4">
                                        <h3 className="text-sm font-medium text-zinc-200">
                                            Performance Anchors
                                        </h3>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            These values are used for workout
                                            structure preview scales and unit
                                            conversions.
                                        </p>
                                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="training-ftp"
                                                    className="text-xs text-zinc-500"
                                                >
                                                    FTP (watts)
                                                </label>
                                                <input
                                                    id="training-ftp"
                                                    type="number"
                                                    min={50}
                                                    max={1000}
                                                    value={
                                                        trainingForm.data
                                                            .ftp_watts ?? ''
                                                    }
                                                    onChange={(event) => {
                                                        trainingForm.setData(
                                                            'ftp_watts',
                                                            parseNullableInteger(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        );
                                                        trainingForm.clearErrors(
                                                            'ftp_watts',
                                                        );
                                                    }}
                                                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                />
                                                <InputError
                                                    message={
                                                        trainingForm.errors
                                                            .ftp_watts
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="training-max-hr"
                                                    className="text-xs text-zinc-500"
                                                >
                                                    Max Heart Rate (bpm)
                                                </label>
                                                <input
                                                    id="training-max-hr"
                                                    type="number"
                                                    min={120}
                                                    max={240}
                                                    value={
                                                        trainingForm.data
                                                            .max_heart_rate_bpm ??
                                                        ''
                                                    }
                                                    onChange={(event) => {
                                                        trainingForm.setData(
                                                            'max_heart_rate_bpm',
                                                            parseNullableInteger(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        );
                                                        trainingForm.clearErrors(
                                                            'max_heart_rate_bpm',
                                                        );
                                                    }}
                                                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                />
                                                <InputError
                                                    message={
                                                        trainingForm.errors
                                                            .max_heart_rate_bpm
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="training-threshold-hr"
                                                    className="text-xs text-zinc-500"
                                                >
                                                    Threshold Heart Rate (bpm)
                                                </label>
                                                <input
                                                    id="training-threshold-hr"
                                                    type="number"
                                                    min={100}
                                                    max={230}
                                                    value={
                                                        trainingForm.data
                                                            .threshold_heart_rate_bpm ??
                                                        ''
                                                    }
                                                    onChange={(event) => {
                                                        trainingForm.setData(
                                                            'threshold_heart_rate_bpm',
                                                            parseNullableInteger(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        );
                                                        trainingForm.clearErrors(
                                                            'threshold_heart_rate_bpm',
                                                        );
                                                    }}
                                                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                />
                                                <InputError
                                                    message={
                                                        trainingForm.errors
                                                            .threshold_heart_rate_bpm
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="training-threshold-pace"
                                                    className="text-xs text-zinc-500"
                                                >
                                                    Threshold Pace (sec/km)
                                                </label>
                                                <input
                                                    id="training-threshold-pace"
                                                    type="number"
                                                    min={120}
                                                    max={1200}
                                                    value={
                                                        trainingForm.data
                                                            .threshold_pace_seconds_per_km ??
                                                        ''
                                                    }
                                                    onChange={(event) => {
                                                        trainingForm.setData(
                                                            'threshold_pace_seconds_per_km',
                                                            parseNullableInteger(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        );
                                                        trainingForm.clearErrors(
                                                            'threshold_pace_seconds_per_km',
                                                        );
                                                    }}
                                                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                />
                                                <p className="text-[11px] text-zinc-500">
                                                    Example: 240 = 4:00 / km
                                                    threshold pace
                                                </p>
                                                <InputError
                                                    message={
                                                        trainingForm.errors
                                                            .threshold_pace_seconds_per_km
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <div className="rounded-lg border border-border/70 bg-background/50 p-4">
                                            <h3 className="text-sm font-medium text-zinc-200">
                                                Power Zones (% FTP)
                                            </h3>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                Editable defaults used by the
                                                builder for bike sessions.
                                            </p>
                                            <div className="mt-3 space-y-2">
                                                {trainingForm.data.power_zones.map(
                                                    (zone, index) => (
                                                        <div
                                                            key={`power-zone-${zone.label}-${index}`}
                                                            className="grid grid-cols-[3rem_1fr_auto_1fr] items-center gap-2"
                                                        >
                                                            <span className="text-xs text-zinc-400">
                                                                {zone.label}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={200}
                                                                value={zone.min}
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updateZoneValue(
                                                                        'power_zones',
                                                                        index,
                                                                        'min',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    );
                                                                }}
                                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                            />
                                                            <span className="text-xs text-zinc-500">
                                                                -
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={250}
                                                                value={zone.max}
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updateZoneValue(
                                                                        'power_zones',
                                                                        index,
                                                                        'max',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    );
                                                                }}
                                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                            />
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <InputError
                                                message={resolveZoneError(
                                                    'power_zones',
                                                )}
                                            />
                                        </div>

                                        <div className="rounded-lg border border-border/70 bg-background/50 p-4">
                                            <h3 className="text-sm font-medium text-zinc-200">
                                                Heart Rate Zones (% max HR)
                                            </h3>
                                            <p className="mt-1 text-xs text-zinc-500">
                                                Editable defaults used by run and
                                                general HR-based workouts.
                                            </p>
                                            <div className="mt-3 space-y-2">
                                                {trainingForm.data.heart_rate_zones.map(
                                                    (zone, index) => (
                                                        <div
                                                            key={`hr-zone-${zone.label}-${index}`}
                                                            className="grid grid-cols-[3rem_1fr_auto_1fr] items-center gap-2"
                                                        >
                                                            <span className="text-xs text-zinc-400">
                                                                {zone.label}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={40}
                                                                max={220}
                                                                value={zone.min}
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updateZoneValue(
                                                                        'heart_rate_zones',
                                                                        index,
                                                                        'min',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    );
                                                                }}
                                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                            />
                                                            <span className="text-xs text-zinc-500">
                                                                -
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={50}
                                                                max={240}
                                                                value={zone.max}
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    updateZoneValue(
                                                                        'heart_rate_zones',
                                                                        index,
                                                                        'max',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    );
                                                                }}
                                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                            />
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <InputError
                                                message={resolveZoneError(
                                                    'heart_rate_zones',
                                                )}
                                            />
                                        </div>
                                    </section>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={trainingForm.processing}
                                        >
                                            {trainingForm.processing
                                                ? 'Saving...'
                                                : 'Save Preferences'}
                                        </Button>
                                    </div>
                                </form>
                            </section>
                        ) : null}

                        {selectedTab === 'integrations' ? (
                            <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
                                <header className="mb-8 border-b border-border pb-6">
                                    <h2 className="text-xl font-medium text-zinc-200">
                                        Integrations
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Connect activity providers and run syncs from one place.
                                    </p>
                                </header>

                                <div className="space-y-4">
                                    {providers.map((provider) => {
                                        const isSyncing =
                                            syncingProvider === provider.provider;
                                        const hasSyncInProgress =
                                            provider.last_sync_status === 'queued' ||
                                            provider.last_sync_status === 'running';

                                        return (
                                            <div
                                                key={provider.provider}
                                                className="rounded-lg border border-border bg-zinc-900/30 px-4 py-4"
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-zinc-100">
                                                                {provider.label}
                                                            </p>
                                                            <span
                                                                className={cn(
                                                                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase',
                                                                    provider.connected
                                                                        ? 'border-emerald-900/50 text-emerald-400'
                                                                        : 'border-zinc-700 text-zinc-400',
                                                                )}
                                                            >
                                                                {provider.connected
                                                                    ? 'Connected'
                                                                    : 'Not connected'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-zinc-500">
                                                            Last sync:{' '}
                                                            {formatOptionalDate(
                                                                provider.last_synced_at,
                                                            )}
                                                        </p>
                                                        {provider.last_sync_status !== null ? (
                                                            <p className="text-xs text-zinc-500">
                                                                Sync status:{' '}
                                                                {formatSyncStatus(
                                                                    provider.last_sync_status,
                                                                )}
                                                            </p>
                                                        ) : null}
                                                        {provider.last_sync_reason !== null &&
                                                        (provider.last_sync_status ===
                                                            'failed' ||
                                                            provider.last_sync_status ===
                                                                'rate_limited') ? (
                                                            <p className="text-xs text-amber-300">
                                                                Sync detail:{' '}
                                                                {provider.last_sync_reason}
                                                            </p>
                                                        ) : null}
                                                        {syncMessageByProvider[
                                                            provider.provider
                                                        ] ? (
                                                            <p className="text-xs text-emerald-400">
                                                                {
                                                                    syncMessageByProvider[
                                                                        provider
                                                                            .provider
                                                                    ]
                                                                }
                                                            </p>
                                                        ) : null}
                                                        {syncErrorByProvider[
                                                            provider.provider
                                                        ] ? (
                                                            <p className="text-xs text-red-300">
                                                                {
                                                                    syncErrorByProvider[
                                                                        provider
                                                                            .provider
                                                                    ]
                                                                }
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    {canManageConnections ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {provider.connected ? (
                                                                <>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="gap-1.5"
                                                                        disabled={
                                                                            isSyncing ||
                                                                            hasSyncInProgress
                                                                        }
                                                                        onClick={() => {
                                                                            void syncNow(
                                                                                provider.provider,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {isSyncing ? (
                                                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                                        )}
                                                                        {isSyncing
                                                                            ? 'Syncing...'
                                                                            : hasSyncInProgress
                                                                              ? 'Sync queued'
                                                                              : 'Sync now'}
                                                                    </Button>
                                                                    <Link
                                                                        href={disconnect(
                                                                            provider.provider,
                                                                        ).url}
                                                                        method="delete"
                                                                        as="button"
                                                                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800/70"
                                                                    >
                                                                        <Link2Off className="h-3.5 w-3.5" />
                                                                        Disconnect
                                                                    </Link>
                                                                </>
                                                            ) : (
                                                                <Link
                                                                    href={connect(
                                                                        provider.provider,
                                                                    ).url}
                                                                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
                                                                >
                                                                    <Link2 className="h-3.5 w-3.5" />
                                                                    Connect
                                                                </Link>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-zinc-500">
                                                            This role cannot manage provider
                                                            connections.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ) : null}

                        {selectedTab === 'billing' ? (
                            <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
                                <header className="mb-8 border-b border-border pb-6">
                                    <h2 className="text-xl font-medium text-zinc-200">
                                        Billing &amp; Plans
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Cashier/Stripe wiring comes in a dedicated billing phase.
                                    </p>
                                </header>

                                <div className="space-y-6">
                                    <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/10 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-medium text-emerald-400">
                                                    Advanced Athlete
                                                </h3>
                                                <p className="mt-1 text-sm text-zinc-400">
                                                    Billing shell only. Subscription wiring is not enabled yet.
                                                </p>
                                            </div>
                                            <span className="font-mono text-xl text-zinc-200">
                                                —
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="billing-name"
                                                className="text-xs text-zinc-500"
                                            >
                                                Billing Name
                                            </label>
                                            <input
                                                id="billing-name"
                                                defaultValue={profile.name}
                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="billing-email"
                                                className="text-xs text-zinc-500"
                                            >
                                                Billing Email
                                            </label>
                                            <input
                                                id="billing-email"
                                                defaultValue={profile.email}
                                                className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-500">
                                        Billing fields are editable as a UI shell in this phase. Payment
                                        processing and invoicing will be added in the dedicated Cashier
                                        integration step.
                                    </p>
                                </div>
                            </section>
                        ) : null}
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}

function formatOptionalDate(value: string | null): string {
    if (value === null) {
        return 'Never';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Never';
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatSyncStatus(status: string): string {
    return status.replaceAll('_', ' ');
}

function formatSettingsStatus(status: string): string {
    switch (status) {
        case 'profile_saved':
            return 'Profile settings saved.';
        case 'training_preferences_saved':
            return 'Training preferences saved.';
        default:
            return 'Settings updated.';
    }
}

function parseNullableInteger(value: string): number | null {
    if (value.trim() === '') {
        return null;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : null;
}
