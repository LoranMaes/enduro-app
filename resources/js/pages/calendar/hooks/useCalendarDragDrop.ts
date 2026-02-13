import { useCallback, useMemo, useState } from 'react';
import type { WorkoutLibraryItemView } from '@/features/workout-library/WorkoutLibraryList';
import type { TrainingSessionView } from '@/types/training-plans';

type CalendarDragState =
    | {
          kind: 'session';
          session: TrainingSessionView;
      }
    | {
          kind: 'library';
          item: WorkoutLibraryItemView;
          sport: string;
      }
    | null;

type UseCalendarDragDropOptions = {
    onMoveSessionToDate: (
        session: TrainingSessionView,
        targetDate: string,
        targetWeekId: number,
    ) => Promise<boolean>;
    onCreateFromLibraryAtDate: (
        item: WorkoutLibraryItemView,
        sport: string,
        targetDate: string,
        targetWeekId: number,
    ) => Promise<boolean>;
};

export function useCalendarDragDrop({
    onMoveSessionToDate,
    onCreateFromLibraryAtDate,
}: UseCalendarDragDropOptions) {
    const [dragState, setDragState] = useState<CalendarDragState>(null);
    const [dropDate, setDropDate] = useState<string | null>(null);
    const [isApplyingDrop, setIsApplyingDrop] = useState(false);

    const startSessionDrag = useCallback((session: TrainingSessionView): void => {
        if (session.status === 'completed') {
            return;
        }

        setDragState({
            kind: 'session',
            session,
        });
    }, []);

    const startLibraryDrag = useCallback(
        (item: WorkoutLibraryItemView, sport: string): void => {
            setDragState({
                kind: 'library',
                item,
                sport,
            });
        },
        [],
    );

    const endDrag = useCallback((): void => {
        setDragState(null);
        setDropDate(null);
    }, []);

    const handleDayDragOver = useCallback((date: string): void => {
        if (dragState === null || isApplyingDrop) {
            return;
        }

        setDropDate((currentDropDate) => {
            if (currentDropDate === date) {
                return currentDropDate;
            }

            return date;
        });
    }, [dragState, isApplyingDrop]);

    const handleDayDrop = useCallback(
        async (targetDate: string, targetWeekId: number): Promise<void> => {
            if (dragState === null || isApplyingDrop) {
                return;
            }

            setIsApplyingDrop(true);

            try {
                if (dragState.kind === 'session') {
                    if (dragState.session.scheduledDate === targetDate) {
                        return;
                    }

                    await onMoveSessionToDate(
                        dragState.session,
                        targetDate,
                        targetWeekId,
                    );

                    return;
                }

                await onCreateFromLibraryAtDate(
                    dragState.item,
                    dragState.sport,
                    targetDate,
                    targetWeekId,
                );
            } finally {
                setIsApplyingDrop(false);
                setDragState(null);
                setDropDate(null);
            }
        },
        [dragState, isApplyingDrop, onCreateFromLibraryAtDate, onMoveSessionToDate],
    );

    const draggingSessionId = useMemo(() => {
        if (dragState?.kind !== 'session') {
            return null;
        }

        return dragState.session.id;
    }, [dragState]);

    const isDropTarget = useCallback((date: string): boolean => {
        return dropDate === date && dragState !== null;
    }, [dragState, dropDate]);

    return {
        draggingSessionId,
        isDropTarget,
        startSessionDrag,
        startLibraryDrag,
        endDrag,
        handleDayDragOver,
        handleDayDrop,
    };
}
