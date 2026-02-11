import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { initializeEcho } from '@/lib/echo';
import { sync as syncActivityProvider } from '@/routes/activity-providers';
import type { SharedData } from '@/types';
import { settingsBreadcrumbs } from './constants';
import { BillingPanel } from './components/BillingPanel';
import { IntegrationsPanel } from './components/IntegrationsPanel';
import { ProfileSettingsForm } from './components/ProfileSettingsForm';
import { SettingsSectionCard } from './components/SettingsSectionCard';
import { SettingsTabs } from './components/SettingsTabs';
import { TrainingPreferencesForm } from './components/TrainingPreferencesForm';
import { useProfileSettings } from './hooks/useProfileSettings';
import { useSettingsTabs } from './hooks/useSettingsTabs';
import { useTrainingPreferences } from './hooks/useTrainingPreferences';
import type {
    SettingsOverviewProps,
    SyncMessagesByProvider,
    SyncStatusEvent,
} from './types';
import {
    formatSettingsStatus,
    resolveSyncStatusMessage,
} from './utils';

export function SettingsPage({
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
    const { selectedTab, availableTabs, changeTab } = useSettingsTabs({
        activeTab,
        role,
    });
    const { profileForm, submitProfile } = useProfileSettings({ profile });
    const {
        trainingForm,
        resolveZoneError,
        updateZoneValue,
        setNullableNumberField,
        submitTrainingPreferences,
    } = useTrainingPreferences({ trainingPreferences });

    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [syncMessageByProvider, setSyncMessageByProvider] =
        useState<SyncMessagesByProvider>({});
    const [syncErrorByProvider, setSyncErrorByProvider] =
        useState<SyncMessagesByProvider>({});

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

        channel.listen(eventName, (event: SyncStatusEvent) => {
            if (typeof event.provider !== 'string' || event.provider === '') {
                return;
            }

            const provider = event.provider;
            const status =
                typeof event.status === 'string' ? event.status.toLowerCase() : null;

            setSyncingProvider((current) =>
                current === provider ? null : current,
            );

            if (status !== null) {
                setSyncMessageByProvider((current) => ({
                    ...current,
                    [provider]: resolveSyncStatusMessage(status),
                }));

                if (status === 'failed' || status === 'rate_limited') {
                    setSyncErrorByProvider((current) => ({
                        ...current,
                        [provider]:
                            typeof event.reason === 'string' ? event.reason : '',
                    }));
                } else {
                    setSyncErrorByProvider((current) => ({
                        ...current,
                        [provider]: '',
                    }));
                }
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
        <AppLayout breadcrumbs={settingsBreadcrumbs}>
            <Head title="Settings" />

            <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
                <SettingsTabs
                    role={role}
                    availableTabs={availableTabs}
                    selectedTab={selectedTab}
                    onSelectTab={changeTab}
                />

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
                            <SettingsSectionCard
                                title="Profile"
                                description="Manage personal details and account defaults."
                            >
                                <ProfileSettingsForm
                                    profileForm={profileForm}
                                    onSubmit={submitProfile}
                                />
                            </SettingsSectionCard>
                        ) : null}

                        {selectedTab === 'training' && role === 'athlete' ? (
                            <SettingsSectionCard
                                title="Training Preferences"
                                description="Configure baseline planning defaults for athlete workflows."
                            >
                                <TrainingPreferencesForm
                                    trainingForm={trainingForm}
                                    resolveZoneError={resolveZoneError}
                                    updateZoneValue={updateZoneValue}
                                    setNullableNumberField={setNullableNumberField}
                                    onSubmit={submitTrainingPreferences}
                                />
                            </SettingsSectionCard>
                        ) : null}

                        {selectedTab === 'integrations' ? (
                            <SettingsSectionCard
                                title="Integrations"
                                description="Connect activity providers and run syncs from one place."
                            >
                                <IntegrationsPanel
                                    providers={providers}
                                    canManageConnections={canManageConnections}
                                    syncingProvider={syncingProvider}
                                    syncMessageByProvider={syncMessageByProvider}
                                    syncErrorByProvider={syncErrorByProvider}
                                    onSyncNow={syncNow}
                                />
                            </SettingsSectionCard>
                        ) : null}

                        {selectedTab === 'billing' ? (
                            <SettingsSectionCard
                                title="Billing & Plans"
                                description="Cashier/Stripe wiring comes in a dedicated billing phase."
                            >
                                <BillingPanel
                                    name={profile.name}
                                    email={profile.email}
                                />
                            </SettingsSectionCard>
                        ) : null}
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
