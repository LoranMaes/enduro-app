import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from './ticket-ui';
import type { AdminOption, Filters } from '../types';

type TicketFiltersProps = {
    queryFilters: Filters;
    admins: AdminOption[];
    onFiltersChange: (nextFilters: Filters) => void;
};

export function TicketFilters({
    queryFilters,
    admins,
    onFiltersChange,
}: TicketFiltersProps) {
    const updateFilters = (patch: Partial<Filters>): void => {
        onFiltersChange({
            ...queryFilters,
            ...patch,
        });
    };

    return (
        <section className="mb-4 rounded-xl border border-border bg-surface px-4 py-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_repeat(5,minmax(0,1fr))]">
                <div className="space-y-1">
                    <Label
                        htmlFor="ticket-search"
                        className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                    >
                        Search
                    </Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                        <Input
                            id="ticket-search"
                            value={queryFilters.search}
                            onChange={(event) => {
                                updateFilters({ search: event.target.value });
                            }}
                            className="h-9 bg-background pl-8 text-xs"
                            placeholder="Search title, description, my notes..."
                        />
                    </div>
                </div>

                <SelectField
                    label="Assignee"
                    value={String(queryFilters.assignee_admin_id)}
                    onChange={(value) => {
                        updateFilters({
                            assignee_admin_id:
                                Number.parseInt(value, 10) || 0,
                        });
                    }}
                    options={[
                        { value: '0', label: 'All assignees' },
                        ...admins.map((admin) => ({
                            value: String(admin.id),
                            label: admin.name,
                        })),
                    ]}
                />

                <SelectField
                    label="Creator"
                    value={String(queryFilters.creator_admin_id)}
                    onChange={(value) => {
                        updateFilters({
                            creator_admin_id:
                                Number.parseInt(value, 10) || 0,
                        });
                    }}
                    options={[
                        { value: '0', label: 'All creators' },
                        ...admins.map((admin) => ({
                            value: String(admin.id),
                            label: admin.name,
                        })),
                    ]}
                />

                <SelectField
                    label="Type"
                    value={queryFilters.type}
                    onChange={(value) => {
                        updateFilters({
                            type: value as Filters['type'],
                        });
                    }}
                    options={[
                        { value: 'all', label: 'All types' },
                        { value: 'bug', label: 'Bug' },
                        { value: 'feature', label: 'Feature' },
                        { value: 'chore', label: 'Chore' },
                        { value: 'support', label: 'Support' },
                    ]}
                />

                <SelectField
                    label="Importance"
                    value={queryFilters.importance}
                    onChange={(value) => {
                        updateFilters({
                            importance: value as Filters['importance'],
                        });
                    }}
                    options={[
                        { value: 'all', label: 'All priorities' },
                        { value: 'low', label: 'Low' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' },
                    ]}
                />

                <div className="grid grid-cols-2 gap-2">
                    <SelectField
                        label="Sort"
                        value={queryFilters.sort}
                        onChange={(value) => {
                            updateFilters({
                                sort: value as Filters['sort'],
                            });
                        }}
                        options={[
                            { value: 'updated_at', label: 'Updated' },
                            { value: 'created_at', label: 'Created' },
                            { value: 'title', label: 'Title' },
                            { value: 'status', label: 'Status' },
                            { value: 'type', label: 'Type' },
                            { value: 'importance', label: 'Importance' },
                        ]}
                    />
                    <SelectField
                        label="Direction"
                        value={queryFilters.direction}
                        onChange={(value) => {
                            updateFilters({
                                direction: value === 'asc' ? 'asc' : 'desc',
                            });
                        }}
                        options={[
                            { value: 'desc', label: 'Desc' },
                            { value: 'asc', label: 'Asc' },
                        ]}
                    />
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <span className="text-[0.6875rem] text-zinc-500">
                    Filters apply automatically.
                </span>
            </div>
        </section>
    );
}
