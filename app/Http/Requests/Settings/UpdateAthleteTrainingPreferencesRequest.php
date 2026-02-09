<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAthleteTrainingPreferencesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user instanceof User || ! $user->isAthlete()) {
            return false;
        }

        if (! $this->hasSession()) {
            return true;
        }

        return ! (
            $this->session()->has('impersonation.original_user_id')
            && $this->session()->has('impersonation.impersonated_user_id')
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'primary_sport' => ['required', Rule::in([
                'swim',
                'bike',
                'run',
                'triathlon',
                'other',
            ])],
            'weekly_training_days' => ['required', 'integer', 'between:1,7'],
            'preferred_rest_day' => ['required', Rule::in([
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday',
            ])],
            'intensity_distribution' => ['required', Rule::in([
                'polarized',
                'pyramidal',
                'threshold',
                'mixed',
            ])],
            'ftp_watts' => ['nullable', 'integer', 'between:50,1000'],
            'max_heart_rate_bpm' => ['nullable', 'integer', 'between:120,240'],
            'threshold_heart_rate_bpm' => ['nullable', 'integer', 'between:100,230'],
            'threshold_pace_seconds_per_km' => ['nullable', 'integer', 'between:120,1200'],
            'power_zones' => ['nullable', 'array', 'size:5'],
            'power_zones.*.label' => ['required_with:power_zones', Rule::in(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'])],
            'power_zones.*.min' => ['required_with:power_zones', 'integer', 'between:0,200'],
            'power_zones.*.max' => ['required_with:power_zones', 'integer', 'between:0,250'],
            'heart_rate_zones' => ['nullable', 'array', 'size:5'],
            'heart_rate_zones.*.label' => ['required_with:heart_rate_zones', Rule::in(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'])],
            'heart_rate_zones.*.min' => ['required_with:heart_rate_zones', 'integer', 'between:40,220'],
            'heart_rate_zones.*.max' => ['required_with:heart_rate_zones', 'integer', 'between:50,240'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $maxHeartRate = $this->integer('max_heart_rate_bpm');
            $thresholdHeartRate = $this->integer('threshold_heart_rate_bpm');

            if (
                $maxHeartRate > 0
                && $thresholdHeartRate > 0
                && $thresholdHeartRate > $maxHeartRate
            ) {
                $validator->errors()->add(
                    'threshold_heart_rate_bpm',
                    'Threshold heart rate must be less than or equal to max heart rate.',
                );
            }

            $this->validateZoneBounds(
                $validator,
                $this->input('power_zones'),
                'power_zones',
            );
            $this->validateZoneBounds(
                $validator,
                $this->input('heart_rate_zones'),
                'heart_rate_zones',
            );
        });
    }

    private function validateZoneBounds(
        Validator $validator,
        mixed $zones,
        string $field,
    ): void {
        if (! is_array($zones)) {
            return;
        }

        foreach ($zones as $index => $zone) {
            if (! is_array($zone)) {
                continue;
            }

            $min = $zone['min'] ?? null;
            $max = $zone['max'] ?? null;

            if (
                is_numeric($min)
                && is_numeric($max)
                && (int) $max < (int) $min
            ) {
                $validator->errors()->add(
                    "{$field}.{$index}.max",
                    'Zone max must be greater than or equal to zone min.',
                );
            }
        }
    }
}
