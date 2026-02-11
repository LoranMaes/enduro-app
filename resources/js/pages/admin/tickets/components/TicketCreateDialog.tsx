import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ticketImportanceOptions, ticketTypeOptions } from '../constants';
import { withoutFieldError } from '../lib/ticket-utils';
import type {
    AdminOption,
    RequestFieldErrors,
    TicketImportance,
    TicketType,
    UserSearchResult,
} from '../types';
import { TicketAssigneeCombobox } from './ticket-assignee-combobox';
import {
    type DescriptionUserRef,
    TicketDescriptionEditor,
    type TicketDescriptionValue,
} from './ticket-description-editor';

type TicketCreateDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    ticketCreateBusy: boolean;
    newTicketError: string | null;
    newTicketFieldErrors: RequestFieldErrors;
    newTicketTitle: string;
    setNewTicketTitle: Dispatch<SetStateAction<string>>;
    newTicketType: TicketType;
    setNewTicketType: Dispatch<SetStateAction<TicketType>>;
    newTicketImportance: TicketImportance;
    setNewTicketImportance: Dispatch<SetStateAction<TicketImportance>>;
    newTicketAssigneeId: number;
    setNewTicketAssigneeId: Dispatch<SetStateAction<number>>;
    newTicketAssigneeQuery: string;
    setNewTicketAssigneeQuery: Dispatch<SetStateAction<string>>;
    newTicketAssigneeDropdownOpen: boolean;
    setNewTicketAssigneeDropdownOpen: Dispatch<SetStateAction<boolean>>;
    newTicketDescriptionHtml: string;
    setNewTicketDescriptionHtml: Dispatch<SetStateAction<string>>;
    newTicketDescriptionText: string;
    setNewTicketDescriptionText: Dispatch<SetStateAction<string>>;
    setNewTicketMentions: Dispatch<SetStateAction<number[]>>;
    setNewTicketUserRefs: Dispatch<SetStateAction<DescriptionUserRef[]>>;
    setNewTicketError: Dispatch<SetStateAction<string | null>>;
    setNewTicketFieldErrors: Dispatch<SetStateAction<RequestFieldErrors>>;
    admins: AdminOption[];
    fetchUserSearch: (query: string) => Promise<UserSearchResult[]>;
};

