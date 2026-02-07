import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage();
    const currentPath = new URL(
        page.url,
        window?.location.origin ?? 'http://localhost',
    ).pathname;
    const showGlobalHeader = !currentPath.startsWith('/dashboard');

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {showGlobalHeader ? (
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                ) : null}
                {children}
            </AppContent>
        </AppShell>
    );
}
