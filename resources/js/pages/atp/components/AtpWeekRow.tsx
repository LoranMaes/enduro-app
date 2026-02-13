import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ATP_TSS_PLACEHOLDER } from '../constants';
import type { AtpWeek } from '../types';
import { minutesToHourLabel } from '../utils';

type AtpWeekRowProps = {
    week: AtpWeek;
    weekTypeOptions: string[];
    priorityOptions: string[];
    isUpdating: boolean;
    onOpenWeek: (weekStart: string) => void;
    onUpdateWeek: (
        weekStart: string,
        payload: {
            week_type?: string;
            priority?: string;
        },
    ) => void;
};

function optionLabel(value: string): string {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function AtpWeekRow({
    week,
    weekTypeOptions,
    priorityOptions,
    isUpdating,
    onOpenWeek,
    onUpdateWeek,
}: AtpWeekRowProps) {
    return (
        <tr className="border-b border-border/70 text-sm text-zinc-300 last:border-b-0">
            <td className="px-3 py-2 align-middle">
                <button
                    type="button"
                    className="text-left text-xs text-zinc-300 transition-colors hover:text-zinc-100"
                    onClick={() => {
                        onOpenWeek(week.week_start_date);
                    }}
                >
                    <span className="block font-medium">{week.week_start_date}</span>
                    <span className="text-zinc-500">{week.week_end_date}</span>
                </button>
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-400">
                {week.weeks_to_goal !== null ? `${week.weeks_to_goal}` : '—'}
                {week.primary_goal !== null ? (
                    <span className="mt-1 block truncate text-zinc-500" title={week.primary_goal.title}>
                        {week.primary_goal.title}
                    </span>
                ) : null}
            </td>
            <td className="px-3 py-2 align-middle">
                <Select
                    value={week.week_type}
                    onValueChange={(value) => {
                        onUpdateWeek(week.week_start_date, {
                            week_type: value,
                        });
                    }}
                    disabled={isUpdating}
                >
                    <SelectTrigger className="h-8 w-full border-border bg-background text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-surface text-zinc-200">
                        {weekTypeOptions.map((option) => (
                            <SelectItem key={option} value={option} className="text-xs">
                                {optionLabel(option)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-3 py-2 align-middle">
                <Select
                    value={week.priority}
                    onValueChange={(value) => {
                        onUpdateWeek(week.week_start_date, {
                            priority: value,
                        });
                    }}
                    disabled={isUpdating}
                >
                    <SelectTrigger className="h-8 w-full border-border bg-background text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-surface text-zinc-200">
                        {priorityOptions.map((option) => (
                            <SelectItem key={option} value={option} className="text-xs">
                                {optionLabel(option)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-300">
                {minutesToHourLabel(week.planned_minutes)}
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-300">
                {minutesToHourLabel(week.completed_minutes)}
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-500">
                {week.planned_tss !== null ? week.planned_tss : ATP_TSS_PLACEHOLDER}
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-500">
                {week.completed_tss !== null ? week.completed_tss : ATP_TSS_PLACEHOLDER}
            </td>
            <td className="px-3 py-2 align-middle">
                {week.primary_goal !== null ? (
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[0.625rem]',
                            week.primary_goal.priority === 'high'
                                ? 'border-amber-600/60 text-amber-300'
                                : week.primary_goal.priority === 'normal'
                                  ? 'border-zinc-700 text-zinc-300'
                                  : 'border-zinc-800 text-zinc-500',
                        )}
                    >
                        {week.primary_goal.priority}
                    </Badge>
                ) : (
                    <span className="text-xs text-zinc-600">—</span>
                )}
            </td>
        </tr>
    );
}
