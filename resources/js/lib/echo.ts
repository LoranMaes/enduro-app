import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance: Echo<'reverb'> | null = null;

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

export function initializeEcho(): Echo<'reverb'> | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (echoInstance !== null) {
        return echoInstance;
    }

    const key = import.meta.env.VITE_REVERB_APP_KEY;

    if (!isNonEmptyString(key)) {
        return null;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': csrfToken(),
            },
        },
    });

    return echoInstance;
}

function csrfToken(): string {
    if (typeof document === 'undefined') {
        return '';
    }

    const csrfMetaTag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return csrfMetaTag?.content ?? '';
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}
