import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ActivityLogItem } from '../types';
import { formatDateTime } from '../utils';

type LogDetailsDialogProps = {
    selectedLog: ActivityLogItem | null;
    setSelectedLog: (log: ActivityLogItem | null) => void;
};

export function LogDetailsDialog({
    selectedLog,
    setSelectedLog,
}: LogDetailsDialogProps) {
    return (
        <Dialog
            open={selectedLog !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setSelectedLog(null);
                }
            }}
        >
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border-border bg-surface text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-base">
                        Log #{selectedLog?.id}
                    </DialogTitle>
                </DialogHeader>

                {selectedLog !== null ? (
                    <div className="space-y-3 overflow-y-auto pr-1">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <LogDetail label="Time">
                                {formatDateTime(selectedLog.created_at)}
                            </LogDetail>
                            <LogDetail label="Event">
                                {selectedLog.event ?? '—'}
                            </LogDetail>
                            <LogDetail label="Action">
                                {selectedLog.description}
                            </LogDetail>
                            <LogDetail label="Subject">
                                {selectedLog.subject_label ?? 'Request'}
                                {selectedLog.subject_id !== null
                                    ? ` #${selectedLog.subject_id}`
                                    : ''}
                            </LogDetail>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            <JsonPanel
                                label="Previous values"
                                payload={selectedLog.changes.old ?? {}}
                            />
                            <JsonPanel
                                label="Next values"
                                payload={selectedLog.changes.attributes ?? {}}
                            />
                        </div>

                        <JsonPanel label="Properties" payload={selectedLog.properties} />
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function LogDetail({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-1 text-xs text-zinc-200">{children}</p>
        </div>
    );
}

function JsonPanel({
    label,
    payload,
}: {
    label: string;
    payload: Record<string, unknown>;
}) {
    return (
        <div className="rounded-md border border-border bg-background p-3">
            <p className="mb-2 text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[0.6875rem] text-zinc-300">
                {JSON.stringify(payload, null, 2)}
            </pre>
        </div>
    );
}
