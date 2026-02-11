import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

type AuthSplitLayoutProps = {
    title: string;
    description: string;
    pageTitle: string;
    children: ReactNode;
    asideTitle: string;
    asideDescription: string;
    asideItems: string[];
    contentAlign?: 'top' | 'center';
};

export default function AuthSplitLayout({
    title,
    description,
    pageTitle,
    children,
    asideTitle,
    asideDescription,
    asideItems,
    contentAlign = 'top',
}: AuthSplitLayoutProps) {
    return (
        <div className="min-h-svh bg-background px-4 py-6 sm:px-6">
            <Head title={pageTitle} />

            <div className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[minmax(20rem,0.95fr)_minmax(0,1.25fr)]">
                <section className="relative hidden border-r border-border bg-zinc-950 lg:flex lg:flex-col">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_58%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_52%)]" />

                    <div className="relative flex h-full flex-col p-10">
                        <Link
                            href={home()}
                            className="inline-flex w-fit items-center gap-2 text-zinc-100 transition-colors hover:text-white"
                        >
                            <AppLogoIcon className="h-8 w-8 fill-current" />
                            <span className="font-mono text-sm tracking-wide uppercase">
                                Endure
                            </span>
                        </Link>

                        <div className="mt-auto space-y-5">
                            <p className="text-[0.6875rem] tracking-[0.24em] text-zinc-500 uppercase">
                                Athlete System
                            </p>
                            <h2 className="max-w-xs text-3xl leading-tight font-medium text-zinc-100">
                                {asideTitle}
                            </h2>
                            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                                {asideDescription}
                            </p>

                            <ul className="space-y-3 pt-2">
                                {asideItems.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-2 text-sm text-zinc-300"
                                    >
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="flex min-h-0 flex-col overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
                    <Link
                        href={home()}
                        className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-zinc-100 lg:hidden"
                    >
                        <AppLogoIcon className="h-8 w-8 fill-current" />
                        <span className="font-mono text-sm tracking-wide uppercase">
                            Endure
                        </span>
                    </Link>

                    <div
                        className={cn(
                            'w-full max-w-xl',
                            contentAlign === 'center'
                                ? 'mx-auto my-auto py-6'
                                : 'mt-8 lg:mt-2',
                        )}
                    >
                        <p className="text-[0.6875rem] tracking-[0.24em] text-zinc-500 uppercase">
                            Access
                        </p>
                        <h1 className="mt-2 text-3xl font-medium text-zinc-100">
                            {title}
                        </h1>
                        <p className="mt-2 text-sm text-zinc-400">
                            {description}
                        </p>

                        <div className="mt-8">{children}</div>
                    </div>
                </section>
            </div>
        </div>
    );
}
