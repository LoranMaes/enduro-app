import { useEffect, useMemo, useState } from 'react';
import { index as listProgressLoadHistory } from '@/routes/api/progress';
import type { ProgressLoadHistoryPayload, ProgressWeek } from '../types';

type UsePerformanceManagementDataResult = {
    data: ProgressLoadHistoryPayload | null;
    loading: boolean;
    error: string | null;
};

export function usePerformanceManagementData(
    weeks: ProgressWeek[],
    loadMetricsEnabled: boolean,
): UsePerformanceManagementDataResult {
    const [data, setData] = useState<ProgressLoadHistoryPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const range = useMemo(() => {
        if (weeks.length === 0) {
            return null;
        }

        const firstWeek = weeks[0];
        const lastWeek = weeks[weeks.length - 1];

        if (firstWeek === undefined || lastWeek === undefined) {
            return null;
        }

        return {
            from: firstWeek.week_start,
            to: lastWeek.week_end,
        };
    }, [weeks]);

    useEffect(() => {
        if (!loadMetricsEnabled || range === null) {
            setData(null);
            setLoading(false);
            setError(null);

            return;
        }

        const abortController = new AbortController();
        const fetchLoadHistory = async (): Promise<void> => {
            setLoading(true);
            setError(null);

            try {
                const route = listProgressLoadHistory({
                    query: {
                        from: range.from,
                        to: range.to,
                    },
                });
                const response = await fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error('Unable to load performance metrics.');
                }

                const payload = (await response.json()) as ProgressLoadHistoryPayload;
                setData(payload);
            } catch (fetchError) {
                if (abortController.signal.aborted) {
                    return;
                }

                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Unable to load performance metrics.',
                );
                setData(null);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void fetchLoadHistory();

        return () => {
            abortController.abort();
        };
    }, [loadMetricsEnabled, range]);

    return {
        data,
        loading,
        error,
    };
}
