import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    LogOut,
    Settings,
    ShieldCheck,
    UserRound,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dashboard, logout } from '@/routes';
import type { SharedData } from '@/types';

type AppRole = 'athlete' | 'coach' | 'admin';
type SidebarItem = {
    title: string;
    href: string;
    icon: LucideIcon;
    matches: string[];
};

export function AppSidebar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentPath = new URL(
        page.url,
        window?.location.origin ?? 'http://localhost',
    ).pathname;
    const role = (auth.user.role ?? 'athlete') as AppRole;

    const items: SidebarItem[] = [
        {
            title: 'Calendar',
            href: dashboard().url,
            icon: CalendarDays,
            matches: ['/dashboard'],
        },
        ...(role === 'coach' || role === 'admin'
            ? [
                  {
                      title: 'Athletes',
                      href: '/athletes',
                      icon: UsersRound,
                      matches: ['/athletes'],
                  } satisfies SidebarItem,
              ]
            : []),
        ...(role === 'admin'
            ? [
                  {
                      title: 'Coaches',
                      href: '/coaches',
                      icon: UserRound,
                      matches: ['/coaches'],
                  } satisfies SidebarItem,
                  {
                      title: 'Admin',
                      href: '/admin',
                      icon: ShieldCheck,
                      matches: ['/admin'],
                  } satisfies SidebarItem,
              ]
            : []),
        {
            title: 'Settings',
            href: '/settings/overview',
            icon: Settings,
            matches: ['/settings'],
        },
    ];

    const roleBadge = role === 'coach' ? 'C' : 'A';

    return (
        <aside className="z-20 flex h-svh w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-6">
            <Link
                href={dashboard()}
                prefetch
                className="mb-8 font-mono text-xl font-bold tracking-tighter text-white transition-colors hover:text-zinc-300"
            >
                E.
            </Link>

            <nav className="flex flex-1 flex-col gap-6">
                {items.map((item) => {
                    const isActive = item.matches.some((path) =>
                        currentPath.startsWith(path),
                    );
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                                isActive
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                            }`}
                            title={item.title}
                            aria-label={item.title}
                        >
                            <Icon className="h-5 w-5" />
                            {isActive ? (
                                <span className="absolute top-1 -right-1 h-2 w-2 rounded-full bg-blue-500" />
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto mb-4 flex flex-col items-center gap-2">
                <div
                    className={`flex h-6 w-6 cursor-help items-center justify-center rounded border text-[10px] font-bold ${
                        role === 'admin'
                            ? 'border-amber-800 bg-amber-900/50 text-amber-500'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                    }`}
                    title={`Current Role: ${role}`}
                >
                    {roleBadge}
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
