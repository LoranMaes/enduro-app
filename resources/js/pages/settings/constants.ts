import {
    Activity,
    CreditCard,
    Link2,
    User,
    type LucideIcon,
} from 'lucide-react';
import { overview as settingsOverview } from '@/routes/settings';
import type { BreadcrumbItem } from '@/types';
import type { SettingsTab } from './types';

export const settingsBreadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: settingsOverview().url,
    },
];

export const tabLabels: Record<SettingsTab, string> = {
    profile: 'Profile',
    training: 'Training Preferences',
    integrations: 'Integrations',
    billing: 'Billing & Plans',
};

export const tabIcons: Record<SettingsTab, LucideIcon> = {
    profile: User,
    training: Activity,
    integrations: Link2,
    billing: CreditCard,
};

export const unitSystemOptions = [
    { value: 'metric', label: 'Metric (km, kg)' },
    { value: 'imperial', label: 'Imperial (mi, lbs)' },
] as const;

export const primarySportOptions = [
    { value: 'triathlon', label: 'Triathlon' },
    { value: 'bike', label: 'Bike' },
    { value: 'run', label: 'Run' },
    { value: 'swim', label: 'Swim' },
    { value: 'other', label: 'Other' },
] as const;

export const restDayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
] as const;

export const intensityDistributionOptions = [
    { value: 'polarized', label: 'Polarized (80/20)' },
    { value: 'pyramidal', label: 'Pyramidal' },
    { value: 'threshold', label: 'Threshold' },
    { value: 'mixed', label: 'Mixed' },
] as const;
