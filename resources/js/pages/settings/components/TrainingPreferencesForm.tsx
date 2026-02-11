import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    intensityDistributionOptions,
    primarySportOptions,
    restDayOptions,
} from '../constants';
import type { useTrainingPreferences } from '../hooks/useTrainingPreferences';
import { PerformanceAnchorsSection } from './PerformanceAnchorsSection';
import { ZoneEditorSection } from './ZoneEditorSection';

type TrainingPreferencesFormProps = {
    trainingForm: ReturnType<typeof useTrainingPreferences>['trainingForm'];
    resolveZoneError: ReturnType<typeof useTrainingPreferences>['resolveZoneError'];
    updateZoneValue: ReturnType<typeof useTrainingPreferences>['updateZoneValue'];
    setNullableNumberField: ReturnType<typeof useTrainingPreferences>['setNullableNumberField'];
    onSubmit: () => void;
};

export function TrainingPreferencesForm({
    trainingForm,
    resolveZoneError,
    updateZoneValue,
    setNullableNumberField,
    onSubmit,
}: TrainingPreferencesFormProps) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="training-primary-sport" className="text-xs text-zinc-500">
                        Primary Sport
                    </label>
                    <Select
                        value={trainingForm.data.primary_sport}
                        onValueChange={(value) => {
                            trainingForm.setData('primary_sport', value);
                            trainingForm.clearErrors('primary_sport');
                        }}
                    >
                        <SelectTrigger
                            id="training-primary-sport"
                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-zinc-900 text-zinc-200">
                            {primarySportOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-sm focus:bg-zinc-800 focus:text-zinc-100"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={trainingForm.errors.primary_sport} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="training-days" className="text-xs text-zinc-500">
                        Weekly Training Days
                    </label>
                    <input
                        id="training-days"
                        type="number"
                        min={1}
                        max={7}
                        value={trainingForm.data.weekly_training_days}
                        onChange={(event) => {
                            trainingForm.setData(
                                'weekly_training_days',
                                Number(event.target.value),
                            );
                            trainingForm.clearErrors('weekly_training_days');
                        }}
                        className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                    <InputError message={trainingForm.errors.weekly_training_days} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="training-rest-day" className="text-xs text-zinc-500">
                        Preferred Rest Day
                    </label>
                    <Select
                        value={trainingForm.data.preferred_rest_day}
                        onValueChange={(value) => {
                            trainingForm.setData('preferred_rest_day', value);
                            trainingForm.clearErrors('preferred_rest_day');
                        }}
                    >
                        <SelectTrigger
                            id="training-rest-day"
                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-zinc-900 text-zinc-200">
                            {restDayOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-sm focus:bg-zinc-800 focus:text-zinc-100"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={trainingForm.errors.preferred_rest_day} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="training-intensity" className="text-xs text-zinc-500">
                        Intensity Distribution
                    </label>
                    <Select
                        value={trainingForm.data.intensity_distribution}
                        onValueChange={(value) => {
                            trainingForm.setData('intensity_distribution', value);
                            trainingForm.clearErrors('intensity_distribution');
                        }}
                    >
                        <SelectTrigger
                            id="training-intensity"
                            className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-zinc-900 text-zinc-200">
                            {intensityDistributionOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-sm focus:bg-zinc-800 focus:text-zinc-100"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={trainingForm.errors.intensity_distribution} />
                </div>
            </div>

            <PerformanceAnchorsSection
                trainingForm={trainingForm}
                setNullableNumberField={setNullableNumberField}
            />

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ZoneEditorSection
                    title="Power Zones (% FTP)"
                    description="Editable defaults used by the builder for bike sessions."
                    zones={trainingForm.data.power_zones}
                    minMin={0}
                    minMax={200}
                    maxMin={0}
                    maxMax={250}
                    error={resolveZoneError('power_zones')}
                    field="power_zones"
                    onChangeZone={updateZoneValue}
                />

                <ZoneEditorSection
                    title="Heart Rate Zones (% max HR)"
                    description="Editable defaults used by run and general HR-based workouts."
                    zones={trainingForm.data.heart_rate_zones}
                    minMin={40}
                    minMax={220}
                    maxMin={50}
                    maxMax={240}
                    error={resolveZoneError('heart_rate_zones')}
                    field="heart_rate_zones"
                    onChangeZone={updateZoneValue}
                />
            </section>

            <div className="flex justify-end">
                <Button type="submit" disabled={trainingForm.processing}>
                    {trainingForm.processing ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </form>
    );
}
