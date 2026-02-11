import type { DragEvent } from 'react';
import { cn } from '@/lib/utils';

type StructureDragOverlayProps = {
    leftPercent: number;
};

export function StructureDragOverlay({ leftPercent }: StructureDragOverlayProps) {
    return (
        <div
            className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-sky-400"
            style={{ left: `${leftPercent}%` }}
        />
    );
}

type DropSeparatorProps = {
    active: boolean;
    disabled: boolean;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function DropSeparator({
    active,
    disabled,
    onDragOver,
    onDrop,
}: DropSeparatorProps) {
    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={cn(
                'relative h-3 rounded transition-colors',
                disabled ? 'pointer-events-none' : 'pointer-events-auto',
                active ? 'bg-sky-500/12' : 'bg-transparent',
            )}
        >
            <span
                className={cn(
                    'pointer-events-none absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-opacity',
                    active
                        ? 'opacity-100 shadow-[0_0_8px_rgba(56,189,248,0.55)]'
                        : 'opacity-0',
                    'bg-sky-400',
                )}
            />
        </div>
    );
}
