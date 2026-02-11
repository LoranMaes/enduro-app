import { useEffect } from 'react';
import { initializeEcho } from '@/lib/echo';

type UseTicketRealtimeOptions = {
    activeTab: 'board' | 'archived';
    selectedTicketId: number | null;
    pageUrl: string;
    refreshBoard: () => Promise<void>;
    refreshArchived: () => Promise<void>;
    openTicketDetail: (ticketId: number) => Promise<void>;
};

export function useTicketRealtime({
    activeTab,
    selectedTicketId,
    pageUrl,
    refreshBoard,
    refreshArchived,
    openTicketDetail,
}: UseTicketRealtimeOptions): void {
    useEffect(() => {
        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channel = echo.private('admin.tickets');

        channel.listen('.ticket.updated', () => {
            void refreshBoard();

            if (activeTab === 'archived') {
                void refreshArchived();
            }

            if (selectedTicketId !== null) {
                void openTicketDetail(selectedTicketId);
            }
        });

        return () => {
            channel.stopListening('.ticket.updated');
            echo.leave('admin.tickets');
        };
    }, [
        activeTab,
        openTicketDetail,
        refreshArchived,
        refreshBoard,
        selectedTicketId,
    ]);

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

        if (selectedTicketId === ticketId) {
            return;
        }

        void openTicketDetail(ticketId);
    }, [openTicketDetail, pageUrl, selectedTicketId]);
}
