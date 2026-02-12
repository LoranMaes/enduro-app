import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RegistrationForm } from '../types';
import { toIntegerOrEmpty } from '../utils';
import { ZoneEditor } from './ZoneEditor';

type AthleteZonesStepProps = {
    form: RegistrationForm;
};

export function AthleteZonesStep({ form }: AthleteZonesStepProps) {
    const updateZone = (
        field: 'power_zones' | 'heart_rate_zones',
        index: number,
        key: 'min' | 'max',
        value: string,
    ): void => {
        form.setData(
            field,
            form.data[field].map((zone, zoneIndex) => {
                if (zoneIndex !== index) {
                    return zone;
                }

                const numericValue = Number.parseInt(value, 10);

                return {
                    ...zone,
                    [key]: Number.isFinite(numericValue) ? numericValue : 0,
                };
            }),
        );
    };

    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="ftp_watts">FTP (W)</Label>
                    <Input
                        id="ftp_watts"
                        type="number"
                        value={form.data.ftp_watts}
                        onChange={(event) =>
                            form.setData(
                                'ftp_watts',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.ftp_watts} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="max_heart_rate_bpm">Max HR (bpm)</Label>
                    <Input
                        id="max_heart_rate_bpm"
                        type="number"
                        value={form.data.max_heart_rate_bpm}
                        onChange={(event) =>
                            form.setData(
                                'max_heart_rate_bpm',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.max_heart_rate_bpm} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="threshold_heart_rate_bpm">
                        Threshold HR (bpm)
                    </Label>
                    <Input
                        id="threshold_heart_rate_bpm"
                        type="number"
                        value={form.data.threshold_heart_rate_bpm}
                        onChange={(event) =>
                            form.setData(
                                'threshold_heart_rate_bpm',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError
                        message={form.errors.threshold_heart_rate_bpm}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="threshold_pace_minutes_per_km">
                        Threshold pace (sec/km)
                    </Label>
                    <Input
                        id="threshold_pace_minutes_per_km"
                        type="number"
                        value={form.data.threshold_pace_minutes_per_km}
                        onChange={(event) =>
                            form.setData(
                                'threshold_pace_minutes_per_km',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError
                        message={form.errors.threshold_pace_minutes_per_km}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <ZoneEditor
                    title="Power zones (%)"
                    zones={form.data.power_zones}
                    onChange={(index, key, value) =>
                        updateZone('power_zones', index, key, value)
                    }
                    error={form.errors.power_zones}
                />
                <ZoneEditor
                    title="Heart-rate zones (%)"
                    zones={form.data.heart_rate_zones}
                    onChange={(index, key, value) =>
                        updateZone('heart_rate_zones', index, key, value)
                    }
                    error={form.errors.heart_rate_zones}
                />
            </div>
        </section>
    );
}
