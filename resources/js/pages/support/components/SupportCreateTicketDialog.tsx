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
import { Textarea } from '@/components/ui/textarea';
import { SelectField } from '@/pages/admin/tickets/components/ticket-ui';
import type { SupportRequestFieldErrors } from '../types';

type SupportCreateTicketDialogProps = {
    open: boolean;
    busy: boolean;
    type: 'bug' | 'feature' | 'support';
    title: string;
    message: string;
    error: string | null;
    fieldErrors: SupportRequestFieldErrors;
    onOpenChange: (open: boolean) => void;
    onTypeChange: (value: 'bug' | 'feature' | 'support') => void;
    onTitleChange: (value: string) => void;
    onMessageChange: (value: string) => void;
    onSubmit: () => void;
};

export function SupportCreateTicketDialog({
    open,
    busy,
    type,
    title,
    message,
    error,
    fieldErrors,
    onOpenChange,
    onTypeChange,
    onTitleChange,
    onMessageChange,
    onSubmit,
}: SupportCreateTicketDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-border bg-surface">
                <DialogHeader>
                    <DialogTitle>Create support ticket</DialogTitle>
                    <DialogDescription>
                        Tell us what is happening and we will follow up in this
                        thread.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <SelectField
                        label="Type"
                        value={type}
                        onChange={(value) => {
                            onTypeChange(value as 'bug' | 'feature' | 'support');
                        }}
                        options={[
                            { value: 'bug', label: 'Bug report' },
                            { value: 'feature', label: 'Feature request' },
                            { value: 'support', label: 'Support question' },
                        ]}
                    />
                    <div className="space-y-1">
                        <Label htmlFor="support-ticket-title">Title</Label>
                        <Input
                            id="support-ticket-title"
                            className="bg-background"
                            value={title}
                            onChange={(event) => {
                                onTitleChange(event.target.value);
                            }}
                        />
                        {fieldErrors.title?.[0] !== undefined ? (
                            <p className="text-xs text-red-300">
                                {fieldErrors.title[0]}
                            </p>
                        ) : null}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="support-ticket-message">Message</Label>
                        <Textarea
                            id="support-ticket-message"
                            className="min-h-28 bg-background"
                            value={message}
                            onChange={(event) => {
                                onMessageChange(event.target.value);
                            }}
                        />
                        {fieldErrors.message?.[0] !== undefined ? (
                            <p className="text-xs text-red-300">
                                {fieldErrors.message[0]}
                            </p>
                        ) : null}
                    </div>
                    {error !== null ? (
                        <div className="rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    ) : null}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            onSubmit();
                        }}
                    >
                        {busy ? 'Creating...' : 'Submit ticket'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
