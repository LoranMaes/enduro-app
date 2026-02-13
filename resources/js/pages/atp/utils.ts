import type { AtpWeek } from './types';

export function minutesToHourLabel(minutes: number): string {
    const safeMinutes = Math.max(0, minutes);
    const hours = safeMinutes / 60;

    return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function resolveWeeklyBandState(week: AtpWeek): 'higher' | 'lower' | 'balanced' {
    if (week.completed_minutes > week.planned_minutes) {
        return 'higher';
    }

    if (week.completed_minutes < week.planned_minutes) {
        return 'lower';
    }

    return 'balanced';
}

export function formatWeekRange(week: AtpWeek): string {
    return `${week.week_start_date} — ${week.week_end_date}`;
}

export function weekSort(weeks: AtpWeek[]): AtpWeek[] {
    return weeks
        .slice()
        .sort((left, right) => left.week_start_date.localeCompare(right.week_start_date));
}
