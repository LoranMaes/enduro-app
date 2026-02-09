<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Enums\UserRole;
use App\Models\AthleteProfile;
use App\Models\CoachApplication;
use App\Models\CoachApplicationFile;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator as ValidationValidator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user with role-aware onboarding.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $validated = Validator::make($input, [
            'role' => ['required', Rule::in([
                UserRole::Athlete->value,
                UserRole::Coach->value,
            ])],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
            'timezone' => ['nullable', 'string', 'timezone:all'],
            'unit_system' => ['nullable', Rule::in(['metric', 'imperial'])],
            'primary_sport' => ['nullable', Rule::in([
                'swim',
                'bike',
                'run',
                'triathlon',
                'other',
            ])],
            'weekly_training_days' => ['nullable', 'integer', 'between:1,7'],
            'preferred_rest_day' => ['nullable', Rule::in([
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday',
            ])],
            'intensity_distribution' => ['nullable', Rule::in([
                'polarized',
                'pyramidal',
                'threshold',
                'mixed',
            ])],
            'ftp_watts' => ['nullable', 'integer', 'between:50,1000'],
            'max_heart_rate_bpm' => ['nullable', 'integer', 'between:120,240'],
            'threshold_heart_rate_bpm' => ['nullable', 'integer', 'between:100,230'],
            'threshold_pace_minutes_per_km' => ['nullable', 'integer', 'between:120,1200'],
            'power_zones' => ['nullable', 'array', 'size:5'],
            'power_zones.*.label' => ['required_with:power_zones', Rule::in(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'])],
            'power_zones.*.min' => ['required_with:power_zones', 'integer', 'between:0,200'],
            'power_zones.*.max' => ['required_with:power_zones', 'integer', 'between:0,250'],
            'heart_rate_zones' => ['nullable', 'array', 'size:5'],
            'heart_rate_zones.*.label' => ['required_with:heart_rate_zones', Rule::in(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'])],
            'heart_rate_zones.*.min' => ['required_with:heart_rate_zones', 'integer', 'between:40,220'],
            'heart_rate_zones.*.max' => ['required_with:heart_rate_zones', 'integer', 'between:50,240'],
            'coaching_experience' => ['required_if:role,'.UserRole::Coach->value, 'nullable', 'string', 'max:10000'],
            'specialties' => ['required_if:role,'.UserRole::Coach->value, 'nullable', 'string', 'max:5000'],
            'certifications_summary' => ['nullable', 'string', 'max:5000'],
            'website_url' => ['nullable', 'url:http,https', 'max:2048'],
            'motivation' => ['required_if:role,'.UserRole::Coach->value, 'nullable', 'string', 'max:10000'],
            'coach_certification_files' => ['nullable', 'array', 'max:10'],
            'coach_certification_files.*' => ['file', 'mimes:pdf,png,jpg,jpeg,webp', 'max:10240'],
            'coach_certification_labels' => ['nullable', 'array'],
            'coach_certification_labels.*' => ['nullable', 'string', 'max:120'],
        ])
            ->after(function (ValidationValidator $validator): void {
                $this->validateRoleSpecificFields($validator);
                $this->validateZoneBounds($validator, request()->input('power_zones'), 'power_zones');
                $this->validateZoneBounds($validator, request()->input('heart_rate_zones'), 'heart_rate_zones');
            })
            ->validate();

        return DB::transaction(function () use ($validated): User {
            $role = UserRole::from((string) $validated['role']);
            $firstName = trim((string) $validated['first_name']);
            $lastName = trim((string) $validated['last_name']);

            $user = User::query()->create([
                'name' => trim("{$firstName} {$lastName}"),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $role,
                'timezone' => $validated['timezone'] ?? null,
                'unit_system' => $validated['unit_system'] ?? null,
            ]);

            if ($role === UserRole::Athlete) {
                AthleteProfile::query()->create([
                    'user_id' => $user->id,
                    'primary_sport' => $validated['primary_sport'] ?? null,
                    'weekly_training_days' => $validated['weekly_training_days'] ?? null,
                    'preferred_rest_day' => $validated['preferred_rest_day'] ?? null,
                    'intensity_distribution' => $validated['intensity_distribution'] ?? null,
                    'ftp_watts' => $validated['ftp_watts'] ?? null,
                    'max_heart_rate_bpm' => $validated['max_heart_rate_bpm'] ?? null,
                    'threshold_heart_rate_bpm' => $validated['threshold_heart_rate_bpm'] ?? null,
                    'threshold_pace_minutes_per_km' => $validated['threshold_pace_minutes_per_km'] ?? null,
                    'power_zones' => $validated['power_zones'] ?? null,
                    'heart_rate_zones' => $validated['heart_rate_zones'] ?? null,
                ]);
            }

            if ($role === UserRole::Coach) {
                CoachProfile::query()->create([
                    'user_id' => $user->id,
                    'is_approved' => false,
                ]);

                $application = CoachApplication::query()->create([
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'coaching_experience' => (string) $validated['coaching_experience'],
                    'specialties' => (string) $validated['specialties'],
                    'certifications_summary' => $validated['certifications_summary'] ?? null,
                    'website_url' => $validated['website_url'] ?? null,
                    'motivation' => (string) $validated['motivation'],
                    'submitted_at' => now(),
                ]);

                $this->persistCoachApplicationFiles(
                    $application,
                    $validated['coach_certification_labels'] ?? [],
                );
            }

            return $user;
        });
    }

    private function validateRoleSpecificFields(ValidationValidator $validator): void
    {
        $role = request()->input('role');

        if (! is_string($role) || $role === '') {
            return;
        }

        if ($role === UserRole::Coach->value) {
            $files = request()->file('coach_certification_files', []);

            if (is_array($files) && count($files) > 0) {
                return;
            }

            $validator->errors()->add(
                'coach_certification_files',
                'Upload at least one certification file for review.',
            );
        }
    }

    private function validateZoneBounds(
        ValidationValidator $validator,
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

            if (is_numeric($min) && is_numeric($max) && (int) $max < (int) $min) {
                $validator->errors()->add(
                    "{$field}.{$index}.max",
                    'Zone max must be greater than or equal to zone min.',
                );
            }
        }
    }

    /**
     * @param  array<int, string|null>  $labels
     */
    private function persistCoachApplicationFiles(
        CoachApplication $application,
        array $labels,
    ): void {
        $requestFiles = request()->file('coach_certification_files', []);

        if (! is_array($requestFiles)) {
            return;
        }

        foreach ($requestFiles as $index => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fallbackDisplayName = pathinfo($originalName, PATHINFO_FILENAME);
            $providedLabel = trim((string) ($labels[$index] ?? ''));
            $displayName = Str::of($providedLabel !== '' ? $providedLabel : $fallbackDisplayName)
                ->replaceMatches('/\.[^.]+$/', '')
                ->limit(120, '')
                ->trim()
                ->value();

            if ($displayName === '') {
                $displayName = 'Document '.($index + 1);
            }

            $storedPath = $file->store(
                "coach-applications/{$application->id}",
                'local',
            );

            CoachApplicationFile::query()->create([
                'coach_application_id' => $application->id,
                'stored_disk' => 'local',
                'stored_path' => $storedPath,
                'original_name' => $originalName,
                'display_name' => $displayName,
                'extension' => $extension !== '' ? strtolower($extension) : null,
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => max(0, (int) $file->getSize()),
                'sort_order' => $index,
            ]);
        }
    }
}
