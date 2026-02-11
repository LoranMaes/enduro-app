import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { index as adminTicketIndex } from '@/routes/admin/api/tickets';
import type { BoardData, Filters, Paginated, TicketRecord } from '../types';

type UseTicketBoardDataOptions = {
    initialBoard: BoardData;
    initialArchived: Paginated<TicketRecord>;
    initialFilters: Filters;
};

type UseTicketBoardDataResult = {
    activeTab: 'board' | 'archived';
    setActiveTab: Dispatch<SetStateAction<'board' | 'archived'>>;
    board: BoardData;
    setBoard: Dispatch<SetStateAction<BoardData>>;
    archived: Paginated<TicketRecord>;
    setArchived: Dispatch<SetStateAction<Paginated<TicketRecord>>>;
    queryFilters: Filters;
    setQueryFilters: Dispatch<SetStateAction<Filters>>;
    boardLoading: boolean;
    archivedLoading: boolean;
    refreshBoard: (nextFilters?: Filters) => Promise<void>;
    refreshArchived: (page?: number, nextFilters?: Filters) => Promise<void>;
};

export function useTicketBoardData({
    initialBoard,
    initialArchived,
    initialFilters,
}: UseTicketBoardDataOptions): UseTicketBoardDataResult {
    const [activeTab, setActiveTab] = useState<'board' | 'archived'>('board');
    const [board, setBoard] = useState<BoardData>(initialBoard);
    const [archived, setArchived] =
        useState<Paginated<TicketRecord>>(initialArchived);
    const [queryFilters, setQueryFilters] = useState<Filters>(initialFilters);
    const [boardLoading, setBoardLoading] = useState(false);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const hasInitializedFilters = useRef(false);

    const refreshBoard = useCallback(
        async (nextFilters = queryFilters): Promise<void> => {
            setBoardLoading(true);

            try {
                const route = adminTicketIndex({
                    query: {
                        view: 'board',
                        search: nextFilters.search,
                        assignee_admin_id: nextFilters.assignee_admin_id,
                        creator_admin_id: nextFilters.creator_admin_id,
                        type: nextFilters.type === 'all' ? '' : nextFilters.type,
                        importance:
                            nextFilters.importance === 'all'
                                ? ''
                                : nextFilters.importance,
                        sort: nextFilters.sort,
                        direction: nextFilters.direction,
                    },
                });

                const response = await fetch(route.url, {
                    method: route.method,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as { data: BoardData };
                setBoard(payload.data);
            } finally {
                setBoardLoading(false);
            }
        },
        [queryFilters],
    );

    const refreshArchived = useCallback(
        async (
            page = archived.meta.current_page,
            nextFilters = queryFilters,
        ): Promise<void> => {
            setArchivedLoading(true);

            try {
                const route = adminTicketIndex({
                    query: {
                        view: 'archived',
                        search: nextFilters.search,
                        assignee_admin_id: nextFilters.assignee_admin_id,
                        creator_admin_id: nextFilters.creator_admin_id,
                        type: nextFilters.type === 'all' ? '' : nextFilters.type,
                        importance:
                            nextFilters.importance === 'all'
                                ? ''
                                : nextFilters.importance,
                        sort: nextFilters.sort,
                        direction: nextFilters.direction,
                        page,
                        per_page: archived.meta.per_page,
                    },
                });

                const response = await fetch(route.url, {
                    method: route.method,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as Paginated<TicketRecord>;
                setArchived(payload);
            } finally {
                setArchivedLoading(false);
            }
        },
        [archived.meta.current_page, archived.meta.per_page, queryFilters],
    );

    useEffect(() => {
        if (!hasInitializedFilters.current) {
            hasInitializedFilters.current = true;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            if (activeTab === 'archived') {
                void refreshArchived(1, queryFilters);
                return;
            }

            void refreshBoard(queryFilters);
        }, 260);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        activeTab,
        queryFilters.assignee_admin_id,
        queryFilters.creator_admin_id,
        queryFilters.direction,
        queryFilters.importance,
        queryFilters.search,
        queryFilters.sort,
        queryFilters.type,
        refreshArchived,
        refreshBoard,
    ]);

    return {
        activeTab,
        setActiveTab,
        board,
        setBoard,
        archived,
        setArchived,
        queryFilters,
        setQueryFilters,
        boardLoading,
        archivedLoading,
        refreshBoard,
        refreshArchived,
    };
}