export function TicketCreateDialog({
    open,
    onOpenChange,
    onSubmit,
    ticketCreateBusy,
    newTicketError,
    newTicketFieldErrors,
    newTicketTitle,
    setNewTicketTitle,
    newTicketType,
    setNewTicketType,
    newTicketImportance,
    setNewTicketImportance,
    newTicketAssigneeId,
    setNewTicketAssigneeId,
    newTicketAssigneeQuery,
    setNewTicketAssigneeQuery,
    newTicketAssigneeDropdownOpen,
    setNewTicketAssigneeDropdownOpen,
    newTicketDescriptionHtml,
    setNewTicketDescriptionHtml,
    newTicketDescriptionText,
    setNewTicketDescriptionText,
    setNewTicketMentions,
    setNewTicketUserRefs,
    setNewTicketError,
    setNewTicketFieldErrors,
    admins,
    fetchUserSearch,
}: TicketCreateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size="xl"
                className="max-h-[92dvh] max-w-[min(96vw,61.25rem)] overflow-hidden border-border bg-surface"
            >
                <DialogHeader>
                    <DialogTitle>New Ticket</DialogTitle>
                    <DialogDescription>
                        Create an admin-only ticket for internal tracking.
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="flex max-h-[calc(92dvh-10.625rem)] flex-col gap-5 overflow-y-auto pr-1"
                    onSubmit={(event) => void onSubmit(event)}
                >
                    <div className="space-y-1">
                        <Label htmlFor="ticket-title">Title</Label>
                        <Input
                            id="ticket-title"
                            value={newTicketTitle}
                            onChange={(event) => {
                                setNewTicketTitle(event.target.value);
                                setNewTicketError(null);
                                setNewTicketFieldErrors((current) =>
                                    withoutFieldError(current, 'title'),
                                );
                            }}
                            required
                        />
                        {newTicketFieldErrors.title !== undefined ? (
                            <p className="text-xs text-red-300">
                                {newTicketFieldErrors.title[0]}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                            Type
                        </p>
                        <ToggleGroup
                            type="single"
                            value={newTicketType}
                            onValueChange={(value) => {
                                if (value === '') {
                                    return;
                                }

                                setNewTicketType(value as TicketType);
                                setNewTicketFieldErrors((current) =>
                                    withoutFieldError(current, 'type'),
                                );
                            }}
                            variant="outline"
                            size="sm"
                            className="flex flex-wrap gap-2 rounded-none bg-transparent"
                            aria-label="Ticket type"
                        >
                            {ticketTypeOptions.map((typeOption) => (
                                <ToggleGroupItem
                                    key={typeOption.value}
                                    value={typeOption.value}
                                    className="h-auto rounded-full border-zinc-700 bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors data-[state=on]:border-sky-600 data-[state=on]:bg-sky-950/25 data-[state=on]:text-sky-200 hover:border-zinc-600 hover:text-zinc-200"
                                >
                                    {typeOption.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                    {newTicketFieldErrors.type !== undefined ? (
                        <p className="text-xs text-red-300">
                            {newTicketFieldErrors.type[0]}
                        </p>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.2fr]">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                                Importance
                            </p>
                            <input
                                type="range"
                                min={0}
                                max={ticketImportanceOptions.length - 1}
                                step={1}
                                value={ticketImportanceOptions.findIndex(
                                    (option) =>
                                        option.value === newTicketImportance,
                                )}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                    const option =
                                        ticketImportanceOptions[
                                            Number.parseInt(event.target.value, 10) ??
                                                1
                                        ];

                                    if (option !== undefined) {
                                        setNewTicketImportance(option.value);
                                        setNewTicketFieldErrors((current) =>
                                            withoutFieldError(
                                                current,
                                                'importance',
                                            ),
                                        );
                                    }
                                }}
                                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-400"
                            />
                            <div className="flex items-center justify-between text-[0.6875rem] text-zinc-500">
                                {ticketImportanceOptions.map((option) => (
                                    <span
                                        key={option.value}
                                        className={
                                            newTicketImportance === option.value
                                                ? 'font-semibold text-zinc-200'
                                                : ''
                                        }
                                    >
                                        {option.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ticket-assignee">Assignee</Label>
                            <TicketAssigneeCombobox
                                value={newTicketAssigneeId}
                                options={admins}
                                query={newTicketAssigneeQuery}
                                open={newTicketAssigneeDropdownOpen}
                                onOpenChange={setNewTicketAssigneeDropdownOpen}
                                onQueryChange={(value) => {
                                    setNewTicketAssigneeQuery(value);

                                    if (value.trim() === '') {
                                        setNewTicketAssigneeId(0);
                                    }
                                }}
                                onValueChange={(value) => {
                                    setNewTicketAssigneeId(value);
                                    setNewTicketFieldErrors((current) =>
                                        withoutFieldError(
                                            current,
                                            'assignee_admin_id',
                                        ),
                                    );
                                }}
                            />
                            {newTicketFieldErrors.assignee_admin_id !==
                            undefined ? (
                                <p className="text-xs text-red-300">
                                    {newTicketFieldErrors.assignee_admin_id[0]}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <TicketDescriptionEditor
                        label="Description"
                        html={newTicketDescriptionHtml}
                        placeholder="Write a ticket update. Use @ to mention admins and /user to reference athletes/coaches."
                        admins={admins}
                        className="h-full"
                        searchUsers={fetchUserSearch}
                        onChange={(value: TicketDescriptionValue) => {
                            setNewTicketDescriptionHtml(value.html);
                            setNewTicketDescriptionText(value.text);
                            setNewTicketMentions(value.mentionAdminIds);
                            setNewTicketUserRefs(value.userRefs);
                            setNewTicketError(null);
                            setNewTicketFieldErrors((current) =>
                                withoutFieldError(current, 'description'),
                            );
                        }}
                    />
                    {newTicketFieldErrors.description !== undefined ? (
                        <p className="text-xs text-red-300">
                            {newTicketFieldErrors.description[0]}
                        </p>
                    ) : null}

                    {newTicketError !== null ? (
                        <p className="rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                            {newTicketError}
                        </p>
                    ) : null}

                    <p className="text-[0.6875rem] text-zinc-500">
                        Description length: {newTicketDescriptionText.trim().length}{' '}
                        chars
                    </p>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={ticketCreateBusy}>
                            {ticketCreateBusy ? 'Creating...' : 'Create Ticket'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
