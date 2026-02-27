import { Head } from '@inertiajs/react';
import { SettingsPage } from './SettingsPage';
import type { SettingsOverviewProps } from './types';

export default function SettingsOverview(props: SettingsOverviewProps) {
    return (
        <>
            <Head title="Settings" />
            <SettingsPage {...props} />
        </>
    );
}
