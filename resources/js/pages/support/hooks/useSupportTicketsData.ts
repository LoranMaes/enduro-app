import { useCallback, useMemo, useState } from 'react';
import { index as supportTicketsIndex } from '@/routes/support/tickets';
import type { SupportTicketBuckets, SupportTicketRecord } from '../types';

type UseSupportTicketsDataOptions = {
    initialTickets: SupportTicketBuckets;
};

export function useSupportTicketsData({
    initialTickets,
}: UseSupportTicketsDataOptions) {
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [tickets, setTickets] = useState<SupportTicketBuckets>(initialTickets);
    const [loading, setLoading] = useState(false);

    const refreshTickets = useCallback(async (): Promise<void> => {
        setLoading(true);

        try {
            const route = supportTicketsIndex();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as SupportTicketBuckets;
            setTickets(payload);
        } finally {
            setLoading(false);
        }
    }, []);

    const upsertTicket = useCallback((ticket: SupportTicketRecord): void => {
        setTickets((current) => {
            const removeTicket = (items: SupportTicketRecord[]) =>
                items.filter((item) => item.id !== ticket.id);
            const targetBucket =
                ticket.archived_at === null ? 'active' : 'archived';

            if (targetBucket === 'active') {
                return {
                    active: [ticket, ...removeTicket(current.active)],
                    archived: removeTicket(current.archived),
                };
            }

            return {
                active: removeTicket(current.active),
                archived: [ticket, ...removeTicket(current.archived)],
            };
        });
    }, []);

    const activeTickets = useMemo(() => tickets.active, [tickets.active]);
    const archivedTickets = useMemo(() => tickets.archived, [tickets.archived]);
    const visibleTickets = useMemo(
        () => (activeTab === 'active' ? activeTickets : archivedTickets),
        [activeTab, activeTickets, archivedTickets],
    );

    return {
        activeTab,
        setActiveTab,
        tickets,
        activeTickets,
        archivedTickets,
        visibleTickets,
        loading,
        refreshTickets,
        upsertTicket,
    };
}
