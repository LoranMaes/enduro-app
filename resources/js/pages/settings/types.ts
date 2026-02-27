export type ProviderConnection = {
    provider: string;
    label: string;
    connected: boolean;
    provider_athlete_id: string | null;
    token_expires_at: string | null;
    last_synced_at: string | null;
    last_sync_status: string | null;
    last_sync_reason: string | null;
};

export type ZoneRange = {
    label: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5' | string;
    min: number;
    max: number;
};

export type SettingsTab = 'profile' | 'theme' | 'training' | 'integrations' | 'billing';

export type SettingsOverviewProps = {
    activeTab: SettingsTab;
    role: 'athlete' | 'coach' | 'admin';
    profile: {
        name: string;
        email: string;
        timezone: string;
        unit_system: 'metric' | 'imperial' | string;
    };
    trainingPreferences: {
        primary_sport: 'swim' | 'bike' | 'run' | 'triathlon' | 'other' | string;
        weekly_training_days: number;
        preferred_rest_day:
            | 'monday'
            | 'tuesday'
            | 'wednesday'
            | 'thursday'
            | 'friday'
            | 'saturday'
            | 'sunday'
            | string;
        intensity_distribution:
            | 'polarized'
            | 'pyramidal'
            | 'threshold'
            | 'mixed'
            | string;
        ftp_watts: number | null;
        max_heart_rate_bpm: number | null;
        threshold_heart_rate_bpm: number | null;
        threshold_pace_minutes_per_km: number | null;
        power_zones: ZoneRange[];
        heart_rate_zones: ZoneRange[];
    };
    providers: ProviderConnection[];
    billing: {
        is_subscribed: boolean;
        subscription_status: string | null;
        stripe_customer_id: string | null;
        stripe_id: string | null;
        subscription_synced_at: string | null;
        plans: Array<{
            key: string;
            label: string;
            subscribe_url: string;
        }>;
    };
    canManageConnections: boolean;
    settingsStatus: string | null;
    connectionStatusMessage: string | null;
    billingStatusMessage: string | null;
};

export type SyncMessagesByProvider = Record<string, string>;

export type SyncStatusEvent = {
    provider?: string;
    status?: string;
    reason?: string | null;
};

export type BillingSubscriptionStatusEvent = {
    user_id?: number;
    is_subscribed?: boolean;
    subscription_status?: string | null;
    synced_at?: string | null;
};
