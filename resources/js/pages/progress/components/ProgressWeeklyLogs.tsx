import { useMemo } from 'react';
import type { ProgressWeek } from '../types';
import { ProgressWeeklyLogRow } from './ProgressWeeklyLogRow';

type ProgressWeeklyLogsProps = {
    weeks: ProgressWeek[];
};

export function ProgressWeeklyLogs({ weeks }: ProgressWeeklyLogsProps) {
    const reversedWeeks = useMemo(() => {
        return [...weeks].reverse();
    }, [weeks]);

    return (
        <section className="mt-10">
            <h2 className="text-2xl font-medium text-zinc-200">Weekly Logs</h2>

            <div className="mt-4 flex flex-col gap-2">
                {reversedWeeks.map((week) => (
                    <ProgressWeeklyLogRow key={week.week_start} week={week} />
                ))}
            </div>
        </section>
    );
}
