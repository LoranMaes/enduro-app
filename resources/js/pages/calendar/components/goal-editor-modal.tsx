import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { store as storeGoal, update as updateGoal } from '@/routes/goals';
import {
    GOAL_PRIORITY_OPTIONS,
    GOAL_SPORT_OPTIONS,
    GOAL_STATUS_OPTIONS,
    GOAL_TYPE_OPTIONS,
} from '../constants';
import type { GoalEditorContext } from '../types';

type GoalEditorModalProps = {
    open: boolean;
    context: GoalEditorContext | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

type ValidationErrors = {
    type?: string;
    sport?: string;
    title?: string;
    description?: string;
    target_date?: string;
    priority?: string;
    status?: string;
};

export function GoalEditorModal({
    open,
    context,
    onOpenChange,
    onSaved,
}: GoalEditorModalProps) {
    const [type, setType] = useState('text');
    const [sport, setSport] = useState('other');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [priority, setPriority] = useState('normal');
    const [status, setStatus] = useState('active');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open || context === null) {
            return;
        }

        if (context.mode === 'edit') {
            setType(context.goal.type ?? 'text');
            setSport(context.goal.sport ?? 'other');
            setTitle(context.goal.title ?? '');
            setDescription(context.goal.description ?? '');
            setTargetDate(context.goal.targetDate ?? '');
            setPriority(context.goal.priority ?? 'normal');
            setStatus(context.goal.status ?? 'active');
        } else {
            setType('text');
            setSport('other');
            setTitle('');
            setDescription('');
            setTargetDate(context.date);
            setPriority('normal');
            setStatus('active');
        }

        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
    }, [context, open]);

    const submit = async (): Promise<void> => {
        if (context === null || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setGeneralError(null);

        const payload = {
            type,
            sport,
            title: title.trim(),
            description: description.trim() === '' ? null : description.trim(),
            target_date: targetDate.trim() === '' ? null : targetDate,
            priority,
            status,
        };

        try {
            const route =
                context.mode === 'edit'
                    ? updateGoal(context.goal.id)
                    : storeGoal();
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

                setErrors({
                    type: errorPayload?.errors?.type?.[0],
                    sport: errorPayload?.errors?.sport?.[0],
                    title: errorPayload?.errors?.title?.[0],
                    description: errorPayload?.errors?.description?.[0],
                    target_date: errorPayload?.errors?.target_date?.[0],
                    priority: errorPayload?.errors?.priority?.[0],
                    status: errorPayload?.errors?.status?.[0],
                });
                setGeneralError(errorPayload?.message ?? 'Unable to save goal.');

                return;
            }

            onOpenChange(false);
            onSaved();
        } catch {
            setGeneralError('Unable to save goal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEditMode = context?.mode === 'edit';

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && isSubmitting) {
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
                        {isEditMode ? 'Goal details' : 'Create goal'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        Keep important targets visible on your calendar.
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

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="goal-type" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                    Type
                                </Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger id="goal-type" className="bg-background/60 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOAL_TYPE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type ? <p className="text-xs text-red-300">{errors.type}</p> : null}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="goal-sport" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                    Sport
                                </Label>
                                <Select value={sport} onValueChange={setSport}>
                                    <SelectTrigger id="goal-sport" className="bg-background/60 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOAL_SPORT_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.sport ? <p className="text-xs text-red-300">{errors.sport}</p> : null}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="goal-title" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                Title
                            </Label>
                            <Input
                                id="goal-title"
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
                                placeholder="Half Marathon PB"
                            />
                            {errors.title ? <p className="text-xs text-red-300">{errors.title}</p> : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="goal-date" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                    Target Date
                                </Label>
                                <Input
                                    id="goal-date"
                                    type="date"
                                    value={targetDate}
                                    onChange={(event) => {
                                        setTargetDate(event.target.value);
                                        setErrors((currentErrors) => ({
                                            ...currentErrors,
                                            target_date: undefined,
                                        }));
                                    }}
                                    className="bg-background/60"
                                />
                                {errors.target_date ? <p className="text-xs text-red-300">{errors.target_date}</p> : null}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="goal-priority" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                    Priority
                                </Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger id="goal-priority" className="bg-background/60 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOAL_PRIORITY_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.priority ? <p className="text-xs text-red-300">{errors.priority}</p> : null}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="goal-description" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                Description
                            </Label>
                            <Textarea
                                id="goal-description"
                                value={description}
                                maxLength={5000}
                                onChange={(event) => {
                                    setDescription(event.target.value);
                                    setErrors((currentErrors) => ({
                                        ...currentErrors,
                                        description: undefined,
                                    }));
                                }}
                                className="resize-none bg-background/60"
                                rows={4}
                            />
                            {errors.description ? <p className="text-xs text-red-300">{errors.description}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="goal-status" className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                Status
                            </Label>
                            <div className="flex items-center gap-2">
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="goal-status" className="bg-background/60 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOAL_STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Badge variant="outline" className="text-[0.625rem]">
                                    {status}
                                </Badge>
                            </div>
                            {errors.status ? <p className="text-xs text-red-300">{errors.status}</p> : null}
                        </div>
                    </div>

                    <DialogFooter className="border-t border-border px-5 py-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Saving...'
                                : isEditMode
                                  ? 'Save goal'
                                  : 'Create goal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
