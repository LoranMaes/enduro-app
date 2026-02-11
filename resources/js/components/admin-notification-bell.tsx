import { router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initializeEcho } from '@/lib/echo';
import {
    index as ticketNotificationsIndex,
    markAllSeen as ticketNotificationsMarkAllSeen,
    markSeen as ticketNotificationsMarkSeen,
} from '@/routes/admin/api/ticket-notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type AdminNotification = {
    id: string;
    type: string;
    data: {
        ticket_id?: number;
        ticket_title?: string;
        mentioned_by?: {
            id: number;
            name: string;
            email: string;
        };
        url?: string;
    };
    read_at: string | null;
    created_at: string | null;
};

type NotificationApiResponse = {
    data: AdminNotification[];
    meta: {
        unread_count: number;
    };
};

export function AdminNotificationBell({ className }: { className?: string }) {
    const { auth, admin_notifications } = usePage<SharedData>().props;
    const isAdmin = auth.user?.role === 'admin';
    const isImpersonating = auth.impersonating === true;
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(
        admin_notifications?.unread_count ?? 0,
    );

    useEffect(() => {
        setUnreadCount(admin_notifications?.unread_count ?? 0);
    }, [admin_notifications?.unread_count]);

    useEffect(() => {
        if (!isAdmin || isImpersonating || auth.user?.id === undefined) {
            return;
        }

        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channelName = `App.Models.User.${auth.user.id}`;
        const eventName = '.admin.notification.created';
        const channel = echo.private(channelName);

        channel.listen(
            eventName,
            (event: {
                notification?: AdminNotification;
                unread_count?: number;
            }) => {
                if (event.notification !== undefined) {
                    setItems((current) => [event.notification!, ...current]);
                }

                if (typeof event.unread_count === 'number') {
                    setUnreadCount(event.unread_count);
                }
            },
        );

        return () => {
            channel.stopListening(eventName);
            echo.leave(channelName);
        };
    }, [auth.user?.id, isAdmin, isImpersonating]);

    if (!isAdmin || isImpersonating) {
        return null;
    }

    const loadNotifications = async (): Promise<void> => {
        setLoading(true);

        try {
            const route = ticketNotificationsIndex({
                query: { per_page: 20 },
            });

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as NotificationApiResponse;
            setItems(payload.data);
            setUnreadCount(payload.meta.unread_count);
        } catch {
            return;
        } finally {
            setLoading(false);
        }
    };

    const markSeen = async (notificationId: string): Promise<void> => {
        try {
            const route = ticketNotificationsMarkSeen({
                notification: notificationId,
            });

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({}),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as {
                unread_count: number;
                notification: AdminNotification;
            };

            setUnreadCount(payload.unread_count);
            setItems((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? {
                              ...notification,
                              read_at: payload.notification.read_at,
                          }
                        : notification,
                ),
            );
        } catch {
            return;
        }
    };

    const markAllSeen = async (): Promise<void> => {
        try {
            const route = ticketNotificationsMarkAllSeen();

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({}),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                return;
            }

            setUnreadCount(0);
            setItems((current) =>
                current.map((notification) => ({
                    ...notification,
                    read_at: notification.read_at ?? new Date().toISOString(),
                })),
            );
        } catch {
            return;
        }
    };

    const openTicket = async (notification: AdminNotification): Promise<void> => {
        if (notification.read_at === null) {
            void markSeen(notification.id);
        }

        const destination = notification.data.url;

        if (typeof destination === 'string' && destination !== '') {
            router.visit(destination, {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    return (
        <div className={cn('z-30', className)}>
            <DropdownMenu
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);

                    if (nextOpen && items.length === 0 && !loading) {
                        void loadNotifications();
                    }
                }}
            >
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-zinc-900/70 text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
                        aria-label="Open notifications"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 ? (
                            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-black">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        ) : null}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[360px] border-border bg-surface p-0"
                >
                    <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs tracking-wider text-zinc-400 uppercase">
                            Notifications
                        </span>
                        <button
                            type="button"
                            className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-200"
                            onClick={() => void markAllSeen()}
                        >
                            Mark all as seen
                        </button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="px-3 py-6 text-sm text-zinc-500">
                                Loading notifications...
                            </p>
                        ) : items.length === 0 ? (
                            <p className="px-3 py-6 text-sm text-zinc-500">
                                No notifications yet.
                            </p>
                        ) : (
                            items.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={`flex cursor-pointer flex-col items-start gap-1 rounded-none border-b border-zinc-900/80 px-3 py-2 text-left ${
                                        notification.read_at === null
                                            ? 'bg-emerald-950/15'
                                            : ''
                                    }`}
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        void openTicket(notification);
                                    }}
                                >
                                    <p className="line-clamp-1 text-sm font-medium text-zinc-100">
                                        {notification.data.ticket_title ??
                                            'Ticket mention'}
                                    </p>
                                    <p className="line-clamp-2 text-xs text-zinc-500">
                                        Mentioned by{' '}
                                        {notification.data.mentioned_by?.name ??
                                            'Admin'}
                                    </p>
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function csrfToken(): string {
    const csrfMetaTag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return csrfMetaTag?.content ?? '';
}
