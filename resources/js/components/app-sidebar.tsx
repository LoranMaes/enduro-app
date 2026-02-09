import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    ClipboardCheck,
    Eye,
    FileText,
    LogOut,
    Settings,
    ShieldCheck,
    TrendingUp,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useImpersonationVisualState } from '@/hooks/use-impersonation-visual-state';
import { dashboard, logout } from '@/routes';
import { index as adminIndex } from '@/routes/admin';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { index as coachesIndex } from '@/routes/coaches';
import { overview as settingsOverview } from '@/routes/settings';
import type { SharedData } from '@/types';

type AppRole = 'athlete' | 'coach' | 'admin';
type SidebarItem = {
    title: string;
    href: string;
    icon: LucideIcon;
    isActive: (currentPath: string) => boolean;
};

export function AppSidebar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentPath = new URL(
        page.url,
        window?.location.origin ?? 'http://localhost',
    ).pathname;
    const role = (auth.user.role ?? 'athlete') as AppRole;
    const { isImpersonating, visualImpersonating } =
        useImpersonationVisualState();
    const isAdminConsoleMode = role === 'admin' && !isImpersonating;

    const items: SidebarItem[] = isAdminConsoleMode
        ? [
              {
                  title: 'Admin Console',
                  href: adminIndex().url,
                  icon: ShieldCheck,
                  isActive: (path: string) => path === '/admin',
              },
              {
                  title: 'Users',
                  href: adminUsersIndex().url,
                  icon: UsersRound,
                  isActive: (path: string) => path.startsWith('/admin/users'),
              },
              {
                  title: 'Analytics',
                  href: '/admin/analytics',
                  icon: BarChart3,
                  isActive: (path: string) => path.startsWith('/admin/analytics'),
              },
              {
                  title: 'Coach Applications',
                  href: '/admin/coach-applications',
                  icon: ClipboardCheck,
                  isActive: (path: string) =>
                      path.startsWith('/admin/coach-applications'),
              },
          ]
        : [
              {
                  title: 'Calendar',
                  href: dashboard().url,
                  icon: CalendarDays,
                  isActive: (path: string) =>
                      path.startsWith('/dashboard') ||
                      path.startsWith('/sessions'),
              },
              ...(role === 'athlete'
                  ? [
                        {
                            title: 'Training Progress',
                            href: '/progress',
                            icon: TrendingUp,
                            isActive: (path: string) =>
                                path.startsWith('/progress'),
                        } satisfies SidebarItem,
                        {
                            title: 'Training Plans',
                            href: '/plans',
                            icon: FileText,
                            isActive: (path: string) =>
                                path.startsWith('/plans'),
                        } satisfies SidebarItem,
                    ]
                  : []),
              ...(role === 'coach'
                  ? [
                        {
                            title: 'Athletes',
                            href: coachesIndex().url,
                            icon: UsersRound,
                            isActive: (path: string) =>
                                path.startsWith('/coaches') ||
                                path.startsWith('/athletes'),
                        } satisfies SidebarItem,
                    ]
                  : []),
              {
                  title: 'Settings',
                  href: settingsOverview().url,
                  icon: Settings,
                  isActive: (path: string) => path.startsWith('/settings'),
              },
          ];

    const roleBadge = role === 'coach' ? 'C' : 'A';
    const homeHref = isAdminConsoleMode ? adminIndex().url : dashboard().url;

    return (
        <aside
            className={`z-20 flex h-svh w-16 shrink-0 flex-col items-center border-r py-6 transition-colors duration-300 ${
                visualImpersonating
                    ? 'border-amber-900/30 bg-amber-950/20'
                    : 'border-border bg-surface'
            }`}
        >
            <Link
                href={homeHref}
                prefetch
                className="mb-8 font-mono text-xl font-bold tracking-tighter text-white transition-colors hover:text-zinc-300"
            >
                E.
            </Link>

            <nav className="flex flex-1 flex-col gap-6">
                {items.map((item) => {
                    const isActive = item.isActive(currentPath);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                                isActive
                                    ? visualImpersonating
                                        ? 'bg-amber-900/40 text-amber-100'
                                        : 'bg-zinc-800 text-white'
                                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                            }`}
                            title={item.title}
                            aria-label={item.title}
                        >
                            <Icon className="h-5 w-5" />
                            {isActive ? (
                                <span
                                    className={`absolute top-1 -right-1 h-2 w-2 rounded-full ${
                                        visualImpersonating
                                            ? 'bg-amber-500'
                                            : 'bg-blue-500'
                                    }`}
                                />
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto mb-4 flex flex-col items-center gap-2">
                <div
                    className={`flex h-6 w-6 cursor-help items-center justify-center rounded border text-[10px] font-bold ${
                        visualImpersonating
                            ? 'border-amber-700 bg-amber-900/80 text-amber-100'
                            : role === 'admin'
                              ? 'border-amber-800 bg-amber-900/50 text-amber-500'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                    }`}
                    title={`Current Role: ${role}`}
                >
                    {visualImpersonating ? (
                        <Eye className="h-3 w-3" />
                    ) : (
                        roleBadge
                    )}
                </div>
                <Link
                    href={logout()}
                    method="post"
                    as="button"
                    className="text-zinc-600 hover:text-zinc-400"
                    title="Sign Out"
                    aria-label="Sign Out"
                >
                    <LogOut className="h-5 w-5" />
                </Link>
            </div>
        </aside>
    );
}
