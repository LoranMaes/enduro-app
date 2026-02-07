import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { show as showTwoFactor } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/overview',
    },
];

const settingsLinks = [
    {
        title: 'Profile',
        description: 'Account identity and profile details',
        href: editProfile(),
    },
    {
        title: 'Password',
        description: 'Credential and access hardening',
        href: editPassword(),
    },
    {
        title: 'Two-Factor Auth',
        description: 'Secondary verification settings',
        href: showTwoFactor(),
    },
    {
        title: 'Appearance',
        description: 'Theme and interface preferences',
        href: editAppearance(),
    },
];

export default function SettingsOverview() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                        <CardDescription>
                            Read-only navigation shell for account and platform
                            configuration surfaces.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Available sections</CardTitle>
                        <CardDescription>
                            Existing settings routes remain fully functional.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        {settingsLinks.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className="bg-surface/50 hover:bg-surface block rounded-md border border-border px-3 py-2 transition-colors"
                            >
                                <p className="text-sm font-medium">{item.title}</p>
                                <p className="text-muted-foreground text-xs">
                                    {item.description}
                                </p>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
