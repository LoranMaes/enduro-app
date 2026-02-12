import type { InertiaFormProps } from '@inertiajs/react';

export type Zone = {
    label: string;
    min: number;
    max: number;
};

export type CoachFileDraft = {
    id: string;
    file: File;
    extension: string;
    label: string;
    isRenaming: boolean;
    draftLabel: string;
    renameFlash: 'saved' | 'cancelled' | null;
};

export type UploadLimits = {
    maxFiles: number;
    maxFileSizeMb: number;
    maxTotalSizeMb: number;
    acceptedExtensions: string[];
};

export type RegistrationFormData = {
    role: 'athlete' | 'coach';
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    timezone: string;
    unit_system: 'metric' | 'imperial';
    primary_sport: 'swim' | 'bike' | 'run' | 'triathlon' | 'other';
    weekly_training_days: number | '';
    preferred_rest_day:
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
        | 'sunday';
    intensity_distribution: 'polarized' | 'pyramidal' | 'threshold' | 'mixed';
    ftp_watts: number | '';
    max_heart_rate_bpm: number | '';
    threshold_heart_rate_bpm: number | '';
    threshold_pace_minutes_per_km: number | '';
    power_zones: Zone[];
    heart_rate_zones: Zone[];
    connect_strava_after_signup: boolean;
    tutorial_opt_in: boolean;
    coaching_experience: string;
    specialties: string;
    certifications_summary: string;
    website_url: string;
    motivation: string;
    coach_certification_files: File[];
    coach_certification_labels: string[];
};

export type StepConfig = {
    key: string;
    title: string;
    subtitle: string;
};

export type RegistrationForm = InertiaFormProps<RegistrationFormData>;
