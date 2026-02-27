import { ATP_WEEK_TYPE_STYLES } from '../constants';

export function AtpLegend() {
    const weekTypeOrder = [
        'base',
        'build',
        'recovery',
        'peak',
        'race',
        'transition',
    ] as const;

    return (
        <div className="flex flex-wrap items-center gap-3 text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
            <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                Planned minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Completed minutes
            </span>
            <span className="text-zinc-600">TSS: actual values</span>
            {weekTypeOrder.map((weekType) => (
                <span key={weekType} className="inline-flex items-center gap-1.5">
                    <span
                        className={`h-2 w-2 rounded-full ${ATP_WEEK_TYPE_STYLES[weekType].dotClassName}`}
                    />
                    {weekType}
                </span>
            ))}
        </div>
    );
}
