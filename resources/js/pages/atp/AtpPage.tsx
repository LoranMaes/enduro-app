import { Head, router } from '@inertiajs/react';
import { useCallback } from 'react';
import { FeatureLockedCard } from '@/components/feature-locked-card';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import { AtpHeaderChart } from './components/AtpHeaderChart';
import { AtpLegend } from './components/AtpLegend';
import { AtpWeekTable } from './components/AtpWeekTable';
import { AtpYearSwitcher } from './components/AtpYearSwitcher';
import { useAtpData } from './hooks/useAtpData';
import { useAtpNavigation } from './hooks/useAtpNavigation';
import type { AtpPageProps } from './types';
import { minutesToHourLabel } from './utils';

export function AtpPage({
    year,
    plan,
    weekTypeOptions,
    isLocked,
}: AtpPageProps) {
    const navigation = useAtpNavigation(year);
    const {
        weeks,
        summary,
        updatingWeekStart,
        errorMessage,
        updateWeek,
    } = useAtpData({
        year,
        initialPlan: plan,
    });

    const openCalendarWeek = useCallback((weekStart: string): void => {
        router.visit(
            dashboard({
                query: {
                    week: weekStart,
                },
            }).url,
            {
                preserveScroll: true,
            },
        );
    }, []);

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <Head title="Annual Training Plan" />
            <header className="border-b border-border px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                            Annual Training Plan
                        </p>
                        <h1 className="mt-1 text-3xl font-medium text-zinc-100">ATP</h1>
                    </div>
                    <AtpYearSwitcher
                        year={year}
                        onPreviousYear={navigation.goToPreviousYear}
                        onNextYear={navigation.goToNextYear}
                    />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs text-zinc-300">
                        Planned {minutesToHourLabel(summary.plannedMinutes)}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-zinc-300">
                        Completed {minutesToHourLabel(summary.completedMinutes)}
                    </Badge>
                    {isLocked ? (
                        <Badge variant="outline" className="text-xs text-amber-300">
                            Premium preview
                        </Badge>
                    ) : null}
                </div>
                <div className="mt-3">
                    <AtpLegend />
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
                {errorMessage !== null ? (
                    <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {errorMessage}
                    </p>
                ) : null}

                <div className="relative min-h-[24rem]">
                    <div
                        className={
                            isLocked
                                ? 'pointer-events-none select-none blur-sm saturate-50'
                                : ''
                        }
                    >
                        <AtpHeaderChart weeks={weeks} onSelectWeek={openCalendarWeek} />

                        <div className="mt-4">
                            <AtpWeekTable
                                weeks={weeks}
                                weekTypeOptions={weekTypeOptions}
                                updatingWeekStart={updatingWeekStart}
                                onOpenWeek={openCalendarWeek}
                                onUpdateWeek={(weekStart, payload) => {
                                    if (isLocked) {
                                        return;
                                    }

                                    void updateWeek(weekStart, payload);
                                }}
                            />
                        </div>
                    </div>

                    {isLocked ? (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
                            <div className="pointer-events-auto w-full max-w-md">
                                <FeatureLockedCard
                                    title="Annual Training Plan is a premium feature"
                                    description="Unlock ATP editing, yearly overview insights, and week-level planning tools."
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
