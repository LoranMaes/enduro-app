import { Link } from '@inertiajs/react';
import { Link2, Link2Off, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { connect, disconnect } from '@/routes/settings/connections';
import type { ProviderConnection, SyncMessagesByProvider } from '../types';
import { formatOptionalDate, formatSyncStatus } from '../utils';

type IntegrationsPanelProps = {
    providers: ProviderConnection[];
    canManageConnections: boolean;
    syncingProvider: string | null;
    syncMessageByProvider: SyncMessagesByProvider;
    syncErrorByProvider: SyncMessagesByProvider;
    onSyncNow: (provider: string) => Promise<void>;
};

export function IntegrationsPanel({
    providers,
    canManageConnections,
    syncingProvider,
    syncMessageByProvider,
    syncErrorByProvider,
    onSyncNow,
}: IntegrationsPanelProps) {
    return (
        <div className="space-y-4">
            {providers.map((provider) => {
                const isSyncing = syncingProvider === provider.provider;
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
                                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-medium uppercase',
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
                                    Last sync: {formatOptionalDate(provider.last_synced_at)}
                                </p>
                                {provider.last_sync_status !== null ? (
                                    <p className="text-xs text-zinc-500">
                                        Sync status:{' '}
                                        {formatSyncStatus(provider.last_sync_status)}
                                    </p>
                                ) : null}
                                {provider.last_sync_reason !== null &&
                                (provider.last_sync_status === 'failed' ||
                                    provider.last_sync_status === 'rate_limited') ? (
                                    <p className="text-xs text-amber-300">
                                        Sync detail: {provider.last_sync_reason}
                                    </p>
                                ) : null}
                                {syncMessageByProvider[provider.provider] ? (
                                    <p className="text-xs text-emerald-400">
                                        {syncMessageByProvider[provider.provider]}
                                    </p>
                                ) : null}
                                {syncErrorByProvider[provider.provider] ? (
                                    <p className="text-xs text-red-300">
                                        {syncErrorByProvider[provider.provider]}
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
                                                disabled={isSyncing || hasSyncInProgress}
                                                onClick={() => {
                                                    void onSyncNow(provider.provider);
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
                                                href={disconnect(provider.provider).url}
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
                                            href={connect(provider.provider).url}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
                                        >
                                            <Link2 className="h-3.5 w-3.5" />
                                            Connect
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-500">
                                    This role cannot manage provider connections.
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
