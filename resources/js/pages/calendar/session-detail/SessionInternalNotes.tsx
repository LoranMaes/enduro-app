import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type SessionInternalNotesProps = {
    value: string;
    canEditNotes: boolean;
    isSavingNotes: boolean;
    hasNotesChanged: boolean;
    notesError: string | null;
    notesStatus: string | null;
    onChange: (value: string) => void;
    onSave: () => void;
};

export function SessionInternalNotes({
    value,
    canEditNotes,
    isSavingNotes,
    hasNotesChanged,
    notesError,
    notesStatus,
    onChange,
    onSave,
}: SessionInternalNotesProps) {
    return (
        <div className="mt-3">
            <Textarea
                value={value}
                rows={8}
                disabled={!canEditNotes || isSavingNotes}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
                className={cn(
                    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-200',
                    'placeholder:text-zinc-600 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                    (!canEditNotes || isSavingNotes) &&
                        'cursor-not-allowed text-zinc-400 opacity-75',
                )}
                placeholder="Write internal notes for this session."
            />

            <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-zinc-500">
                    {canEditNotes
                        ? 'Notes are private to the athlete account.'
                        : 'Notes are read-only in this context.'}
                </p>

                {canEditNotes ? (
                    <button
                        type="button"
                        disabled={!hasNotesChanged || isSavingNotes}
                        onClick={onSave}
                        className={cn(
                            'inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors',
                            !hasNotesChanged || isSavingNotes
                                ? 'cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600'
                                : 'border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:text-zinc-100',
                        )}
                    >
                        <Save className="h-3.5 w-3.5" />
                        {isSavingNotes ? 'Saving...' : 'Save notes'}
                    </button>
                ) : null}
            </div>

            {notesStatus !== null ? (
                <p className="mt-2 text-[11px] text-zinc-500">
                    Last update saved successfully.
                </p>
            ) : null}

            {notesError !== null ? (
                <p className="mt-2 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">
                    {notesError}
                </p>
            ) : null}
        </div>
    );
}
