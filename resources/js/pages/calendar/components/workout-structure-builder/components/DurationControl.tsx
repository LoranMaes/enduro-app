import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { durationTypeLabels } from '../constants';
import type { WorkoutStructureDurationType } from '../types';
import { normalizeDurationSeconds } from '../utils';

type DurationControlProps = {
    durationType: WorkoutStructureDurationType;
    durationSeconds: number;
    distanceMeters: number | null;
    disabled: boolean;
    onChange: (next: {
        durationType: WorkoutStructureDurationType;
        durationSeconds: number;
        distanceMeters: number | null;
    }) => void;
};

function resolveDurationParts(durationSeconds: number): {
    minutes: number;
    seconds: number;
} {
    const safeDuration = Math.max(60, Math.round(durationSeconds));

    return {
        minutes: Math.floor(safeDuration / 60),
        seconds: safeDuration % 60,
    };
}

export function DurationControl({
    durationType,
    durationSeconds,
    distanceMeters,
    disabled,
    onChange,
}: DurationControlProps) {
    const parts = resolveDurationParts(durationSeconds);

    return (
        <div className="space-y-1">
            <label className="text-[0.625rem] text-zinc-500 uppercase">
                Duration
            </label>

            <div className="grid grid-cols-[8.5rem_1fr] gap-2">
                <Select
                    value={durationType}
                    disabled={disabled}
                    onValueChange={(value) => {
                        const nextType =
                            value === 'distance' ? 'distance' : 'time';

                        onChange({
                            durationType: nextType,
                            durationSeconds: normalizeDurationSeconds(durationSeconds),
                            distanceMeters:
                                nextType === 'distance'
                                    ? Math.max(1, Math.round(distanceMeters ?? 1000))
                                    : null,
                        });
                    }}
                >
                    <SelectTrigger className="h-7 rounded border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="time">
                            {durationTypeLabels.time}
                        </SelectItem>
                        <SelectItem value="distance">
                            {durationTypeLabels.distance}
                        </SelectItem>
                    </SelectContent>
                </Select>

                {durationType === 'time' ? (
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1">
                        <input
                            type="number"
                            min={0}
                            max={720}
                            value={parts.minutes}
                            disabled={disabled}
                            onChange={(event) => {
                                const minutes = Math.max(
                                    0,
                                    Number(event.target.value) || 0,
                                );
                                const nextSeconds = normalizeDurationSeconds(
                                    minutes * 60 + parts.seconds,
                                );

                                onChange({
                                    durationType: 'time',
                                    durationSeconds: nextSeconds,
                                    distanceMeters: null,
                                });
                            }}
                            className="w-full bg-transparent font-mono text-xs text-zinc-200 focus:outline-none"
                        />
                        <span className="text-[0.625rem] text-zinc-500">:</span>
                        <input
                            type="number"
                            min={0}
                            max={59}
                            value={parts.seconds}
                            disabled={disabled}
                            onChange={(event) => {
                                const seconds = Math.max(
                                    0,
                                    Math.min(59, Number(event.target.value) || 0),
                                );
                                const nextSeconds = normalizeDurationSeconds(
                                    parts.minutes * 60 + seconds,
                                );

                                onChange({
                                    durationType: 'time',
                                    durationSeconds: nextSeconds,
                                    distanceMeters: null,
                                });
                            }}
                            className="w-full bg-transparent font-mono text-xs text-zinc-200 focus:outline-none"
                        />
                    </div>
                ) : (
                    <input
                        type="number"
                        min={1}
                        max={500000}
                        value={distanceMeters ?? 1000}
                        disabled={disabled}
                        onChange={(event) => {
                            onChange({
                                durationType: 'distance',
                                durationSeconds: normalizeDurationSeconds(
                                    durationSeconds,
                                ),
                                distanceMeters: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                ),
                            });
                        }}
                        className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                )}
            </div>

            {durationType === 'distance' ? (
                <p className="text-[0.625rem] text-zinc-500">meters</p>
            ) : null}
        </div>
    );
}
