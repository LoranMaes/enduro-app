import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AtpYearSwitcherProps = {
    year: number;
    onPreviousYear: () => void;
    onNextYear: () => void;
};

export function AtpYearSwitcher({
    year,
    onPreviousYear,
    onNextYear,
}: AtpYearSwitcherProps) {
    return (
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                onClick={onPreviousYear}
                aria-label="Open previous ATP year"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-sm font-medium text-zinc-200">
                {year}
            </span>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                onClick={onNextYear}
                aria-label="Open next ATP year"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
