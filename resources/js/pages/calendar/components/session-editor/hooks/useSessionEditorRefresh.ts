import { useEffect } from 'react';
import type { SessionEditorContext } from '../types';
import type { TrainingSessionView } from '@/types/training-plans';

type UseSessionEditorRefreshParams = {
    open: boolean;
    context: SessionEditorContext | null;
    refreshSessionDetails: (
        sessionId: number,
    ) => Promise<{ session: TrainingSessionView | null }>;
    setSessionDetails: (session: TrainingSessionView | null) => void;
};

export function useSessionEditorRefresh({
    open,
    context,
    refreshSessionDetails,
    setSessionDetails,
}: UseSessionEditorRefreshParams): void {
    useEffect(() => {
        if (!open || context?.mode !== 'edit') {
            return;
        }

        void (async () => {
            const result = await refreshSessionDetails(context.session.id);

            if (result.session !== null) {
                setSessionDetails(result.session);
            }
        })();
    }, [context, open, refreshSessionDetails, setSessionDetails]);
}
