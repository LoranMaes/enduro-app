import { cn } from '@/lib/utils';
import type { SessionView } from './types';
import { SessionInternalNotes } from './SessionInternalNotes';
import { formatDurationMinutes, formatNumber } from './utils';

type SessionStatisticsCardProps = {
    sessionView: SessionView;
    sideCardTab: 'statistics' | 'notes';
    onSideCardTabChange: (value: 'statistics' | 'notes') => void;
    notesStatus: string | null;
    internalNotesProps: {
        value: string;
        canEditNotes: boolean;
        isSavingNotes: boolean;
        hasNotesChanged: boolean;
        notesError: string | null;
        notesStatus: string | null;
        onChange: (value: string) => void;
        onSave: () => void;
    };
    avgHeartRate: number | null;
    avgPower: number | null;
    avgCadence: number | null;
    avgSpeedLabel: string;
    totalDistanceKilometers: number | null;
    elevationGainMeters: number | null;
};

export function SessionStatisticsCard({
    sessionView,
    sideCardTab,
    onSideCardTabChange,
    notesStatus,
    internalNotesProps,
    avgHeartRate,
    avgPower,
    avgCadence,
    avgSpeedLabel,
    totalDistanceKilometers,
    elevationGainMeters,
}: SessionStatisticsCardProps) {
    return (
        <div className="h-full overflow-y-auto rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">
                    Route Statistics
                </h2>
                {sideCardTab === 'notes' && notesStatus !== null ? (
                    <span className="text-[11px] text-emerald-300">
                        {notesStatus}
                    </span>
                ) : null}
            </div>

            <div className="mt-3 inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/60 p-1">
                <button
                    type="button"
                    onClick={() => onSideCardTabChange('statistics')}
                    className={cn(
                        'rounded px-2 py-1 text-[11px] transition-colors',
                        sideCardTab === 'statistics'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200',
                    )}
                >
                    Statistics
                </button>
                <button
                    type="button"
                    onClick={() => onSideCardTabChange('notes')}
                    className={cn(
                        'rounded px-2 py-1 text-[11px] transition-colors',
                        sideCardTab === 'notes'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200',
                    )}
                >
                    Internal Notes
                </button>
            </div>

            {sideCardTab === 'statistics' ? (
                <>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <ComparisonBadge
                            label="Planned"
                            value={formatDurationMinutes(
                                sessionView.durationMinutes,
                            )}
                            meta={`${formatNumber(sessionView.plannedTss)} TSS`}
                        />
                        <ComparisonBadge
                            label="Actual"
                            value={formatDurationMinutes(
                                sessionView.actualDurationMinutes,
                            )}
                            meta={`${formatNumber(sessionView.actualTss)} TSS`}
                        />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <StatisticsRow
                            label="Avg HR"
                            value={
                                avgHeartRate === null
                                    ? '—'
                                    : `${Math.round(avgHeartRate)} bpm`
                            }
                        />
                        <StatisticsRow
                            label="Avg Power"
                            value={
                                avgPower === null
                                    ? '—'
                                    : `${Math.round(avgPower)} W`
                            }
                        />
                        <StatisticsRow
                            label="Avg Cadence"
                            value={
                                avgCadence === null
                                    ? '—'
                                    : `${Math.round(avgCadence)} rpm`
                            }
                        />
                        <StatisticsRow label="Avg Speed" value={avgSpeedLabel} />
                        <StatisticsRow
                            label="Distance"
                            value={
                                totalDistanceKilometers === null
                                    ? '—'
                                    : `${totalDistanceKilometers.toFixed(2)} km`
                            }
                        />
                        <StatisticsRow
                            label="Elevation"
                            value={
                                elevationGainMeters === null
                                    ? '—'
                                    : `${Math.round(elevationGainMeters)} m`
                            }
                        />
                    </div>
                </>
            ) : (
                <SessionInternalNotes {...internalNotesProps} />
            )}
        </div>
    );
}

function StatisticsRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-2">
            <span className="block text-[10px] tracking-wide text-zinc-500 uppercase">
                {label}
            </span>
            <span className="mt-0.5 block font-mono text-xs text-zinc-200">
                {value}
            </span>
        </div>
    );
}

function ComparisonBadge({
    label,
    value,
    meta,
}: {
    label: string;
    value: string;
    meta: string;
}) {
    return (
        <div className="rounded-full border border-border/80 bg-background/60 px-3 py-1.5">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="font-mono text-xs text-zinc-100">{value}</p>
            <p className="text-[10px] text-zinc-400">{meta}</p>
        </div>
    );
}
