import { ArrowDown, ArrowUp, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    TicketStatusKey,
    TicketImportance,
    TicketType,
} from '../types';

type Filters = {
    sort:
        | 'title'
        | 'status'
        | 'type'
        | 'importance'
        | 'created_at'
        | 'updated_at';
    direction: 'asc' | 'desc';
};

export function TypeBadge({ type }: { type: TicketType }) {
    const classes: Record<TicketType, string> = {
        bug: 'border-rose-900/60 bg-rose-950/30 text-rose-300',
        feature: 'border-sky-900/60 bg-sky-950/30 text-sky-300',
        chore: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
        support: 'border-violet-900/60 bg-violet-950/30 text-violet-300',
    };

    return (
        <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[0.625rem] capitalize ${classes[type]}`}
        >
            {type}
        </Badge>
    );
}

export function ImportanceDot({ importance }: { importance: TicketImportance }) {
    const classes: Record<TicketImportance, string> = {
        low: 'bg-zinc-500',
        normal: 'bg-sky-500',
        high: 'bg-amber-500',
        urgent: 'bg-red-500',
    };

    return (
        <Badge
            variant="outline"
            className="h-2 w-2 rounded-full border-transparent p-0"
            aria-label={`Importance: ${importance}`}
        >
            <span className={`h-2 w-2 rounded-full ${classes[importance]}`} />
        </Badge>
    );
}

export function ImportanceLabel({ importance }: { importance: TicketImportance }) {
    const classes: Record<TicketImportance, string> = {
        low: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
        normal: 'border-sky-900/60 bg-sky-950/30 text-sky-300',
        high: 'border-amber-900/60 bg-amber-950/30 text-amber-300',
        urgent: 'border-red-900/60 bg-red-950/30 text-red-300',
    };

    return (
        <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[0.625rem] capitalize ${classes[importance]}`}
        >
            {importance}
        </Badge>
    );
}

export function StatusBadge({ status }: { status: TicketStatusKey }) {
    const classes: Record<TicketStatusKey, string> = {
        todo: 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300',
        in_progress: 'border-sky-900/60 bg-sky-950/30 text-sky-300',
        to_review: 'border-amber-900/60 bg-amber-950/30 text-amber-300',
        done: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
    };

    return (
        <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[0.625rem] capitalize ${classes[status]}`}
        >
            {status.replace('_', ' ')}
        </Badge>
    );
}

export function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-9 border-border bg-background text-xs text-zinc-200 focus-visible:ring-zinc-700">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-surface text-zinc-200">
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-xs focus:bg-zinc-800 focus:text-zinc-100"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function HeaderButton({
    label,
    sortKey,
    currentSort,
    currentDirection,
    onClick,
}: {
    label: string;
    sortKey: Filters['sort'];
    currentSort: Filters['sort'];
    currentDirection: Filters['direction'];
    onClick: (nextDirection: Filters['direction']) => void;
}) {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-1 text-[0.625rem] tracking-wide text-zinc-500 uppercase transition-colors hover:text-zinc-300"
            onClick={() =>
                onClick(
                    currentSort === sortKey && currentDirection === 'asc'
                        ? 'desc'
                        : 'asc',
                )
            }
        >
            {label}
            {currentSort === sortKey ? (
                currentDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                ) : (
                    <ArrowDown className="h-3 w-3" />
                )
            ) : null}
        </button>
    );
}

export function highlightSearchMatch(text: string, search: string): ReactNode {
    const query = search.trim();

    if (query === '') {
        return text;
    }

    const index = text.toLowerCase().indexOf(query.toLowerCase());

    if (index === -1) {
        return text;
    }

    const start = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const end = text.slice(index + query.length);

    return (
        <>
            {start}
            <mark className="rounded-sm bg-sky-500/20 px-0.5 text-sky-100">
                {match}
            </mark>
            {end}
        </>
    );
}

export function AssigneeLabel({
    name,
}: {
    name: string | null;
}) {
    if (name === null) {
        return (
            <Badge
                variant="outline"
                className="px-1.5 py-0 text-[0.625rem] text-zinc-500 italic"
            >
                Unassigned
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="inline-flex items-center gap-1 px-1.5 py-0 text-[0.625rem] text-zinc-300"
        >
            <UserRound className="h-3 w-3" />
            {name}
        </Badge>
    );
}
