type SelectionStatLineProps = {
    label: string;
    value: string;
};

export function SelectionStatLine({ label, value }: SelectionStatLineProps) {
    return (
        <div className="flex items-center justify-between gap-2 rounded border border-zinc-800/80 bg-black/20 px-2 py-1.5">
            <span className="text-[0.625rem] text-zinc-500">{label}</span>
            <span className="font-mono text-[0.6875rem] text-zinc-200">{value}</span>
        </div>
    );
}
