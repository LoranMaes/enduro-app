import { useCallback, useEffect, useState } from 'react';

type UseTicketSelectionOptions = {
    pageUrl: string;
};

type UseTicketSelectionResult = {
    selectedTicketId: number | null;
    ticketDetailOpen: boolean;
    openTicket: (ticketId: number) => void;
    closeTicket: () => void;
};

export function useTicketSelection({
    pageUrl,
}: UseTicketSelectionOptions): UseTicketSelectionResult {
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
        null,
    );
    const [ticketDetailOpen, setTicketDetailOpen] = useState(false);

    const removeTicketQueryFromUrl = useCallback((): void => {
        if (typeof window === 'undefined') {
            return;
        }

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('ticket');

        window.history.replaceState(
            window.history.state,
            '',
            `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
        );
    }, []);

    const openTicket = useCallback((ticketId: number): void => {
        if (ticketId <= 0) {
            return;
        }

        setSelectedTicketId(ticketId);
        setTicketDetailOpen(true);
    }, []);

    const closeTicket = useCallback((): void => {
        setTicketDetailOpen(false);
        setSelectedTicketId(null);
        removeTicketQueryFromUrl();
    }, [removeTicketQueryFromUrl]);

    useEffect(() => {
        const pageQuery = pageUrl.split('?')[1] ?? '';
        const search =
            typeof window === 'undefined'
                ? pageQuery
                : window.location.search.replace(/^\?/, '') || pageQuery;
        const ticketQueryValue = new URLSearchParams(search).get('ticket');

        if (ticketQueryValue === null) {
            return;
        }

        const ticketId = Number.parseInt(ticketQueryValue, 10);

        if (Number.isNaN(ticketId) || ticketId <= 0) {
            return;
        }

        if (selectedTicketId === ticketId && ticketDetailOpen) {
            return;
        }

        setSelectedTicketId(ticketId);
        setTicketDetailOpen(true);
    }, [pageUrl, selectedTicketId, ticketDetailOpen]);

    return {
        selectedTicketId,
        ticketDetailOpen,
        openTicket,
        closeTicket,
    };
}
