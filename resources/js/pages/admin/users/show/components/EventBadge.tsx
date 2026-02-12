import { Badge } from '@/components/ui/badge';

type EventBadgeProps = {
    event: string | null;
};

export function EventBadge({ event }: EventBadgeProps) {
    const value = (event ?? 'unknown').toLowerCase();
    const baseClass =
        value === 'created' || value === 'post'
            ? 'bg-emerald-500/15 text-emerald-300'
            : value === 'updated' || value === 'put' || value === 'patch'
              ? 'bg-sky-500/15 text-sky-300'
              : value === 'deleted' || value === 'delete'
                ? 'bg-red-500/15 text-red-300'
                : 'bg-zinc-700/60 text-zinc-300';

    return (
        <Badge
            className={`inline-flex w-fit items-center border-transparent px-2 py-0.5 text-[0.625rem] tracking-wide uppercase ${baseClass}`}
        >
            {value}
        </Badge>
    );
}
