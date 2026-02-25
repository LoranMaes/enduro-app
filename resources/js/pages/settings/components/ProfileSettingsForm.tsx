import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
    const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
    const timezoneOptions = useMemo(() => {
        const supportedValuesOf = (
            Intl as unknown as {
                supportedValuesOf?: (key: 'timeZone') => string[];
            }
        ).supportedValuesOf;

        if (typeof supportedValuesOf === 'function') {
            return supportedValuesOf('timeZone');
        }

        return ['UTC'];
    }, []);

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
                <Popover open={isTimezoneOpen} onOpenChange={setIsTimezoneOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="settings-timezone"
                            variant="outline"
                            role="combobox"
                            aria-expanded={isTimezoneOpen}
                            className="w-full justify-between border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/50"
                        >
                            <span className="truncate">
                                {profileForm.data.timezone.trim() !== ''
                                    ? profileForm.data.timezone
                                    : 'Select timezone'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[22rem] border-border bg-surface p-0">
                        <Command>
                            <CommandInput placeholder="Search timezone..." />
                            <CommandList>
                                <CommandEmpty>No timezone found.</CommandEmpty>
                                {timezoneOptions.map((timezone: string) => (
                                    <CommandItem
                                        key={timezone}
                                        value={timezone}
                                        onSelect={() => {
                                            profileForm.setData('timezone', timezone);
                                            profileForm.clearErrors('timezone');
                                            setIsTimezoneOpen(false);
                                        }}
                                        className="text-xs"
                                    >
                                        <Check
                                            className={cn(
                                                'h-4 w-4',
                                                profileForm.data.timezone === timezone
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <span className="truncate">{timezone}</span>
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
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
