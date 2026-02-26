import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type LegendHelp = {
    key: 'ctl' | 'atl' | 'tsb';
    label: 'CTL' | 'ATL' | 'TSB';
    strokeClassName: string;
    title: string;
    description: string;
};

const legendHelpItems: LegendHelp[] = [
    {
        key: 'ctl',
        label: 'CTL',
        strokeClassName: 'bg-cyan-400',
        title: 'Long-term training load (about 42-day trend).',
        description: 'Rising CTL suggests growing chronic fitness.',
    },
    {
        key: 'atl',
        label: 'ATL',
        strokeClassName: 'bg-amber-400',
        title: 'Short-term training load (about 7-day trend).',
        description: 'Spikes indicate recent fatigue.',
    },
    {
        key: 'tsb',
        label: 'TSB',
        strokeClassName: 'bg-fuchsia-400',
        title: 'Freshness balance (CTL - ATL).',
        description: 'Negative means fatigued, positive means fresher.',
    },
];

type PerformanceManagementLegendProps = {
    visibleSeries: Array<'ctl' | 'atl' | 'tsb'>;
    onToggleSeries: (key: 'ctl' | 'atl' | 'tsb') => void;
};

export function PerformanceManagementLegend({
    visibleSeries,
    onToggleSeries,
}: PerformanceManagementLegendProps) {
    return (
        <div className="mt-4 flex items-center gap-5 text-[0.6875rem] text-muted-foreground uppercase">
            {legendHelpItems.map((item) => (
                <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            aria-label={`${item.label} meaning`}
                            aria-pressed={visibleSeries.includes(item.key)}
                            onClick={() => onToggleSeries(item.key)}
                            className={`inline-flex items-center gap-2 rounded-sm px-1 py-0.5 text-[0.6875rem] uppercase transition-colors focus-visible:outline-none ${
                                visibleSeries.includes(item.key)
                                    ? 'text-foreground hover:text-foreground focus-visible:text-foreground'
                                    : 'text-muted-foreground/70 hover:text-muted-foreground focus-visible:text-foreground'
                            }`}
                        >
                            <span className={`h-0.5 w-4 ${item.strokeClassName}`} />
                            {item.label}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64 border border-border bg-popover text-popover-foreground">
                        <div className="space-y-1 text-[0.6875rem]">
                            <p className="font-medium text-popover-foreground">{item.title}</p>
                            <p className="text-muted-foreground">{item.description}</p>
                            <p className="pt-1 text-muted-foreground">Use trends over time, not a single-day value.</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
