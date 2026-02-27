import type { LoadSeriesPoint, PerformanceSeriesSnapshot } from '../types';

type PerformanceSnapshotRowProps = {
    snapshot: PerformanceSeriesSnapshot;
};

export function PerformanceSnapshotRow({
    snapshot,
}: PerformanceSnapshotRowProps) {
    return (
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 md:grid-cols-3">
            <SnapshotMetric
                label="Today CTL"
                value={Math.round(snapshot.ctl)}
                dotClassName="bg-cyan-400"
            />
            <SnapshotMetric
                label="Today ATL"
                value={Math.round(snapshot.atl)}
                dotClassName="bg-amber-400"
            />
            <SnapshotMetric
                label="Today TSB"
                value={Math.round(snapshot.tsb)}
                dotClassName="bg-fuchsia-400"
                meta={snapshot.source === 'last_real' ? 'Using last real day' : undefined}
            />
        </div>
    );
}

export function resolveTodaySnapshot(series: LoadSeriesPoint[]): PerformanceSeriesSnapshot {
    const todayDate = new Date().toISOString().slice(0, 10);
    const todayPoint = series.find((point) => point.date === todayDate && isRealPoint(point));

    if (todayPoint !== undefined) {
        return {
            date: todayPoint.date,
            atl: todayPoint.atl,
            ctl: todayPoint.ctl,
            tsb: todayPoint.tsb,
            source: 'today',
        };
    }

    const lastRealPoint = [...series]
        .reverse()
        .find((point) => point.date <= todayDate && isRealPoint(point));

    if (lastRealPoint !== undefined) {
        return {
            date: lastRealPoint.date,
            atl: lastRealPoint.atl,
            ctl: lastRealPoint.ctl,
            tsb: lastRealPoint.tsb,
            source: 'last_real',
        };
    }

    const fallbackPoint = series[series.length - 1] ?? {
        date: todayDate,
        atl: 0,
        ctl: 0,
        tsb: 0,
    };

    return {
        date: fallbackPoint.date,
        atl: fallbackPoint.atl,
        ctl: fallbackPoint.ctl,
        tsb: fallbackPoint.tsb,
        source: 'last_real',
    };
}

function isRealPoint(point: LoadSeriesPoint): boolean {
    return !(
        point.tss === 0
        && point.atl === 0
        && point.ctl === 0
        && point.tsb === 0
    );
}

function SnapshotMetric({
    label,
    value,
    dotClassName,
    meta,
}: {
    label: string;
    value: number;
    dotClassName: string;
    meta?: string;
}) {
    return (
        <div className="space-y-1">
            <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="inline-flex items-center gap-2 font-mono text-sm text-foreground">
                <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
                {value}
            </p>
            {meta !== undefined ? (
                <p className="text-[0.625rem] text-muted-foreground">{meta}</p>
            ) : null}
        </div>
    );
}
