import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ValidationErrors } from '../types';

type SessionNotesSectionProps = {
    notes: string;
    canManageSessionWrites: boolean;
    setNotes: (value: string) => void;
    clearFieldError: (field: keyof ValidationErrors) => void;
    errors: ValidationErrors;
};

export function SessionNotesSection({
    notes,
    canManageSessionWrites,
    setNotes,
    clearFieldError,
    errors,
}: SessionNotesSectionProps) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor="session-notes" className="text-xs text-zinc-400">
                Notes
            </Label>
            <Textarea
                id="session-notes"
                rows={4}
                disabled={!canManageSessionWrites}
                value={notes}
                onChange={(event) => {
                    setNotes(event.target.value);
                    clearFieldError('notes');
                }}
                className={cn(
                    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-200',
                    'placeholder:text-zinc-600 focus-visible:border-ring focus-visible:ring-[0.1875rem] focus-visible:ring-ring/50 focus-visible:outline-none',
                    !canManageSessionWrites &&
                        'cursor-default opacity-65',
                )}
            />
            <InputError message={errors.notes} />
        </div>
    );
}
