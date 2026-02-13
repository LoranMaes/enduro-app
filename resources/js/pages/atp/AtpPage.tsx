import { Head, router } from '@inertiajs/react';
import { useCallback } from 'react';
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
    priorityOptions,
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

                <AtpHeaderChart weeks={weeks} onSelectWeek={openCalendarWeek} />

                <AtpWeekTable
                    weeks={weeks}
                    weekTypeOptions={weekTypeOptions}
                    priorityOptions={priorityOptions}
                    updatingWeekStart={updatingWeekStart}
                    onOpenWeek={openCalendarWeek}
                    onUpdateWeek={(weekStart, payload) => {
                        void updateWeek(weekStart, payload);
                    }}
                />
            </div>
        </div>
    );
}
