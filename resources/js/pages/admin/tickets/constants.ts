export const ticketStatuses = ['todo', 'in_progress', 'to_review', 'done'] as const;

export type TicketStatusKey = (typeof ticketStatuses)[number];

export const ticketTypes = ['bug', 'feature', 'chore', 'support'] as const;

export type TicketType = (typeof ticketTypes)[number];

export const ticketImportances = ['low', 'normal', 'high', 'urgent'] as const;

export type TicketImportance = (typeof ticketImportances)[number];

export const statusColumns: Array<{ key: TicketStatusKey; label: string }> = [
    { key: 'todo', label: 'Todo' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'to_review', label: 'To Review' },
    { key: 'done', label: 'Done' },
];

export const ticketTypeOptions: Array<{ value: TicketType; label: string }> = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'chore', label: 'Chore' },
    { value: 'support', label: 'Support' },
];

export const ticketImportanceOptions: Array<{
    value: TicketImportance;
    label: string;
}> = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];
