type ProgressSummaryCardsProps = {
    consistencyWeeks: number;
    selectedRangeWeeks: number;
    currentStreakWeeks: number;
};

export function ProgressSummaryCards({
    consistencyWeeks,
    selectedRangeWeeks,
    currentStreakWeeks,
}: ProgressSummaryCardsProps) {
    return (
        <section className="mt-8">
            <h2 className="text-2xl font-medium text-zinc-200">Consistency</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-6">
                    <p className="text-[0.6875rem] tracking-wider text-zinc-500 uppercase">
                        Consistency
                    </p>
                    <p className="mt-2 font-mono text-5xl text-zinc-100">
                        {consistencyWeeks}
                        <span className="ml-2 text-lg text-zinc-500">wks</span>
                    </p>
                    <p className="mt-4 border-t border-border pt-3 text-sm text-zinc-500">
                        of {selectedRangeWeeks} weeks
                    </p>
                </div>

                <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/10 p-6">
                    <p className="text-[0.6875rem] tracking-wider text-zinc-500 uppercase">
                        Current Streak
                    </p>
                    <p className="mt-2 font-mono text-5xl text-zinc-100">
                        {currentStreakWeeks}
                        <span className="ml-2 text-lg text-zinc-500">wks</span>
                    </p>
                    <p className="mt-4 border-t border-border pt-3 text-sm text-zinc-500">
                        {currentStreakWeeks > 0
                            ? 'Consistent completion cadence.'
                            : 'No active streak in this range.'}
                    </p>
                </div>
            </div>
        </section>
    );
}
