import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DragEvent as ReactDragEvent } from 'react';

export type WorkoutLibraryItemView = {
    id: number;
    title: string;
    sport: string;
    estimated_duration_minutes: number;
    estimated_tss: number | null;
    structure_json: Record<string, unknown>;
};

type WorkoutLibraryListProps = {
    items: WorkoutLibraryItemView[];
    loading: boolean;
    onStartDragItem: (
        item: WorkoutLibraryItemView,
        event: ReactDragEvent<HTMLElement>,
    ) => void;
    onEndDragItem: () => void;
    onEditItem: (item: WorkoutLibraryItemView) => void;
};

type PreviewSegment = {
    id: string;
    durationMinutes: number;
    type: string;
    intensity: number;
};

const segmentColorByType: Record<string, string> = {
    warmup: 'bg-emerald-500/40',
    active: 'bg-sky-500/55',
    recovery: 'bg-zinc-500/50',
    cooldown: 'bg-violet-500/45',
    repeats: 'bg-amber-500/60',
    two_step_repeats: 'bg-amber-500/60',
    three_step_repeats: 'bg-amber-500/60',
    ramp_up: 'bg-cyan-500/60',
    ramp_down: 'bg-cyan-500/45',
};

function normalizeSegments(
    structure: Record<string, unknown>,
): PreviewSegment[] {
    const rawSteps = Array.isArray(structure.steps)
        ? structure.steps
        : Array.isArray((structure as { Steps?: unknown[] }).Steps)
          ? ((structure as { Steps: unknown[] }).Steps ?? [])
          : [];

    const segments: PreviewSegment[] = [];

    const mode =
        (typeof structure.mode === 'string' ? structure.mode : null) ??
        (typeof (structure as { Mode?: unknown }).Mode === 'string'
            ? String((structure as { Mode?: unknown }).Mode)
            : 'target');

    rawSteps.forEach((rawStep, stepIndex) => {
        if (typeof rawStep !== 'object' || rawStep === null) {
            return;
        }

        const step = rawStep as {
            id?: string;
            type?: string;
            duration_minutes?: number;
            durationMinutes?: number;
            target?: number;
            range_min?: number;
            range_max?: number;
            items?: unknown[];
        };
        const stepType = step.type ?? 'active';
        const stepItems = Array.isArray(step.items) ? step.items : null;
        const stepTarget = Number(
            step.target ??
                (step as { target_value?: unknown }).target_value ??
                0,
        );
        const stepRangeMin = Number(
            step.range_min ??
                (step as { rangeMin?: unknown }).rangeMin ??
                stepTarget,
        );
        const stepRangeMax = Number(
            step.range_max ??
                (step as { rangeMax?: unknown }).rangeMax ??
                stepRangeMin,
        );
        const stepIntensity =
            mode === 'range'
                ? (stepRangeMin + stepRangeMax) / 2
                : stepTarget;

        if (stepItems !== null && stepItems.length > 0) {
            stepItems.forEach((rawItem, itemIndex) => {
                if (typeof rawItem !== 'object' || rawItem === null) {
                    return;
                }

                const item = rawItem as {
                    id?: string;
                    duration_minutes?: number;
                    durationMinutes?: number;
                    target?: number;
                    range_min?: number;
                    range_max?: number;
                    rangeMin?: number;
                    rangeMax?: number;
                };
                const durationMinutes = Math.max(
                    1,
                    Number(item.duration_minutes ?? item.durationMinutes ?? 1),
                );
                const itemTarget = Number(item.target ?? stepTarget);
                const itemRangeMin = Number(
                    item.range_min ?? item.rangeMin ?? itemTarget,
                );
                const itemRangeMax = Number(
                    item.range_max ?? item.rangeMax ?? itemRangeMin,
                );
                const intensity =
                    mode === 'range'
                        ? (itemRangeMin + itemRangeMax) / 2
                        : itemTarget;

                segments.push({
                    id: item.id ?? `${stepIndex}-${itemIndex}`,
                    durationMinutes,
                    type: stepType,
                    intensity,
                });
            });

            return;
        }

        const durationMinutes = Math.max(
            1,
            Number(step.duration_minutes ?? step.durationMinutes ?? 1),
        );

        segments.push({
            id: step.id ?? `${stepIndex}`,
            durationMinutes,
            type: stepType,
            intensity: stepIntensity,
        });
    });

    return segments.slice(0, 12);
}

