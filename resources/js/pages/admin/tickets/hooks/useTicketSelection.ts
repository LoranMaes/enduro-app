import { useCallback, useMemo, useState } from 'react';

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
    const parseTicketIdFromSearch = useCallback((search: string): number | null => {
        const ticketQueryValue = new URLSearchParams(search).get('ticket');

        if (ticketQueryValue === null) {
            return null;
        }

        const ticketId = Number.parseInt(ticketQueryValue, 10);

        if (Number.isNaN(ticketId) || ticketId <= 0) {
            return null;
        }

        return ticketId;
    }, []);

    const readTicketIdFromCurrentLocation = useCallback((): number | null => {
        if (typeof window !== 'undefined') {
            return parseTicketIdFromSearch(
                window.location.search.replace(/^\?/, ''),
            );
        }

        return parseTicketIdFromSearch(pageUrl.split('?')[1] ?? '');
    }, [pageUrl, parseTicketIdFromSearch]);

    const [localSelection, setLocalSelection] = useState<{
        selectedTicketId: number | null;
        ticketDetailOpen: boolean;
    }>(() => {
        const initialTicketId = readTicketIdFromCurrentLocation();

        if (initialTicketId === null) {
            return {
                selectedTicketId: null,
                ticketDetailOpen: false,
            };
        }

        return {
            selectedTicketId: initialTicketId,
            ticketDetailOpen: true,
        };
    });

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

        setLocalSelection({
            selectedTicketId: ticketId,
            ticketDetailOpen: true,
        });
    }, []);

    const closeTicket = useCallback((): void => {
        setLocalSelection({
            selectedTicketId: null,
            ticketDetailOpen: false,
        });
        removeTicketQueryFromUrl();
    }, [removeTicketQueryFromUrl]);

    const queryTicketId = useMemo(() => {
        return readTicketIdFromCurrentLocation();
    }, [readTicketIdFromCurrentLocation]);

    const selectedTicketId =
        queryTicketId !== null
            ? queryTicketId
            : localSelection.selectedTicketId;
    const ticketDetailOpen =
        queryTicketId !== null ? true : localSelection.ticketDetailOpen;

    return {
        selectedTicketId,
        ticketDetailOpen,
        openTicket,
        closeTicket,
    };
}
