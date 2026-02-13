import { useCallback, useEffect, useMemo, useState } from 'react';
import { update as updateAtpWeek } from '@/routes/api/atp/weeks';
import type { AtpPlan, AtpWeek } from '../types';
import { weekSort } from '../utils';

type UpdateWeekPayload = {
    week_type?: string;
    priority?: string;
    notes?: string | null;
};

export function useAtpData({
    year,
    initialPlan,
}: {
    year: number;
    initialPlan: AtpPlan;
}) {
    const [weeks, setWeeks] = useState<AtpWeek[]>(() => weekSort(initialPlan.weeks));
    const [updatingWeekStart, setUpdatingWeekStart] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        setWeeks(weekSort(initialPlan.weeks));
    }, [initialPlan.weeks]);

    const updateWeek = useCallback(
        async (weekStart: string, payload: UpdateWeekPayload): Promise<boolean> => {
            setUpdatingWeekStart(weekStart);
            setErrorMessage(null);

            try {
                const route = updateAtpWeek({
                    year,
                    week_start: weekStart,
                });
                const response = await fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    setErrorMessage('Unable to update ATP week metadata.');
                    return false;
                }

                const json = (await response.json()) as { data?: AtpWeek };
                const updatedWeek = json.data;

                if (updatedWeek === undefined) {
                    setErrorMessage('Unable to update ATP week metadata.');
                    return false;
                }

                setWeeks((current) => {
                    return weekSort(
                        current.map((week) => {
                            if (week.week_start_date !== weekStart) {
                                return week;
                            }

                            return {
                                ...week,
                                week_type: updatedWeek.week_type,
                                priority: updatedWeek.priority,
                                notes: updatedWeek.notes,
                            };
                        }),
                    );
                });

                return true;
            } catch {
                setErrorMessage('Unable to update ATP week metadata.');

                return false;
            } finally {
                setUpdatingWeekStart(null);
            }
        },
        [year],
    );

    const summary = useMemo(() => {
        return weeks.reduce(
            (carry, week) => {
                carry.plannedMinutes += week.planned_minutes;
                carry.completedMinutes += week.completed_minutes;

                return carry;
            },
            {
                plannedMinutes: 0,
                completedMinutes: 0,
            },
        );
    }, [weeks]);

    return {
        weeks,
        summary,
        updatingWeekStart,
        errorMessage,
        updateWeek,
    };
}