function WorkoutTemplatePreview({
    structure,
}: {
    structure: Record<string, unknown>;
}) {
    const segments = normalizeSegments(structure);

    if (segments.length === 0) {
        return (
            <div className="h-1.5 w-full rounded-full bg-zinc-800/70" />
        );
    }

    const totalDuration = segments.reduce((total, segment) => {
        return total + segment.durationMinutes;
    }, 0);
    const structureUnit =
        typeof structure.unit === 'string'
            ? structure.unit
            : typeof (structure as { Unit?: unknown }).Unit === 'string'
              ? String((structure as { Unit?: unknown }).Unit)
              : 'ftp_percent';
    const intensityCeiling =
        structureUnit === 'rpe'
            ? 10
            : Math.max(
                  120,
                  Math.ceil(
                      segments.reduce((maxIntensity, segment) => {
                          return Math.max(maxIntensity, segment.intensity);
                      }, 0) / 5,
                  ) * 5,
              );

    return (
        <div className="flex h-7 w-full items-end gap-0.5 overflow-hidden rounded-md bg-zinc-900/60 p-1">
            {segments.map((segment) => (
                <span
                    key={segment.id}
                    className={`rounded-sm ${segmentColorByType[segment.type] ?? 'bg-zinc-500/50'}`}
                    style={{
                        width: `${Math.max(
                            4,
                            Math.round((segment.durationMinutes / totalDuration) * 100),
                        )}%`,
                        height: `${Math.max(
                            20,
                            Math.min(
                                100,
                                Math.round((segment.intensity / intensityCeiling) * 100),
                            ),
                        )}%`,
                    }}
                />
            ))}
        </div>
    );
}

export function WorkoutLibraryList({
    items,
    loading,
    onStartDragItem,
    onEndDragItem,
    onEditItem,
}: WorkoutLibraryListProps) {
    const [query, setQuery] = useState('');

    const visibleItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (normalizedQuery === '') {
            return items;
        }

        return items.filter((item) => {
            return (
                item.title.toLowerCase().includes(normalizedQuery) ||
                item.sport.toLowerCase().includes(normalizedQuery)
            );
        });
    }, [items, query]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <Input
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                }}
                placeholder="Search workout templates..."
                className="h-9 border-border bg-background text-xs"
            />

            <ScrollArea className="min-h-0 flex-1 rounded-md border border-border bg-background/60">
                <div className="space-y-2 p-2">
                    {loading ? (
                        <p className="px-2 py-2 text-xs text-zinc-500">
                            Loading templates...
                        </p>
                    ) : null}

                    {!loading && visibleItems.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-zinc-500">
                            No templates found.
                        </p>
                    ) : null}

                    {visibleItems.map((item) => (
                        <article
                            key={item.id}
                            draggable
                            onDragStart={(event) => {
                                event.dataTransfer.setData(
                                    'text/plain',
                                    `library:${item.id}`,
                                );
                                onStartDragItem(item, event);
                            }}
                            onDragEnd={onEndDragItem}
                            className="group cursor-grab rounded-md border border-border bg-surface px-3 py-2 transition-colors active:cursor-grabbing hover:border-zinc-600"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-zinc-100">
                                        {item.title}
                                    </p>
                                    <p className="text-[0.6875rem] text-zinc-500">
                                        {item.estimated_duration_minutes}m
                                        {item.estimated_tss !== null
                                            ? ` • ${item.estimated_tss} TSS`
                                            : ''}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onEditItem(item);
                                    }}
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                                    aria-label={`Edit ${item.title}`}
                                    title={`Edit ${item.title}`}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="mt-2">
                                <WorkoutTemplatePreview structure={item.structure_json} />
                            </div>
                        </article>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
