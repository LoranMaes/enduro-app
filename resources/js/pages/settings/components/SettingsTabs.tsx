import { cn } from '@/lib/utils';
import { tabIcons, tabLabels } from '../constants';
import type { SettingsTab } from '../types';

type SettingsTabsProps = {
    role: 'athlete' | 'coach' | 'admin';
    availableTabs: SettingsTab[];
    selectedTab: SettingsTab;
    onSelectTab: (tab: SettingsTab) => void;
};

export function SettingsTabs({
    role,
    availableTabs,
    selectedTab,
    onSelectTab,
}: SettingsTabsProps) {
    return (
        <aside className="hidden w-64 shrink-0 border-r border-border bg-background px-6 py-8 md:block">
            <h1 className="text-xl font-medium text-zinc-100">Settings</h1>
            <div className="mt-2 inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-[0.625rem] font-medium tracking-wider text-zinc-400 uppercase">
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
                                onSelectTab(tab);
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
    );
}
