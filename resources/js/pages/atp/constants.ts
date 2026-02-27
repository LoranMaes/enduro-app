export const ATP_BAR_MAX_HEIGHT = 7;

export const ATP_WEEK_TYPE_STYLES: Record<
    string,
    {
        dotClassName: string;
        barClassName: string;
        textClassName: string;
        chipClassName: string;
    }
> = {
    base: {
        dotClassName: 'bg-sky-400',
        barClassName: 'bg-sky-500/70',
        textClassName: 'text-sky-300',
        chipClassName: 'border-sky-500/40 text-sky-300',
    },
    build: {
        dotClassName: 'bg-violet-400',
        barClassName: 'bg-violet-500/70',
        textClassName: 'text-violet-300',
        chipClassName: 'border-violet-500/40 text-violet-300',
    },
    recovery: {
        dotClassName: 'bg-emerald-400',
        barClassName: 'bg-emerald-500/70',
        textClassName: 'text-emerald-300',
        chipClassName: 'border-emerald-500/40 text-emerald-300',
    },
    peak: {
        dotClassName: 'bg-amber-400',
        barClassName: 'bg-amber-500/70',
        textClassName: 'text-amber-300',
        chipClassName: 'border-amber-500/40 text-amber-300',
    },
    race: {
        dotClassName: 'bg-rose-400',
        barClassName: 'bg-rose-500/70',
        textClassName: 'text-rose-300',
        chipClassName: 'border-rose-500/40 text-rose-300',
    },
    transition: {
        dotClassName: 'bg-zinc-400',
        barClassName: 'bg-zinc-500/70',
        textClassName: 'text-zinc-300',
        chipClassName: 'border-zinc-600 text-zinc-300',
    },
    default: {
        dotClassName: 'bg-zinc-500',
        barClassName: 'bg-zinc-600/80',
        textClassName: 'text-zinc-300',
        chipClassName: 'border-zinc-700 text-zinc-300',
    },
};
