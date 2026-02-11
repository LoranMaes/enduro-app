import { Head, router } from '@inertiajs/react';
import { Cog, Flag, Layers, TimerReset } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

type AdminSettingsProps = {
    ticketArchiveDelayHours: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Settings',
        href: '/admin/settings',
    },
];

export default function AdminSettings({
    ticketArchiveDelayHours,
}: AdminSettingsProps) {
    const [archiveDelayHours, setArchiveDelayHours] = useState<number>(
        ticketArchiveDelayHours,
    );
    const [saving, setSaving] = useState(false);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (archiveDelayHours < 1 || archiveDelayHours > 168 || saving) {
            return;
        }

        setSaving(true);

        router.patch(
            '/admin/settings',
            {
                ticket_archive_delay_hours: archiveDelayHours,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setSaving(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Settings" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-6">
                    <div className="flex items-center gap-2">
                        <Cog className="h-4 w-4 text-zinc-500" />
                        <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                            Admin Controls
                        </p>
                    </div>
                    <h1 className="mt-2 text-4xl font-medium text-zinc-100">
                        Settings
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        Operational defaults and feature controls for internal tools.
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="grid gap-4 xl:grid-cols-3">
                        <section className="rounded-xl border border-border bg-surface p-5 xl:col-span-2">
                            <div className="mb-4 flex items-center gap-2">
                                <TimerReset className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Ticket Lifecycle
                                </h2>
                            </div>

                            <form className="space-y-4" onSubmit={submit}>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ticket-archive-delay">
                                        Archive delay (hours)
                                    </Label>
                                    <Input
                                        id="ticket-archive-delay"
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={archiveDelayHours}
                                        onChange={(event) =>
                                            setArchiveDelayHours(
                                                Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                ) || 1,
                                            )
                                        }
                                        className="h-10 max-w-40 bg-background"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Tickets in Done are archived automatically after
                                        this delay.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        className="h-9 px-4"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        <section className="rounded-xl border border-border bg-surface p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Flag className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Feature Flags
                                </h2>
                            </div>
                            <p className="text-sm text-zinc-500">
                                Placeholder for coach/athlete variables and rollout flags.
                            </p>
                        </section>

                        <section className="rounded-xl border border-border bg-surface p-5 xl:col-span-3">
                            <div className="mb-3 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-zinc-500" />
                                <h2 className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
                                    Configuration Roadmap
                                </h2>
                            </div>
                            <ul className="space-y-2 text-sm text-zinc-500">
                                <li>- Athlete defaults (units, onboarding toggles)</li>
                                <li>- Coach constraints and approval automation</li>
                                <li>- Ticket workflow templates and SLA presets</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
