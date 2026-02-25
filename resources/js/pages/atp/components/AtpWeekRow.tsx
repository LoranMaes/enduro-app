import { usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { ATP_WEEK_TYPE_STYLES } from '../constants';
import type { AtpWeek } from '../types';
import { formatAtpDate, minutesToHourLabel } from '../utils';

type AtpWeekRowProps = {
    week: AtpWeek;
    weekTypeOptions: string[];
    isUpdating: boolean;
    onOpenWeek: (weekStart: string) => void;
    onUpdateWeek: (
        weekStart: string,
        payload: {
            week_type?: string;
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
    isUpdating,
    onOpenWeek,
    onUpdateWeek,
}: AtpWeekRowProps) {
    const { auth } = usePage<SharedData>().props;
    const timezone =
        typeof auth.user.timezone === 'string' ? auth.user.timezone : null;
    const weekTypeStyle =
        ATP_WEEK_TYPE_STYLES[week.week_type] ?? ATP_WEEK_TYPE_STYLES.default;
    const loadStateClass =
        week.load_state === 'in_range'
            ? 'border-emerald-500/40 text-emerald-300'
            : week.load_state === 'high'
              ? 'border-amber-500/40 text-amber-300'
              : week.load_state === 'low'
                ? 'border-zinc-700 text-zinc-300'
                : 'border-zinc-800 text-zinc-500';

    return (
        <tr
            className={cn(
                'border-b border-border/70 text-sm text-zinc-300 last:border-b-0',
                week.is_current_week && 'bg-zinc-900/35',
            )}
        >
            <td className="px-3 py-2 align-middle">
                <button
                    type="button"
                    className="text-left text-xs text-zinc-300 transition-colors hover:text-zinc-100"
                    onClick={() => {
                        onOpenWeek(week.week_start_date);
                    }}
                >
                    <span className="block font-medium">
                        {formatAtpDate(week.week_start_date, timezone)}
                    </span>
                    <span className="text-zinc-500">
                        {formatAtpDate(week.week_end_date, timezone)}
                    </span>
                    {week.is_current_week ? (
                        <span className="mt-0.5 block text-[0.625rem] text-zinc-400">
                            Current week
                        </span>
                    ) : null}
                </button>
            </td>
            <td className="px-3 py-2 align-middle">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'h-2 w-2 rounded-full',
                            weekTypeStyle.dotClassName,
                        )}
                        aria-hidden="true"
                    />
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
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[0.625rem] capitalize',
                            weekTypeStyle.chipClassName,
                        )}
                    >
                        {week.week_type.replace('_', ' ')}
                    </Badge>
                </div>
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-300">
                {minutesToHourLabel(week.planned_minutes)}
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-300">
                {minutesToHourLabel(week.completed_minutes)}
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-500">
                <span className="font-mono">
                    {week.planned_tss !== null ? week.planned_tss : '—'}
                </span>
            </td>
            <td className="px-3 py-2 align-middle text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                    {week.completed_tss !== null ? (
                        <span className="font-mono">{week.completed_tss}</span>
                    ) : null}
                    <Badge
                        variant="outline"
                        className={cn('text-[0.625rem] capitalize', loadStateClass)}
                    >
                        {week.load_state.replace('_', ' ')}
                    </Badge>
                </div>
            </td>
            <td className="px-3 py-2 align-middle">
                {week.primary_goal !== null ? (
                    <div className="flex items-center gap-2">
                        <span className="max-w-44 truncate text-xs text-zinc-300" title={week.primary_goal.title}>
                            {week.primary_goal.title}
                        </span>
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
                    </div>
                ) : (
                    <span className="text-xs text-zinc-600">—</span>
                )}
            </td>
        </tr>
    );
}
