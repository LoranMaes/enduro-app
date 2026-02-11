import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlannedSegment, SessionView } from './types';
import {
    formatDurationMinutes,
    formatNumber,
    formatPlannedSegmentSummary,
    formatStructureUnit,
    plannedBlockColor,
} from './utils';

type SessionPlannedStructurePreviewProps = {
    sessionView: SessionView;
    plannedSegments: PlannedSegment[];
    plannedPreviewScaleMax: number;
    totalPlannedSegmentDuration: number;
};

export function SessionPlannedStructurePreview({
    sessionView,
    plannedSegments,
    plannedPreviewScaleMax,
    totalPlannedSegmentDuration,
}: SessionPlannedStructurePreviewProps) {
    const [hoveredPlannedSegmentId, setHoveredPlannedSegmentId] = useState<
        string | null
    >(null);

    const hoveredPlannedSegment = useMemo(() => {
        if (hoveredPlannedSegmentId === null) {
            return null;
        }

        return (
            plannedSegments.find(
                (segment) => segment.id === hoveredPlannedSegmentId,
            ) ?? null
        );
    }, [hoveredPlannedSegmentId, plannedSegments]);

    return (
        <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-medium text-zinc-200">
                Planned Structure
            </h2>

            <div className="mt-2 flex items-center justify-between text-[10px] tracking-wider text-zinc-500 uppercase">
                <span>
                    {formatStructureUnit(
                        sessionView.plannedStructure?.unit ?? 'rpe',
                    )}
                </span>
                <span>{sessionView.plannedStructure?.mode ?? 'range'}</span>
            </div>

            <div className="mt-3 h-36 overflow-hidden rounded border border-border/60 bg-background/70 p-2">
                <div className="flex h-full items-end gap-[1px]">
                    {plannedSegments.map((segment) => {
                        const width =
                            totalPlannedSegmentDuration > 0
                                ? (segment.durationMinutes /
                                      totalPlannedSegmentDuration) *
                                  100
                                : 0;
                        const minHeight =
                            plannedPreviewScaleMax === 0
                                ? 0
                                : (segment.min / plannedPreviewScaleMax) * 100;
                        const maxHeight =
                            plannedPreviewScaleMax === 0
                                ? 0
                                : (segment.max / plannedPreviewScaleMax) * 100;
                        const rangeHeight = Math.max(2, maxHeight - minHeight);

                        return (
                            <button
                                key={segment.id}
                                type="button"
                                onMouseEnter={() => {
                                    setHoveredPlannedSegmentId(segment.id);
                                }}
                                onMouseLeave={() => {
                                    setHoveredPlannedSegmentId(null);
                                }}
                                className="relative h-full min-w-[6px] border-r border-zinc-900/60"
                                style={{ width: `${Math.max(4, width)}%` }}
                            >
                                <span
                                    className={cn(
                                        'absolute inset-x-0 bottom-0 rounded-[2px] border border-white/5 opacity-45',
                                        plannedBlockColor(segment.type),
                                    )}
                                    style={{
                                        height: `${Math.max(2, maxHeight)}%`,
                                    }}
                                />
                                <span
                                    className={cn(
                                        'absolute inset-x-0 rounded-[2px] border border-white/20',
                                        plannedBlockColor(segment.type),
                                    )}
                                    style={{
                                        bottom: `${minHeight}%`,
                                        height: `${rangeHeight}%`,
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="mt-2 text-[11px] text-zinc-400">
                {hoveredPlannedSegment !== null
                    ? formatPlannedSegmentSummary(
                          hoveredPlannedSegment,
                          sessionView.plannedStructure?.mode ?? 'range',
                      )
                    : 'Hover a segment to inspect block details.'}
            </p>

            <p className="mt-1 text-[11px] text-zinc-500">
                Planned total: {formatDurationMinutes(sessionView.durationMinutes)}
                {' • '}Planned TSS: {formatNumber(sessionView.plannedTss)}
            </p>
        </div>
    );
}
