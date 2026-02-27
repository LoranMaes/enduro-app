import type { DragEvent } from 'react';
import { useCallback, useState } from 'react';

type UseStructureDragOptions = {
    disabled: boolean;
    stepCount: number;
    onMoveStep: (from: number, to: number) => void;
};

type UseStructureDragResult = {
    dragIndex: number | null;
    dropIndex: number | null;
    setDropIndex: (nextIndex: number | null) => void;
    startDrag: (index: number, event?: DragEvent<HTMLElement>) => void;
    endDrag: () => void;
    canDrop: (dropAt: number) => boolean;
    commitDrop: (dropAt: number) => void;
    handlePreviewDragOver: (
        event: DragEvent<HTMLElement>,
        itemIndex: number,
    ) => void;
    handleListDragOver: (event: DragEvent<HTMLElement>, itemIndex: number) => void;
    handleSeparatorDragOver: (event: DragEvent<HTMLElement>, dropAt: number) => void;
    handleDropAt: (event: DragEvent<HTMLElement>, dropAt: number) => void;
    handleDropCurrent: (event: DragEvent<HTMLElement>) => void;
};

export function useStructureDrag({
    disabled,
    stepCount,
    onMoveStep,
}: UseStructureDragOptions): UseStructureDragResult {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const startDrag = useCallback(
        (index: number, event?: DragEvent<HTMLElement>): void => {
            if (disabled) {
                return;
            }

            setDragIndex(index);
            setDropIndex(index);

            if (event !== undefined) {
                event.dataTransfer.effectAllowed = 'move';
            }
        },
        [disabled],
    );

    const endDrag = useCallback((): void => {
        setDragIndex(null);
        setDropIndex(null);
    }, []);

    const canDrop = useCallback(
        (dropAt: number): boolean => {
            if (dragIndex === null) {
                return false;
            }

            return dropAt >= 0 && dropAt <= stepCount;
        },
        [dragIndex, stepCount],
    );

    const commitDrop = useCallback(
        (dropAt: number): void => {
            if (disabled || !canDrop(dropAt) || dragIndex === null) {
                return;
            }

            onMoveStep(dragIndex, dropAt);
            setDragIndex(null);
            setDropIndex(null);
        },
        [canDrop, disabled, dragIndex, onMoveStep],
    );

    const handlePreviewDragOver = useCallback(
        (event: DragEvent<HTMLElement>, itemIndex: number): void => {
            if (disabled || dragIndex === null) {
                return;
            }

            event.preventDefault();
            const bounds = event.currentTarget.getBoundingClientRect();
            const insertAt =
                event.clientX < bounds.left + bounds.width / 2
                    ? itemIndex
                    : itemIndex + 1;

            setDropIndex(insertAt);
        },
        [disabled, dragIndex],
    );

    const handleListDragOver = useCallback(
        (event: DragEvent<HTMLElement>, itemIndex: number): void => {
            if (disabled || dragIndex === null) {
                return;
            }

            event.preventDefault();
            const bounds = event.currentTarget.getBoundingClientRect();
            const insertAt =
                event.clientY < bounds.top + bounds.height / 2
                    ? itemIndex
                    : itemIndex + 1;

            setDropIndex(insertAt);
        },
        [disabled, dragIndex],
    );

    const handleSeparatorDragOver = useCallback(
        (event: DragEvent<HTMLElement>, dropAt: number): void => {
            if (disabled || dragIndex === null) {
                return;
            }

            event.preventDefault();
            setDropIndex(dropAt);
        },
        [disabled, dragIndex],
    );

    const handleDropAt = useCallback(
        (event: DragEvent<HTMLElement>, dropAt: number): void => {
            event.preventDefault();
            commitDrop(dropAt);
        },
        [commitDrop],
    );

    const handleDropCurrent = useCallback(
        (event: DragEvent<HTMLElement>): void => {
            event.preventDefault();

            if (dropIndex !== null) {
                commitDrop(dropIndex);
            }
        },
        [commitDrop, dropIndex],
    );

    return {
        dragIndex,
        dropIndex,
        setDropIndex,
        startDrag,
        endDrag,
        canDrop,
        commitDrop,
        handlePreviewDragOver,
        handleListDragOver,
        handleSeparatorDragOver,
        handleDropAt,
        handleDropCurrent,
    };
}
