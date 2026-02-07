export type SessionStatus = 'planned' | 'completed' | 'skipped' | 'partial';

export const SESSION_STATUSES: readonly SessionStatus[] = [
    'planned',
    'completed',
    'skipped',
    'partial',
];
