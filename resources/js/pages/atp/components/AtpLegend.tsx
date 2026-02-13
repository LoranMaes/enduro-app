import { ATP_TSS_PLACEHOLDER } from '../constants';

export function AtpLegend() {
    return (
        <div className="flex flex-wrap items-center gap-3 text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
            <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                Planned minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Completed minutes
            </span>
            <span>{`TSS: ${ATP_TSS_PLACEHOLDER}`}</span>
        </div>
    );
}
