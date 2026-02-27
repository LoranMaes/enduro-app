export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    feature_access?: Record<string, boolean>;
    feature_limits?: Record<string, number | null>;
    admin_notifications?: {
        unread_count: number;
    };
    sidebarOpen: boolean;
    [key: string]: unknown;
};
