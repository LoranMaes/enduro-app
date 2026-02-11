import { ChevronLeft, ChevronRight, Layers, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarViewMode } from '../types';

type CalendarHeaderProps = {
    viewingAthleteName: string | null;
    canManageSessionWrites: boolean;
    isRefreshing: boolean;
    integrationDotClass: string;
    integrationLabel: string;
    stravaSyncStatus: string | null;
    canShowSyncButton: boolean;
    isSyncDispatching: boolean;
    isStravaSyncInProgress: boolean;
    onSync: () => void;
    viewModes: CalendarViewMode[];
    calendarViewMode: CalendarViewMode;
    onModeChange: (mode: CalendarViewMode) => void;
    onShiftFocusDate: (direction: 'previous' | 'next') => void;
    focusLabel: string;
    jumpButtonVisible: boolean;
    onJumpToCurrentWeek: () => void;
    avatarInitials: string;
    headerGridTemplateColumns: string;
    activeDayHeaders: string[];
};

export function CalendarHeader({
    viewingAthleteName,
    canManageSessionWrites,
    isRefreshing,
    integrationDotClass,
    integrationLabel,
    stravaSyncStatus,
    canShowSyncButton,
    isSyncDispatching,
    isStravaSyncInProgress,
    onSync,
    viewModes,
    calendarViewMode,
    onModeChange,
    onShiftFocusDate,
    focusLabel,
    jumpButtonVisible,
    onJumpToCurrentWeek,
    avatarInitials,
    headerGridTemplateColumns,
    activeDayHeaders,
}: CalendarHeaderProps) {
    return (
        <>
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
                <div>
                    <h1 className="text-sm font-semibold text-white">
                        Training Calendar
                    </h1>
                    <p className="text-xs text-zinc-500">
                        {viewingAthleteName !== null
                            ? `Viewing athlete: ${viewingAthleteName}`
                            : 'Season 2026 • Build Phase 1'}
                        {!canManageSessionWrites ? ' • Read-only' : null}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isRefreshing ? (
                        <p
                            className="flex items-center gap-1.5 text-[11px] text-zinc-500"
                            aria-live="polite"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                            Refreshing
                        </p>
                    ) : null}
                    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                        <span
                            className={cn(
                                'h-2 w-2 rounded-full',
                                integrationDotClass,
                                stravaSyncStatus === 'running' &&
                                    'animate-pulse',
                            )}
                        />
                        <span className="text-zinc-400">{integrationLabel}</span>
                    </div>
                    {canShowSyncButton ? (
                        <button
                            type="button"
                            onClick={onSync}
                            disabled={isSyncDispatching || isStravaSyncInProgress}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-300 transition-colors',
                                isSyncDispatching || isStravaSyncInProgress
                                    ? 'cursor-not-allowed opacity-70'
                                    : 'hover:border-zinc-600 hover:text-white',
                            )}
                        >
                            <RefreshCw
                                className={cn(
                                    'h-3.5 w-3.5',
                                    (isSyncDispatching ||
                                        isStravaSyncInProgress) &&
                                        'animate-spin',
                                )}
                            />
                            {isSyncDispatching || isStravaSyncInProgress
                                ? 'Syncing'
                                : 'Sync'}
                        </button>
                    ) : null}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200">
                        {avatarInitials || 'U'}
                    </div>
                </div>
            </header>

            <div
                className="sticky z-[35] flex h-10 items-center justify-between border-b border-border bg-background px-6"
                style={{ top: 'var(--calendar-header-height)' }}
            >
                <div className="inline-flex items-center rounded-lg border border-border bg-surface/40 p-1">
                    {viewModes.map((mode) => {
                        const isActive = calendarViewMode === mode;

                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                    onModeChange(mode);
                                }}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                                    isActive
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300',
                                )}
                            >
                                {mode === 'infinite'
                                    ? 'Infinite'
                                    : mode.charAt(0).toUpperCase() +
                                      mode.slice(1)}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    {calendarViewMode !== 'infinite' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    onShiftFocusDate('previous');
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface/40 text-zinc-400 transition-colors hover:text-zinc-200"
                                aria-label="Previous range"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <p className="min-w-[120px] text-center text-[11px] text-zinc-400">
                                {focusLabel}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    onShiftFocusDate('next');
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface/40 text-zinc-400 transition-colors hover:text-zinc-200"
                                aria-label="Next range"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : null}

                    {jumpButtonVisible ? (
                        <button
                            type="button"
                            onClick={onJumpToCurrentWeek}
                            className="rounded-md border border-zinc-700/80 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                        >
                            Jump to current week
                        </button>
                    ) : null}
                </div>
            </div>

            <div
                className="sticky z-30 grid h-11 items-center border-b border-border bg-background"
                style={{
                    top: 'calc(var(--calendar-header-height) + var(--calendar-controls-height))',
                    gridTemplateColumns: headerGridTemplateColumns,
                }}
            >
                {activeDayHeaders.map((day) => (
                    <div
                        key={day}
                        className="flex h-11 items-center justify-center border-r border-border/30 px-2 text-center text-[10px] font-medium tracking-wider text-zinc-500 uppercase"
                    >
                        {day}
                    </div>
                ))}
                <div className="flex h-11 items-center justify-center border-l border-border px-3 py-1">
                    <div className="group flex max-w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-surface/50 px-2 py-1.5">
                        <button
                            type="button"
                            className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-zinc-400"
                            aria-label="Overlay plan (coming later)"
                            onClick={() => {}}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium whitespace-nowrap">
                                Overlay Plan
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
