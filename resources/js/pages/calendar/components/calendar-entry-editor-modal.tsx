import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    destroy as destroyCalendarEntry,
    store as storeCalendarEntry,
    update as updateCalendarEntry,
} from '@/routes/calendar-entries';
import type {
    CalendarEntryEditorContext,
    EntryTypeEntitlement,
    OtherEntryType,
} from '../types';

type CalendarEntryEditorModalProps = {
    open: boolean;
    context: CalendarEntryEditorContext | null;
    isSubscribed: boolean;
    entryTypeEntitlements: EntryTypeEntitlement[];
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

type ValidationErrors = {
    date?: string;
    type?: string;
    title?: string;
    body?: string;
};

const OTHER_TYPE_OPTIONS: Array<{ type: OtherEntryType; label: string }> = [
    { type: 'event', label: 'Event' },
    { type: 'goal', label: 'Goal' },
    { type: 'note', label: 'Note' },
];

export function CalendarEntryEditorModal({
    open,
    context,
    isSubscribed,
    entryTypeEntitlements,
    onOpenChange,
    onSaved,
}: CalendarEntryEditorModalProps) {
    const [date, setDate] = useState('');
    const [type, setType] = useState<OtherEntryType>('event');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const entitlements = useMemo(() => {
        const map = new Map<string, boolean>();

        entryTypeEntitlements.forEach((entitlement) => {
            map.set(entitlement.key, entitlement.requires_subscription);
        });

        return map;
    }, [entryTypeEntitlements]);

    useEffect(() => {
        if (!open || context === null) {
            return;
        }

        if (context.mode === 'edit') {
            setDate(context.entry.scheduledDate);
            setType(
                context.entry.type === 'event' ||
                    context.entry.type === 'goal' ||
                    context.entry.type === 'note'
                    ? context.entry.type
                    : 'note',
            );
            setTitle(context.entry.title ?? '');
            setBody(context.entry.body ?? '');
        } else {
            setDate(context.date);
            setType(context.type);
            setTitle('');
            setBody('');
        }

        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
        setIsDeleting(false);
    }, [open, context]);

    const typeIsLocked = useMemo(() => {
        if (isSubscribed) {
            return false;
        }

        return Boolean(entitlements.get(`other.${type}`));
    }, [entitlements, isSubscribed, type]);

    const submit = async (): Promise<void> => {
        if (context === null || isSubmitting || isDeleting) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setGeneralError(null);

        const payload = {
            date,
            type,
            title: title.trim() === '' ? null : title.trim(),
            body: body.trim() === '' ? null : body.trim(),
        };

        try {
            const route =
                context.mode === 'edit'
                    ? updateCalendarEntry(context.entry.id)
                    : storeCalendarEntry();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorPayload = (await response.json().catch(() => null)) as
                    | {
                          message?: string;
                          errors?: Record<string, string[]>;
                      }
                    | null;

                const nextErrors: ValidationErrors = {};
                if (errorPayload?.errors !== undefined) {
                    nextErrors.date = errorPayload.errors.date?.[0];
                    nextErrors.type = errorPayload.errors.type?.[0];
                    nextErrors.title = errorPayload.errors.title?.[0];
                    nextErrors.body = errorPayload.errors.body?.[0];
                }

                setErrors(nextErrors);
                setGeneralError(
                    errorPayload?.message ?? 'Unable to save calendar entry.',
                );

                return;
            }

            onOpenChange(false);
            onSaved();
        } catch {
            setGeneralError('Unable to save calendar entry.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const remove = async (): Promise<void> => {
        if (
            context === null ||
            context.mode !== 'edit' ||
            isSubmitting ||
            isDeleting
        ) {
            return;
        }

        setIsDeleting(true);
        setGeneralError(null);

        try {
            const route = destroyCalendarEntry(context.entry.id);
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                setGeneralError('Unable to delete calendar entry.');
                return;
            }

            onOpenChange(false);
            onSaved();
        } catch {
            setGeneralError('Unable to delete calendar entry.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if ((isSubmitting || isDeleting) && !nextOpen) {
                    return;
                }

                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                size="sm"
                className="max-h-[calc(100dvh-1.5rem)] overflow-hidden border-border bg-surface p-0 text-zinc-200"
            >
                <DialogHeader className="border-b border-border px-5 py-4">
                    <DialogTitle className="text-base text-zinc-100">
                        {context?.mode === 'edit'
                            ? 'Edit calendar entry'
                            : 'Create calendar entry'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        Add non-workout context to your training calendar.
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="contents"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                >
                    <div className="space-y-4 px-5 py-4">
                    {generalError !== null ? (
                        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {generalError}
                        </p>
                    ) : null}

                    <div className="space-y-1.5">
                        <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                            Type
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {OTHER_TYPE_OPTIONS.map((option) => {
                                const locked =
                                    !isSubscribed &&
                                    Boolean(
                                        entitlements.get(`other.${option.type}`),
                                    );
                                const selected = type === option.type;

                                return (
                                    <button
                                        key={option.type}
                                        type="button"
                                        onClick={() => {
                                            if (locked) {
                                                return;
                                            }

                                            setType(option.type);
                                            setErrors((currentErrors) => ({
                                                ...currentErrors,
                                                type: undefined,
                                            }));
                                        }}
                                        disabled={locked}
                                        className={cn(
                                            'rounded-md border px-3 py-2 text-xs transition-colors',
                                            selected
                                                ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                                                : 'border-border bg-background/60 text-zinc-300 hover:border-zinc-600',
                                            locked && 'cursor-not-allowed opacity-65',
                                        )}
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            <span>{option.label}</span>
                                            {locked ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[0.625rem]"
                                                >
                                                    Locked
                                                </Badge>
                                            ) : null}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.type ? (
                            <p className="text-xs text-red-300">{errors.type}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="calendar-entry-date"
                            className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                        >
                            Date
                        </label>
                        <Input
                            id="calendar-entry-date"
                            type="date"
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value);
                                setErrors((currentErrors) => ({
                                    ...currentErrors,
                                    date: undefined,
                                }));
                            }}
                            className="bg-background/60"
                        />
                        {errors.date ? (
                            <p className="text-xs text-red-300">{errors.date}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="calendar-entry-title"
                            className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                        >
                            Title
                        </label>
                        <Input
                            id="calendar-entry-title"
                            value={title}
                            maxLength={255}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                setErrors((currentErrors) => ({
                                    ...currentErrors,
                                    title: undefined,
                                }));
                            }}
                            className="bg-background/60"
                        />
                        {errors.title ? (
                            <p className="text-xs text-red-300">{errors.title}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="calendar-entry-body"
                            className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                        >
                            Note
                        </label>
                        <Textarea
                            id="calendar-entry-body"
                            value={body}
                            maxLength={5000}
                            onChange={(event) => {
                                setBody(event.target.value);
                                setErrors((currentErrors) => ({
                                    ...currentErrors,
                                    body: undefined,
                                }));
                            }}
                            rows={5}
                            className="resize-none bg-background/60"
                        />
                        {errors.body ? (
                            <p className="text-xs text-red-300">{errors.body}</p>
                        ) : null}
                    </div>

                        {typeIsLocked ? (
                            <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                This entry type requires an active subscription.
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter className="border-t border-border px-5 py-3 sm:justify-between">
                        <div>
                            {context?.mode === 'edit' ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={isSubmitting || isDeleting}
                                    onClick={() => {
                                        void remove();
                                    }}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSubmitting || isDeleting}
                                onClick={() => {
                                    onOpenChange(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isDeleting || typeIsLocked}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
