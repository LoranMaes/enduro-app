<?php

use App\Models\AthleteProfile;
use App\Models\CoachApplication;
use App\Models\CoachProfile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('athletes can register with multi-step payload fields', function () {
    $response = $this->post(route('register.store'), [
        'role' => 'athlete',
        'first_name' => 'Test',
        'last_name' => 'Athlete',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'primary_sport' => 'triathlon',
        'weekly_training_days' => 6,
        'preferred_rest_day' => 'monday',
        'intensity_distribution' => 'polarized',
        'ftp_watts' => 260,
        'max_heart_rate_bpm' => 188,
        'threshold_heart_rate_bpm' => 171,
        'threshold_pace_minutes_per_km' => 275,
        'power_zones' => [
            ['label' => 'Z1', 'min' => 55, 'max' => 75],
            ['label' => 'Z2', 'min' => 76, 'max' => 90],
            ['label' => 'Z3', 'min' => 91, 'max' => 105],
            ['label' => 'Z4', 'min' => 106, 'max' => 120],
            ['label' => 'Z5', 'min' => 121, 'max' => 150],
        ],
        'heart_rate_zones' => [
            ['label' => 'Z1', 'min' => 60, 'max' => 72],
            ['label' => 'Z2', 'min' => 73, 'max' => 82],
            ['label' => 'Z3', 'min' => 83, 'max' => 89],
            ['label' => 'Z4', 'min' => 90, 'max' => 95],
            ['label' => 'Z5', 'min' => 96, 'max' => 100],
        ],
    ]);

    $this->assertAuthenticated();
    expect(auth()->user()?->role?->value)->toBe('athlete');
    expect(auth()->user()?->first_name)->toBe('Test');
    expect(auth()->user()?->last_name)->toBe('Athlete');
    expect(auth()->user()?->name)->toBe('Test Athlete');
    expect(AthleteProfile::query()->where('user_id', auth()->id())->exists())->toBeTrue();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('coaches can register and are marked pending approval with uploaded files', function () {
    Storage::fake('local');

    $response = $this->post(route('register.store'), [
        'role' => 'coach',
        'first_name' => 'Casey',
        'last_name' => 'Coach',
        'email' => 'coach-registration@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'coaching_experience' => '8 years coaching long-course triathletes.',
        'specialties' => 'Triathlon periodization and bike power development.',
        'certifications_summary' => 'USAT Level II.',
        'website_url' => 'https://coach.example.com',
        'motivation' => 'I want to coach athletes in a structured, transparent environment.',
        'coach_certification_files' => [
            UploadedFile::fake()->create('certification.pdf', 220, 'application/pdf'),
        ],
        'coach_certification_labels' => ['USAT_Level_II'],
    ]);

    $this->assertAuthenticated();
    expect(auth()->user()?->role?->value)->toBe('coach');
    expect(CoachProfile::query()->where('user_id', auth()->id())->value('is_approved'))->toBeFalse();
    expect(CoachApplication::query()->where('user_id', auth()->id())->exists())->toBeTrue();
    expect(CoachApplication::query()->where('user_id', auth()->id())->withCount('files')->first()?->files_count)->toBe(1);
    $response->assertRedirect(route('dashboard', absolute: false));
});
