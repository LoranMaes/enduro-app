import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { AppSidebar } from '@/components/app-sidebar';
import { useImpersonationVisualState } from '@/hooks/use-impersonation-visual-state';
import { cn } from '@/lib/utils';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    void breadcrumbs;
    const { isImpersonating, visualImpersonating } =
        useImpersonationVisualState();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
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
                    {children}
                </div>
                <ImpersonationBanner />
            </AppContent>
        </AppShell>
    );
}
