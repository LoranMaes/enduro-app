import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { CalendarDays, Settings, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

type AppRole = 'athlete' | 'coach' | 'admin';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = (auth.user.role ?? 'athlete') as AppRole;

    const mainNavItems: NavItem[] = [
        {
            title: 'Calendar',
            href: dashboard(),
            icon: CalendarDays,
        },
        ...(role === 'coach' || role === 'admin'
            ? [
                  {
                      title: 'Athletes',
                      href: '/athletes',
                      icon: UsersRound,
                  } satisfies NavItem,
              ]
            : []),
        ...(role === 'admin'
            ? [
                  {
                      title: 'Coaches',
                      href: '/coaches',
                      icon: UserRound,
                  } satisfies NavItem,
                  {
                      title: 'Admin',
                      href: '/admin',
                      icon: ShieldCheck,
                  } satisfies NavItem,
              ]
            : []),
        {
            title: 'Settings',
            href: '/settings/overview',
            icon: Settings,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
