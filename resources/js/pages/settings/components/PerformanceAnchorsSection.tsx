import InputError from '@/components/input-error';
import type { useTrainingPreferences } from '../hooks/useTrainingPreferences';

type PerformanceAnchorsSectionProps = {
    trainingForm: ReturnType<typeof useTrainingPreferences>['trainingForm'];
    setNullableNumberField: ReturnType<typeof useTrainingPreferences>['setNullableNumberField'];
};

export function PerformanceAnchorsSection({
    trainingForm,
    setNullableNumberField,
}: PerformanceAnchorsSectionProps) {
    return (
        <section className="rounded-lg border border-border/70 bg-background/50 p-4">
            <h3 className="text-sm font-medium text-zinc-200">Performance Anchors</h3>
            <p className="mt-1 text-xs text-zinc-500">
                These values are used for workout structure preview scales and unit
                conversions.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="training-ftp" className="text-xs text-zinc-500">
                        FTP (watts)
                    </label>
                    <input
                        id="training-ftp"
                        type="number"
                        min={50}
                        max={1000}
                        value={trainingForm.data.ftp_watts ?? ''}
                        onChange={(event) => {
                            setNullableNumberField('ftp_watts', event.target.value);
                        }}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 font-mono text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                    <InputError message={trainingForm.errors.ftp_watts} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="training-max-hr" className="text-xs text-zinc-500">
                        Max Heart Rate (bpm)
                    </label>
                    <input
                        id="training-max-hr"
                        type="number"
                        min={120}
                        max={240}
                        value={trainingForm.data.max_heart_rate_bpm ?? ''}
                        onChange={(event) => {
                            setNullableNumberField('max_heart_rate_bpm', event.target.value);
                        }}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 font-mono text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                    <InputError message={trainingForm.errors.max_heart_rate_bpm} />
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="training-threshold-hr"
                        className="text-xs text-zinc-500"
                    >
                        Threshold Heart Rate (bpm)
                    </label>
                    <input
                        id="training-threshold-hr"
                        type="number"
                        min={100}
                        max={230}
                        value={trainingForm.data.threshold_heart_rate_bpm ?? ''}
                        onChange={(event) => {
                            setNullableNumberField(
                                'threshold_heart_rate_bpm',
                                event.target.value,
                            );
                        }}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 font-mono text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                    <InputError message={trainingForm.errors.threshold_heart_rate_bpm} />
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="training-threshold-pace"
                        className="text-xs text-zinc-500"
                    >
                        Threshold Pace (min/km)
                    </label>
                    <input
                        id="training-threshold-pace"
                        type="number"
                        min={120}
                        max={1200}
                        value={trainingForm.data.threshold_pace_minutes_per_km ?? ''}
                        onChange={(event) => {
                            setNullableNumberField(
                                'threshold_pace_minutes_per_km',
                                event.target.value,
                            );
                        }}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 font-mono text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                    <p className="text-[0.6875rem] text-zinc-500">
                        Example: 240 = 4:00 / km threshold pace
                    </p>
                    <InputError
                        message={trainingForm.errors.threshold_pace_minutes_per_km}
                    />
                </div>
            </div>
        </section>
    );
}
