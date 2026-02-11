import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

export function useProgressState(selectedWeeks: number) {
    const [isSwitchingRange, setIsSwitchingRange] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const switchRange = useCallback(
        (weeksRange: number): void => {
            if (weeksRange === selectedWeeks || isSwitchingRange) {
                return;
            }

            setIsSwitchingRange(true);

            router.get(
                '/progress',
                {
                    weeks: weeksRange,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => {
                        setIsSwitchingRange(false);
                    },
                },
            );
        },
        [isSwitchingRange, selectedWeeks],
    );

    return {
        isSwitchingRange,
        hoveredIndex,
        setHoveredIndex,
        switchRange,
    };
}
