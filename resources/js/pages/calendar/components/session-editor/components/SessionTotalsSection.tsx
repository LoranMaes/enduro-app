import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    formatDurationMinutes,
    formatTssValue,
} from '../hooks/useSessionDerivedValues';
import type { ValidationErrors } from '../types';

type SessionTotalsSectionProps = {
    hasStructuredPlanning: boolean;
    derivedStructureDurationMinutes: number;
    derivedStructureTss: number | null;
    plannedDurationMinutes: string;
    plannedTss: string;
    canManageSessionWrites: boolean;
    plannedDurationInputRef: React.RefObject<HTMLInputElement | null>;
    setPlannedDurationMinutes: (value: string) => void;
    setPlannedTss: (value: string) => void;
    clearFieldError: (field: keyof ValidationErrors) => void;
    errors: ValidationErrors;
};

export function SessionTotalsSection({
    hasStructuredPlanning,
    derivedStructureDurationMinutes,
    derivedStructureTss,
    plannedDurationMinutes,
    plannedTss,
    canManageSessionWrites,
    plannedDurationInputRef,
    setPlannedDurationMinutes,
    setPlannedTss,
    clearFieldError,
    errors,
}: SessionTotalsSectionProps) {
    if (hasStructuredPlanning) {
        return (
            <div className="space-y-2 rounded-md border border-sky-400/25 bg-sky-500/10 px-3 py-2.5">
                <p className="text-[0.6875rem] font-medium tracking-wide text-sky-200 uppercase">
                    Structure-driven targets
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-2">
                        <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                            Planned Duration
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-100">
                            {formatDurationMinutes(derivedStructureDurationMinutes)}
                        </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-2">
                        <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                            Estimated TSS
                        </p>
                        <p className="mt-1 font-mono text-xs text-zinc-100">
                            {formatTssValue(derivedStructureTss)}
                        </p>
                    </div>
                </div>
                <p className="text-[0.6875rem] text-zinc-300">
                    Planned duration and planned TSS are derived from the current
                    workout structure.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <Label
                    htmlFor="planned-duration-minutes"
                    className="text-xs text-zinc-400"
                >
                    Planned Duration (min)
                </Label>
                <Input
                    id="planned-duration-minutes"
                    ref={plannedDurationInputRef}
                    type="number"
                    min={1}
                    disabled={!canManageSessionWrites}
                    value={plannedDurationMinutes}
                    onChange={(event) => {
                        setPlannedDurationMinutes(event.target.value);
                        clearFieldError('planned_duration_minutes');
                    }}
                    className="border-border bg-background font-mono text-sm text-zinc-200"
                />
                <InputError message={errors.planned_duration_minutes} />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="planned-tss" className="text-xs text-zinc-400">
                    Planned TSS
                </Label>
                <Input
                    id="planned-tss"
                    type="number"
                    min={0}
                    disabled={!canManageSessionWrites}
                    value={plannedTss}
                    onChange={(event) => {
                        setPlannedTss(event.target.value);
                        clearFieldError('planned_tss');
                    }}
                    className="border-border bg-background font-mono text-sm text-zinc-200"
                />
                <InputError message={errors.planned_tss} />
            </div>
        </div>
    );
}
