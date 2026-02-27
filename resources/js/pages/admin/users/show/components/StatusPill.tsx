import { Badge } from '@/components/ui/badge';

type StatusPillProps = {
    status: string;
};

export function StatusPill({ status }: StatusPillProps) {
    if (status === 'active') {
        return (
            <Badge className="inline-flex items-center gap-1.5 border-transparent bg-emerald-950/30 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-emerald-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
            </Badge>
        );
    }

    if (status === 'rejected') {
        return (
            <Badge className="inline-flex items-center gap-1.5 border-transparent bg-red-950/40 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-red-300 uppercase">
                Rejected
            </Badge>
        );
    }

    if (status === 'suspended') {
        return (
            <Badge className="inline-flex items-center gap-1.5 border-transparent bg-zinc-800 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-zinc-200 uppercase">
                Suspended
            </Badge>
        );
    }

    return (
        <Badge className="inline-flex items-center gap-1.5 border-transparent bg-amber-950/35 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-amber-300 uppercase">
            Pending
        </Badge>
    );
}
