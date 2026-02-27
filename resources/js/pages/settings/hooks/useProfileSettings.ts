import { useForm } from '@inertiajs/react';
import type { SettingsOverviewProps } from '../types';

type UseProfileSettingsParams = {
    profile: SettingsOverviewProps['profile'];
};

export function useProfileSettings({ profile }: UseProfileSettingsParams) {
    const profileForm = useForm({
        name: profile.name,
        email: profile.email,
        timezone: profile.timezone,
        unit_system: profile.unit_system,
    });

    const submitProfile = (): void => {
        profileForm.patch('/settings/overview/profile', {
            preserveScroll: true,
        });
    };

    return {
        profileForm,
        submitProfile,
    };
}
