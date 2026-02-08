import { Head, Link, router, usePage } from '@inertiajs/react';
import { Link2, Link2Off, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { initializeEcho } from '@/lib/echo';
import SettingsLayout from '@/layouts/settings/layout';
import { sync as syncActivityProvider } from '@/routes/activity-providers';
import { connections as settingsConnections, overview } from '@/routes/settings';
import { connect, disconnect } from '@/routes/settings/connections';
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

type ConnectionsPageProps = {
    providers: ProviderConnection[];
    canManageConnections: boolean;
    statusMessage: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: overview().url,
    },
    {
        title: 'Connections',
        href: settingsConnections().url,
    },
];

export default function Connections({
    providers,
    canManageConnections,
    statusMessage,
}: ConnectionsPageProps) {
    const { auth } = usePage<SharedData>().props;
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [syncMessageByProvider, setSyncMessageByProvider] = useState<
        Record<string, string>
    >({});
    const [syncErrorByProvider, setSyncErrorByProvider] = useState<
        Record<string, string>
    >({});

    const hasProviders = providers.length > 0;

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
                typeof payload?.status === 'string'
                    ? payload.status
                    : 'queued';

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
            <Head title="Connections" />

            <h1 className="sr-only">Connections</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Connections"
                        description="Manage external activity provider connections and trigger manual syncs."
                    />

                    {statusMessage ? (
                        <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-zinc-300">
                            {statusMessage}
                        </p>
                    ) : null}

                    {hasProviders ? (
                        <div className="space-y-4">
                            {providers.map((providerConnection) => {
                                const isSyncing =
                                    syncingProvider ===
                                    providerConnection.provider;
                                const hasSyncInProgress =
                                    providerConnection.last_sync_status ===
                                        'queued' ||
                                    providerConnection.last_sync_status ===
                                        'running';
                                const connectionStatusClass =
                                    providerConnection.connected
                                        ? 'border-emerald-900/50 text-emerald-400'
                                        : 'border-zinc-700 text-zinc-400';

                                return (
                                    <section
                                        key={providerConnection.provider}
                                        className="space-y-4 rounded-xl border border-border bg-surface px-4 py-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-zinc-100">
                                                        {providerConnection.label}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${connectionStatusClass}`}
                                                    >
                                                        {providerConnection.connected
                                                            ? 'Connected'
                                                            : 'Not connected'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500">
                                                    Last sync:{' '}
                                                    {formatOptionalDate(
                                                        providerConnection.last_synced_at,
                                                    )}
                                                </p>
                                                {providerConnection.last_sync_status ? (
                                                    <p className="text-xs text-zinc-500">
                                                        Sync status:{' '}
                                                        {formatSyncStatus(
                                                            providerConnection.last_sync_status,
                                                        )}
                                                    </p>
                                                ) : null}
                                                {providerConnection.last_sync_status ===
                                                    'failed' ||
                                                providerConnection.last_sync_status ===
                                                    'rate_limited' ? (
                                                    <p className="text-xs text-amber-300">
                                                        Sync detail:{' '}
                                                        {providerConnection.last_sync_reason ??
                                                            'Unknown reason'}
                                                    </p>
                                                ) : null}
                                                {syncMessageByProvider[
                                                    providerConnection.provider
                                                ] ? (
                                                    <p className="text-xs text-emerald-400">
                                                        {
                                                            syncMessageByProvider[
                                                                providerConnection
                                                                    .provider
                                                            ]
                                                        }
                                                    </p>
                                                ) : null}
                                                {syncErrorByProvider[
                                                    providerConnection.provider
                                                ] ? (
                                                    <p className="text-xs text-red-300">
                                                        {
                                                            syncErrorByProvider[
                                                                providerConnection
                                                                    .provider
                                                            ]
                                                        }
                                                    </p>
                                                ) : null}
                                            </div>

                                            {canManageConnections ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {providerConnection.connected ? (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={
                                                                    isSyncing ||
                                                                    hasSyncInProgress
                                                                }
                                                                onClick={() =>
                                                                    void syncNow(
                                                                        providerConnection.provider,
                                                                    )
                                                                }
                                                                className="gap-1.5"
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
                                                                    providerConnection.provider,
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
                                                                providerConnection.provider,
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
                                                    Coach accounts cannot manage
                                                    provider connections.
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border px-4 py-6">
                            <p className="text-sm text-zinc-500">
                                No activity providers are configured.
                            </p>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

function formatOptionalDate(value: string | null): string {
    if (value === null) {
        return '\u2014';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '\u2014';
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatSyncStatus(value: string): string {
    switch (value) {
        case 'queued':
            return 'Queued';
        case 'running':
            return 'Syncing';
        case 'rate_limited':
            return 'Rate limited';
        case 'failed':
            return 'Failed';
        case 'success':
            return 'Success';
        default:
            return value;
    }
}
