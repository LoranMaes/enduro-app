import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SupportComposerProps = {
    value: string;
    busy: boolean;
    disabled: boolean;
    error: string | null;
    fieldError: string | null;
    onChange: (value: string) => void;
    onSubmit: () => void;
};

export function SupportComposer({
    value,
    busy,
    disabled,
    error,
    fieldError,
    onChange,
    onSubmit,
}: SupportComposerProps) {
    return (
        <div className="rounded-lg border border-border bg-background p-3">
            <Label className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                Follow-up
            </Label>
            <Textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 min-h-24 bg-zinc-950"
                placeholder={
                    disabled
                        ? 'Resolved tickets are locked.'
                        : 'Add more context, screenshots, or updates...'
                }
                disabled={disabled || busy}
            />
            {fieldError !== null ? (
                <p className="mt-2 text-xs text-red-300">{fieldError}</p>
            ) : null}
            {error !== null ? (
                <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
            <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                    {disabled
                        ? 'This ticket is resolved. New replies are disabled.'
                        : 'Your message appears in the support conversation.'}
                </p>
                <Button
                    type="button"
                    size="sm"
                    disabled={disabled || busy || value.trim() === ''}
                    onClick={onSubmit}
                >
                    <Send className="mr-1.5 h-4 w-4" />
                    {busy ? 'Sending...' : 'Send'}
                </Button>
            </div>
        </div>
    );
}
