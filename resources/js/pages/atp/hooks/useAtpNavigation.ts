import { router } from '@inertiajs/react';
import { useCallback } from 'react';
import { show as showAtp } from '@/routes/atp';

export function useAtpNavigation(year: number) {
    const goToYear = useCallback((targetYear: number): void => {
        router.visit(showAtp(targetYear).url, {
            preserveScroll: true,
        });
    }, []);

    const goToPreviousYear = useCallback((): void => {
        goToYear(year - 1);
    }, [goToYear, year]);

    const goToNextYear = useCallback((): void => {
        goToYear(year + 1);
    }, [goToYear, year]);

    return {
        goToYear,
        goToPreviousYear,
        goToNextYear,
    };
}
