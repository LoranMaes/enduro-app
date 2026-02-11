import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type CalendarSummaryProps = {
    plans: number;
    weeks: number;
    sessions: number;
    completed: number;
    coverageLabel: string;
};

export function CalendarSummary({
    plans,
    weeks,
    sessions,
    completed,
    coverageLabel,
}: CalendarSummaryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Training Calendar (Read Only)</CardTitle>
                <CardDescription>
                    Session planning and review from backend read models.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground text-[0.6875rem] uppercase">Plans</p>
                    <p className="text-xl font-semibold font-mono">{plans}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground text-[0.6875rem] uppercase">Weeks</p>
                    <p className="text-xl font-semibold font-mono">{weeks}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground text-[0.6875rem] uppercase">
                        Sessions
                    </p>
                    <p className="text-xl font-semibold font-mono">{sessions}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground text-[0.6875rem] uppercase">
                        Completed
                    </p>
                    <p className="text-xl font-semibold font-mono">{completed}</p>
                </div>
                <div className="rounded-md border border-dashed border-border p-3">
                    <p className="text-muted-foreground text-[0.6875rem] uppercase">Coverage</p>
                    <p className="text-xl font-semibold font-mono">{coverageLabel}</p>
                </div>
            </CardContent>
        </Card>
    );
}
