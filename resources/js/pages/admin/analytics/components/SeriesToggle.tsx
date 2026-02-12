type SeriesToggleProps = {
    label: string;
    enabled: boolean;
    onClick: () => void;
    colorClass: string;
};

export function SeriesToggle({
    label,
    enabled,
    onClick,
    colorClass,
}: SeriesToggleProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[0.6875rem] transition-colors ${
                enabled
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                    : 'border-border text-zinc-500 hover:bg-zinc-900/60'
            }`}
        >
            <span className={`h-2 w-2 rounded-full ${colorClass}`} />
            {label}
        </button>
    );
}
