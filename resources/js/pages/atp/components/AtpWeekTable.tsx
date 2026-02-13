import { ScrollArea } from '@/components/ui/scroll-area';
import type { AtpWeek } from '../types';
import { AtpWeekRow } from './AtpWeekRow';

type AtpWeekTableProps = {
    weeks: AtpWeek[];
    weekTypeOptions: string[];
    priorityOptions: string[];
    updatingWeekStart: string | null;
    onOpenWeek: (weekStart: string) => void;
    onUpdateWeek: (
        weekStart: string,
        payload: {
            week_type?: string;
            priority?: string;
        },
    ) => void;
};

export function AtpWeekTable({
    weeks,
    weekTypeOptions,
    priorityOptions,
    updatingWeekStart,
    onOpenWeek,
    onUpdateWeek,
}: AtpWeekTableProps) {
    return (
        <ScrollArea className="rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[76rem] border-collapse">
                <thead className="bg-background/60 text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium">Week range</th>
                        <th className="px-3 py-2 text-left font-medium">Weeks to goal</th>
                        <th className="px-3 py-2 text-left font-medium">Week type</th>
                        <th className="px-3 py-2 text-left font-medium">Priority</th>
                        <th className="px-3 py-2 text-left font-medium">Planned hours</th>
                        <th className="px-3 py-2 text-left font-medium">Completed hours</th>
                        <th className="px-3 py-2 text-left font-medium">Planned TSS</th>
                        <th className="px-3 py-2 text-left font-medium">Completed TSS</th>
                        <th className="px-3 py-2 text-left font-medium">Goal priority</th>
                    </tr>
                </thead>
                <tbody>
                    {weeks.map((week) => (
                        <AtpWeekRow
                            key={week.week_start_date}
                            week={week}
                            weekTypeOptions={weekTypeOptions}
                            priorityOptions={priorityOptions}
                            isUpdating={updatingWeekStart === week.week_start_date}
                            onOpenWeek={onOpenWeek}
                            onUpdateWeek={onUpdateWeek}
                        />
                    ))}
                </tbody>
            </table>
        </ScrollArea>
    );
}
