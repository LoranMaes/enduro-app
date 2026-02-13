import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { show as showAtp } from '@/routes/atp';
import { index as plansIndex } from '@/routes/plans';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Training Plans',
        href: plansIndex().url,
    },
];

export default function PlansIndex() {
    const currentYear = new Date().getFullYear();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Training Plans" />

            <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
                <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-10">
                    <section className="w-full rounded-2xl border border-border bg-surface p-10">
                        <p className="text-[0.6875rem] tracking-wider text-zinc-500 uppercase">
                            Planning Surface
                        </p>
                        <h1 className="mt-2 text-3xl font-medium text-zinc-100">
                            Training Plans
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
                            Plan management is coming in a dedicated workflow. In this
                            phase, daily execution lives in Calendar while coach and AI
                            plan orchestration remains intentionally out of scope.
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4">
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Coach-authored
                                </p>
                                <p className="mt-2 text-sm text-zinc-300">
                                    Structured blocks prepared by assigned coaches.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4">
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    AI-assisted
                                </p>
                                <p className="mt-2 text-sm text-zinc-300">
                                    Optional generated templates for athlete review.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4">
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Calendar-linked
                                </p>
                                <p className="mt-2 text-sm text-zinc-300">
                                    Plans feed sessions without replacing athlete control.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-border/70 bg-zinc-900/40 p-4">
                            <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                Annual Training Plan
                            </p>
                            <p className="mt-2 text-sm text-zinc-300">
                                Annual Training Plan (coming soon)
                            </p>
                            <a
                                href={showAtp(currentYear).url}
                                className="mt-3 inline-flex text-xs text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-200"
                            >
                                Open yearly scaffold
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
