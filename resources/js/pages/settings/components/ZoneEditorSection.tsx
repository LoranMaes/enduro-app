import InputError from '@/components/input-error';
import type { ZoneRange } from '../types';

type ZoneEditorSectionProps = {
    title: string;
    description: string;
    zones: ZoneRange[];
    minMin: number;
    minMax: number;
    maxMin: number;
    maxMax: number;
    error: string | undefined;
    field: 'power_zones' | 'heart_rate_zones';
    onChangeZone: (
        field: 'power_zones' | 'heart_rate_zones',
        index: number,
        key: 'min' | 'max',
        value: string,
    ) => void;
};

export function ZoneEditorSection({
    title,
    description,
    zones,
    minMin,
    minMax,
    maxMin,
    maxMax,
    error,
    field,
    onChangeZone,
}: ZoneEditorSectionProps) {
    return (
        <div className="rounded-lg border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
            <p className="mt-1 text-xs text-zinc-500">{description}</p>
            <div className="mt-3 space-y-2">
                {zones.map((zone, index) => (
                    <div
                        key={`${field}-${zone.label}-${index}`}
                        className="grid grid-cols-[3rem_1fr_auto_1fr] items-center gap-2"
                    >
                        <span className="text-xs text-zinc-400">{zone.label}</span>
                        <input
                            type="number"
                            min={minMin}
                            max={minMax}
                            value={zone.min}
                            onChange={(event) => {
                                onChangeZone(field, index, 'min', event.target.value);
                            }}
                            className="w-full rounded-md border border-border bg-zinc-900/50 px-2 py-1.5 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-500">-</span>
                        <input
                            type="number"
                            min={maxMin}
                            max={maxMax}
                            value={zone.max}
                            onChange={(event) => {
                                onChangeZone(field, index, 'max', event.target.value);
                            }}
                            className="w-full rounded-md border border-border bg-zinc-900/50 px-2 py-1.5 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                        />
                    </div>
                ))}
            </div>
            <InputError message={error} />
        </div>
    );
}
