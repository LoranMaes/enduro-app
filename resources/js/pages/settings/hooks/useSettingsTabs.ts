import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { overview as settingsOverview } from '@/routes/settings';
import type { SettingsTab } from '../types';

type UseSettingsTabsParams = {
    activeTab: SettingsTab;
    role: 'athlete' | 'coach' | 'admin';
};

export function useSettingsTabs({ activeTab, role }: UseSettingsTabsParams) {
    const [selectedTab, setSelectedTab] = useState<SettingsTab>(activeTab);

    useEffect(() => {
        setSelectedTab(activeTab);
    }, [activeTab]);

    const availableTabs = useMemo((): SettingsTab[] => {
        if (role === 'athlete') {
            return ['profile', 'training', 'integrations', 'billing'];
        }

        return ['profile', 'integrations', 'billing'];
    }, [role]);

    const changeTab = (tab: SettingsTab): void => {
        setSelectedTab(tab);

        router.get(
            settingsOverview().url,
            { tab },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['activeTab', 'settingsStatus', 'connectionStatusMessage'],
            },
        );
    };

    return {
        selectedTab,
        availableTabs,
        changeTab,
    };
}
