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
