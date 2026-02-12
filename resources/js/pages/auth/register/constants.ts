import type { StepConfig, Zone } from './types';

export const athleteSteps: StepConfig[] = [
    {
        key: 'account',
        title: 'Create account',
        subtitle: 'Identity, credentials, and role.',
    },
    {
        key: 'preferences',
        title: 'Preferences',
        subtitle: 'Primary sport and weekly rhythm.',
    },
    {
        key: 'zones',
        title: 'Zones',
        subtitle: 'Set baseline power and heart-rate targets.',
    },
    {
        key: 'integrations',
        title: 'Integrations',
        subtitle: 'Optional onboarding shortcuts before you enter.',
    },
];

export const coachSteps: StepConfig[] = [
    {
        key: 'account',
        title: 'Create account',
        subtitle: 'Identity, credentials, and role.',
    },
    {
        key: 'profile',
        title: 'Coach profile',
        subtitle: 'Experience and coaching focus.',
    },
    {
        key: 'application',
        title: 'Application',
        subtitle: 'Motivation and certification documents.',
    },
];

export const defaultPowerZones: Zone[] = [
    { label: 'Z1', min: 55, max: 75 },
    { label: 'Z2', min: 76, max: 90 },
    { label: 'Z3', min: 91, max: 105 },
    { label: 'Z4', min: 106, max: 120 },
    { label: 'Z5', min: 121, max: 150 },
];

export const defaultHeartRateZones: Zone[] = [
    { label: 'Z1', min: 60, max: 72 },
    { label: 'Z2', min: 73, max: 82 },
    { label: 'Z3', min: 83, max: 89 },
    { label: 'Z4', min: 90, max: 95 },
    { label: 'Z5', min: 96, max: 100 },
];
