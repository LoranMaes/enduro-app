import { LoaderCircle } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MentionableAdmin, MentionableUser, SuggestionState } from './types';
import { initials } from './utils';

type TicketSuggestionPopoverProps = {
    suggestion: SuggestionState | null;
    adminResults: MentionableAdmin[];
    userResults: MentionableUser[];
    usersLoading: boolean;
    activeSuggestionIndex: number;
    onActiveSuggestionIndexChange: (index: number) => void;
    onSuggestionOpenChange: (open: boolean) => void;
    onSuggestionKeyDown: (event: KeyboardEvent<HTMLElement>) => boolean;
    insertAdminMention: (admin: MentionableAdmin) => void;
    insertUserReference: (user: MentionableUser) => void;
};

export function TicketSuggestionPopover({
    suggestion,
    adminResults,
    userResults,
    usersLoading,
    activeSuggestionIndex,
    onActiveSuggestionIndexChange,
    onSuggestionOpenChange,
    onSuggestionKeyDown,
    insertAdminMention,
    insertUserReference,
}: TicketSuggestionPopoverProps) {
    return (
        <Popover
            open={suggestion !== null}
            onOpenChange={onSuggestionOpenChange}
            modal={false}
        >
            <PopoverAnchor asChild>
                <span
                    aria-hidden
                    className="pointer-events-none absolute z-30 h-0.5 w-0.5"
                    style={{
                        left: `${suggestion?.left ?? 0}px`,
                        top: `${suggestion?.top ?? 0}px`,
                    }}
                />
            </PopoverAnchor>
            <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="w-72 border-border bg-surface p-1"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                }}
            >
                <Command
                    className="bg-transparent"
                    onKeyDown={(event) => {
                        onSuggestionKeyDown(event);
                    }}
                >
                    <CommandList role="listbox" aria-label="Suggestions">
                        {suggestion?.mode === 'admin' ? (
                            adminResults.length === 0 ? (
                                <CommandEmpty>No admins found.</CommandEmpty>
                            ) : (
                                <CommandGroup heading="Admins">
                                    {adminResults.map((admin, index) => (
                                        <CommandItem
                                            key={admin.id}
                                            value={`${admin.name} ${admin.email}`}
                                            className={cn(
                                                index === activeSuggestionIndex
                                                    ? 'bg-zinc-800 text-zinc-100'
                                                    : undefined,
                                            )}
                                            onMouseEnter={() => {
                                                onActiveSuggestionIndexChange(
                                                    index,
                                                );
                                            }}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                insertAdminMention(admin);
                                            }}
                                            onSelect={() => {
                                                insertAdminMention(admin);
                                            }}
                                            role="option"
                                            aria-selected={
                                                index === activeSuggestionIndex
                                            }
                                        >
                                            <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                                <AvatarFallback className="bg-zinc-900 text-[0.625rem] text-zinc-300">
                                                    {initials(admin.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-zinc-100">
                                                    {admin.name}
                                                </span>
                                                <span className="block truncate text-zinc-500">
                                                    {admin.email}
                                                </span>
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )
                        ) : usersLoading ? (
                            <div className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-500">
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                Searching users...
                            </div>
                        ) : userResults.length === 0 ? (
                            <CommandEmpty>No users found.</CommandEmpty>
                        ) : (
                            <CommandGroup heading="Users">
                                {userResults.map((user, index) => (
                                    <CommandItem
                                        key={user.id}
                                        value={`${user.name} ${user.email}`}
                                        className={cn(
                                            index === activeSuggestionIndex
                                                ? 'bg-zinc-800 text-zinc-100'
                                                : undefined,
                                        )}
                                        onMouseEnter={() => {
                                            onActiveSuggestionIndexChange(index);
                                        }}
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            insertUserReference(user);
                                        }}
                                        onSelect={() => {
                                            insertUserReference(user);
                                        }}
                                        role="option"
                                        aria-selected={
                                            index === activeSuggestionIndex
                                        }
                                    >
                                        <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                            <AvatarFallback className="bg-zinc-900 text-[0.625rem] text-zinc-300">
                                                {initials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-zinc-100">
                                                {user.name}
                                            </span>
                                            <span className="block truncate text-zinc-500">
                                                {user.email}
                                            </span>
                                        </span>
                                        <span className="rounded border border-zinc-700 px-1 py-0 text-[0.625rem] text-zinc-500 capitalize">
                                            {user.role}
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
