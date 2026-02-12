import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RegistrationForm, RegistrationFormData } from '../types';
import { toIntegerOrEmpty } from '../utils';

type AthletePreferencesStepProps = {
    form: RegistrationForm;
};

export function AthletePreferencesStep({ form }: AthletePreferencesStepProps) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="primary_sport">Primary sport</Label>
                    <Select
                        value={form.data.primary_sport}
                        onValueChange={(value) =>
                            form.setData(
                                'primary_sport',
                                value as RegistrationFormData['primary_sport'],
                            )
                        }
                    >
                        <SelectTrigger
                            id="primary_sport"
                            className="h-10 w-full rounded-md border-border bg-background text-sm text-zinc-200"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="triathlon">Triathlon</SelectItem>
                            <SelectItem value="bike">Bike</SelectItem>
                            <SelectItem value="run">Run</SelectItem>
                            <SelectItem value="swim">Swim</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.primary_sport} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="weekly_training_days">
                        Training days / week
                    </Label>
                    <Input
                        id="weekly_training_days"
                        type="number"
                        min={1}
                        max={7}
                        value={form.data.weekly_training_days}
                        onChange={(event) =>
                            form.setData(
                                'weekly_training_days',
                                toIntegerOrEmpty(event.target.value),
                            )
                        }
                    />
                    <InputError message={form.errors.weekly_training_days} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="preferred_rest_day">
                        Preferred rest day
                    </Label>
                    <Select
                        value={form.data.preferred_rest_day}
                        onValueChange={(value) =>
                            form.setData(
                                'preferred_rest_day',
                                value as RegistrationFormData['preferred_rest_day'],
                            )
                        }
                    >
                        <SelectTrigger
                            id="preferred_rest_day"
                            className="h-10 w-full rounded-md border-border bg-background text-sm text-zinc-200"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.preferred_rest_day} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="intensity_distribution">
                        Intensity distribution
                    </Label>
                    <Select
                        value={form.data.intensity_distribution}
                        onValueChange={(value) =>
                            form.setData(
                                'intensity_distribution',
                                value as RegistrationFormData['intensity_distribution'],
                            )
                        }
                    >
                        <SelectTrigger
                            id="intensity_distribution"
                            className="h-10 w-full rounded-md border-border bg-background text-sm text-zinc-200"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="polarized">Polarized</SelectItem>
                            <SelectItem value="pyramidal">Pyramidal</SelectItem>
                            <SelectItem value="threshold">Threshold</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.intensity_distribution} />
                </div>
            </div>
        </section>
    );
}
