import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { unitSystemOptions } from '../constants';
import type { useProfileSettings } from '../hooks/useProfileSettings';

type ProfileSettingsFormProps = {
    profileForm: ReturnType<typeof useProfileSettings>['profileForm'];
    onSubmit: () => void;
};

export function ProfileSettingsForm({
    profileForm,
    onSubmit,
}: ProfileSettingsFormProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
            <div className="space-y-1.5">
                <label htmlFor="settings-name" className="text-xs text-zinc-500">
                    Full Name
                </label>
                <input
                    id="settings-name"
                    value={profileForm.data.name}
                    onChange={(event) => {
                        profileForm.setData('name', event.target.value);
                        profileForm.clearErrors('name');
                    }}
                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
                <InputError message={profileForm.errors.name} />
            </div>

            <div className="space-y-1.5">
                <label htmlFor="settings-email" className="text-xs text-zinc-500">
                    Email Address
                </label>
                <input
                    id="settings-email"
                    type="email"
                    value={profileForm.data.email}
                    onChange={(event) => {
                        profileForm.setData('email', event.target.value);
                        profileForm.clearErrors('email');
                    }}
                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
                <InputError message={profileForm.errors.email} />
            </div>

            <div className="space-y-1.5">
                <label htmlFor="settings-timezone" className="text-xs text-zinc-500">
                    Timezone
                </label>
                <input
                    id="settings-timezone"
                    value={profileForm.data.timezone}
                    onChange={(event) => {
                        profileForm.setData('timezone', event.target.value);
                        profileForm.clearErrors('timezone');
                    }}
                    className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
                <InputError message={profileForm.errors.timezone} />
            </div>

            <div className="space-y-1.5">
                <label htmlFor="settings-unit-system" className="text-xs text-zinc-500">
                    Unit System
                </label>
                <Select
                    value={profileForm.data.unit_system}
                    onValueChange={(value) => {
                        profileForm.setData('unit_system', value);
                        profileForm.clearErrors('unit_system');
                    }}
                >
                    <SelectTrigger
                        id="settings-unit-system"
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-zinc-900 text-zinc-200">
                        {unitSystemOptions.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                                className="text-sm focus:bg-zinc-800 focus:text-zinc-100"
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={profileForm.errors.unit_system} />
            </div>

            <div className="flex justify-end md:col-span-2">
                <Button type="submit" disabled={profileForm.processing}>
                    {profileForm.processing ? 'Saving...' : 'Save Profile'}
                </Button>
            </div>
        </form>
    );
}
