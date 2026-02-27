import { ScrollArea } from '@/components/ui/scroll-area';
import type { AtpWeek } from '../types';
import { AtpWeekRow } from './AtpWeekRow';

type AtpWeekTableProps = {
    weeks: AtpWeek[];
    weekTypeOptions: string[];
    updatingWeekStart: string | null;
    onOpenWeek: (weekStart: string) => void;
    onUpdateWeek: (
        weekStart: string,
        payload: {
            week_type?: string;
        },
    ) => void;
};

export function AtpWeekTable({
    weeks,
    weekTypeOptions,
    updatingWeekStart,
    onOpenWeek,
    onUpdateWeek,
}: AtpWeekTableProps) {
    return (
        <ScrollArea className="rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[56rem] border-collapse">
                <thead className="sticky top-0 z-10 bg-background/95 text-[0.6875rem] tracking-wide text-zinc-500 uppercase backdrop-blur-sm">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium">Week range</th>
                        <th className="px-3 py-2 text-left font-medium">Week type</th>
                        <th className="px-3 py-2 text-left font-medium">Planned hours</th>
                        <th className="px-3 py-2 text-left font-medium">Completed hours</th>
                        <th className="px-3 py-2 text-left font-medium">Planned TSS</th>
                        <th className="px-3 py-2 text-left font-medium">Completed TSS</th>
                        <th className="px-3 py-2 text-left font-medium">Goal</th>
                    </tr>
                </thead>
                <tbody>
                    {weeks.map((week) => (
                        <AtpWeekRow
                            key={week.week_start_date}
                            week={week}
                            weekTypeOptions={weekTypeOptions}
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
