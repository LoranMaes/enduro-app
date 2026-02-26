import { useEffect, useState } from 'react';
import type { SupportTicketRecord } from '../types';

type UseSupportTicketSelectionOptions = {
    visibleTickets: SupportTicketRecord[];
};

export function useSupportTicketSelection({
    visibleTickets,
}: UseSupportTicketSelectionOptions) {
    const [selectedTicketId, setSelectedTicketId] = useState<
        number | string | null
    >(null);

    useEffect(() => {
        if (visibleTickets.length === 0) {
            setSelectedTicketId(null);
            return;
        }

        const hasCurrentSelection = visibleTickets.some(
            (ticket) => ticket.id === selectedTicketId,
        );

        if (hasCurrentSelection) {
            return;
        }

        setSelectedTicketId(visibleTickets[0]?.id ?? null);
    }, [selectedTicketId, visibleTickets]);

    return {
        selectedTicketId,
        setSelectedTicketId,
    };
}
