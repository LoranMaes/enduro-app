import type { CalendarViewMode } from './types';

export const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WINDOW_EXTENSION_WEEKS = 4;
export const SESSIONS_PER_PAGE = 100;
export const ACTIVITIES_PER_PAGE = 100;
export const SUMMARY_RAIL_WIDTH = 156;
export const VIEW_MODES: CalendarViewMode[] = [
    'infinite',
    'day',
    'week',
    'month',
];

export const SYNC_PENDING_STATUSES = new Set(['queued', 'running']);
export const SYNC_POLLING_STATUSES = new Set([
    'queued',
    'running',
    'rate_limited',
]);

export const GOAL_TYPE_OPTIONS = [
    { value: 'race', label: 'Race' },
    { value: 'distance', label: 'Distance' },
    { value: 'performance', label: 'Performance' },
    { value: 'text', label: 'Text' },
] as const;

export const GOAL_SPORT_OPTIONS = [
    { value: 'run', label: 'Run' },
    { value: 'bike', label: 'Bike' },
    { value: 'swim', label: 'Swim' },
    { value: 'other', label: 'Other' },
] as const;

export const GOAL_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
] as const;

export const GOAL_STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
] as const;
