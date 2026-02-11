import { useCallback, useState } from 'react';
import {
    linkActivity as linkActivityToSession,
    unlinkActivity as unlinkActivityFromSession,
} from '@/routes/training-sessions';
import { extractMessage, extractValidationErrors } from '../utils';
import type { ValidationErrors } from '../types';

type LinkingResult = {
    success: boolean;
    validationErrors: ValidationErrors | null;
    message: string | null;
};

export function useSessionLinking() {
    const [isLinkingActivity, setIsLinkingActivity] = useState(false);
    const [isUnlinkingActivity, setIsUnlinkingActivity] = useState(false);

    const linkActivity = useCallback(
        async (sessionId: number, activityId: number): Promise<LinkingResult> => {
            setIsLinkingActivity(true);

            try {
                const route = linkActivityToSession(sessionId);
                const response = await fetch(route.url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        activity_id: activityId,
                    }),
                });

                if (response.ok) {
                    return {
                        success: true,
                        validationErrors: null,
                        message: null,
                    };
                }

                const responsePayload = await response.json().catch(() => null);
                return {
                    success: false,
                    validationErrors: extractValidationErrors(responsePayload),
                    message:
                        extractMessage(responsePayload) ?? 'Unable to link activity.',
                };
            } finally {
                setIsLinkingActivity(false);
            }
        },
        [],
    );

    const unlinkActivity = useCallback(
        async (sessionId: number): Promise<LinkingResult> => {
            setIsUnlinkingActivity(true);

            try {
                const route = unlinkActivityFromSession(sessionId);
                const response = await fetch(route.url, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    return {
                        success: true,
                        validationErrors: null,
                        message: null,
                    };
                }

                const responsePayload = await response.json().catch(() => null);
                return {
                    success: false,
                    validationErrors: extractValidationErrors(responsePayload),
                    message:
                        extractMessage(responsePayload) ?? 'Unable to unlink activity.',
                };
            } finally {
                setIsUnlinkingActivity(false);
            }
        },
        [],
    );

    return {
        isLinkingActivity,
        isUnlinkingActivity,
        linkActivity,
        unlinkActivity,
    };
}
