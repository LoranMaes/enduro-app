import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type MutableRefObject,
} from 'react';

export function useCalendarScroll({
    calendarViewMode,
    currentWeekStart,
    focusWeekStart,
    visibleWeeks,
}: {
    calendarViewMode: 'infinite' | 'day' | 'week' | 'month';
    currentWeekStart: string;
    focusWeekStart: string;
    visibleWeeks: Array<{ startsAt: string }>;
}) {
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const weekElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const hasCenteredCurrentWeekRef = useRef(false);

    const [isCurrentWeekVisible, setIsCurrentWeekVisible] = useState(true);

    const jumpToCurrentWeek = useCallback((): void => {
        if (calendarViewMode !== 'infinite') {
            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement = weekElementsRef.current[currentWeekStart];

        if (
            container === null ||
            currentWeekElement === null ||
            currentWeekElement === undefined
        ) {
            return;
        }

        container.scrollTo({
            top: Math.max(
                0,
                currentWeekElement.offsetTop -
                    (container.clientHeight - currentWeekElement.offsetHeight) /
                        2,
            ),
            behavior: 'smooth',
        });
    }, [calendarViewMode, currentWeekStart]);

    const jumpToWeek = useCallback(
        (weekStart: string, behavior: ScrollBehavior = 'smooth'): void => {
            if (calendarViewMode !== 'infinite') {
                return;
            }

            const container = scrollContainerRef.current;
            const weekElement = weekElementsRef.current[weekStart];

            if (container === null || weekElement === null || weekElement === undefined) {
                return;
            }

            container.scrollTo({
                top: Math.max(
                    0,
                    weekElement.offsetTop -
                        (container.clientHeight - weekElement.offsetHeight) / 2,
                ),
                behavior,
            });
        },
        [calendarViewMode],
    );

    useLayoutEffect(() => {
        if (calendarViewMode !== 'infinite') {
            return;
        }

        if (hasCenteredCurrentWeekRef.current) {
            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement = weekElementsRef.current[currentWeekStart];

        if (
            container === null ||
            currentWeekElement === undefined ||
            currentWeekElement === null
        ) {
            return;
        }

        const targetScrollTop =
            currentWeekElement.offsetTop -
            (container.clientHeight - currentWeekElement.offsetHeight) / 2;

        container.scrollTop = Math.max(0, targetScrollTop);
        hasCenteredCurrentWeekRef.current = true;
    }, [calendarViewMode, currentWeekStart, visibleWeeks]);

    useEffect(() => {
        if (calendarViewMode === 'infinite') {
            return;
        }

        setIsCurrentWeekVisible(focusWeekStart === currentWeekStart);
    }, [calendarViewMode, currentWeekStart, focusWeekStart]);

    useEffect(() => {
        if (calendarViewMode !== 'infinite') {
            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement = weekElementsRef.current[currentWeekStart];

        if (
            container === null ||
            currentWeekElement === undefined ||
            currentWeekElement === null
        ) {
            setIsCurrentWeekVisible(false);

            return;
        }

        const evaluateVisibility = (): void => {
            const viewportTop = container.scrollTop;
            const viewportBottom = viewportTop + container.clientHeight;
            const weekTop = currentWeekElement.offsetTop;
            const weekBottom = weekTop + currentWeekElement.offsetHeight;
            const verticalOffset = 40;

            setIsCurrentWeekVisible(
                weekBottom >= viewportTop + verticalOffset &&
                    weekTop <= viewportBottom - verticalOffset,
            );
        };

        evaluateVisibility();

        container.addEventListener('scroll', evaluateVisibility, {
            passive: true,
        });
        window.addEventListener('resize', evaluateVisibility);

        return () => {
            container.removeEventListener('scroll', evaluateVisibility);
            window.removeEventListener('resize', evaluateVisibility);
        };
    }, [calendarViewMode, currentWeekStart, visibleWeeks]);

    const markHydratedWindow = useCallback(() => {
        hasCenteredCurrentWeekRef.current = false;
    }, []);

    return {
        scrollContainerRef,
        weekElementsRef,
        isCurrentWeekVisible,
        jumpToCurrentWeek,
        jumpToWeek,
        markHydratedWindow,
    };
}

export type CalendarScrollRefs = {
    scrollContainerRef: MutableRefObject<HTMLElement | null>;
    weekElementsRef: MutableRefObject<Record<string, HTMLDivElement | null>>;
};
