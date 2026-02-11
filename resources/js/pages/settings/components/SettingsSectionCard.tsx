import type { ReactNode } from 'react';

type SettingsSectionCardProps = {
    title: string;
    description: string;
    children: ReactNode;
};

export function SettingsSectionCard({
    title,
    description,
    children,
}: SettingsSectionCardProps) {
    return (
        <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <header className="mb-8 border-b border-border pb-6">
                <h2 className="text-xl font-medium text-zinc-200">{title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{description}</p>
            </header>

            {children}
        </section>
    );
}
