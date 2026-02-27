export function parseNullableInteger(value: string): number | null {
    if (value.trim() === '') {
        return null;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : null;
}

export function formatOptionalDate(value: string | null): string {
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

export function formatSyncStatus(status: string): string {
    return status.replaceAll('_', ' ');
}

export function formatSettingsStatus(status: string): string {
    switch (status) {
        case 'profile_saved':
            return 'Profile settings saved.';
        case 'training_preferences_saved':
            return 'Training preferences saved.';
        default:
            return 'Settings updated.';
    }
}

export function resolveSyncStatusMessage(status: string): string {
    if (status === 'success') {
        return 'Sync completed.';
    }

    if (status === 'running') {
        return 'Syncing...';
    }

    if (status === 'queued') {
        return 'Sync queued.';
    }

    if (status === 'rate_limited') {
        return 'Sync rate limited.';
    }

    if (status === 'failed') {
        return 'Sync failed.';
    }

    return `Sync status: ${status}.`;
}
