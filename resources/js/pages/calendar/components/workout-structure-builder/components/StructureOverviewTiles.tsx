import { formatDurationMinutes } from '../utils';

type StructureOverviewTilesProps = {
    totalDuration: number;
    estimatedTss: number | null;
    blockCount: number;
};

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-2">
            <p className="text-[0.625rem] text-zinc-500 uppercase">{label}</p>
            <p className="mt-1 font-mono text-sm text-zinc-200">{value}</p>
        </div>
    );
}

export function StructureOverviewTiles({
    totalDuration,
    estimatedTss,
    blockCount,
}: StructureOverviewTilesProps) {
    return (
        <div className="grid grid-cols-3 gap-2 rounded-md border border-border/70 bg-zinc-950/40 p-2">
            <MetricTile
                label="Total Duration"
                value={formatDurationMinutes(totalDuration)}
            />
            <MetricTile
                label="Estimated TSS"
                value={estimatedTss === null ? '—' : `${estimatedTss}`}
            />
            <MetricTile label="Blocks" value={`${blockCount}`} />
        </div>
    );
}
