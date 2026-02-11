import { usePage } from '@inertiajs/react';
import { AdminNotificationBell } from '@/components/admin-notification-bell';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { useImpersonationVisualState } from '@/hooks/use-impersonation-visual-state';
import { cn } from '@/lib/utils';
import type { AppLayoutProps, SharedData } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    void breadcrumbs;
    const { isImpersonating, visualImpersonating } =
        useImpersonationVisualState();
    const { auth } = usePage<SharedData>().props;
    const showAdminNotificationBell =
        auth.user?.role === 'admin' && !isImpersonating;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="relative overflow-x-hidden">
                <div
                    className={cn(
                        'flex h-full min-h-0 flex-1 flex-col transition-all duration-300',
                        visualImpersonating &&
                            'm-2 rounded-lg border-4 border-amber-900/30 pb-12 shadow-[0_0_50px_rgba(245,158,11,0.05)]',
                        isImpersonating &&
                            !visualImpersonating &&
                            'pb-12',
                    )}
                >
                    {showAdminNotificationBell ? (
                        <div className="flex h-14 items-center justify-end border-b border-border bg-background/80 px-6">
                            <AdminNotificationBell />
                        </div>
                    ) : null}
                    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                </div>
                <ImpersonationBanner />
            </AppContent>
        </AppShell>
    );
}
