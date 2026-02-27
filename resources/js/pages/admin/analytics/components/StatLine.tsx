type StatLineProps = {
    label: string;
    value: number | string;
};

export function StatLine({ label, value }: StatLineProps) {
    return (
        <div className="flex items-center justify-between border-b border-border/70 py-1.5 last:border-b-0">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="font-mono text-xs text-zinc-200">{value}</span>
        </div>
    );
}
