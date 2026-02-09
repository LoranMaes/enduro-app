<?php

use App\Models\CoachApplication;
use App\Models\CoachApplicationFile;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('redirects unapproved coaches to the pending approval page', function () {
    Storage::fake('local');

    $coach = User::factory()->coach()->create();
    CoachProfile::query()->updateOrCreate(
        ['user_id' => $coach->id],
        ['is_approved' => false],
    );

    $application = CoachApplication::query()->create([
        'user_id' => $coach->id,
        'status' => 'pending',
        'coaching_experience' => 'Sample coaching experience.',
        'specialties' => 'Sample specialties.',
        'certifications_summary' => 'Sample certs.',
        'website_url' => 'https://coach.example.com',
        'motivation' => 'Sample motivation.',
        'submitted_at' => now(),
    ]);

    $uploadedFile = UploadedFile::fake()->create('certificate.pdf', 120, 'application/pdf');
    $storedPath = $uploadedFile->store("coach-applications/{$application->id}", 'local');

    CoachApplicationFile::query()->create([
        'coach_application_id' => $application->id,
        'stored_disk' => 'local',
        'stored_path' => $storedPath,
        'original_name' => 'certificate.pdf',
        'display_name' => 'certificate',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 120 * 1024,
        'sort_order' => 0,
    ]);

    $this->actingAs($coach)
        ->get('/dashboard')
        ->assertRedirect(route('coach.pending-approval'));

    $this->actingAs($coach)
        ->get(route('coach.pending-approval'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/pending-approval')
            ->where('application.status', 'pending')
            ->where('application.files.0.display_name', 'certificate'));
});

it('allows admins to approve and reject coach applications', function () {
    $admin = User::factory()->admin()->create();
    $coach = User::factory()->coach()->create();
    CoachProfile::query()->updateOrCreate(
        ['user_id' => $coach->id],
        ['is_approved' => false],
    );

    $application = CoachApplication::query()->create([
        'user_id' => $coach->id,
        'status' => 'pending',
        'coaching_experience' => 'Sample coaching experience.',
        'specialties' => 'Sample specialties.',
        'certifications_summary' => null,
        'website_url' => null,
        'motivation' => 'Sample motivation.',
        'submitted_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post(
            route('admin.coach-applications.review', ['coachApplication' => $application->id]),
            [
                'decision' => 'approve',
                'review_notes' => 'Approved for onboarding.',
            ],
        )
        ->assertRedirect(route('admin.coach-applications.index'));

    $application->refresh();
    expect($application->status)->toBe('approved');
    expect($application->review_notes)->toBe('Approved for onboarding.');
    expect($application->reviewed_by_user_id)->toBe($admin->id);
    expect(
        CoachProfile::query()->where('user_id', $coach->id)->value('is_approved'),
    )->toBeTrue();

    $this->actingAs($coach)->get('/dashboard')->assertOk();

    $this->actingAs($admin)
        ->post(
            route('admin.coach-applications.review', ['coachApplication' => $application->id]),
            [
                'decision' => 'reject',
                'review_notes' => 'Rejected for missing requirements.',
            ],
        )
        ->assertRedirect(route('admin.coach-applications.index'));

    $application->refresh();
    expect($application->status)->toBe('rejected');
    expect($application->review_notes)->toBe('Rejected for missing requirements.');
    expect(
        CoachProfile::query()->where('user_id', $coach->id)->value('is_approved'),
    )->toBeFalse();
});

it('lets admins filter coach applications by status', function () {
    $admin = User::factory()->admin()->create();

    $pendingCoach = User::factory()->coach()->create();
    $approvedCoach = User::factory()->coach()->create();
    $rejectedCoach = User::factory()->coach()->create();

    CoachApplication::query()->create([
        'user_id' => $pendingCoach->id,
        'status' => 'pending',
        'coaching_experience' => 'Pending experience.',
        'specialties' => 'Pending specialties.',
        'certifications_summary' => null,
        'website_url' => null,
        'motivation' => 'Pending motivation.',
        'submitted_at' => now(),
    ]);

    CoachApplication::query()->create([
        'user_id' => $approvedCoach->id,
        'status' => 'approved',
        'coaching_experience' => 'Approved experience.',
        'specialties' => 'Approved specialties.',
        'certifications_summary' => null,
        'website_url' => null,
        'motivation' => 'Approved motivation.',
        'submitted_at' => now(),
    ]);

    CoachApplication::query()->create([
        'user_id' => $rejectedCoach->id,
        'status' => 'rejected',
        'coaching_experience' => 'Rejected experience.',
        'specialties' => 'Rejected specialties.',
        'certifications_summary' => null,
        'website_url' => null,
        'motivation' => 'Rejected motivation.',
        'submitted_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/coach-applications?status=rejected')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/coach-applications/index')
            ->where('activeStatus', 'rejected')
            ->where('applications', fn ($applications): bool => collect($applications)->count() === 1
                && collect($applications)->first()['status'] === 'rejected')
            ->where('metrics.pending', 1)
            ->where('metrics.approved', 1)
            ->where('metrics.rejected', 1));
});
