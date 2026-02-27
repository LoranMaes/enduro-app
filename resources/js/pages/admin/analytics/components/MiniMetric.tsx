type MiniMetricProps = {
    label: string;
    value: number;
};

export function MiniMetric({ label, value }: MiniMetricProps) {
    return (
        <div className="rounded-md border border-border bg-background/50 px-3 py-2">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">{label}</p>
            <p className="mt-1 font-mono text-lg text-zinc-100">{value}</p>
        </div>
    );
}
