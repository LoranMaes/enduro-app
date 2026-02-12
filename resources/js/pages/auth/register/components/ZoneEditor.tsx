import { Input } from '@/components/ui/input';
import type { Zone } from '../types';

type ZoneEditorProps = {
    title: string;
    zones: Zone[];
    onChange: (index: number, key: 'min' | 'max', value: string) => void;
    error?: string;
};

export function ZoneEditor({ title, zones, onChange, error }: ZoneEditorProps) {
    return (
        <div className="rounded-lg border border-border bg-background/60 p-3">
            <p className="mb-2 text-sm font-medium text-zinc-200">{title}</p>

            <div className="space-y-1.5">
                {zones.map((zone, index) => (
                    <div
                        key={zone.label}
                        className="grid grid-cols-[2.625rem_1fr_auto_1fr] items-center gap-2"
                    >
                        <span className="text-xs text-zinc-400">
                            {zone.label}
                        </span>
                        <Input
                            type="number"
                            value={zone.min}
                            onChange={(event) =>
                                onChange(index, 'min', event.target.value)
                            }
                            className="h-8"
                        />
                        <span className="text-xs text-zinc-500">-</span>
                        <Input
                            type="number"
                            value={zone.max}
                            onChange={(event) =>
                                onChange(index, 'max', event.target.value)
                            }
                            className="h-8"
                        />
                    </div>
                ))}
            </div>

            {error !== undefined ? (
                <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
        </div>
    );
}
