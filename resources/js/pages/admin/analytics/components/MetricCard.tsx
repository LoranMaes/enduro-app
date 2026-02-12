type MetricCardProps = {
    label: string;
    value: string;
    accent: string;
};

export function MetricCard({ label, value, accent }: MetricCardProps) {
    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">{label}</p>
            <p className={`mt-2 font-mono text-3xl ${accent}`}>{value}</p>
        </div>
    );
}
