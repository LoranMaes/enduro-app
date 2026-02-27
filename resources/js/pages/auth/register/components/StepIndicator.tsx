import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepConfig } from '../types';

type StepIndicatorProps = {
    steps: StepConfig[];
    activeIndex: number;
};

export function StepIndicator({ steps, activeIndex }: StepIndicatorProps) {
    const progressPercentage =
        steps.length <= 1 ? 100 : (activeIndex / (steps.length - 1)) * 100;

    return (
        <div className="rounded-xl border border-border bg-background/50 p-4">
            <div className="relative hidden sm:block">
                <div className="absolute top-2 right-2 left-2 h-px bg-border" />
                <div
                    className="absolute top-2 left-2 h-px bg-cyan-400/70 transition-[width] duration-300"
                    style={{
                        width: `calc((100% - 1rem) * ${progressPercentage / 100})`,
                    }}
                />

                <ol
                    className="relative grid gap-3"
                    style={{
                        gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                    }}
                >
                    {steps.map((step, index) => {
                        const isActive = index === activeIndex;
                        const isComplete = index < activeIndex;

                        return (
                            <li
                                key={step.key}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <div className="flex flex-col gap-2">
                                    <span
                                        className={cn(
                                            'inline-flex h-4 w-4 items-center justify-center rounded-full text-[0.5625rem] font-medium',
                                            isComplete
                                                ? 'bg-emerald-400 text-zinc-950'
                                                : isActive
                                                  ? 'bg-zinc-100 text-zinc-950 ring-2 ring-cyan-400/50'
                                                  : 'bg-zinc-700 text-zinc-300',
                                        )}
                                    >
                                        {isComplete ? (
                                            <Check className="h-2.5 w-2.5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <div className="space-y-0.5">
                                        <p
                                            className={cn(
                                                'text-[0.6875rem] leading-tight font-medium',
                                                isActive
                                                    ? 'text-zinc-100'
                                                    : 'text-zinc-400',
                                            )}
                                        >
                                            {step.title}
                                        </p>
                                        <p className="text-[0.625rem] leading-tight text-zinc-500">
                                            {step.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <ol className="space-y-2 sm:hidden">
                {steps.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isComplete = index < activeIndex;

                    return (
                        <li
                            key={step.key}
                            aria-current={isActive ? 'step' : undefined}
                            className={cn(
                                'flex items-start gap-2 rounded-md border px-2.5 py-2',
                                isActive
                                    ? 'border-zinc-600 bg-zinc-900/60'
                                    : 'border-border bg-background/40',
                            )}
                        >
                            <span
                                className={cn(
                                    'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-medium',
                                    isComplete
                                        ? 'bg-emerald-400 text-zinc-950'
                                        : isActive
                                          ? 'bg-zinc-100 text-zinc-950'
                                          : 'bg-zinc-700 text-zinc-300',
                                )}
                            >
                                {isComplete ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-100">
                                    {step.title}
                                </p>
                                <p className="text-[0.6875rem] text-zinc-500">
                                    {step.subtitle}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
