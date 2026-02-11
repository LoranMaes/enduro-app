import { Check, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type TicketAssigneeOption = {
    id: number;
    name: string;
    email: string;
};

type TicketAssigneeComboboxProps = {
    value: number;
    options: TicketAssigneeOption[];
    query: string;
    open: boolean;
    disabled?: boolean;
    placeholder?: string;
    onOpenChange: (open: boolean) => void;
    onQueryChange: (value: string) => void;
    onValueChange: (value: number) => void;
};

export function TicketAssigneeCombobox({
    value,
    options,
    query,
    open,
    disabled = false,
    placeholder = 'Assign admin...',
    onOpenChange,
    onQueryChange,
    onValueChange,
}: TicketAssigneeComboboxProps) {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedOption = options.find((option) => option.id === value) ?? null;

    const filteredOptions =
        normalizedQuery.length === 0
            ? options.slice(0, 8)
            : options
                  .filter((option) => {
                      return (
                          option.name.toLowerCase().includes(normalizedQuery) ||
                          option.email.toLowerCase().includes(normalizedQuery)
                      );
                  })
                  .slice(0, 8);

    return (
        <Popover open={open} onOpenChange={onOpenChange} modal={false}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-10 w-full justify-between border-border bg-background text-xs font-normal text-zinc-200"
                >
                    <span className="truncate">
                        {selectedOption !== null
                            ? `${selectedOption.name} (${selectedOption.email})`
                            : 'Unassigned'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-border bg-surface p-0">
                <Command className="bg-transparent">
                    <CommandInput
                        value={query}
                        onValueChange={onQueryChange}
                        placeholder={placeholder}
                        className="h-9 text-xs"
                    />
                    <CommandList>
                        <CommandGroup heading="Assignment">
                            <CommandItem
                                value="unassigned"
                                className="text-xs text-zinc-400"
                                onSelect={() => {
                                    onValueChange(0);
                                    onQueryChange('');
                                    onOpenChange(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-3.5 w-3.5',
                                        value === 0 ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                                Unassigned
                            </CommandItem>
                        </CommandGroup>
                        {filteredOptions.length === 0 ? (
                            <CommandEmpty>No admins found.</CommandEmpty>
                        ) : (
                            <CommandGroup heading="Admins">
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={`${option.name} ${option.email}`}
                                        onSelect={() => {
                                            onValueChange(option.id);
                                            onQueryChange(option.name);
                                            onOpenChange(false);
                                        }}
                                        className="gap-2"
                                    >
                                        <Check
                                            className={cn(
                                                'h-3.5 w-3.5',
                                                value === option.id
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                            <AvatarFallback className="bg-zinc-900 text-[0.625rem] text-zinc-300">
                                                {initials(option.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-zinc-100">
                                                {option.name}
                                            </span>
                                            <span className="block truncate text-zinc-500">
                                                {option.email}
                                            </span>
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function initials(value: string): string {
    return value
        .split(' ')
        .map((chunk) => chunk.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}
