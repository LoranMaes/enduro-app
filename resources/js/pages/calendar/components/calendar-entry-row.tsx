import {
    CalendarDays,
    Flag,
    StickyNote,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEntryView } from '@/types/training-plans';

const entryConfig: Record<
    string,
    {
        icon: LucideIcon;
        textColor: string;
        borderColor: string;
        label: string;
    }
> = {
    event: {
        icon: CalendarDays,
        textColor: 'text-cyan-300',
        borderColor: 'bg-cyan-400/80',
        label: 'Event',
    },
    goal: {
        icon: Flag,
        textColor: 'text-amber-300',
        borderColor: 'bg-amber-400/80',
        label: 'Goal',
    },
    note: {
        icon: StickyNote,
        textColor: 'text-zinc-300',
        borderColor: 'bg-zinc-400/80',
        label: 'Note',
    },
};

type CalendarEntryRowProps = {
    entry: CalendarEntryView;
    isInteractive?: boolean;
    onClick?: () => void;
};

export function CalendarEntryRow({
    entry,
    isInteractive = false,
    onClick,
}: CalendarEntryRowProps) {
    const config = entryConfig[entry.type] ?? entryConfig.note;
    const EntryIcon = config.icon;
    const title = entry.title?.trim() || config.label;

    const activate = (): void => {
        if (!isInteractive) {
            return;
        }

        onClick?.();
    };

    const Container = isInteractive ? 'button' : 'div';

    return (
        <Container
            {...(isInteractive
                ? {
                      type: 'button' as const,
                      onClick: (event) => {
                          event.stopPropagation();
                          activate();
                      },
                  }
                : {})}
            className={cn(
                'relative flex w-full flex-col overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-900/50 px-3 py-2 text-left',
                isInteractive &&
                    'cursor-pointer transition-colors hover:border-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:ring-offset-0 focus-visible:outline-none',
            )}
        >
            <span
                className={cn(
                    'absolute top-0 bottom-0 left-0 w-1',
                    config.borderColor,
                )}
            />
            <div className="flex items-center gap-2">
                <EntryIcon className={cn('h-3.5 w-3.5 shrink-0', config.textColor)} />
                <p className="truncate text-xs font-medium text-zinc-300">
                    {title}
                </p>
                <span className="ml-auto text-[0.625rem] text-zinc-500 uppercase">
                    {config.label}
                </span>
            </div>
        </Container>
    );
}
