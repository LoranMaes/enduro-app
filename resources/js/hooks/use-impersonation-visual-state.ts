import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { SharedData } from '@/types';

const impersonationVisualStateStorageKey = 'endure:impersonation-visual-state';

type ImpersonationVisualState = {
    isImpersonating: boolean;
    visualImpersonating: boolean;
};

export function useImpersonationVisualState(): ImpersonationVisualState {
    const { auth } = usePage<SharedData>().props;
    const isImpersonating = auth.impersonating ?? false;
    const [visualImpersonating, setVisualImpersonating] =
        useState<boolean>(() => {
            if (typeof window === 'undefined') {
                return isImpersonating;
            }

            const storedState = window.sessionStorage.getItem(
                impersonationVisualStateStorageKey,
            );

            if (storedState === null) {
                return isImpersonating;
            }

            return storedState === '1';
        });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const storedState = window.sessionStorage.getItem(
            impersonationVisualStateStorageKey,
        );
        const previousState =
            storedState === null ? isImpersonating : storedState === '1';

        if (previousState !== isImpersonating) {
            const animationFrame = window.requestAnimationFrame(() => {
                setVisualImpersonating(isImpersonating);
                window.sessionStorage.setItem(
                    impersonationVisualStateStorageKey,
                    isImpersonating ? '1' : '0',
                );
            });

            return () => {
                window.cancelAnimationFrame(animationFrame);
            };
        }

        setVisualImpersonating(isImpersonating);
        window.sessionStorage.setItem(
            impersonationVisualStateStorageKey,
            isImpersonating ? '1' : '0',
        );
    }, [isImpersonating]);

    return {
        isImpersonating,
        visualImpersonating,
    };
}
