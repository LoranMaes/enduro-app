import { useEffect, useRef } from 'react';
import { initializeEcho } from '@/lib/echo';

type UseTicketRealtimeOptions = {
    activeTab: 'board' | 'archived';
    selectedTicketId: number | null;
    refreshBoard: () => Promise<void>;
    refreshArchived: () => Promise<void>;
    openTicketDetail: (ticketId: number) => Promise<void>;
};

export function useTicketRealtime({
    activeTab,
    selectedTicketId,
    refreshBoard,
    refreshArchived,
    openTicketDetail,
}: UseTicketRealtimeOptions): void {
    const activeTabRef = useRef(activeTab);
    const selectedTicketIdRef = useRef(selectedTicketId);
    const refreshBoardRef = useRef(refreshBoard);
    const refreshArchivedRef = useRef(refreshArchived);
    const openTicketDetailRef = useRef(openTicketDetail);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useEffect(() => {
        selectedTicketIdRef.current = selectedTicketId;
    }, [selectedTicketId]);

    useEffect(() => {
        refreshBoardRef.current = refreshBoard;
    }, [refreshBoard]);

    useEffect(() => {
        refreshArchivedRef.current = refreshArchived;
    }, [refreshArchived]);

    useEffect(() => {
        openTicketDetailRef.current = openTicketDetail;
    }, [openTicketDetail]);

    useEffect(() => {
        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channel = echo.private('admin.tickets');

        channel.listen('.ticket.updated', () => {
            void refreshBoardRef.current();

            if (activeTabRef.current === 'archived') {
                void refreshArchivedRef.current();
            }

            if (selectedTicketIdRef.current !== null) {
                void openTicketDetailRef.current(selectedTicketIdRef.current);
            }
        });

        return () => {
            channel.stopListening('.ticket.updated');
            echo.leave('admin.tickets');
        };
    }, []);
}
