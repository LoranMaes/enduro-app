import type { ReactNode } from 'react';

type StatsCardProps = {
    title: string;
    children: ReactNode;
};

export function StatsCard({ title, children }: StatsCardProps) {
    return (
        <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-base font-medium text-zinc-100">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}
