import { formatAuditEvent, formatDateTime } from '../lib/ticket-utils';
import type { TicketAudit } from '../types';

type TicketDetailAuditTabProps = {
    loading: boolean;
    logs: TicketAudit[];
};

export function TicketDetailAuditTab({
    loading,
    logs,
}: TicketDetailAuditTabProps) {
    if (loading) {
        return (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 py-4">
                <p className="text-sm text-zinc-500">Loading audit trail...</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 py-4">
                <p className="text-sm text-zinc-500">No audit events yet.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 py-4">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto pr-1">
                {logs.map((auditLog) => (
                    <div
                        key={auditLog.id}
                        className="max-w-full min-w-0 shrink-0 rounded-md border border-border bg-background px-3 py-2"
                    >
                        <p className="text-xs font-medium text-zinc-200">
                            {formatAuditEvent(auditLog.event_type)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {auditLog.actor_admin?.name ?? 'System'} •{' '}
                            {formatDateTime(auditLog.created_at)}
                        </p>
                        {auditLog.meta !== null ? (
                            <pre className="mt-2 max-h-56 w-full max-w-full overflow-x-hidden overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-2 text-[0.6875rem] [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-zinc-400">
                                {JSON.stringify(auditLog.meta, null, 2)}
                            </pre>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
